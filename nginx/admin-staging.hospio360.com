# admin-staging.hospio360.com → the H.M.S admin portal (apps/admin) on :3002.
# After `sudo certbot --nginx -d admin-staging.hospio360.com` certbot adds the ssl lines and the redirect.
server {
    listen 80;
    listen [::]:80;
    server_name admin-staging.hospio360.com;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
