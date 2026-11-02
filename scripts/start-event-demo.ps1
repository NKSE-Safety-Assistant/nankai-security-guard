$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot

if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) {
  Write-Host '[FAILED] Node.js 18 or newer is required.' -ForegroundColor Red
  exit 1
}

function Get-DemoHealth {
  try {
    return Invoke-RestMethod -Uri 'http://127.0.0.1:8021/api/health' -TimeoutSec 2
  } catch {
    return $null
  }
}

function Stop-JsonDemoServer {
  param($Health)
  if (-not $Health -or $Health.service -ne 'nankai-security-guard' -or $Health.databaseMode -eq 'mysql') { return }
  $listener = Get-NetTCPConnection -LocalPort 8021 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $listener) { return }
  $process = Get-Process -Id $listener.OwningProcess -ErrorAction SilentlyContinue
  if ($process -and $process.ProcessName -eq 'node') {
    Write-Host 'Stopping the earlier JSON demo service before switching to MySQL...'
    Stop-Process -Id $process.Id -Force
    Start-Sleep -Milliseconds 800
  }
}

$health = Get-DemoHealth
Stop-JsonDemoServer -Health $health
$health = Get-DemoHealth

if (-not $health) {
  Write-Host 'Starting Nankai Security Guard...'
  Start-Process -FilePath 'node.exe' `
    -ArgumentList 'server.js' `
    -WorkingDirectory $projectRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $projectRoot 'local-server.log') `
    -RedirectStandardError (Join-Path $projectRoot 'local-server-error.log')

  $ready = $false
  foreach ($attempt in 1..20) {
    Start-Sleep -Milliseconds 500
    $health = Get-DemoHealth
    if ($health) {
      $ready = $true
      break
    }
  }
  if (-not $ready) {
    Write-Host '[FAILED] The website did not start. Make sure MySQL80 is running.' -ForegroundColor Red
    Write-Host 'See local-server-error.log for details.'
    exit 1
  }
}

if ($health.databaseMode -ne 'mysql') {
  Write-Host '[FAILED] The website is running, but it is not connected to MySQL.' -ForegroundColor Red
  Write-Host 'Close the existing service and run this launcher again.'
  exit 1
}

Start-Process 'http://localhost:8021/knowledge.html'
Write-Host 'The fire-safety demo page is open.' -ForegroundColor Green

& node.exe scripts\check-event-demo.js
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}
exit 0
