#!/bin/bash
# 将导出的JSON数据转换为CSV格式

set -e

if [ $# -eq 0 ]; then
    # 查找最新的JSON文件
    JSON_FILE=$(ls -t exports/users_*.json 2>/dev/null | head -1)
    if [ -z "$JSON_FILE" ]; then
        echo "错误: 未找到导出的JSON文件，请先运行 ./scripts/export-users.sh"
        exit 1
    fi
else
    JSON_FILE=$1
fi

CSV_FILE="${JSON_FILE%.json}.csv"

echo "📄 正在转换 $JSON_FILE 到 CSV 格式..."

# 创建临时Node.js脚本
cat > /tmp/json2csv.js << 'EOF'
const fs = require('fs');

const jsonFile = process.argv[2];
const csvFile = process.argv[3];

const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

const headers = [
  'ID',
  '姓名',
  '用户名',
  '邮箱',
  '邮箱已验证',
  '注册方式',
  '角色',
  '创建时间',
  '更新时间',
  '已接受条款',
  '双因素认证'
].join(',');

const rows = data.map(user => {
  return [
    user._id,
    `"${(user.name || '').replace(/"/g, '""')}"`,
    `"${(user.username || '').replace(/"/g, '""')}"`,
    user.email,
    user.emailVerified ? '是' : '否',
    user.provider,
    user.role,
    user.createdAt || '',
    user.updatedAt || '',
    user.termsAccepted ? '是' : '否',
    user.twoFactorEnabled ? '是' : '否'
  ].join(',');
});

const csv = '\uFEFF' + [headers, ...rows].join('\n');
fs.writeFileSync(csvFile, csv, 'utf8');
console.log('✅ CSV转换成功: ' + csvFile);
console.log('📊 共导出 ' + data.length + ' 条记录');
EOF

# 运行转换脚本
node /tmp/json2csv.js "$JSON_FILE" "$CSV_FILE"

echo "✨ 完成！"

