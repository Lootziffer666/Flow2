\
Write-Host "=== VERIFY FAST START ==="

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

function Invoke-PackageFastCheck($packageName) {
    $packagePath = Join-Path $repoRoot "packages/$packageName"

    if (-not (Test-Path $packagePath)) {
        Write-Host "⚠️ Package missing: $packageName"
        return
    }

    Set-Location $packagePath

    if (Test-Path "package.json") {
        $packageJson = Get-Content "package.json" -Raw

        if ($packageJson -match '"lint"\s*:') {
            npm run lint
            if ($LASTEXITCODE -ne 0) { return }
        } elseif ($packageJson -match '"typecheck"\s*:') {
            npm run typecheck
            if ($LASTEXITCODE -ne 0) { return }
        } elseif ($packageJson -match '"test"\s*:') {
            npm run test -- --runInBand
            if ($LASTEXITCODE -ne 0) { return }
        } else {
            Write-Host "⚠️ No lint/typecheck/test script found in $packageName"
        }
    } else {
        Write-Host "⚠️ No package.json in $packageName"
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

Run-Step "Flow fast check"  { Invoke-PackageFastCheck "flow" }
Run-Step "Spin fast check"  { Invoke-PackageFastCheck "spin" }
Run-Step "Smash fast check" { Invoke-PackageFastCheck "smash" }
Run-Step "Loom fast check"  { Invoke-PackageFastCheck "loom" }

if ($failed) {
    Write-Host "`n=== VERIFY FAST FAILED ==="
    exit 1
} else {
    Write-Host "`n=== VERIFY FAST PASSED ==="
    exit 0
}
