#!/usr/bin/env bash
# 列出所有电子邮件未验证的用户 （也许是需要帮助的新注册用户）

echo "Listing users with emailVerified = false"
echo "======================================"
echo

docker exec -i chat-mongodb mongosh LibreChat --quiet --eval '
db.users.find(
  { emailVerified: false },
  {
    email: 1,
    createdAt: 1,
    expiresAt: 1,
    provider: 1
  }
).sort({ createdAt: -1 }).forEach(u => {
  print(
    "- " +
    u.email +
    " | provider=" + (u.provider || "unknown") +
    " | createdAt=" + u.createdAt.toISOString() +
    " | expiresAt=" + (u.expiresAt ? u.expiresAt.toISOString() : "n/a")
  );
});
'
