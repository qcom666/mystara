#!/usr/bin/env bash
# Резервная копия базы в db/backups/ (формат pg_dump custom, восстанавливается db/restore.sh).
#   DATABASE_URL="postgresql://..." [DATABASE_SSL_CA="$(cat ca.pem)"] db/backup.sh
# Работает и с локальной базой, и с боевой в РФ: если задан корневой сертификат хостера (DATABASE_SSL_CA),
# соединение проверяется строго. Пароль не печатается. Копии в git не попадают (db/backups в .gitignore).
set -euo pipefail
: "${DATABASE_URL:?Задайте DATABASE_URL}"

BIN="${PG_BIN:-}"
for dir in "$BIN" "$HOME/Applications/Postgres.app/Contents/Versions/latest/bin" "/Applications/Postgres.app/Contents/Versions/latest/bin"; do
  [[ -n "$dir" && -x "$dir/pg_dump" ]] && { BIN="$dir"; break; }
done
command -v "$BIN/pg_dump" >/dev/null 2>&1 || BIN="$(dirname "$(command -v pg_dump)")"

if [[ -n "${DATABASE_SSL_CA:-}" ]]; then
  ca_file="$(mktemp)"; trap 'rm -f "$ca_file"' EXIT
  printf '%b' "$DATABASE_SSL_CA" > "$ca_file"
  export PGSSLROOTCERT="$ca_file" PGSSLMODE=verify-full
fi

dir="$(cd "$(dirname "$0")" && pwd)/backups"
mkdir -p "$dir"
target="$(node -e 'const u=new URL(process.env.DATABASE_URL);console.log(`${u.hostname}-${u.pathname.slice(1)}`)')"
file="$dir/${target}-$(date +%Y%m%d-%H%M%S).dump"

"$BIN/pg_dump" --format=custom --no-owner --no-privileges --file="$file" "$DATABASE_URL"
echo "Готово: $file ($(du -h "$file" | cut -f1))"
