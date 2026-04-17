\
$repoRoot = Split-Path -Parent $PSScriptRoot
$loomPath = Join-Path $repoRoot "packages/loom"
$flowPath = Join-Path $repoRoot "packages/flow"
$spinPath = Join-Path $repoRoot "packages/spin"
$smashPath = Join-Path $repoRoot "packages/smash"

Write-Host "=== LOOM IMPACT CHECK START ==="

$failed = $false

function Flag-Failure($message) {
    Write-Host "❌ $message"
    $global:failed = $true
}

function Flag-Warn($message) {
    Write-Host "⚠️ $message"
}

function Flag-Ok($message) {
    Write-Host "✅ $message"
}

if (-not (Test-Path $loomPath)) {
    Flag-Failure "packages/loom is missing"
}

if (-not (Test-Path $flowPath)) {
    Flag-Warn "packages/flow is missing"
}

if (-not (Test-Path $spinPath)) {
    Flag-Warn "packages/spin is missing"
}

$sharedPath = Join-Path $repoRoot "shared"
if (Test-Path $sharedPath) {
    Flag-Failure "Deprecated root/shared still exists"
}

$legacySharedRefs = @()
$scanRoots = @($flowPath, $spinPath, $smashPath) | Where-Object { Test-Path $_ }

foreach ($scanRoot in $scanRoots) {
    $matches = Get-ChildItem -Path $scanRoot -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Extension -in ".ts",".tsx",".js",".jsx",".json",".md",".kt",".kts",".gradle",".properties" } |
        Select-String -Pattern '\bshared\b' -SimpleMatch:$false -ErrorAction SilentlyContinue

    foreach ($m in $matches) {
        $legacySharedRefs += $m
    }
}

if ($legacySharedRefs.Count -gt 0) {
    Flag-Failure "Found legacy 'shared' references outside loom"
    $legacySharedRefs | Select-Object -First 20 | ForEach-Object {
        Write-Host ("   - " + $_.Path.Replace($repoRoot + [IO.Path]::DirectorySeparatorChar, "") + ":" + $_.LineNumber)
    }
} else {
    Flag-Ok "No legacy shared references detected in downstream packages"
}

function Check-PackageDependsOnLoom($packagePath, $packageName) {
    $packageJsonPath = Join-Path $packagePath "package.json"

    if (-not (Test-Path $packageJsonPath)) {
        Flag-Warn "$packageName has no package.json; dependency check skipped"
        return
    }

    $raw = Get-Content $packageJsonPath -Raw
    if ($raw -match '"loom"' -or $raw -match '@[^"]*loom') {
        Flag-Ok "$packageName appears to reference loom"
    } else {
        Flag-Warn "$packageName does not clearly reference loom in package.json"
    }
}

if (Test-Path $flowPath) { Check-PackageDependsOnLoom $flowPath "flow" }
if (Test-Path $spinPath) { Check-PackageDependsOnLoom $spinPath "spin" }

$crossCouplingHits = @()
foreach ($scanRoot in @($flowPath, $spinPath) | Where-Object { Test-Path $_ }) {
    $matches = Get-ChildItem -Path $scanRoot -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Extension -in ".ts",".tsx",".js",".jsx",".json",".md" } |
        Select-String -Pattern 'packages/spin|packages/flow|from\s+[\'"].*spin|from\s+[\'"].*flow' -ErrorAction SilentlyContinue

    foreach ($m in $matches) {
        $crossCouplingHits += $m
    }
}

if ($crossCouplingHits.Count -gt 0) {
    Flag-Warn "Potential direct flow/spin coupling found"
    $crossCouplingHits | Select-Object -First 20 | ForEach-Object {
        Write-Host ("   - " + $_.Path.Replace($repoRoot + [IO.Path]::DirectorySeparatorChar, "") + ":" + $_.LineNumber)
    }
} else {
    Flag-Ok "No obvious direct flow/spin coupling found"
}

if ($failed) {
    Write-Host "`n=== LOOM IMPACT CHECK FAILED ==="
    exit 1
} else {
    Write-Host "`n=== LOOM IMPACT CHECK PASSED ==="
    exit 0
}
