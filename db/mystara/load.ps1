# Загружает SQL-файлы в ПУСТУЮ базу (по умолчанию mystara) в таком порядке:
#   mystara_schema.sql -> mystara_seed.sql -> mystara_additions.sql -> mystara_extension.sql -> mystara_content.sql
# Сама база должна уже существовать (создайте её в pgAdmin: Databases -> Create -> Database,
# владелец mystara_app, кодировка UTF8; или от администратора: CREATE DATABASE mystara OWNER mystara_app ENCODING 'UTF8';).
# По желанию, для роли только для чтения из расширения: CREATE ROLE mystara_readonly NOLOGIN;  (от администратора)
#   powershell -ExecutionPolicy Bypass -File db\mystara\load.ps1 [-DbName mystara]
param([string]$DbName = 'mystara')
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$psql = 'C:\Program Files\PostgreSQL\16\bin\psql.exe'
$env:PGCLIENTENCODING = 'UTF8'   # файлы в UTF-8; кодировка Windows по умолчанию испортила бы кириллицу
$env:PGOPTIONS = '-c client_min_messages=warning'   # скрываем безвредные NOTICE (PowerShell счёл бы текст в stderr ошибкой)

foreach ($line in Get-Content (Join-Path $root '.env.local')) {
  if ($line -match '^(\w+)="(.*)"$') { Set-Item -Path "Env:$($Matches[1])" -Value $Matches[2] }
}
if (-not $env:DATABASE_URL) { throw 'DATABASE_URL не задан в .env.local' }
$url = $env:DATABASE_URL -replace '(?<=/)[^/?]+(?=\?|$)', $DbName

$tables = & $psql -d $url -w -tAc "select count(*) from information_schema.tables where table_schema = 'public'"
if ($LASTEXITCODE -ne 0) { throw "Не удалось подключиться к базе '$DbName' (она создана?)" }
if ([int]$tables -gt 0) { throw "База '$DbName' не пуста (таблиц: $tables): файл схемы нельзя запускать повторно. Нужна пустая база." }

foreach ($name in 'mystara_schema.sql', 'mystara_seed.sql', 'mystara_additions.sql', 'mystara_extension.sql', 'mystara_content.sql') {
  "Загружается $name ..."
  & $psql -d $url -w -v ON_ERROR_STOP=1 -q -f (Join-Path $PSScriptRoot $name)
  if ($LASTEXITCODE -ne 0) { throw "$name завершился с ошибкой (код $LASTEXITCODE)" }
}
$env:DATABASE_URL = $null
"Готово: база '$DbName' создана."
