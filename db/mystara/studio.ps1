# Opens Prisma Studio on the `mystara` database (tables, rows, relationship diagram, SQL console)
# at http://localhost:5556. Stop with Ctrl+C.
#   powershell -ExecutionPolicy Bypass -File db\mystara\studio.ps1 [-DbName mystara]
# Studio reads the live database structure itself; the schema file next to the config only has to
# exist and be valid (written without a BOM, which Prisma rejects).
param([string]$DbName = 'mystara')
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
foreach ($line in Get-Content (Join-Path $root '.env.local')) {
  if ($line -match '^(\w+)="(.*)"$') { Set-Item -Path "Env:$($Matches[1])" -Value $Matches[2] }
}
if (-not $env:DATABASE_URL) { throw 'DATABASE_URL is not set in .env.local' }
$env:DATABASE_URL = $env:DATABASE_URL -replace '(?<=/)[^/?]+(?=\?|$)', $DbName

Set-Location $root
$schema = Join-Path $PSScriptRoot 'studio\schema.prisma'
Set-Content -Path $schema -Value "datasource db {`n  provider = `"postgresql`"`n}" -Encoding ascii
npx prisma studio --config db/mystara/studio/prisma.config.ts --port 5556 --browser none
