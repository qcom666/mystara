# Открывает Prisma Studio, визуальный просмотр локальной базы разработки, на
# http://localhost:5555. Запуск из любого места:
#   powershell -ExecutionPolicy Bypass -File db\studio.ps1
# Остановка: Ctrl+C. (Prisma сам не читает .env.local, поэтому скрипт сначала подгружает его.)
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
foreach ($line in Get-Content (Join-Path $root '.env.local')) {
  if ($line -match '^(\w+)="(.*)"$') { Set-Item -Path "Env:$($Matches[1])" -Value $Matches[2] }
}
if (-not $env:DATABASE_URL) { throw 'DATABASE_URL не задан в .env.local' }

Set-Location $root
npx prisma studio --port 5555 --browser none
