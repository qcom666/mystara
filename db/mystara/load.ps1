# Loads the SQL files into an EMPTY database (default: mystara), in order:
#   mystara_schema.sql -> mystara_seed.sql -> mystara_additions.sql -> mystara_extension.sql -> mystara_content.sql
# The database itself must already exist (create it in pgAdmin: Databases -> Create -> Database,
# owner mystara_app, encoding UTF8; or as administrator: CREATE DATABASE mystara OWNER mystara_app ENCODING 'UTF8';).
# Optional, for the read-only role in the extension: CREATE ROLE mystara_readonly NOLOGIN;  (as administrator)
#   powershell -ExecutionPolicy Bypass -File db\mystara\load.ps1 [-DbName mystara]
param([string]$DbName = 'mystara')
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$psql = 'C:\Program Files\PostgreSQL\16\bin\psql.exe'
$env:PGCLIENTENCODING = 'UTF8'   # the files are UTF-8; Windows' default would garble the Cyrillic
$env:PGOPTIONS = '-c client_min_messages=warning'   # hide harmless NOTICEs (PowerShell would treat stderr text as a failure)

foreach ($line in Get-Content (Join-Path $root '.env.local')) {
  if ($line -match '^(\w+)="(.*)"$') { Set-Item -Path "Env:$($Matches[1])" -Value $Matches[2] }
}
if (-not $env:DATABASE_URL) { throw 'DATABASE_URL is not set in .env.local' }
$url = $env:DATABASE_URL -replace '(?<=/)[^/?]+(?=\?|$)', $DbName

$tables = & $psql -d $url -w -tAc "select count(*) from information_schema.tables where table_schema = 'public'"
if ($LASTEXITCODE -ne 0) { throw "Cannot connect to database '$DbName' (does it exist?)" }
if ([int]$tables -gt 0) { throw "Database '$DbName' is not empty ($tables tables) - the schema file is not re-runnable. Use an empty database." }

foreach ($name in 'mystara_schema.sql', 'mystara_seed.sql', 'mystara_additions.sql', 'mystara_extension.sql', 'mystara_content.sql') {
  "Loading $name ..."
  & $psql -d $url -w -v ON_ERROR_STOP=1 -q -f (Join-Path $PSScriptRoot $name)
  if ($LASTEXITCODE -ne 0) { throw "$name failed (exit $LASTEXITCODE)" }
}
$env:DATABASE_URL = $null
"Done: database '$DbName' is ready."
