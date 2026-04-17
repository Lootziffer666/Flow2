\
Write-Host "=== VERIFY FULL START ==="

$failed = $false
$repoRoot = Split-Path -Parent $PSScriptRoot

function Run-Step($name, $scriptBlock) {
    Write-Host "`n--- $name ---"
    try {
        & $scriptBlock
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Failed: $name"
            $global:failed = $true
        } else {
            Write-Host "✅ Passed: $name"
        }
    } catch {
        Write-Host "❌ Error in: $name"
        Write-Host $_
        $global:failed = $true
    } finally {
        Set-Location $repoRoot
    }
}

function Invoke-PackageFullCheck($packageName) {
    $packagePath = Join-Path $repoRoot "packages/$packageName"

    if (-not (Test-Path $packagePath)) {
        Write-Host "⚠️ Package missing: $packageName"
        return
    }

    Set-Location $packagePath

    if (-not (Test-Path "package.json")) {
        Write-Host "⚠️ No package.json in $packageName"
        return
    }

    $packageJson = Get-Content "package.json" -Raw

    if ($packageJson -match '"lint"\s*:') {
        npm run lint
        if ($LASTEXITCODE -ne 0) { return }
    }

    if ($packageJson -match '"typecheck"\s*:') {
        npm run typecheck
        if ($LASTEXITCODE -ne 0) { return }
    }

    if ($packageJson -match '"build"\s*:') {
        npm run build
        if ($LASTEXITCODE -ne 0) { return }
    }

    if ($packageJson -match '"test"\s*:') {
        npm run test
        if ($LASTEXITCODE -ne 0) { return }
    } else {
        Write-Host "⚠️ No test script found in $packageName"
    }
}

Run-Step "Structure check" {
    if (Test-Path (Join-Path $repoRoot "shared")) {
        Write-Host "❌ Deprecated 'shared' folder exists"
        exit 1
    }

    if (-not (Test-Path (Join-Path $repoRoot "packages/loom"))) {
        Write-Host "❌ Loom missing"
        exit 1
    }

    if (-not (Test-Path (Join-Path $repoRoot "docs/repo-map.md"))) {
        Write-Host "❌ docs/repo-map.md missing"
        exit 1
    }

    Write-Host "Core structure looks sane"
    exit 0
}

Run-Step "Loom full check"  { Invoke-PackageFullCheck "loom" }
Run-Step "Flow full check"  { Invoke-PackageFullCheck "flow" }
Run-Step "Spin full check"  { Invoke-PackageFullCheck "spin" }
Run-Step "Smash full check" { Invoke-PackageFullCheck "smash" }

Run-Step "Loom impact check" {
    & (Join-Path $repoRoot "scripts/loom-impact-check.ps1")
}

if ($failed) {
    Write-Host "`n=== VERIFY FULL FAILED ==="
    exit 1
} else {
    Write-Host "`n=== VERIFY FULL PASSED ==="
    exit 0
}
