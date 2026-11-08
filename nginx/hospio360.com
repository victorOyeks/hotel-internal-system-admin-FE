# hospio360.com → the landing site (apps/landing) on :3003.
# The certificate for hospio360.com already exists on the box; `sudo certbot --nginx -d hospio360.com -d www.hospio360.com` re-attaches it.
server {
    listen 80;
    listen [::]:80;
    server_name hospio360.com www.hospio360.com;

    location / {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
