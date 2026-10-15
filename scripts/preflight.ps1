[CmdletBinding()]
param(
    [ValidateSet('Foundation', 'PostGIS', 'GeoServer', 'Api', 'OperationalSync', 'Full')]
    [string] $Target = 'PostGIS',
    [string] $ProjectRoot,
    [switch] $SkipDatabaseValidation,
    [switch] $Json
)

$ErrorActionPreference = 'Stop'
$root = if ($ProjectRoot) { [IO.Path]::GetFullPath($ProjectRoot) } else { Split-Path -Parent $PSScriptRoot }
if (-not (Test-Path -LiteralPath $root -PathType Container)) { throw "Project root does not exist: $root" }
$order = @{ Foundation = 0; PostGIS = 1; GeoServer = 2; Api = 3; OperationalSync = 4; Full = 5 }
$level = $order[$Target]
$results = [Collections.Generic.List[object]]::new()

function Add-Check {
    param(
        [string] $Component,
        [ValidateSet('PASS', 'WARN', 'FAIL', 'INFO')] [string] $Status,
        [bool] $Required,
        [string] $Version = '',
        [string] $Location = '',
        [string] $Detail = ''
    )
    $results.Add([pscustomobject]@{
        Component = $Component; Status = $Status; Required = $Required
        Version = $Version; Location = $Location; Detail = $Detail
    })
}

function Find-ProjectItems([string] $Pattern, [bool] $Directory) {
    $ignored = @('.git', '.agents', '.specify', '__pycache__')
    return @(Get-ChildItem -LiteralPath $root -Recurse -Force -Filter $Pattern -ErrorAction SilentlyContinue |
        Where-Object {
            $_.PSIsContainer -eq $Directory -and
            -not ($_.FullName.Split([IO.Path]::DirectorySeparatorChar) | Where-Object { $ignored -contains $_ })
        } | Sort-Object FullName -Unique)
}

function Find-ArcGis {
    $candidates = [Collections.Generic.List[string]]::new()
    foreach ($key in @('HKLM:\SOFTWARE\ESRI\ArcGISPro', 'HKLM:\SOFTWARE\WOW6432Node\ESRI\ArcGISPro')) {
        $install = (Get-ItemProperty -LiteralPath $key -ErrorAction SilentlyContinue).InstallDir
        if ($install) { $candidates.Add($install) }
    }
    if ($env:ProgramFiles) { $candidates.Add((Join-Path $env:ProgramFiles 'ArcGIS\Pro')) }
    return $candidates | Where-Object { Test-Path -LiteralPath (Join-Path $_ 'bin\ArcGISPro.exe') } | Select-Object -First 1
}

function Find-Psql {
    $command = Get-Command psql.exe -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }
    $candidates = [Collections.Generic.List[string]]::new()
    foreach ($keyRoot in @('HKLM:\SOFTWARE\PostgreSQL\Installations', 'HKLM:\SOFTWARE\WOW6432Node\PostgreSQL\Installations')) {
        Get-ChildItem -LiteralPath $keyRoot -ErrorAction SilentlyContinue | ForEach-Object {
            $properties = Get-ItemProperty -LiteralPath $_.PSPath -ErrorAction SilentlyContinue
            $base = $properties.'Base Directory'
            if (-not $base) { $base = $properties.BaseDirectory }
            if ($base) { $candidates.Add((Join-Path $base 'bin\psql.exe')) }
        }
    }
    if ($env:ProgramFiles) {
        Get-ChildItem -LiteralPath (Join-Path $env:ProgramFiles 'PostgreSQL') -Directory -ErrorAction SilentlyContinue |
            ForEach-Object { $candidates.Add((Join-Path $_.FullName 'bin\psql.exe')) }
    }
    return $candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
}

function Find-Java {
    $candidates = [Collections.Generic.List[string]]::new()
    if ($env:JAVA_HOME) { $candidates.Add((Join-Path $env:JAVA_HOME 'bin\java.exe')) }
    $command = Get-Command java.exe -ErrorAction SilentlyContinue
    if ($command) { $candidates.Add($command.Source) }
    if ($env:ProgramFiles) {
        foreach ($parent in @('Eclipse Adoptium', 'Java')) {
            Get-ChildItem -LiteralPath (Join-Path $env:ProgramFiles $parent) -Directory -ErrorAction SilentlyContinue |
                Sort-Object Name -Descending |
                ForEach-Object { $candidates.Add((Join-Path $_.FullName 'bin\java.exe')) }
        }
    }
    return $candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
}

