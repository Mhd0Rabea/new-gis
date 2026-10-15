[CmdletBinding()]
param(
    [ValidateSet('core', 'all')]
    [string] $Group = 'core',
    [switch] $DryRun,
    [string] $ProjectRoot,
    [string] $Config,
    [string] $Gdb,
    [string] $Sde,
    [string] $Schema,
    [int] $Srid,
    [string] $Report
)

$ErrorActionPreference = 'Stop'
$detectedRoot = Split-Path -Parent $PSScriptRoot
$importer = Join-Path $PSScriptRoot 'import_mgos.py'
$pythonArgs = @($importer, '--group', $Group)
if ($DryRun) { $pythonArgs += '--dry-run' }
foreach ($entry in @(
    @('--project-root', $ProjectRoot),
    @('--config', $Config),
    @('--gdb', $Gdb),
    @('--sde', $Sde),
    @('--schema', $Schema),
    @('--report', $Report)
)) {
    if ($entry[1]) { $pythonArgs += $entry }
}
if ($PSBoundParameters.ContainsKey('Srid')) {
    $pythonArgs += @('--srid', [string] $Srid)
}

function Invoke-Importer([string] $CommandPath) {
    & $CommandPath @pythonArgs
    exit $LASTEXITCODE
}

if ($env:ARCGIS_PYTHON) {
    Invoke-Importer (Resolve-Path $env:ARCGIS_PYTHON).Path
}

$propy = Get-Command propy.bat -ErrorAction SilentlyContinue
if ($propy) {
    & $propy.Source @pythonArgs
    exit $LASTEXITCODE
}

$candidates = [System.Collections.Generic.List[string]]::new()
foreach ($registryPath in @(
    'HKLM:\SOFTWARE\ESRI\ArcGISPro',
    'HKLM:\SOFTWARE\WOW6432Node\ESRI\ArcGISPro'
)) {
    $install = (Get-ItemProperty -LiteralPath $registryPath -ErrorAction SilentlyContinue).InstallDir
    if ($install) {
        $candidates.Add((Join-Path $install 'bin\Python\envs\arcgispro-py3\python.exe'))
    }
}
if ($env:ProgramFiles) {
    $candidates.Add((Join-Path $env:ProgramFiles 'ArcGIS\Pro\bin\Python\envs\arcgispro-py3\python.exe'))
}

$python = $candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $python) {
    throw 'ArcGIS Pro Python was not found. Set ARCGIS_PYTHON to its python.exe path.'
}

Push-Location $detectedRoot
try {
    Invoke-Importer $python
}
finally {
    Pop-Location
}