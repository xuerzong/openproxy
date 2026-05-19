#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_EXAMPLE="$SCRIPT_DIR/.env.example"
ENV_FILE="$SCRIPT_DIR/.env"

if [[ ! -f "$ENV_EXAMPLE" ]]; then
  echo "Missing $ENV_EXAMPLE" >&2
  exit 1
fi

print_success() {
  printf '\033[32m✓\033[0m %s\n' "$1"
}

generate_secret() {
  openssl rand -base64 32 | tr -d '\n'
}

escape_multiline_for_env() {
  perl -0pe 's/\n/\\\\n/g'
}

get_env_value() {
  local key="$1"

  if ! grep -q "^${key}=" "$ENV_FILE"; then
    return 1
  fi

  grep "^${key}=" "$ENV_FILE" | head -n 1 | cut -d '=' -f 2-
}

set_env_value() {
  local key="$1"
  local value="$2"
  local temp_file

  temp_file="$(mktemp)"

  awk -v key="$key" -v value="$value" '
    BEGIN { updated = 0 }
    $0 ~ "^" key "=" {
      print key "=" value
      updated = 1
      next
    }
    { print }
    END {
      if (!updated) {
        print key "=" value
      }
    }
  ' "$ENV_FILE" > "$temp_file"

  mv "$temp_file" "$ENV_FILE"
}

sync_better_auth_url() {
  local app_domain="$1"
  local current_better_auth_url
  local expected_better_auth_url

  if [[ -z "$app_domain" ]]; then
    return
  fi

  current_better_auth_url="$(get_env_value BETTER_AUTH_URL || true)"
  expected_better_auth_url="https://app.${app_domain}"

  if [[ -z "$current_better_auth_url" || "$current_better_auth_url" == "http://localhost:5173/api" ]]; then
    set_env_value "BETTER_AUTH_URL" "$expected_better_auth_url"
    print_success "Set BETTER_AUTH_URL=$expected_better_auth_url"
    return
  fi

  echo "BETTER_AUTH_URL already set, skipped"
}

prompt_app_domain() {
  local current_app_domain="$1"
  local input_app_domain

  if [[ -n "$current_app_domain" ]]; then
    echo "APP_DOMAIN already set, skipped"
    return
  fi

  while true; do
    if ! read -r -p "Enter APP_DOMAIN (apex domain, e.g. example.com). Leave blank to skip: " input_app_domain; then
      echo
      echo "APP_DOMAIN is empty. Please set it manually in $ENV_FILE if needed."
      return
    fi

    if [[ -z "$input_app_domain" ]]; then
      echo "Skipped APP_DOMAIN"
      return
    fi

    input_app_domain="${input_app_domain#http://}"
    input_app_domain="${input_app_domain#https://}"
    input_app_domain="${input_app_domain#/}"
    input_app_domain="${input_app_domain%%/*}"

    if [[ "$input_app_domain" == *.* ]]; then
      set_env_value "APP_DOMAIN" "$input_app_domain"
      print_success "Set APP_DOMAIN=$input_app_domain"
      sync_better_auth_url "$input_app_domain"
      return
    fi

    echo "Invalid APP_DOMAIN. Use an apex domain like example.com."
  done
}

prompt_admin_emails() {
  local current_admin_emails="$1"
  local input_admin_emails

  if [[ -n "$current_admin_emails" ]]; then
    echo "ADMIN_EMAILS already set, skipped"
    return
  fi

  if ! read -r -p "Enter ADMIN_EMAILS (comma-separated signup emails to promote as admin). Leave blank to skip: " input_admin_emails; then
    echo
    echo "ADMIN_EMAILS is empty. You can set it manually in $ENV_FILE later."
    return
  fi

  input_admin_emails="$(printf '%s' "$input_admin_emails" | tr '[:upper:]' '[:lower:]')"
  input_admin_emails="$(printf '%s' "$input_admin_emails" | sed 's/, */,/g; s/^ *//; s/ *$//')"

  if [[ -z "$input_admin_emails" ]]; then
    echo "Skipped ADMIN_EMAILS"
    return
  fi

  set_env_value "ADMIN_EMAILS" "$input_admin_emails"
  print_success "Set ADMIN_EMAILS=$input_admin_emails"
}

if [[ ! -f "$ENV_FILE" ]]; then
  cp "$ENV_EXAMPLE" "$ENV_FILE"
  print_success "Created .env from .env.example"
else
  echo ".env already exists, keeping existing file"
fi

current_better_auth_secret="$(get_env_value BETTER_AUTH_SECRET || true)"
if [[ -z "$current_better_auth_secret" || "$current_better_auth_secret" == "your-secret" ]]; then
  set_env_value "BETTER_AUTH_SECRET" "$(generate_secret)"
  print_success "Generated BETTER_AUTH_SECRET"
else
  echo "BETTER_AUTH_SECRET already set, skipped"
fi

current_cron_secret="$(get_env_value CRON_SECRET || true)"
if [[ -z "$current_cron_secret" ]]; then
  set_env_value "CRON_SECRET" "$(generate_secret)"
  print_success "Generated CRON_SECRET"
else
  echo "CRON_SECRET already set, skipped"
fi

current_app_domain="$(get_env_value APP_DOMAIN || true)"
prompt_app_domain "$current_app_domain"

if [[ -n "$current_app_domain" ]]; then
  sync_better_auth_url "$current_app_domain"
fi

current_admin_emails="$(get_env_value ADMIN_EMAILS || true)"
prompt_admin_emails "$current_admin_emails"

current_rsa_private_key="$(get_env_value RSA_PRIVATE_KEY || true)"
current_rsa_public_key="$(get_env_value RSA_PUBLIC_KEY || true)"

if [[ -z "$current_rsa_private_key" || -z "$current_rsa_public_key" ]]; then
  private_key_pem="$(openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 2>/dev/null)"
  public_key_pem="$(printf '%s' "$private_key_pem" | openssl rsa -pubout 2>/dev/null)"

  set_env_value "RSA_PRIVATE_KEY" "$(printf '%s' "$private_key_pem" | escape_multiline_for_env)"
  set_env_value "RSA_PUBLIC_KEY" "$(printf '%s' "$public_key_pem" | escape_multiline_for_env)"
  print_success "Generated RSA_PRIVATE_KEY and RSA_PUBLIC_KEY"
else
  echo "RSA keys already set, skipped"
fi

print_success "Done. Env prepared at $ENV_FILE"