function Find-GeoServer {
    $locations = [Collections.Generic.List[string]]::new()
    if ($env:GEOSERVER_HOME -and (Test-Path -LiteralPath $env:GEOSERVER_HOME)) {
        $locations.Add([IO.Path]::GetFullPath($env:GEOSERVER_HOME))
    }
    foreach ($base in @($env:ProgramFiles, ${env:ProgramFiles(x86)}, $env:LOCALAPPDATA)) {
        if (-not $base -or -not (Test-Path -LiteralPath $base)) { continue }
        Get-ChildItem -LiteralPath $base -Directory -ErrorAction SilentlyContinue | Where-Object {
            (Test-Path -LiteralPath (Join-Path $_.FullName 'bin\startup.bat')) -or
            (Test-Path -LiteralPath (Join-Path $_.FullName 'webapps\geoserver'))
        } | ForEach-Object { $locations.Add($_.FullName) }
    }
    $locations = @($locations | Sort-Object -Unique)
    $services = @(Get-Service -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match 'geoserver' -or $_.DisplayName -match 'GeoServer' })
    $baseUrl = if ($env:GEOSERVER_URL) { $env:GEOSERVER_URL.TrimEnd('/') } else { 'http://localhost:8080/geoserver' }
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/web/" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            $mode = if ($services.Count -gt 0) {
                ($services | ForEach-Object { "$($_.Name):$($_.Status)" }) -join ', '
            } else { 'standalone process' }
            return [pscustomobject]@{
                Location = ($locations | Select-Object -First 1)
                Detail = "$baseUrl is responding (HTTP 200); $mode."
            }
        }
    }
    catch { }
    if ($services.Count -gt 0 -or $locations.Count -gt 0) {
        return [pscustomobject]@{
            Location = ($locations | Select-Object -First 1)
            Detail = 'Installation found, but the configured endpoint did not respond.'
        }
    }
    return $null
}

function Invoke-ImportDryRun {
    $launcher = Join-Path $root 'scripts\import-mgos.ps1'
    $arguments = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $launcher, '-Group', 'all', '-DryRun', '-ProjectRoot', $root)
    $previous = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $output = & (Join-Path $PSHOME 'powershell.exe') @arguments 2>&1 | Out-String
        $exitCode = $LASTEXITCODE
    }
    finally { $ErrorActionPreference = $previous }
    return [pscustomobject]@{ ExitCode = $exitCode; Output = $output.Trim() }
}

$requiredFiles = @(
    'config\mgos-import.json', 'scripts\import-mgos.ps1', 'scripts\import_mgos.py',
    'database\init\001-create-mgos.sql', 'database\init\002-create-schema.sql',
    'database\security\operational-roles.sql', 'scripts\verify-operational-sync.ps1'
)
$missing = @($requiredFiles | Where-Object { -not (Test-Path -LiteralPath (Join-Path $root $_) -PathType Leaf) })
if ($missing.Count -eq 0) { Add-Check 'Project files' 'PASS' $true -Location $root -Detail 'Portable configuration and import scripts found.' }
else { Add-Check 'Project files' 'FAIL' $true -Detail ("Missing: {0}" -f ($missing -join ', ')) }

$gdb = Find-ProjectItems '*.gdb' $true
if ($gdb.Count -eq 1) { Add-Check 'File Geodatabase' 'PASS' $true -Location $gdb[0].FullName }
else { Add-Check 'File Geodatabase' 'FAIL' $true -Detail "Expected one *.gdb; found $($gdb.Count)." }

$aprx = Find-ProjectItems '*.aprx' $false
if ($aprx.Count -eq 1) { Add-Check 'ArcGIS project' 'PASS' $true -Location $aprx[0].FullName -Detail 'Use .ppkx when sharing outside the repository layout.' }
else { Add-Check 'ArcGIS project' 'FAIL' $true -Detail "Expected one *.aprx; found $($aprx.Count)." }

$sdeRequired = $level -ge $order.PostGIS
$sde = Find-ProjectItems '*.sde' $false
if ($sde.Count -eq 1) { Add-Check 'Database connection (*.sde)' 'PASS' $sdeRequired -Location $sde[0].FullName -Detail 'Local-only file; must not be committed.' }
elseif ($sdeRequired) { Add-Check 'Database connection (*.sde)' 'FAIL' $true -Detail "Expected one local *.sde; found $($sde.Count)." }
else { Add-Check 'Database connection (*.sde)' 'INFO' $false -Detail 'Required starting with PostGIS.' }

$arcgis = Find-ArcGis
if ($arcgis) {
    $arcExe = Join-Path $arcgis 'bin\ArcGISPro.exe'
    Add-Check 'ArcGIS Pro' 'PASS' $true -Version ((Get-Item -LiteralPath $arcExe).VersionInfo.ProductVersion) -Location $arcgis
    $arcPython = Join-Path $arcgis 'bin\Python\envs\arcgispro-py3\python.exe'
    if (Test-Path -LiteralPath $arcPython) { Add-Check 'ArcGIS Python' 'PASS' $true -Location $arcPython }
    else { Add-Check 'ArcGIS Python' 'FAIL' $true -Detail 'arcgispro-py3 was not found.' }
}
else {
    Add-Check 'ArcGIS Pro' 'FAIL' $true -Detail 'ArcGIS Pro was not detected.'
    Add-Check 'ArcGIS Python' 'FAIL' $true -Detail 'Cannot validate without ArcGIS Pro.'
}

