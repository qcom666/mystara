#!/usr/bin/env bash
# Восстановление базы из резервной копии db/backup.sh. ЗАМЕНЯЕТ содержимое базы, поэтому нужен флаг --yes.
#   DATABASE_URL="postgresql://..." db/restore.sh db/backups/ИМЯ.dump --yes
set -euo pipefail
: "${DATABASE_URL:?Задайте DATABASE_URL}"
file="${1:?Укажите файл копии}"
[[ -f "$file" ]] || { echo "Нет файла $file" >&2; exit 1; }

target="$(node -e 'const u=new URL(process.env.DATABASE_URL);console.log(`${u.hostname}:${u.port||5432}/${u.pathname.slice(1)}`)')"
if [[ "${2:-}" != "--yes" ]]; then
  echo "Будет ЗАМЕНЕНО содержимое базы $target данными из $file."
  echo "Если это то, что нужно, повторите команду с флагом --yes."
  exit 1
fi

BIN="${PG_BIN:-}"
for dir in "$BIN" "$HOME/Applications/Postgres.app/Contents/Versions/latest/bin" "/Applications/Postgres.app/Contents/Versions/latest/bin"; do
  [[ -n "$dir" && -x "$dir/pg_restore" ]] && { BIN="$dir"; break; }
done
command -v "$BIN/pg_restore" >/dev/null 2>&1 || BIN="$(dirname "$(command -v pg_restore)")"

if [[ -n "${DATABASE_SSL_CA:-}" ]]; then
  ca_file="$(mktemp)"; trap 'rm -f "$ca_file"' EXIT
  printf '%b' "$DATABASE_SSL_CA" > "$ca_file"
  export PGSSLROOTCERT="$ca_file" PGSSLMODE=verify-full
fi

"$BIN/pg_restore" --clean --if-exists --no-owner --no-privileges --single-transaction --dbname="$DATABASE_URL" "$file"
echo "Восстановлено в $target из $file"
