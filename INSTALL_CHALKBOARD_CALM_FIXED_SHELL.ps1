$ErrorActionPreference = "Stop"

Set-Location "C:\Users\Dell\Downloads\chalkboard-x\chalkboard"

$globals = ".\app\globals.css"
$layout = ".\app\layout.js"
$admin = ".\app\app\admin\page.js"
$login = ".\app\app\page.js"

if (-not (Test-Path $globals)) {
  throw "app\globals.css was not found."
}

if (-not (Test-Path $layout)) {
  throw "app\layout.js was not found."
}

if (-not (Test-Path ".\styles\chalkboard-calm-shell.css")) {
  throw "styles\chalkboard-calm-shell.css was not found."
}

if (-not (Test-Path ".\components\PortalScrollManager.js")) {
  throw "components\PortalScrollManager.js was not found."
}

if (-not (Test-Path ".\public\chalkboard-sidebar-mark.png")) {
  throw "public\chalkboard-sidebar-mark.png was not found."
}

$backupFiles = @(
  @{ Path = $globals; Backup = ".\app\globals.before-calm-shell.css" },
  @{ Path = $layout; Backup = ".\app\layout.before-calm-shell.js" }
)

if (Test-Path $admin) {
  $backupFiles += @{
    Path = $admin
    Backup = ".\app\app\admin\page.before-calm-shell.js"
  }
}

if (Test-Path $login) {
  $backupFiles += @{
    Path = $login
    Backup = ".\app\app\page.before-calm-shell.js"
  }
}

foreach ($item in $backupFiles) {
  if (-not (Test-Path $item.Backup)) {
    Copy-Item $item.Path $item.Backup -Force
  }
}

$globalContent = Get-Content $globals -Raw
$themeImport = '@import "../styles/chalkboard-calm-shell.css";'

if (-not $globalContent.Contains($themeImport)) {
  $globalContent = $themeImport + "`r`n" + $globalContent
}

[System.IO.File]::WriteAllText(
  (Resolve-Path $globals),
  $globalContent,
  [System.Text.UTF8Encoding]::new($false)
)

$layoutContent = Get-Content $layout -Raw
$managerImport =
  "import PortalScrollManager from '../components/PortalScrollManager';"

if (-not $layoutContent.Contains($managerImport)) {
  $imports = [regex]::Matches(
    $layoutContent,
    '^import .*?;\r?$',
    [System.Text.RegularExpressions.RegexOptions]::Multiline
  )

  if ($imports.Count -eq 0) {
    throw "No import block was found in app\layout.js."
  }

  $lastImport = $imports[$imports.Count - 1]

  $layoutContent =
    $layoutContent.Substring(
      0,
      $lastImport.Index + $lastImport.Length
    ) +
    "`r`n" +
    $managerImport +
    $layoutContent.Substring(
      $lastImport.Index + $lastImport.Length
    )
}

if (-not $layoutContent.Contains("<PortalScrollManager")) {
  $bodyOpen = [regex]::Match(
    $layoutContent,
    '<body[^>]*>'
  )

  if (-not $bodyOpen.Success) {
    throw "The body tag was not found in app\layout.js."
  }

  $replacement =
    $bodyOpen.Value +
    "`r`n        <PortalScrollManager />"

  $layoutContent =
    $layoutContent.Substring(0, $bodyOpen.Index) +
    $replacement +
    $layoutContent.Substring(
      $bodyOpen.Index + $bodyOpen.Length
    )
}

[System.IO.File]::WriteAllText(
  (Resolve-Path $layout),
  $layoutContent,
  [System.Text.UTF8Encoding]::new($false)
)

# Standardise the School Admin sidebar brand to the official icon-only mark.
if (Test-Path $admin) {
  $adminContent = Get-Content $admin -Raw

  $brandPattern =
    '<div className="side-brand">[\s\S]*?</div>'

  if ([regex]::IsMatch($adminContent, $brandPattern)) {
    $adminContent = [regex]::Replace(
      $adminContent,
      $brandPattern,
      '<div className="side-brand"><img src="/chalkboard-sidebar-mark.png" alt="Chalkboard" /></div>',
      1
    )
  }

  [System.IO.File]::WriteAllText(
    (Resolve-Path $admin),
    $adminContent,
    [System.Text.UTF8Encoding]::new($false)
  )
}

# Replace known electric-blue literals in the login source with calm brand colours.
if (Test-Path $login) {
  $loginContent = Get-Content $login -Raw

  $replacements = [ordered]@{
    "#096df3" = "#286fce"
    "#086ff5" = "#286fce"
    "#0a72ff" = "#286fce"
    "#0877ff" = "#286fce"
    "#007bff" = "#286fce"
    "#061e50" = "#061e50"
    "#071f59" = "#061e50"
  }

  foreach ($key in $replacements.Keys) {
    $loginContent =
      $loginContent.Replace(
        $key,
        $replacements[$key]
      )
  }

  [System.IO.File]::WriteAllText(
    (Resolve-Path $login),
    $loginContent,
    [System.Text.UTF8Encoding]::new($false)
  )
}

Write-Host "Calm Chalkboard colour system installed."
Write-Host "Sidebar logo replaced with the official mark."
Write-Host "Sidebar and workspace now scroll independently."
Write-Host "Workspace resets to the top after navigation."
Write-Host "Login role-card contrast improved."
