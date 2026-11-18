$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$extensionDir = Join-Path $repoRoot "extensions\chrome-capture"
$distRoot = Join-Path $repoRoot "dist"
$zipPath = Join-Path $distRoot "video-comment-overlay-chrome-capture.zip"

Push-Location $repoRoot
try {
  node scripts/validate-extension.mjs | Out-Host
  if ($LASTEXITCODE -ne 0) {
    throw "validate-extension failed with exit code $LASTEXITCODE"
  }
  if (!(Test-Path -LiteralPath $distRoot)) {
    New-Item -ItemType Directory -Path $distRoot | Out-Null
  }
  if (Test-Path -LiteralPath $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
  }
  Compress-Archive -Path (Join-Path $extensionDir "*") -DestinationPath $zipPath -Force
  Write-Host (@{
    ok = $true
    zipPath = $zipPath
    sourceDir = $extensionDir
  } | ConvertTo-Json)
} finally {
  Pop-Location
}
