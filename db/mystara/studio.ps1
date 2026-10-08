# Открывает Prisma Studio для базы `mystara` (таблицы, строки, схема связей, SQL-консоль)
# на http://localhost:5556. Остановка: Ctrl+C.
#   powershell -ExecutionPolicy Bypass -File db\mystara\studio.ps1 [-DbName mystara]
# Studio сам читает структуру живой базы; файл схемы рядом с конфигом должен лишь существовать
# и быть корректным (записан без BOM, который Prisma не принимает).
param([string]$DbName = 'mystara')
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
foreach ($line in Get-Content (Join-Path $root '.env.local')) {
  if ($line -match '^(\w+)="(.*)"$') { Set-Item -Path "Env:$($Matches[1])" -Value $Matches[2] }
}
if (-not $env:DATABASE_URL) { throw 'DATABASE_URL не задан в .env.local' }
$env:DATABASE_URL = $env:DATABASE_URL -replace '(?<=/)[^/?]+(?=\?|$)', $DbName

Set-Location $root
$schema = Join-Path $PSScriptRoot 'studio\schema.prisma'
Set-Content -Path $schema -Value "datasource db {`n  provider = `"postgresql`"`n}" -Encoding ascii
npx prisma studio --config db/mystara/studio/prisma.config.ts --port 5556 --browser none
