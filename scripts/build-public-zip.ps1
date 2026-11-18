$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$distRoot = Join-Path $repoRoot "dist"
$publicDemoDir = Join-Path $distRoot "public-demo"
$zipPath = Join-Path $distRoot "video-comment-overlay-public-demo.zip"

Push-Location $repoRoot
try {
  node scripts/build-public-demo.mjs | Out-Host
  if ($LASTEXITCODE -ne 0) {
    throw "build-public-demo failed with exit code $LASTEXITCODE"
  }
  if (Test-Path -LiteralPath $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
  }
  Compress-Archive -Path (Join-Path $publicDemoDir "*") -DestinationPath $zipPath -Force
  Write-Host (@{
    ok = $true
    zipPath = $zipPath
    sourceDir = $publicDemoDir
  } | ConvertTo-Json)
} finally {
  Pop-Location
}
