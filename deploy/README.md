# Deploy — istudy-cms

VPS bootstrap + deploy procedure cho `cms.aistudy.com.vn`.

## VPS spec

- Provider: DigitalOcean
- Plan: `s-1vcpu-2gb` Singapore ($12/tháng)
- OS: Ubuntu 24.04 LTS

## Bootstrap (one-time, anh chạy SSH thủ công)

### 1. Initial setup (as root)

```bash
ssh root@<VPS_IP>

# Update + essentials
apt update && apt upgrade -y
apt install -y ufw fail2ban curl gnupg ca-certificates

# Create deploy user
adduser --disabled-password --gecos "" deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Sudo without password (for deploy workflow)
echo "deploy ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/deploy
chmod 440 /etc/sudoers.d/deploy

# SSH hardening
sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd

# Firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# fail2ban
systemctl enable --now fail2ban
```

### 2. Install Docker (as root)

```bash
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Allow deploy user to run docker
usermod -aG docker deploy
```

### 3. Switch to deploy user

```bash
exit
ssh deploy@<VPS_IP>
```

### 4. App directory

```bash
sudo mkdir -p /opt/istudy-cms
sudo chown deploy:deploy /opt/istudy-cms
cd /opt/istudy-cms

# Copy docker-compose.yml + nginx.conf from this repo
# scp từ máy local hoặc git clone repo + symlink
mkdir -p /opt/istudy-cms
# Place docker-compose.yml + nginx.conf in /opt/istudy-cms/
```

### 5. Configure .env

```bash
cd /opt/istudy-cms
# Copy template
scp deploy/.env.example /opt/istudy-cms/.env
chmod 600 .env
nano .env  # fill real values
```

### 6. Login GHCR

```bash
# Generate PAT on GitHub (Settings → Developer settings → Tokens, scope: read:packages)
echo <PAT> | docker login ghcr.io -u nth913 --password-stdin
```

### 7. Cloudflare DNS

Vào Cloudflare dashboard:
- A record `cms.aistudy.com.vn` → `<VPS_IP>`
- **Proxy status: DNS only (orange-cloud OFF)** — WebSocket admin sẽ vỡ nếu bật

### 8. TLS Let's Encrypt

```bash
sudo apt install -y certbot
sudo certbot certonly --standalone -d cms.aistudy.com.vn \
  --email <admin-email> --agree-tos --no-eff-email

# Auto-renew cron
echo "0 3 * * * certbot renew --quiet --deploy-hook 'docker compose -f /opt/istudy-cms/docker-compose.yml restart nginx'" | sudo tee -a /etc/crontab
```

### 9. Atlas IP allowlist

Vào MongoDB Atlas dashboard → Network Access:
- Add IP `<VPS_IP>/32`
- Remove `0.0.0.0/0` nếu còn

### 10. First deploy

```bash
cd /opt/istudy-cms
docker compose pull
docker compose up -d
docker compose logs -f cms  # check
curl -fsS https://cms.aistudy.com.vn/api/health  # verify
```

## GitHub Secrets (anh add Repository → Settings → Secrets)

| Secret | Value |
|---|---|
| `VPS_HOST` | `<VPS_IP>` hoặc `cms.aistudy.com.vn` |
| `VPS_USER` | `deploy` |
| `SSH_PRIVATE_KEY` | Private key tương ứng với public key authorized_keys của user deploy |
| `GHCR_PULL_TOKEN` | Same PAT đã dùng `docker login ghcr.io` (read:packages) |

## Deploy workflow

Sau khi setup xong, trigger deploy:
- GitHub UI → Actions → "Deploy to VPS" → "Run workflow" → chọn `main` branch
- Workflow SSH VPS, pull image, restart, healthcheck.

## Rollback

```bash
ssh deploy@<VPS_IP>
cd /opt/istudy-cms
docker image ls ghcr.io/nth913/istudy-cms  # list available tags
VERSION=sha-<previous-7char> docker compose up -d cms --wait
curl -fsS https://cms.aistudy.com.vn/api/health
```
