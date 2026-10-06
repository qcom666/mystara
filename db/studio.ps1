# Opens Prisma Studio - a visual browser for the local development database - on
# http://localhost:5555. Run from anywhere:
#   powershell -ExecutionPolicy Bypass -File db\studio.ps1
# Stop it with Ctrl+C. (Prisma doesn't read .env.local itself, so this loads it first.)
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
foreach ($line in Get-Content (Join-Path $root '.env.local')) {
  if ($line -match '^(\w+)="(.*)"$') { Set-Item -Path "Env:$($Matches[1])" -Value $Matches[2] }
}
if (-not $env:DATABASE_URL) { throw 'DATABASE_URL is not set in .env.local' }

Set-Location $root
npx prisma studio --port 5555 --browser none
