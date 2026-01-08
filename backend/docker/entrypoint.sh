#!/bin/sh
set -e

if [ ! -f .env ]; then
  cp .env.example .env
fi

if [ -z "$(grep -E '^APP_KEY=' .env | cut -d= -f2)" ]; then
  php artisan key:generate --force
fi

DB_CONNECTION="${DB_CONNECTION:-sqlite}"

if [ "$DB_CONNECTION" = "mysql" ]; then
  echo "Waiting for MySQL..."
  until mysql --ssl=0 -h "${DB_HOST:-db}" -P "${DB_PORT:-3306}" -u "${DB_USERNAME:-firewatch}" ${DB_PASSWORD:+-p${DB_PASSWORD}} -e "SELECT 1" >/dev/null 2>&1; do
    sleep 2
  done
fi

if [ "$DB_CONNECTION" = "sqlite" ]; then
  if [ ! -f database/database.sqlite ]; then
    mkdir -p database
    touch database/database.sqlite
  fi
fi

mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/app/public
chown -R www-data:www-data storage bootstrap/cache || true

php artisan migrate --force
php artisan storage:link || true
php artisan db:seed


exec apache2-foreground
