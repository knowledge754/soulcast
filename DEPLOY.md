# Web3Blog 部署指南 (Ubuntu 24.04)

## 方案总览

提供两种部署方式，任选其一：

| 方案 | 适合场景 | 更新方式 |
|------|---------|---------|
| **方案 A：一键脚本** | 快速上线，手动更新 | SSH 登录执行 `update.sh` |
| **方案 B：GitHub Actions** | push 到 main 自动部署 | git push 即可 |

---

## 前置条件

- 一台 Ubuntu 24.04 服务器（最低 1C1G 即可）
- 域名已在 DNS 解析到服务器 IP（A 记录）
- 项目已推送到 GitHub 仓库

---

## 方案 A：一键脚本部署

### 步骤 1：推送代码到 GitHub

在本地 Windows 上：

```bash
cd d:\smd\web3blog
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/你的用户名/web3blog.git
git branch -M main
git push -u origin main
```

### 步骤 2：SSH 登录服务器执行

```bash
# 登录服务器
ssh root@你的服务器IP

# 下载并执行部署脚本（二选一）

# 方法1：直接从 GitHub 下载执行
curl -fsSL https://raw.githubusercontent.com/你的用户名/web3blog/main/deploy.sh -o deploy.sh
sudo bash deploy.sh 你的域名.com https://github.com/你的用户名/web3blog.git

# 方法2：先 clone 再执行
git clone https://github.com/你的用户名/web3blog.git /var/www/web3blog
cd /var/www/web3blog
sudo bash deploy.sh 你的域名.com
```

脚本会自动完成：
1. 安装 Node.js 20、Nginx、Certbot
2. `npm install` + `vite build`
3. 配置 Nginx（SPA 路由、Gzip、缓存）
4. 申请 Let's Encrypt HTTPS 证书
5. 开放防火墙 80/443 端口

### 后续更新

```bash
ssh root@你的服务器IP
cd /var/www/web3blog
bash update.sh
```

---

## 方案 B：GitHub Actions 自动部署

每次 push 到 `main` 分支，GitHub 自动构建并部署到服务器。

### 步骤 1：服务器初始化（只需一次）

```bash
ssh root@你的服务器IP

# 安装 Nginx
apt update && apt install -y nginx certbot python3-certbot-nginx

# 创建站点目录
mkdir -p /var/www/web3blog/dist

# 配置 Nginx（替换 your-domain.com 为你的域名）
cat > /etc/nginx/sites-available/web3blog << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com;

    root /var/www/web3blog/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
}
EOF

ln -sf /etc/nginx/sites-available/web3blog /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 申请 HTTPS 证书
certbot --nginx -d your-domain.com

# 开放防火墙
ufw allow 'Nginx Full'
```

### 步骤 2：配置 GitHub Secrets

在 GitHub 仓库 → Settings → Secrets and variables → Actions，添加：

| Secret 名 | 值 |
|-----------|---|
| `SERVER_HOST` | 服务器 IP，如 `123.45.67.89` |
| `SERVER_USER` | SSH 用户名，通常 `root` |
| `SERVER_SSH_KEY` | SSH 私钥（见下方生成方法） |

**生成 SSH 密钥对：**

```bash
# 在服务器上执行
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github_deploy -N ""
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 复制私钥内容，粘贴到 GitHub 的 SERVER_SSH_KEY
cat ~/.ssh/github_deploy
```

### 步骤 3：推送代码触发部署

```bash
git add .
git commit -m "deploy: initial setup"
git push origin main
```

去 GitHub 仓库 → Actions 标签页查看部署进度。

---

## 常见问题

### Q: 证书申请失败？
域名 DNS 必须已经解析到服务器 IP。可以用 `ping 你的域名.com` 验证。解析生效后重新执行：
```bash
sudo certbot --nginx -d 你的域名.com
```

### Q: 访问显示 502 Bad Gateway？
Nginx 没正确指向 dist 目录。检查：
```bash
ls /var/www/web3blog/dist/index.html  # 确认文件存在
nginx -t                                # 检查配置语法
sudo systemctl reload nginx
```

### Q: 路由刷新 404？
Nginx 配置中已包含 `try_files $uri $uri/ /index.html;`，如果还是 404，检查是否正确使用了上面的 Nginx 配置。

### Q: 如何切换到非 root 用户？
```bash
# 创建部署用户
adduser deploy
usermod -aG sudo deploy
mkdir -p /var/www/web3blog
chown -R deploy:deploy /var/www/web3blog
```
然后 GitHub Secrets 中 `SERVER_USER` 改为 `deploy`。

### Q: 如何查看 HTTPS 证书续期状态？
```bash
sudo certbot certificates
# 证书会自动续期，可手动测试：
sudo certbot renew --dry-run
```
