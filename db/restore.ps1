# Восстанавливает копию, сделанную db/backup.ps1, в локальную базу разработки.
# ОПАСНО: текущее содержимое базы заменяется, поэтому скрипт работает только с ключом -Yes.
#   powershell -ExecutionPolicy Bypass -File db\restore.ps1 -File db\backups\<name>.dump -Yes
#   powershell -ExecutionPolicy Bypass -File db\restore.ps1 -File db\backups\<name>.dump -DbName mystara -Yes
param(
  [Parameter(Mandatory = $true)][string]$File,
  [string]$DbName,
  [switch]$Yes
)
$ErrorActionPreference = 'Stop'

if (-not $Yes) { throw 'Содержимое базы будет заменено. Для подтверждения запустите скрипт с ключом -Yes.' }

$root = Split-Path -Parent $PSScriptRoot
$pgBin = 'C:\Program Files\PostgreSQL\16\bin'
if (-not (Test-Path $File)) { throw "Файл копии не найден: $File" }

foreach ($line in Get-Content (Join-Path $root '.env.local')) {
  if ($line -match '^(\w+)="(.*)"$') { Set-Item -Path "Env:$($Matches[1])" -Value $Matches[2] }
}
if (-not $env:DATABASE_URL) { throw 'DATABASE_URL не задан в .env.local' }

$url = $env:DATABASE_URL
if ($DbName) { $url = $url -replace '(?<=/)[^/?]+(?=\?|$)', $DbName }

& "$pgBin\pg_restore.exe" --clean --if-exists --no-owner --dbname=$url $File
if ($LASTEXITCODE -ne 0) { throw "pg_restore завершился с ошибкой (код $LASTEXITCODE)" }

$env:DATABASE_URL = $null
"Восстановлено из $File"
