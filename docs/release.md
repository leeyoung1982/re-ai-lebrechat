# Release Management

本文档规范了 `re-ai-radio/librechat` 镜像的发布、部署与回滚流程。

## 1. 镜像 Tag 规范

镜像名称：`re-ai-radio/librechat`

| 环境 | Tag 格式 | 示例 | 说明 |
| :--- | :--- | :--- | :--- |
| **Development** | `dev-smtpfix<N>` | `dev-smtpfix1` | 用于开发调试与初步验证 |
| **Staging** | `staging-smtpfix<N>` | `staging-smtpfix1` | 用于预发布环境验证 |
| **Production** | `<upstream_version>-smtpfix<N>` | `v0.8.2-rc1-smtpfix1` | 基于上游版本号的正式修复版本 |

`<N>` 为自增序列号，每次修复逻辑变更后递增。

## 2. 构建与部署命令

### 2.1 本地构建

```bash
# 构建 dev 镜像
docker compose build --no-cache api
```

### 2.2 打标签与推送（可选）

```bash
# 示例：打生产标签
docker tag re-ai-radio/librechat:dev re-ai-radio/librechat:v0.8.2-rc1-smtpfix1
# 推送（需要登录私有仓库）
# docker push re-ai-radio/librechat:v0.8.2-rc1-smtpfix1
```

### 2.3 部署

```bash
# 重建并启动服务
docker compose up -d --force-recreate api
```

### 2.4 自动校验

构建部署完成后，必须执行校验脚本确保修复生效：

```bash
npm run verify:smtpfix
# 或直接运行脚本
./scripts/verify_smtp_fix.sh
```

## 3. 回滚方案

如果发现新构建的镜像存在问题，按以下步骤回滚：

1.  **修改配置**：在 `docker-compose.override.yml` 中将 `api` 服务的 `image` 改为之前稳定的 Tag（或注释掉 `build` 段落恢复官方镜像，但官方镜像不含 SMTP 修复）。
2.  **重新启动**：
    ```bash
    docker compose up -d --force-recreate api
    ```
3.  **清理现场**：如果需要彻底删除有问题的本地镜像：
    ```bash
    docker rmi re-ai-radio/librechat:dev
    ```

## 4. 基础镜像锁定说明

当前基础镜像已通过 Digest 锁定在 `Dockerfile.smtp_fix` 中：
`ghcr.io/danny-avila/librechat-dev@sha256:8fce2f8fa48a7cc12285e1acbc2e28c1583348b260dfadfbec33b1d7a4dab0d1`