$postgresRequired = $level -ge $order.PostGIS
$postgresServices = @(Get-Service -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '^postgresql' })
$psql = Find-Psql
if ($postgresServices.Count -gt 0 -or $psql) {
    $version = if ($psql) { ((& $psql --version) -join ' ').Trim() } else { '' }
    $detail = if ($postgresServices.Count -gt 0) { ($postgresServices | ForEach-Object { "$($_.Name):$($_.Status)" }) -join ', ' } else { 'psql client found.' }
    Add-Check 'PostgreSQL' 'PASS' $postgresRequired -Version $version -Location $psql -Detail $detail
}
elseif ($postgresRequired) { Add-Check 'PostgreSQL' 'FAIL' $true -Detail 'No PostgreSQL service or psql client detected.' }
else { Add-Check 'PostgreSQL' 'INFO' $false -Detail 'Required starting with PostGIS.' }

if ($postgresRequired) {
    if ($SkipDatabaseValidation) { Add-Check 'PostGIS connection and schema' 'WARN' $true -Detail 'Database dry-run was skipped.' }
    elseif ($arcgis -and $sde.Count -eq 1 -and $gdb.Count -eq 1) {
        $db = Invoke-ImportDryRun
        if ($db.ExitCode -eq 0) {
            $summary = ($db.Output -split "`r?`n" | Where-Object { $_ -match 'Validated|PostgreSQL|PostGIS' }) -join ' | '
            Add-Check 'PostGIS connection and schema' 'PASS' $true -Detail $summary
        }
        else { Add-Check 'PostGIS connection and schema' 'FAIL' $true -Detail $db.Output }
    }
    else { Add-Check 'PostGIS connection and schema' 'FAIL' $true -Detail 'Prerequisites for the dry-run are missing.' }
}

$javaRequired = $level -ge $order.GeoServer
$java = Find-Java
if ($java) {
    $previous = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $javaVersion = ((& $java -version 2>&1 | Select-Object -First 1) -join ' ').Trim()
    }
    finally { $ErrorActionPreference = $previous }
    Add-Check 'Java' 'PASS' $javaRequired -Version $javaVersion -Location $java
}
elseif ($javaRequired) { Add-Check 'Java' 'FAIL' $true -Detail 'Java was not detected.' }
else { Add-Check 'Java' 'INFO' $false -Detail 'Required starting with GeoServer.' }

$geoRequired = $level -ge $order.GeoServer
$geoserver = Find-GeoServer
if ($geoserver) { Add-Check 'GeoServer' 'PASS' $geoRequired -Location $geoserver.Location -Detail $geoserver.Detail }
elseif ($geoRequired) { Add-Check 'GeoServer' 'FAIL' $true -Detail 'GeoServer installation or live endpoint was not detected.' }
else { Add-Check 'GeoServer' 'INFO' $false -Detail 'Required starting with GeoServer.' }

$nodeRequired = $level -ge $order.Api
$node = Get-Command node.exe -ErrorAction SilentlyContinue
$npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
if ($node) { Add-Check 'Node.js' 'PASS' $nodeRequired -Version ((& $node.Source --version).Trim()) -Location $node.Source }
elseif ($nodeRequired) { Add-Check 'Node.js' 'FAIL' $true -Detail 'Node.js was not found in PATH.' }
else { Add-Check 'Node.js' 'INFO' $false -Detail 'Required starting with Api.' }
if ($npm) { Add-Check 'npm' 'PASS' $nodeRequired -Version ((& $npm.Source --version).Trim()) -Location $npm.Source }
elseif ($nodeRequired) { Add-Check 'npm' 'FAIL' $true -Detail 'npm was not found in PATH.' }
else { Add-Check 'npm' 'INFO' $false -Detail 'Required starting with Api.' }

$failures = @($results | Where-Object { $_.Required -and $_.Status -eq 'FAIL' })
$warnings = @($results | Where-Object { $_.Status -eq 'WARN' })
$summary = [pscustomobject]@{
    generatedAt = [datetime]::UtcNow.ToString('o'); projectRoot = $root; target = $Target
    status = if ($failures.Count -eq 0) { 'PASS' } else { 'FAIL' }
    failures = $failures.Count; warnings = $warnings.Count; checks = $results
}
if ($Json) { $summary | ConvertTo-Json -Depth 5 }
else {
    $results | Format-Table Component, Status, Required, Version, Detail -AutoSize -Wrap
    Write-Output ''
    Write-Output "Target: $Target"
    Write-Output "Result: $($summary.status) ($($failures.Count) failure(s), $($warnings.Count) warning(s))"
}
if ($failures.Count -gt 0) { exit 1 }
exit 0