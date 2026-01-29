用户数据库操作使用文档（MongoDB）
适用对象
* AI Radio 平台管理员
* 运维 / 技术负责人
* 需要查看或管理用户的工程人员
适用环境
* LibreChat（自托管）
* MongoDB（Docker 部署，已开启鉴权）

一、环境确认
1. 查看当前运行的容器

docker ps
确认 MongoDB 容器名称，一般为：

chat-mongodb

二、进入 MongoDB（带认证）
1. 使用 root 管理员账号登录 MongoDB
root 账号信息来自 .env 或 docker-compose.yml

docker exec -it chat-mongodb mongosh \
  -u admin \
  -p <MongoDB密码> \
  --authenticationDatabase admin
登录成功后，会看到类似提示：

Using MongoDB: 8.x.x
Using Mongosh: 2.x.x
test>

2. 验证当前登录身份与权限

db.runCommand({ connectionStatus: 1 })
期望看到：

authenticatedUsers: [{ user: "admin", db: "admin" }]
authenticatedUserRoles: [{ role: "root", db: "admin" }]
说明当前为 MongoDB root 权限

三、查看数据库与切换 LibreChat 数据库
1. 查看数据库列表

show dbs
典型输出：

LibreChat   6.33 MiB
admin     112 KiB
config    108 KiB
local     180 KiB
⚠️ 注意：数据库名区分大小写 👉 本项目数据库名为 LibreChat

2. 切换到 LibreChat 数据库

use LibreChat

3. 查看集合（Collections）

show collections
常见集合包括：
* users（用户）
* conversations（会话）
* messages（消息）
* sessions
* agents
* files（如启用文件/RAG）

四、用户列表查看（核心操作）
1. 查看全部用户（推荐方式）

db.users
  .find(
    {},
    {
      email: 1,
      username: 1,
      name: 1,
      role: 1,
      provider: 1,
      emailVerified: 1,
      disabled: 1,
      createdAt: 1,
      lastLoginAt: 1
    }
  )
  .sort({ createdAt: -1 })
  .pretty()

2. 常用筛选命令
仅查看公司邮箱用户（@reload.com.cn）

db.users.find(
  { email: /@reload\.com\.cn$/ },
  { email: 1, role: 1, emailVerified: 1, disabled: 1, createdAt: 1 }
).sort({ createdAt: -1 })
查看管理员用户

db.users.find(
  { role: "admin" },
  { email: 1, role: 1, createdAt: 1 }
)
查看未验证邮箱的用户

db.users.find(
  { emailVerified: false },
  { email: 1, role: 1, createdAt: 1 }
)
查看被禁用的用户

db.users.find(
  { disabled: true },
  { email: 1, role: 1, createdAt: 1 }
)

五、用户管理操作（需谨慎）
1. 禁用用户（推荐做法）

db.users.updateOne(
  { email: "user@reload.com.cn" },
  { $set: { disabled: true } }
)
效果：
* 用户无法再次登录
* 历史聊天数据保留

2. 解禁用户

db.users.updateOne(
  { email: "user@reload.com.cn" },
  { $set: { disabled: false } }
)

3. 提升用户为管理员

db.users.updateOne(
  { email: "ops@reload.com.cn" },
  { $set: { role: "admin" } }
)

4. 删除用户（⚠️ 不推荐常用）

db.users.deleteOne(
  { email: "user@reload.com.cn" }
)
⚠️ 风险说明：
* 可能影响会话、消息、Agent 关联数据
* 不可逆操作

六、用户数据导出（Excel / Sheets）
导出为 TSV（制表符分隔）

db.users.find(
  {},
  {
    email: 1,
    username: 1,
    role: 1,
    provider: 1,
    emailVerified: 1,
    disabled: 1,
    createdAt: 1
  }
).sort({ createdAt: -1 }).forEach(u => {
  print([
    u.email ?? "",
    u.username ?? "",
    u.role ?? "",
    u.provider ?? "",
    u.emailVerified ?? "",
    u.disabled ?? "",
    u.createdAt ?? ""
  ].join("\t"));
});
操作说明：
1. 复制终端输出
2. 粘贴到 Excel / Google Sheets
3. 自动按列拆分

七、安全与运维注意事项（重要）
* ✅ MongoDB 已开启鉴权（正确）
* ❌ 不要关闭 MongoDB auth
* ❌ 不要暴露 27017 端口到公网
* ❌ 不建议频繁手动删用户
推荐策略：
* 使用 禁用（disabled）代替删除
* 管理员账号数量最小化
* 重要操作留操作记录（人工或脚本）

八、推荐后续优化（非必需）
* 建立 只读 Admin 用户列表页面
* 将用户角色接入 Agent / RAG 权限体系
* 后期引入 SSO / 企业身份系统（可选）
用户数据库操作使用文档（MongoDB）
适用对象
* AI Radio 平台管理员
* 运维 / 技术负责人
* 需要查看或管理用户的工程人员
适用环境
* LibreChat（自托管）
* MongoDB（Docker 部署，已开启鉴权）

