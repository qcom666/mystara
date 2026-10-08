# Делает копию локальной базы разработки в db/backups/<имя>_<дата>.dump
# (пользовательский формат PostgreSQL; восстановить можно через db/restore.ps1). Запуск из любого места:
#   powershell -ExecutionPolicy Bypass -File db\backup.ps1               # база приложения (из DATABASE_URL)
#   powershell -ExecutionPolicy Bypass -File db\backup.ps1 -DbName mystara   # другая база на том же сервере
param([string]$DbName)
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$pgBin = 'C:\Program Files\PostgreSQL\16\bin'

foreach ($line in Get-Content (Join-Path $root '.env.local')) {
  if ($line -match '^(\w+)="(.*)"$') { Set-Item -Path "Env:$($Matches[1])" -Value $Matches[2] }
}
if (-not $env:DATABASE_URL) { throw 'DATABASE_URL не задан в .env.local' }

# Тот же сервер и пользователь, другое имя базы.
$url = $env:DATABASE_URL
if ($DbName) { $url = $url -replace '(?<=/)[^/?]+(?=\?|$)', $DbName }
$name = if ($DbName) { $DbName } else { ([uri]$url).AbsolutePath.TrimStart('/') }

$dir = Join-Path $PSScriptRoot 'backups'
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$file = Join-Path $dir ('{0}_{1:yyyy-MM-dd_HHmm}.dump' -f $name, (Get-Date))

& "$pgBin\pg_dump.exe" --format=custom --no-owner --dbname=$url --file=$file
if ($LASTEXITCODE -ne 0) { throw "pg_dump завершился с ошибкой (код $LASTEXITCODE)" }

$env:DATABASE_URL = $null
'Копия сохранена: {0} ({1:N0} байт)' -f $file, (Get-Item $file).Length
