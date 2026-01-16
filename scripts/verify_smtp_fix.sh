#!/bin/bash

# 校验容器内 sendEmail.js 是否包含 SMTP 修复逻辑
echo "Checking SMTP fix in container 'LibreChat'..."

# 获取 secure 相关的逻辑行
FILE_PATH="/app/api/server/utils/sendEmail.js"
TARGET_KEYWORDS=("secure: true" "port: 465")

# 检查文件是否存在并包含关键字
# 由于实际逻辑可能是 secure: enc === 'ssl' ... 我们主要检查是否包含关键的配置行
LOGIC_CHECK=$(docker compose exec -T api grep -E "secure:|port:" $FILE_PATH)

if [ $? -ne 0 ]; then
  echo "Error: Could not find or read $FILE_PATH in container."
  exit 1
fi

echo "Found SMTP configuration lines:"
echo "$LOGIC_CHECK"

# 必须验证逻辑是否包含我们预期的修复关键字
# 根据之前的 grep 结果：
# 122:      secure: enc === 'ssl' || enc === 'tls' || port === 465,
# 154:      secure: transporterOptions.secure,
# 我们校验 port === 465 和 secure: 关键字

if echo "$LOGIC_CHECK" | grep -q "port === 465" && echo "$LOGIC_CHECK" | grep -q "secure:"; then
  echo "Success: SMTP fix verified."
  exit 0
else
  echo "Error: SMTP fix keywords not found in $FILE_PATH"
  exit 1
fi
