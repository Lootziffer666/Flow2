\
param (
    [Parameter(Mandatory = $true)]
    [ValidateSet("flow", "spin", "smash", "loom")]
    [string]$package
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$path = Join-Path $repoRoot "packages/$package"

if (-not (Test-Path $path)) {
    Write-Host "❌ Package not found: $package"
    exit 1
}

Set-Location $path

if (-not (Test-Path "package.json")) {
    Write-Host "⚠️ No package.json in $package"
    exit 0
}

$packageJson = Get-Content "package.json" -Raw

if ($packageJson -match '"test"\s*:') {
    Write-Host "Running tests for $package..."
    npm run test
    exit $LASTEXITCODE
}

Write-Host "⚠️ No test script found in $package"
exit 0
