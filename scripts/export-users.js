#!/usr/bin/env node
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

/**
 * 导出平台注册用户数据
 * 支持CSV和JSON两种格式
 */

// 定义User Schema（简化版，仅用于查询）
const UserSchema = new mongoose.Schema({
    name: String,
    username: String,
    email: String,
    emailVerified: Boolean,
    provider: String,
    role: String,
    avatar: String,
    twoFactorEnabled: Boolean,
    termsAccepted: Boolean,
}, {
    timestamps: true,
    collection: 'users'
});

const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toISOString();
};

const exportToJSON = (users, outputPath) => {
    const data = users.map(user => ({
        id: user._id,
        name: user.name || '',
        username: user.username || '',
        email: user.email,
        emailVerified: user.emailVerified,
        provider: user.provider,
        role: user.role,
        avatar: user.avatar || '',
        createdAt: formatDate(user.createdAt),
        updatedAt: formatDate(user.updatedAt),
        termsAccepted: user.termsAccepted,
        twoFactorEnabled: user.twoFactorEnabled,
    }));

    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ 成功导出 ${data.length} 个用户到 ${outputPath}`);
};

const exportToCSV = (users, outputPath) => {
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
        '双因素认证',
    ].join(',');

    const rows = users.map(user => {
        return [
            user._id,
            `"${(user.name || '').replace(/"/g, '""')}"`,
            `"${(user.username || '').replace(/"/g, '""')}"`,
            user.email,
            user.emailVerified ? '是' : '否',
            user.provider,
            user.role,
            formatDate(user.createdAt),
            formatDate(user.updatedAt),
            user.termsAccepted ? '是' : '否',
            user.twoFactorEnabled ? '是' : '否',
        ].join(',');
    });

    const csv = [headers, ...rows].join('\n');
    fs.writeFileSync(outputPath, '\uFEFF' + csv, 'utf8'); // BOM for Excel UTF-8 support
    console.log(`✅ 成功导出 ${rows.length} 个用户到 ${outputPath}`);
};

async function exportUsers() {
    try {
        console.log('🔌 正在连接到数据库...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ 数据库连接成功\n');

        // 获取或创建User模型
        const User = mongoose.models.User || mongoose.model('User', UserSchema);

        console.log('📊 正在获取用户数据...');
        const users = await User.find({})
            .select('name username email emailVerified provider role avatar createdAt updatedAt termsAccepted twoFactorEnabled')
            .sort({ createdAt: -1 })
            .lean();

        console.log(`📋 找到 ${users.length} 个注册用户\n`);

        if (users.length === 0) {
            console.log('⚠️  没有找到任何用户数据');
            return;
        }

        // 显示统计信息
        console.log('📈 用户统计:');
        const stats = {
            total: users.length,
            verified: users.filter(u => u.emailVerified).length,
            unverified: users.filter(u => !u.emailVerified).length,
            byProvider: {},
            byRole: {},
        };

        users.forEach(user => {
            stats.byProvider[user.provider] = (stats.byProvider[user.provider] || 0) + 1;
            stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;
        });

        console.log(`  总用户数: ${stats.total}`);
        console.log(`  已验证邮箱: ${stats.verified}`);
        console.log(`  未验证邮箱: ${stats.unverified}`);
        console.log('  注册方式分布:');
        Object.entries(stats.byProvider).forEach(([provider, count]) => {
            console.log(`    ${provider}: ${count}`);
        });
        console.log('  角色分布:');
        Object.entries(stats.byRole).forEach(([role, count]) => {
            console.log(`    ${role}: ${count}`);
        });
        console.log('');

        // 创建导出目录
        const exportDir = path.join(__dirname, '..', 'exports');
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }

        // 生成文件名（带时间戳）
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const jsonPath = path.join(exportDir, `users-${timestamp}.json`);
        const csvPath = path.join(exportDir, `users-${timestamp}.csv`);

        // 导出为JSON
        exportToJSON(users, jsonPath);

        // 导出为CSV
        exportToCSV(users, csvPath);

        console.log('\n✨ 导出完成！');
        console.log(`📁 文件保存在: ${exportDir}`);

    } catch (error) {
        console.error('❌ 导出失败:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 数据库连接已关闭');
    }
}

// 执行导出
exportUsers();
