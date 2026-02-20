# CuraLink DICOM Viewer - Deployment Guide

## Prerequisites
- Node.js and npm installed on your build machine
- Nginx installed on your production server
- SSL certificate for curalink.nextasolutions.net
- FastAPI backend running on port 8000

## Step 1: Build the React Application

### On your development machine:

```bash
# Navigate to the React app directory
cd dcm4chee-viewer

# Install dependencies (if not already done)
npm install

# Build for production
npm run build
```

This will create a `dist` folder with the optimized production build.

## Step 2: Transfer Files to Server

### Copy the built files to your production server:

```bash
# Create directory on server (SSH into your server first)
sudo mkdir -p /var/www/curalink

# From your local machine, copy the dist folder
scp -r dist/* user@curalink.nextasolutions.net:/var/www/curalink/
```

Or use SFTP, rsync, or your preferred file transfer method.

## Step 3: Configure Nginx

### On your production server:

```bash
# Copy the nginx configuration
sudo cp nginx-curalink.conf /etc/nginx/sites-available/curalink

# Update SSL certificate paths in the config
sudo nano /etc/nginx/sites-available/curalink
# Edit these lines with your actual certificate paths:
#   ssl_certificate /path/to/your/certificate.crt;
#   ssl_certificate_key /path/to/your/private.key;

# Enable the site (on Ubuntu/Debian systems)
sudo ln -s /etc/nginx/sites-available/curalink /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# If test is successful, reload nginx
sudo systemctl reload nginx
```

### For CentOS/RHEL systems:
```bash
# Copy directly to conf.d
sudo cp nginx-curalink.conf /etc/nginx/conf.d/curalink.conf

# Update SSL paths as above
sudo nano /etc/nginx/conf.d/curalink.conf

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

## Step 4: Ensure FastAPI is Running

Make sure your FastAPI backend is running on port 8000:

```bash
# Check if FastAPI is running
sudo systemctl status dcm-api
# or
ps aux | grep uvicorn

# If using systemd, ensure it's enabled
sudo systemctl enable dcm-api
sudo systemctl start dcm-api
```

If you don't have a systemd service, create one:

```bash
# Create systemd service file
sudo nano /etc/systemd/system/dcm-api.service
```

Add this content:
```ini
[Unit]
Description=CuraLink DICOM API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/dcm
Environment="PATH=/path/to/venv/bin"
ExecStart=/path/to/venv/bin/uvicorn app:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then enable and start it:
```bash
sudo systemctl daemon-reload
sudo systemctl enable dcm-api
sudo systemctl start dcm-api
```

## Step 5: Verify Deployment

1. **Check nginx is serving the app:**
   ```bash
   curl https://curalink.nextasolutions.net
   ```

2. **Check API proxy is working:**
   ```bash
   curl https://curalink.nextasolutions.net/api/health
   ```

3. **Open in browser:**
   Visit https://curalink.nextasolutions.net

4. **Check logs if issues occur:**
   ```bash
   # Nginx logs
   sudo tail -f /var/log/nginx/curalink_error.log
   sudo tail -f /var/log/nginx/curalink_access.log

   # FastAPI logs
   sudo journalctl -u dcm-api -f
   ```

## Troubleshooting

### Issue: 502 Bad Gateway
- Check if FastAPI is running: `sudo systemctl status dcm-api`
- Check FastAPI logs: `sudo journalctl -u dcm-api -n 50`
- Verify port 8000 is open: `sudo netstat -tlnp | grep 8000`

### Issue: SSL Certificate Error
- Verify certificate paths in nginx config
- Ensure certificate files have correct permissions: `sudo chmod 644 /path/to/cert.crt`
- Ensure private key has correct permissions: `sudo chmod 600 /path/to/private.key`

### Issue: API calls not working
- Check nginx error logs
- Verify FastAPI is accessible: `curl http://localhost:8000/health`
- Check firewall rules: `sudo ufw status`

### Issue: React Router not working (404 on refresh)
- Ensure the `try_files` directive is correct in nginx config
- This line should be present: `try_files $uri $uri/ /index.html;`

## Updating the Application

When you need to update the frontend:

```bash
# Build new version
cd dcm4chee-viewer
npm run build

# Transfer to server
scp -r dist/* user@curalink.nextasolutions.net:/var/www/curalink/

# Clear nginx cache (if using)
sudo rm -rf /var/cache/nginx/*

# No need to reload nginx for static file changes
```

When you need to update the backend:

```bash
# SSH into server
ssh user@curalink.nextasolutions.net

# Update code
cd /path/to/dcm
git pull  # or however you deploy

# Restart FastAPI
sudo systemctl restart dcm-api
```

## Performance Optimization

1. **Enable HTTP/2** (already in config)
2. **Enable Gzip compression** (already in config)
3. **Set up caching headers** (already in config)
4. **Consider using a CDN** for static assets
5. **Monitor logs** and set up log rotation:

```bash
sudo nano /etc/logrotate.d/curalink
```

Add:
```
/var/log/nginx/curalink_*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

## Security Checklist

- ✅ HTTPS enabled
- ✅ Security headers configured
- ✅ API proxy configured
- ✅ Firewall rules in place
- ✅ Regular updates scheduled
- ⬜ Set up monitoring (e.g., with Prometheus/Grafana)
- ⬜ Set up automated backups
- ⬜ Configure rate limiting if needed

## Support

For issues, check:
1. Nginx error logs: `/var/log/nginx/curalink_error.log`
2. FastAPI logs: `sudo journalctl -u dcm-api -f`
3. Browser console for frontend errors

## Quick Reference

- **App URL**: https://curalink.nextasolutions.net
- **API URL**: https://curalink.nextasolutions.net/api
- **Health Check**: https://curalink.nextasolutions.net/health
- **Nginx Config**: `/etc/nginx/sites-available/curalink` or `/etc/nginx/conf.d/curalink.conf`
- **App Files**: `/var/www/curalink/`
- **Logs**: `/var/log/nginx/curalink_*.log`
