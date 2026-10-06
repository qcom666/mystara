# Restores a backup made by db/backup.ps1 into the local development database.
# DESTRUCTIVE: it replaces the current contents of the database, so it only runs with -Yes.
#   powershell -ExecutionPolicy Bypass -File db\restore.ps1 -File db\backups\<name>.dump -Yes
param(
  [Parameter(Mandatory = $true)][string]$File,
  [switch]$Yes
)
$ErrorActionPreference = 'Stop'

if (-not $Yes) { throw 'This replaces the current database contents. Re-run with -Yes to confirm.' }

$root = Split-Path -Parent $PSScriptRoot
$pgBin = 'C:\Program Files\PostgreSQL\16\bin'
if (-not (Test-Path $File)) { throw "Backup file not found: $File" }

foreach ($line in Get-Content (Join-Path $root '.env.local')) {
  if ($line -match '^(\w+)="(.*)"$') { Set-Item -Path "Env:$($Matches[1])" -Value $Matches[2] }
}
if (-not $env:DATABASE_URL) { throw 'DATABASE_URL is not set in .env.local' }

& "$pgBin\pg_restore.exe" --clean --if-exists --no-owner --dbname=$env:DATABASE_URL $File
if ($LASTEXITCODE -ne 0) { throw "pg_restore failed (exit $LASTEXITCODE)" }

$env:DATABASE_URL = $null
"Restored from $File"
