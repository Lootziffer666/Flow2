\
$repoRoot = Split-Path -Parent $PSScriptRoot
$packagesPath = Join-Path $repoRoot "packages"

Write-Host "=== REPO MAP ==="

if (-not (Test-Path $packagesPath)) {
    Write-Host "❌ packages directory not found"
    exit 1
}

$packages = Get-ChildItem -Path $packagesPath -Directory | Sort-Object Name

foreach ($pkg in $packages) {
    Write-Host "`nPackage: $($pkg.Name)"

    $packageJsonPath = Join-Path $pkg.FullName "package.json"
    $testsPath = Join-Path $pkg.FullName "tests"
    $srcPath = Join-Path $pkg.FullName "src"

    if (Test-Path $packageJsonPath) {
        Write-Host "  - Node package detected"

        try {
            $packageJson = Get-Content $packageJsonPath -Raw

            if ($packageJson -match '"build"\s*:')     { Write-Host "  - build script present" }
            if ($packageJson -match '"lint"\s*:')      { Write-Host "  - lint script present" }
            if ($packageJson -match '"typecheck"\s*:') { Write-Host "  - typecheck script present" }
            if ($packageJson -match '"test"\s*:')      { Write-Host "  - test script present" }
        } catch {
            Write-Host "  - package.json unreadable"
        }
    } else {
        Write-Host "  - No package.json"
    }

    if (Test-Path $srcPath) {
        Write-Host "  - src folder present"
    } else {
        Write-Host "  - No src folder"
    }

    if (Test-Path $testsPath) {
        Write-Host "  - tests folder present"
    } else {
        Write-Host "  - No tests folder"
    }
}

Write-Host "`n=== CANONICAL DEPENDENCY RULES ==="
Write-Host "flow  -> loom"
Write-Host "spin  -> loom"
Write-Host "smash -> loom (optional)"
Write-Host "smash -> flow/spin (read-only)"
Write-Host "NO flow <-> spin direct coupling"
