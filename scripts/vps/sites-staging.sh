#!/usr/bin/env bash
# Install the nginx sites for the admin portal and the landing page on the staging box (run as devoyeks
# from a checkout of this repo). web-staging.hospio360.com already exists and is left alone.
set -euo pipefail
HERE=$(cd "$(dirname "$0")/../.." && pwd)
for site in admin-staging.hospio360.com hospio360.com; do
  if [ ! -f "/etc/nginx/sites-available/$site" ]; then
    sudo cp "$HERE/nginx/$site" "/etc/nginx/sites-available/$site"
    echo "installed $site"
  else
    echo "$site already exists; not overwritten (diff below)"; diff "/etc/nginx/sites-available/$site" "$HERE/nginx/$site" || true
  fi
  sudo ln -sf "/etc/nginx/sites-available/$site" "/etc/nginx/sites-enabled/$site"
done
sudo nginx -t && sudo systemctl reload nginx
echo "Now: sudo certbot --nginx -d admin-staging.hospio360.com   (needs the DNS A record first)"
echo "     sudo certbot --nginx -d hospio360.com -d www.hospio360.com"