一、环境确认
1. 查看当前运行的容器

docker ps
确认 MongoDB 容器名称，一般为：

chat-mongodb

二、进入 MongoDB（带认证）
1. 使用 root 管理员账号登录 MongoDB
root 账号信息来自 .env 或 docker-compose.yml

docker exec -it chat-mongodb mongosh \
  -u admin \
  -p <MongoDB密码> \
  --authenticationDatabase admin
登录成功后，会看到类似提示：

Using MongoDB: 8.x.x
Using Mongosh: 2.x.x
test>

2. 验证当前登录身份与权限

db.runCommand({ connectionStatus: 1 })
期望看到：

authenticatedUsers: [{ user: "admin", db: "admin" }]
authenticatedUserRoles: [{ role: "root", db: "admin" }]
说明当前为 MongoDB root 权限

三、查看数据库与切换 LibreChat 数据库
1. 查看数据库列表

show dbs
典型输出：

LibreChat   6.33 MiB
admin     112 KiB
config    108 KiB
local     180 KiB
⚠️ 注意：数据库名区分大小写 👉 本项目数据库名为 LibreChat

2. 切换到 LibreChat 数据库

use LibreChat

3. 查看集合（Collections）

show collections
常见集合包括：
* users（用户）
* conversations（会话）
* messages（消息）
* sessions
* agents
* files（如启用文件/RAG）

四、用户列表查看（核心操作）
1. 查看全部用户（推荐方式）

db.users
  .find(
    {},
    {
      email: 1,
      username: 1,
      name: 1,
      role: 1,
      provider: 1,
      emailVerified: 1,
      disabled: 1,
      createdAt: 1,
      lastLoginAt: 1
    }
  )
  .sort({ createdAt: -1 })
  .pretty()

2. 常用筛选命令
仅查看公司邮箱用户（@reload.com.cn）

db.users.find(
  { email: /@reload\.com\.cn$/ },
  { email: 1, role: 1, emailVerified: 1, disabled: 1, createdAt: 1 }
).sort({ createdAt: -1 })
查看管理员用户

db.users.find(
  { role: "admin" },
  { email: 1, role: 1, createdAt: 1 }
)
查看未验证邮箱的用户

db.users.find(
  { emailVerified: false },
  { email: 1, role: 1, createdAt: 1 }
)
查看被禁用的用户

db.users.find(
  { disabled: true },
  { email: 1, role: 1, createdAt: 1 }
)

五、用户管理操作（需谨慎）
1. 禁用用户（推荐做法）

db.users.updateOne(
  { email: "user@reload.com.cn" },
  { $set: { disabled: true } }
)
效果：
* 用户无法再次登录
* 历史聊天数据保留

2. 解禁用户

db.users.updateOne(
  { email: "user@reload.com.cn" },
  { $set: { disabled: false } }
)

3. 提升用户为管理员

db.users.updateOne(
  { email: "ops@reload.com.cn" },
  { $set: { role: "admin" } }
)

4. 删除用户（⚠️ 不推荐常用）

db.users.deleteOne(
  { email: "user@reload.com.cn" }
)
⚠️ 风险说明：
* 可能影响会话、消息、Agent 关联数据
* 不可逆操作

六、用户数据导出（Excel / Sheets）
导出为 TSV（制表符分隔）

db.users.find(
  {},
  {
    email: 1,
    username: 1,
    role: 1,
    provider: 1,
    emailVerified: 1,
    disabled: 1,
    createdAt: 1
  }
).sort({ createdAt: -1 }).forEach(u => {
  print([
    u.email ?? "",
    u.username ?? "",
    u.role ?? "",
    u.provider ?? "",
    u.emailVerified ?? "",
    u.disabled ?? "",
    u.createdAt ?? ""
  ].join("\t"));
});
操作说明：
1. 复制终端输出
2. 粘贴到 Excel / Google Sheets
3. 自动按列拆分

七、安全与运维注意事项（重要）
* ✅ MongoDB 已开启鉴权（正确）
* ❌ 不要关闭 MongoDB auth
* ❌ 不要暴露 27017 端口到公网
* ❌ 不建议频繁手动删用户
推荐策略：
* 使用 禁用（disabled）代替删除
* 管理员账号数量最小化
* 重要操作留操作记录（人工或脚本）

八、推荐后续优化（非必需）
* 建立 只读 Admin 用户列表页面
* 将用户角色接入 Agent / RAG 权限体系
* 后期引入 SSO / 企业身份系统（可选）
git add docs/runbooks/USER_DB_RUNBOOK.md
git commit -m "docs(runbook): add MongoDB user ops runbook (security baseline)"

