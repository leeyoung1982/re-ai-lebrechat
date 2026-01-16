# SMTP 邮件发送修复总结

## 问题分析

**原始错误**: `connect ECONNREFUSED 127.0.0.1:587`

**根本原因**:
1. **.env 中设置了 `EMAIL_SERVICE=smtp`**
   - `"smtp"` 不是有效的 nodemailer 预定义服务名
   - nodemailer 只认识 "gmail", "outlook", "yahoo" 等具体服务商
   - 当找不到服务配置时,回退到默认值: `localhost:587`

2. **secure 标志不支持 'ssl' 值**
   - 代码只检查 `EMAIL_ENCRYPTION === 'tls'`
   - 但配置中使用的是 `EMAIL_ENCRYPTION=ssl` (端口 465)
   - 导致 secure=false,使用错误的加密方式

## 已实施的修复

### 修改 1: `.env` 文件
**位置**: `/opt/librechat-radio/.env`

```diff
#========================#
# Email Password Reset   #
#========================#

- EMAIL_SERVICE=smtp
+ # EMAIL_SERVICE=smtp  # Commented out - "smtp" is not a valid nodemailer service preset
EMAIL_HOST=smtp.exmail.qq.com
EMAIL_PORT=465
EMAIL_ENCRYPTION=ssl
```

### 修改 2: `api/server/utils/sendEmail.js`
**位置**: `/opt/librechat-radio/api/server/utils/sendEmail.js`

**更改 A - 修复 secure 标志逻辑** (第 117-119 行):
```javascript
// 之前:
secure: process.env.EMAIL_ENCRYPTION === 'tls',

// 之后:
const enc = (process.env.EMAIL_ENCRYPTION || '').toLowerCase();
const port = Number(process.env.EMAIL_PORT) || 25;
const transporterOptions = {
  // Support both 'ssl' and 'tls' for secure connections, also auto-detect port 465
  secure: enc === 'ssl' || enc === 'tls' || port === 465,
```

**更改 B - 添加诊断日志** (第 145-151 行):
```javascript
// Mailer service definition has precedence
if (process.env.EMAIL_SERVICE) {
  transporterOptions.service = process.env.EMAIL_SERVICE;
  logger.info(`[sendEmail] SMTP Config: service=${process.env.EMAIL_SERVICE}, secure=${transporterOptions.secure}`);
} else {
  transporterOptions.host = process.env.EMAIL_HOST;
  transporterOptions.port = port;  // 使用 Number 转换后的 port
  logger.info(`[sendEmail] SMTP Config: host=${process.env.EMAIL_HOST}, port=${port}, secure=${transporterOptions.secure}, encryption=${enc}`);
}
```

## 验证步骤

### 1. 测试用户注册

```bash
# 使用 curl 测试注册 (替换为实际的测试邮箱)
curl -X POST http://localhost:3100/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@reload.com.cn",
    "password": "TestPassword123!",
    "name": "Test User",
    "username": "testuser123"
  }'
```

**预期结果**:
```json
{
  "status": 200,
  "message": "Please check your email to verify your email address."
}
```

### 2. 检查日志验证 SMTP 配置

```bash
# 查看 SMTP 配置日志
docker logs LibreChat --tail 200 | grep "SMTP Config"

# 预期输出:
# [sendEmail] SMTP Config: host=smtp.exmail.qq.com, port=465, secure=true, encryption=ssl
```

### 3. 验证没有 127.0.0.1:587 错误

```bash
# 检查是否还有旧的连接错误
docker logs LibreChat --tail 300 | grep -i "127.0.0.1:587\|ECONNREFUSED"

# 预期: 无输出 (没有错误)
```

### 4. 检查邮件发送成功

```bash
# 查看完整的邮件发送日志
docker logs LibreChat --tail 300 | grep -iE "sendEmail|verify"

# 预期看到:
# [sendEmail] Using SMTP provider
# [sendEmail] SMTP Config: host=smtp.exmail.qq.com, port=465, secure=true, encryption=ssl
# [sendVerificationEmail] Verification link issued. [Email: test@reload.com.cn]
```

### 5. 确认邮箱收到验证邮件

登录 `test@reload.com.cn` 邮箱,查看是否收到来自 `re-ai-radio@reload.com.cn` 的验证邮件。

## 当前配置状态

**SMTP 配置** (在 `.env` 中):
```bash
# EMAIL_SERVICE=smtp  # ← 已注释掉
EMAIL_HOST=smtp.exmail.qq.com
EMAIL_PORT=465
EMAIL_ENCRYPTION=ssl
EMAIL_USERNAME=re-ai-radio@reload.com.cn
EMAIL_PASSWORD=Youngai2452
EMAIL_FROM_NAME=re- AI Radio
EMAIL_FROM=re-ai-radio@reload.com.cn
```

**实际使用的 nodemailer 传输配置**:
```javascript
{
  host: 'smtp.exmail.qq.com',
  port: 465,
  secure: true,  // SSL/TLS 加密
  auth: {
    user: 're-ai-radio@reload.com.cn',
    pass: 'Youngai2452'
  },
  tls: {
    rejectUnauthorized: true  // 验证证书
  }
}
```

## 故障排查

### 如果仍然出现连接错误

1. **检查防火墙**:
```bash
# 测试从容器内部连接到 SMTP 服务器
docker exec LibreChat nc -zv smtp.exmail.qq.com 465
# 或
docker exec LibreChat openssl s_client -connect smtp.exmail.qq.com:465
```

2. **验证环境变量已加载**:
```bash
docker exec LibreChat env | grep EMAIL_
```

3. **查看详细错误日志**:
```bash
docker logs LibreChat --tail 500 | grep -A 5 -B 5 "registerUser\|sendEmail"
```

### 如果邮件未收到但无错误

1. 检查邮箱垃圾箱
2. 检查 SMTP 服务器日志
3. 验证 EMAIL_USERNAME 和 EMAIL_PASSWORD 是否正确

## 相关文件

- **配置文件**: `/opt/librechat-radio/.env`
- **邮件发送代码**: `/opt/librechat-radio/api/server/utils/sendEmail.js`
- **注册服务**: `/opt/librechat-radio/api/server/services/AuthService.js`
- **域名限制配置**: `/opt/librechat-radio/librechat.yaml`

## 回滚说明

如果需要回滚更改:

1. **恢复 EMAIL_SERVICE**:
```bash
# 在 .env 中取消注释
EMAIL_SERVICE=smtp
```

2. **恢复原始 sendEmail.js**:
```bash
cd /opt/librechat-radio
git checkout api/server/utils/sendEmail.js
```

3. **重启容器**:
```bash
docker restart LibreChat
```

---

**修复完成时间**: 2026-01-06 21:47  
**修复状态**: ✅ 完成并等待测试验证  
**预期结果**: 用户注册时邮件将通过 `smtp.exmail.qq.com:465` 发送,不再尝试连接 `127.0.0.1:587`
