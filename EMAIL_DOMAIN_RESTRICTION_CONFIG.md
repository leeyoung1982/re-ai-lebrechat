# 邮箱域名限制配置说明

## 概述
LibreChat 现已配置为仅允许 `@reload.com.cn` 域名的邮箱进行用户注册。其他域名的邮箱在注册时将被拒绝,返回 HTTP 403 错误。

**新增功能**: 现在支持通过 `allowedEmails` 配置项允许特定的完整邮箱地址注册，即使其域名不在白名单中。

## 配置位置

### 1. 主配置文件: `librechat.yaml`
```yaml
registration:
  allowedDomains:
    - "reload.com.cn"
  allowedEmails:             # 新增：允许注册的特定邮箱地址
    - "special@gmail.com"    # 绕过域名限制
    - "vip@example.com"
```

### 2. 环境变量说明: `.env`
已在 `.env` 文件的 "Registration and Login" 部分添加了配置说明注释。

## 工作原理

### 后端验证流程
1. 用户提交注册请求（POST `/api/auth/register`）
2. 请求经过 `registrationController` 处理（`api/server/controllers/AuthController.js`）
3. 调用 `registerUser` 服务（`api/server/services/AuthService.js`）
4. 在创建用户前，调用 `isEmailDomainAllowed(email, appConfig?.registration?.allowedDomains)`
5. 域名验证函数位于 `packages/api/src/auth/domain.ts`
6. 如果邮箱域名不在允许列表中，返回 403 错误

### 关键代码位置
- **域名验证函数**: `packages/api/src/auth/domain.ts` - `isEmailDomainAllowed()`
- **注册服务**: `api/server/services/AuthService.js` - `registerUser()`
- **注册控制器**: `api/server/controllers/AuthController.js` - `registrationController()`
- **配置加载**: `api/server/services/Config/loadCustomConfig.js`

## 错误响应示例

当用户尝试使用非 `@reload.com.cn` 域名注册时：

```json
{
  "status": 403,
  "message": "The email address provided cannot be used. Please use a different email address."
}
```

## 修改配置

### 添加更多允许的域名
编辑 `librechat.yaml` 文件：

```yaml
registration:
  allowedDomains:
    - "reload.com.cn"
    - "example.com"      # 添加新域名
    - "another-domain.com"
```

### 移除域名限制（允许所有域名）
方式 1 - 注释掉配置：
```yaml
# registration:
#   allowedDomains:
#     - "reload.com.cn"
```

方式 2 - 设置为空数组：
```yaml
registration:
  allowedDomains: []
```

### 配置生效
修改配置后需要重启 LibreChat 服务：
```bash
# Docker 部署
docker-compose restart

# 或者
docker restart <container-name>

# 开发环境
npm run backend:restart
```

## 测试验证

### 测试允许的域名
```bash
curl -X POST http://localhost:3100/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@reload.com.cn",
    "password": "SecurePassword123",
    "name": "Test User",
    "username": "testuser"
  }'
```
**预期结果**: 成功注册（或邮件验证提示）

### 测试被拒绝的域名
```bash
curl -X POST http://localhost:3100/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@gmail.com",
    "password": "SecurePassword123",
    "name": "Test User",
    "username": "testuser"
  }'
```
**预期结果**: HTTP 403 错误
```json
{
  "status": 403,
  "message": "The email address provided cannot be used. Please use a different email address."
}
```

## 日志输出

当域名验证失败时，后端日志会记录：
```
[registerUser] [Registration not allowed] [Email: test@gmail.com]
```

## 安全说明

1. **大小写不敏感**: 域名比较时自动转换为小写，`Test@Reload.Com.CN` 和 `test@reload.com.cn` 被视为相同
2. **仅验证域名部分**: 只检查 `@` 符号后的域名部分
3. **无通配符支持**: 必须精确匹配域名，不支持 `*.reload.com.cn` 格式
4. **密码重置**: 密码重置功能也会验证邮箱域名（在 `requestPasswordReset` 函数中）

## 影响范围

域名限制仅影响：
- ✅ 新用户注册（`/api/auth/register`）
- ✅ 密码重置请求（`/api/auth/reset-password`）
- ✅ 社交登录注册（如果 `ALLOW_SOCIAL_REGISTRATION=true`）

不影响：
- ❌ 已存在用户的登录
- ❌ 系统管理员手动创建的用户
- ❌ LDAP/OpenID 等外部认证方式

## 相关环境变量

```bash
# 启用邮箱/密码注册
ALLOW_EMAIL_LOGIN=true
ALLOW_REGISTRATION=true

# 邮箱验证
ALLOW_UNVERIFIED_EMAIL_LOGIN=false  # 需要邮箱验证后才能登录
ALLOW_PASSWORD_RESET=true           # 启用密码重置功能
```

## 故障排查

### 问题: 所有邮箱都被拒绝（包括 @reload.com.cn）
**可能原因**:
- 配置文件 YAML 格式错误
- 配置文件未正确加载
- 缓存未清除

**解决方案**:
```bash
# 检查配置文件语法
npm run validate-config

# 清除缓存并重启
docker-compose down
docker-compose up -d
```

### 问题: 配置不生效
**可能原因**:
- 服务未重启
- 使用了错误的配置文件路径

**解决方案**:
```bash
# 确认配置文件路径
echo $CONFIG_PATH  # 应该为空或指向正确的文件

# 查看日志确认配置已加载
docker-compose logs api | grep "Custom config file loaded"
```

## 维护建议

1. **定期审查**: 定期检查允许的域名列表是否需要更新
2. **监控日志**: 监控注册失败日志，了解是否有合法用户被误拒
3. **文档同步**: 域名列表变更时同步更新内部文档
4. **备份配置**: 修改配置前先备份 `librechat.yaml`

## 更新历史

- **2026-02-08**: 新增 `allowedEmails` 配置 - 支持精确匹配特定邮箱地址
- **2026-01-06**: 初始配置 - 限制为仅允许 @reload.com.cn 域名注册

---

**配置完成日期**: 2026-02-08  
**配置人员**: AI Assistant  
**版本**: 1.1
