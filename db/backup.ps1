# Backs up a local development database to db/backups/<name>_<date>.dump
# (PostgreSQL custom format - restore it with db/restore.ps1). Run from anywhere:
#   powershell -ExecutionPolicy Bypass -File db\backup.ps1               # the app database (from DATABASE_URL)
#   powershell -ExecutionPolicy Bypass -File db\backup.ps1 -DbName mystara   # another database on the same server
param([string]$DbName)
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$pgBin = 'C:\Program Files\PostgreSQL\16\bin'

foreach ($line in Get-Content (Join-Path $root '.env.local')) {
  if ($line -match '^(\w+)="(.*)"$') { Set-Item -Path "Env:$($Matches[1])" -Value $Matches[2] }
}
if (-not $env:DATABASE_URL) { throw 'DATABASE_URL is not set in .env.local' }

# Same server and user, different database name.
$url = $env:DATABASE_URL
if ($DbName) { $url = $url -replace '(?<=/)[^/?]+(?=\?|$)', $DbName }
$name = if ($DbName) { $DbName } else { ([uri]$url).AbsolutePath.TrimStart('/') }

$dir = Join-Path $PSScriptRoot 'backups'
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$file = Join-Path $dir ('{0}_{1:yyyy-MM-dd_HHmm}.dump' -f $name, (Get-Date))

& "$pgBin\pg_dump.exe" --format=custom --no-owner --dbname=$url --file=$file
if ($LASTEXITCODE -ne 0) { throw "pg_dump failed (exit $LASTEXITCODE)" }

$env:DATABASE_URL = $null
'Backup saved: {0} ({1:N0} bytes)' -f $file, (Get-Item $file).Length
