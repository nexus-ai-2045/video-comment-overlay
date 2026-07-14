$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Push-Location $repoRoot
try {
  git config core.hooksPath .githooks
  Write-Host "Git hooks enabled: .githooks"
  Write-Host "pre-commit runs: npm run check, npm test, npm run scan:private"
} finally {
  Pop-Location
}
