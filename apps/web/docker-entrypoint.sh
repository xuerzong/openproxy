#!/bin/sh
set -eu

umami_website_id=$(printf '%s' "${UMAMI_WEBSITE_ID:-}" | sed 's/[\\"]/\\&/g')

cat > /usr/share/nginx/html/runtime-config.js <<EOF
window.__APP_CONFIG__ = Object.assign(window.__APP_CONFIG__ || {}, {
  UMAMI_WEBSITE_ID: "${umami_website_id}"
})
EOF

exec nginx -g 'daemon off;'
