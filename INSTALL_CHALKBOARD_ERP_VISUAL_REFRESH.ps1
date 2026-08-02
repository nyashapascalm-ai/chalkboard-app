$ErrorActionPreference = "Stop"
Set-Location "C:\Users\Dell\Downloads\chalkboard-x\chalkboard"

$globals = ".\app\globals.css"
$theme = ".\styles\chalkboard-erp-theme.css"

if (-not (Test-Path $globals)) {
  throw "app\globals.css was not found."
}

if (-not (Test-Path $theme)) {
  throw "styles\chalkboard-erp-theme.css was not found."
}

$backup = ".\app\globals.before-erp-refresh.css"

if (-not (Test-Path $backup)) {
  Copy-Item $globals $backup -Force
  Write-Host "Created backup: $backup"
}

$content = Get-Content $globals -Raw
$import = '@import "../styles/chalkboard-erp-theme.css";'

if (-not $content.Contains($import)) {
  $content = $import + "`r`n" + $content
}

[System.IO.File]::WriteAllText(
  (Resolve-Path $globals),
  $content,
  [System.Text.UTF8Encoding]::new($false)
)

Write-Host "Chalkboard ERP visual system installed."
Write-Host "Navy and blue branding applied across shared portal components."
Write-Host "Backup: $backup"
