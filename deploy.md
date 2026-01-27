---
description: How to deploy the application to a production server
---

# Deployment Guide for Vibe Subscription Manager

This guide provides step-by-step instructions for deploying the Vibe Subscription Manager application to a production server.

## 📋 Prerequisites

Before deploying, ensure you have:

- A Linux server with SSH access:
  - Ubuntu 20.04 LTS or newer, OR
  - Rocky Linux 8 or newer
- Root or sudo privileges
- A domain name (optional but recommended)
- SSL certificate (Let's Encrypt recommended)
- Minimum server requirements:
  - 2 GB RAM
  - 2 CPU cores
  - 20 GB storage

## 🚀 Deployment Options

Choose one of the following deployment methods:


---

## VPS Deployment

This method deploys the application directly on a VPS (DigitalOcean, Linode, AWS EC2, etc.)

### Step 1: Server Setup

```bash
# Update system packages
sudo dnf update -y

# Install EPEL repository (required for some packages)
sudo dnf install -y epel-release

# Install Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs

# Install pnpm
sudo npm install -g pnpm@8.15.0

# Install Nginx (reverse proxy)
sudo dnf install -y nginx

# Install Certbot for SSL (optional)
sudo dnf install -y certbot python3-certbot-nginx

# Install PM2 (process manager)
sudo npm install -g pm2

# Enable and start Nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Configure SELinux for Nginx reverse proxy
sudo setsebool -P httpd_can_network_connect 1

# If using SQLite database file, allow Nginx to write to data directory
sudo semanage fcontext -a -t httpd_sys_rw_content_t "/opt/subscription-manager/data(/.*)?"
sudo restorecon -Rv /opt/subscription-manager/data
```

### Step 2: Create Application User

```bash
# Create a dedicated user for the application
sudo useradd -r -m -d /opt/subscription-manager -s /bin/bash subscription-manager

# Switch to the application user
sudo su - subscription-manager
```

### Step 3: Deploy Application Code

```bash
# Clone the repository
cd /opt/subscription-manager
git clone <your-repository-url> app
cd app

# Install dependencies
pnpm install --frozen-lockfile

# Build the application
pnpm build
```

### Step 4: Configure Environment Variables

```bash
# Create production environment file for backend
cat > apps/backend/.env << 'EOF'
# Database
DATABASE_URL=file:/opt/subscription-manager/data/production.db

# Security - CHANGE THESE!
JWT_SECRET=<generate-a-strong-secret-min-32-chars>
API_KEY_SECRET=<generate-a-strong-secret-min-32-chars>

# Server
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com

# Google reCAPTCHA
RECAPTCHA_SITE_KEY=your-recaptcha-site-key
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key
EOF

# Create data directory
mkdir -p /opt/subscription-manager/data

# Set proper permissions
chmod 600 apps/backend/.env
```

**Generate Strong Secrets:**
```bash
# Generate JWT_SECRET
openssl rand -base64 48

# Generate API_KEY_SECRET
openssl rand -base64 48
```

### Step 5: Initialize Database

```bash
# Run database migrations
pnpm backend:db:push

# Seed initial data (creates admin user)
pnpm backend:db:seed
```

### Step 6: Configure PM2

```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'subscription-manager-backend',
    script: 'dist/index.js',
    cwd: '/opt/subscription-manager/app/apps/backend',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/opt/subscription-manager/logs/backend-error.log',
    out_file: '/opt/subscription-manager/logs/backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '500M',
    watch: false
  }]
}
EOF

# Create logs directory
mkdir -p /opt/subscription-manager/logs

# Start the application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command above
```

### Step 7: Configure Nginx Reverse Proxy

Exit the application user and return to your regular user with sudo access:

```bash
exit  # Exit from subscription-manager user
```

Create Nginx configuration:

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/subscription-manager
```

Add the following configuration:

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://localhost:3000/health;
    }
}

# Frontend (if serving from same server)
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /opt/subscription-manager/app/apps/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site and restart Nginx:

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/subscription-manager /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 8: Setup SSL with Let's Encrypt

```bash
# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Certbot will automatically configure SSL in Nginx
# Follow the prompts to complete setup

# Test automatic renewal
sudo certbot renew --dry-run
```

### Step 9: Configure Firewall

```bash
# Enable and start firewalld
sudo systemctl enable firewalld
sudo systemctl start firewalld

# Allow SSH, HTTP, and HTTPS
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# Reload firewall to apply changes
sudo firewall-cmd --reload

# Verify open ports
sudo firewall-cmd --list-all
```

### Step 10: Setup Monitoring and Logging

```bash
# View PM2 logs
pm2 logs subscription-manager-backend

# Monitor PM2 processes
pm2 monit

# Setup log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## 🔧 Troubleshooting

### Rocky Linux Specific Issues

#### SELinux Permission Denied Errors

If you encounter permission denied errors on Rocky Linux, it's likely due to SELinux policies:

```bash
# Check SELinux status
getenforce

# View SELinux denials
sudo ausearch -m avc -ts recent

# Allow Nginx to connect to network (for reverse proxy)
sudo setsebool -P httpd_can_network_connect 1

# Allow Nginx to read/write to application directories
sudo semanage fcontext -a -t httpd_sys_rw_content_t "/opt/subscription-manager/app(/.*)?"
sudo semanage fcontext -a -t httpd_sys_rw_content_t "/opt/subscription-manager/data(/.*)?"
sudo semanage fcontext -a -t httpd_sys_rw_content_t "/opt/subscription-manager/logs(/.*)?"
sudo restorecon -Rv /opt/subscription-manager

# If PM2 has issues, you may need to allow it as well
sudo semanage fcontext -a -t bin_t "/usr/bin/pm2"
sudo restorecon -v /usr/bin/pm2
```

**Note:** If you need to install `semanage`, run:
```bash
sudo dnf install -y policycoreutils-python-utils
```

#### Database File Permissions

If the application can't write to the SQLite database:

```bash
# Ensure proper ownership
sudo chown -R subscription-manager:subscription-manager /opt/subscription-manager/data

# Set proper permissions
sudo chmod 755 /opt/subscription-manager/data
sudo chmod 644 /opt/subscription-manager/data/*.db

# Update SELinux context
sudo chcon -t httpd_sys_rw_content_t /opt/subscription-manager/data/*.db
```

#### Nginx Can't Start or Bind to Port 80/443

```bash
# Check if another service is using the ports
sudo ss -tulpn | grep ':80\|:443'

# Ensure Nginx is allowed to bind to HTTP ports
sudo semanage port -a -t http_port_t -p tcp 80
sudo semanage port -a -t http_port_t -p tcp 443

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx status and logs
sudo systemctl status nginx
sudo journalctl -u nginx -n 50
```

#### PM2 Startup Issues on Rocky Linux

If PM2 doesn't start on boot:

```bash
# Generate startup script
pm2 startup systemd -u subscription-manager --hp /opt/subscription-manager

# The command will output a command to run with sudo - execute it
# Example: sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u subscription-manager --hp /opt/subscription-manager

# Save PM2 process list
pm2 save

# Test the service
sudo systemctl status pm2-subscription-manager
```

### General Issues

#### Application Won't Start

```bash
# Check PM2 logs
pm2 logs subscription-manager-backend --lines 100

# Check if port 3000 is already in use
sudo ss -tulpn | grep :3000

# Verify environment variables
cat /opt/subscription-manager/app/apps/backend/.env

# Check database file exists and is readable
ls -la /opt/subscription-manager/data/
```

#### Nginx 502 Bad Gateway

```bash
# Check if backend is running
pm2 status

# Check backend logs
pm2 logs subscription-manager-backend

# Verify Nginx can connect to backend
curl http://localhost:3000/health

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

#### SSL Certificate Issues

```bash
# Test certificate renewal
sudo certbot renew --dry-run

# Check certificate status
sudo certbot certificates

# Manually renew if needed
sudo certbot renew --force-renewal
```

#### Out of Memory Errors

```bash
# Check system memory
free -h

# Reduce PM2 instances in ecosystem.config.js
# Change instances: 2 to instances: 1

# Restart PM2
pm2 restart ecosystem.config.js
```

---
