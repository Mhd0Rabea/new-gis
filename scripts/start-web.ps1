[CmdletBinding()]
param(
    [switch]$CheckOnly,
    [int]$WebPort = 5173
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot

function Get-EnvValue {
    param([string]$Path, [string]$Name, [string]$Default)

    if (Test-Path -LiteralPath $Path) {
        $line = Get-Content -LiteralPath $Path | Where-Object {
            $_ -match "^$([regex]::Escape($Name))="
        } | Select-Object -Last 1
        if ($line) { return ($line -split '=', 2)[1].Trim() }
    }
    return $Default
}

function Test-HttpEndpoint {
    param([string]$Name, [string]$Url)

    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 5
        return [pscustomobject]@{ Service = $Name; Ready = $true; Status = [int]$response.StatusCode; Url = $Url }
    }
    catch {
        return [pscustomobject]@{ Service = $Name; Ready = $false; Status = '-'; Url = $Url }
    }
}

$apiEnv = Join-Path $projectRoot 'api\.env'
$webEnv = Join-Path $projectRoot 'GIS-Base\.env'
$apiHost = Get-EnvValue $apiEnv 'API_HOST' '127.0.0.1'
$apiPort = Get-EnvValue $apiEnv 'API_PORT' '3000'
$apiTarget = Get-EnvValue $webEnv 'MGOS_API_PROXY_TARGET' "http://${apiHost}:$apiPort"
$geoServerTarget = Get-EnvValue $webEnv 'MGOS_GEOSERVER_PROXY_TARGET' 'http://127.0.0.1:8080'
$webTarget = "http://127.0.0.1:$WebPort"

$urls = [ordered]@{
    NestJS = "$apiTarget/api/features/Military_Bases?limit=1"
    GeoServer = "$geoServerTarget/geoserver/mgos/wms?service=WMS&version=1.3.0&request=GetCapabilities"
    React = "$webTarget/map"
}

$initial = @(
    Test-HttpEndpoint 'NestJS' $urls.NestJS
    Test-HttpEndpoint 'GeoServer' $urls.GeoServer
    Test-HttpEndpoint 'React' $urls.React
)

if ($CheckOnly) {
    $initial | Format-Table -AutoSize
    if ($initial.Ready -contains $false) { exit 1 }
    exit 0
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js is not available in PATH.' }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw 'npm is not available in PATH.' }

$geoServerStarted = $false
if (-not ($initial | Where-Object Service -eq 'GeoServer').Ready) {
    $portableGeoServerHome = Join-Path $projectRoot '.runtime\geoserver-3.0.1'
    $geoServerHome = if ($env:GEOSERVER_HOME -and (Test-Path -LiteralPath $env:GEOSERVER_HOME)) {
        $env:GEOSERVER_HOME
    }
    elseif (Test-Path -LiteralPath $portableGeoServerHome) {
        $portableGeoServerHome
    }

    $startupScript = if ($geoServerHome) { Join-Path $geoServerHome 'bin\startup.bat' }
    if ($startupScript -and (Test-Path -LiteralPath $startupScript)) {
        $env:GEOSERVER_HOME = $geoServerHome
        if (-not $env:GEOSERVER_DATA_DIR) {
            $env:GEOSERVER_DATA_DIR = Join-Path $geoServerHome 'data_dir'
        }
        Start-Process -FilePath $startupScript -WorkingDirectory $geoServerHome -WindowStyle Hidden
        $geoServerStarted = $true
    }
    else {
        Write-Warning "GeoServer is not ready at $geoServerTarget and no local installation was found."
    }
}

if (-not ($initial | Where-Object Service -eq 'NestJS').Ready) {
    $apiPath = Join-Path $projectRoot 'api'
    $apiCommand = "Set-Location -LiteralPath '$($apiPath.Replace("'", "''"))'; npm run start:dev"
    Start-Process powershell.exe -ArgumentList @('-NoExit', '-Command', $apiCommand)
}

if (-not ($initial | Where-Object Service -eq 'React').Ready) {
    $webPath = Join-Path $projectRoot 'GIS-Base'
    $webCommand = "Set-Location -LiteralPath '$($webPath.Replace("'", "''"))'; npm run dev -- --port $WebPort --strictPort"
    Start-Process powershell.exe -ArgumentList @('-NoExit', '-Command', $webCommand)
}

$deadline = (Get-Date).AddSeconds($(if ($geoServerStarted) { 120 } else { 20 }))
do {
    Start-Sleep -Milliseconds 500
    $results = @(
        Test-HttpEndpoint 'NestJS' $urls.NestJS
        Test-HttpEndpoint 'GeoServer' $urls.GeoServer
        Test-HttpEndpoint 'React' $urls.React
    )
} while (($results.Ready -contains $false) -and (Get-Date) -lt $deadline)

$results | Format-Table -AutoSize
if (($results | Where-Object Service -eq 'React').Ready) {
    Write-Host "MGOS map: $($urls.React)"
}
if ($results.Ready -contains $false) { exit 1 }
