#!/bin/bash
# 导出LibreChat注册用户数据
# 使用docker exec直接从MongoDB导出数据

set -e

CONTAINER_NAME="chat-mongodb"
DB_NAME="LibreChat"
DB_USER="admin"
DB_PASSWORD="2xF9YEeo97FYqa2e1rMJveELZCJ7jKXx"
EXPORT_DIR="./exports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 创建导出目录
mkdir -p "$EXPORT_DIR"

echo "📊 正在导出用户数据..."
echo ""

# 导出为JSON格式
JSON_FILE="${EXPORT_DIR}/users_${TIMESTAMP}.json"
docker exec -i "$CONTAINER_NAME" mongosh --quiet \
  -u "$DB_USER" \
  -p "$DB_PASSWORD" \
  --authenticationDatabase admin \
  "$DB_NAME" \
  --eval 'JSON.stringify(db.users.find({}, {
    _id: 1,
    name: 1,
    username: 1,
    email: 1,
    emailVerified: 1,
    provider: 1,
    role: 1,
    avatar: 1,
    createdAt: 1,
    updatedAt: 1,
    termsAccepted: 1,
    twoFactorEnabled: 1
  }).toArray(), null, 2)' > "$JSON_FILE"

echo "✅ JSON导出成功: $JSON_FILE"

# 获取用户统计信息
echo ""
echo "📈 用户统计:"
docker exec -i "$CONTAINER_NAME" mongosh --quiet \
  -u "$DB_USER" \
  -p "$DB_PASSWORD" \
  --authenticationDatabase admin \
  "$DB_NAME" << 'EOF'
const stats = db.users.aggregate([
  {
    $facet: {
      total: [{ $count: "count" }],
      verified: [{ $match: { emailVerified: true } }, { $count: "count" }],
      unverified: [{ $match: { emailVerified: false } }, { $count: "count" }],
      byProvider: [{ $group: { _id: "$provider", count: { $sum: 1 } } }],
      byRole: [{ $group: { _id: "$role", count: { $sum: 1 } } }]
    }
  }
]).toArray()[0];

print("  总用户数: " + (stats.total[0]?.count || 0));
print("  已验证邮箱: " + (stats.verified[0]?.count || 0));
print("  未验证邮箱: " + (stats.unverified[0]?.count || 0));
print("");
print("  注册方式分布:");
stats.byProvider.forEach(item => {
  print("    " + item._id + ": " + item.count);
});
print("");
print("  角色分布:");
stats.byRole.forEach(item => {
  print("    " + item._id + ": " + item.count);
});
EOF

echo ""
echo "✨ 导出完成！"
echo "📁 文件位置: $JSON_FILE"
