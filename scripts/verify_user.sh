#!/usr/bin/env bash
#管理员脚本，用于在数据库中验证用户的电子邮件地址和接受条款。

EMAIL="$1"

if [ -z "$EMAIL" ]; then
  echo "Usage: verify_user.sh user@domain.com" 
  exit 1
fi

echo "Verifying user: $EMAIL"

docker exec -i chat-mongodb mongosh LibreChat --quiet --eval "
const email = '$EMAIL';
const res = db.users.updateOne(
  { email },
  {
    \$set: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      termsAccepted: true
    }
  }
);
printjson(res);
"
