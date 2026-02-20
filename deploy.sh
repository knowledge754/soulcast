#!/bin/bash
set -e

# ═══════════════════════════════════════════════════
#  Web3Blog 一键部署脚本 (Ubuntu 24.04)
#  用法: sudo bash deploy.sh <你的域名>
#  示例: sudo bash deploy.sh blog.example.com
# ═══════════════════════════════════════════════════

DOMAIN="${1:?请传入域名，例如: sudo bash deploy.sh blog.example.com}"
REPO_URL="${2:-https://github.com/你的用户名/web3blog.git}"
APP_DIR="/var/www/web3blog"
BRANCH="main"

echo "══════════════════════════════════════"
echo "  Web3Blog 部署 → $DOMAIN"
echo "══════════════════════════════════════"

# ── 1. 系统更新 & 安装基础依赖 ──
echo "[1/7] 安装系统依赖..."
apt-get update -qq
apt-get install -y -qq curl git nginx certbot python3-certbot-nginx ufw > /dev/null

# ── 2. 安装 Node.js 20 LTS ──
if ! command -v node &> /dev/null || [[ $(node -v | cut -d. -f1 | tr -d v) -lt 20 ]]; then
  echo "[2/7] 安装 Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
  apt-get install -y -qq nodejs > /dev/null
else
  echo "[2/7] Node.js $(node -v) 已安装，跳过"
fi
echo "  Node: $(node -v)  npm: $(npm -v)"

# ── 3. 拉取代码 ──
echo "[3/7] 拉取代码..."
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git fetch origin
  git reset --hard "origin/$BRANCH"
else
  rm -rf "$APP_DIR"
  git clone --branch "$BRANCH" --depth 1 "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

# ── 4. 安装依赖 & 构建 ──
echo "[4/7] npm install..."
npm ci --omit=dev --ignore-scripts 2>/dev/null || npm install --omit=dev
echo "[5/7] 构建生产版本..."
npx vue-tsc -b && npx vite build
echo "  构建完成 → $APP_DIR/dist"

# ── 5. 配置 Nginx ──
echo "[6/7] 配置 Nginx..."
cat > /etc/nginx/sites-available/web3blog << NGINX_EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    root $APP_DIR/dist;
    index index.html;

    # SPA 路由 — 所有路径回退到 index.html
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # 静态资源长缓存
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 1024;
}
NGINX_EOF

ln -sf /etc/nginx/sites-available/web3blog /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# ── 6. 防火墙 ──
ufw allow 'Nginx Full' > /dev/null 2>&1
ufw --force enable > /dev/null 2>&1

# ── 7. HTTPS (Let's Encrypt) ──
echo "[7/7] 配置 HTTPS 证书..."
echo "  尝试为 $DOMAIN 申请 Let's Encrypt 证书..."
echo "  (确保域名 DNS 已解析到本服务器 IP)"
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect 2>&1 || {
  echo "  ⚠ 证书申请失败，可能是域名未解析。"
  echo "  请稍后手动执行: sudo certbot --nginx -d $DOMAIN"
  echo "  当前 HTTP 可正常访问"
}

echo ""
echo "══════════════════════════════════════"
echo "  ✅ 部署完成！"
echo "  HTTP:  http://$DOMAIN"
echo "  HTTPS: https://$DOMAIN (如果证书成功)"
echo "══════════════════════════════════════"
echo ""
echo "后续更新只需运行:"
echo "  cd $APP_DIR && git pull && npm ci && npx vite build && sudo systemctl reload nginx"
