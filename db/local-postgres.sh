#!/usr/bin/env bash
# Локальный PostgreSQL на macOS (Postgres.app в ~/Applications или /Applications) для разработки и тестов.
#   db/local-postgres.sh start | stop | status | create ИМЯ_БАЗЫ | psql [ИМЯ_БАЗЫ]
# Настройки через переменные окружения: PG_BIN (папка с программами), PGDATA_DIR (данные), PGPORT (порт).
set -euo pipefail

find_bin() {
  for dir in "${PG_BIN:-}" "$HOME/Applications/Postgres.app/Contents/Versions/latest/bin" \
             "/Applications/Postgres.app/Contents/Versions/latest/bin" "$HOME/Applications/Postgres.app/Contents/Versions/18/bin"; do
    [[ -n "$dir" && -x "$dir/pg_ctl" ]] && { echo "$dir"; return; }
  done
  echo "Не найден PostgreSQL: установите Postgres.app или задайте PG_BIN." >&2
  exit 1
}

BIN="$(find_bin)"
DATA="${PGDATA_DIR:-$HOME/.local/pgdata18}"
PORT="${PGPORT:-5433}"

case "${1:-status}" in
  start)
    if [[ ! -d "$DATA" ]]; then
      "$BIN/initdb" -D "$DATA" -U postgres --auth=trust -E UTF8 --locale=en_US.UTF-8 >/dev/null
      echo "Создан кластер в $DATA"
    fi
    "$BIN/pg_ctl" -D "$DATA" -l "$DATA/server.log" -o "-p $PORT -c listen_addresses=localhost -k /tmp" -w start
    echo "Адрес: postgresql://postgres@localhost:$PORT/ИМЯ_БАЗЫ"
    ;;
  stop) "$BIN/pg_ctl" -D "$DATA" stop -m fast ;;
  status) "$BIN/pg_ctl" -D "$DATA" status || true ;;
  create)
    name="${2:?Укажите имя базы: db/local-postgres.sh create mystara_dev}"
    "$BIN/createdb" -h localhost -p "$PORT" -U postgres "$name"
    echo "Создана база $name: postgresql://postgres@localhost:$PORT/$name"
    ;;
  psql) "$BIN/psql" -h localhost -p "$PORT" -U postgres -d "${2:-postgres}" ;;
  *) echo "Команды: start | stop | status | create ИМЯ | psql [ИМЯ]" >&2; exit 1 ;;
esac
