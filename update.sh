#!/bin/bash
set -e

# ═══════════════════════════════════════
#  Web3Blog 快速更新脚本
#  用法: cd /var/www/web3blog && bash update.sh
# ═══════════════════════════════════════

APP_DIR="/var/www/web3blog"
cd "$APP_DIR"

echo "⏳ 拉取最新代码..."
git pull origin main

echo "⏳ 安装依赖..."
npm ci

echo "⏳ 构建..."
npx vue-tsc -b && npx vite build

echo "⏳ 重载 Nginx..."
sudo systemctl reload nginx

echo "✅ 更新完成！$(date)"
