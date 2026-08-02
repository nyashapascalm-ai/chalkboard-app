$ErrorActionPreference = "Stop"

Set-Location "C:\Users\Dell\Downloads\chalkboard-x\chalkboard"

$globals = ".\app\globals.css"
$layout = ".\app\layout.js"

if (-not (Test-Path $globals)) {
  throw "app\globals.css was not found."
}

if (-not (Test-Path $layout)) {
  throw "app\layout.js was not found."
}

if (-not (Test-Path ".\styles\chalkboard-white-sidebar.css")) {
  throw "styles\chalkboard-white-sidebar.css was not found."
}

if (-not (Test-Path ".\components\SidebarIconEnhancer.js")) {
  throw "components\SidebarIconEnhancer.js was not found."
}

$globalsBackup = ".\app\globals.before-white-sidebar.css"
$layoutBackup = ".\app\layout.before-white-sidebar.js"

if (-not (Test-Path $globalsBackup)) {
  Copy-Item $globals $globalsBackup -Force
}

if (-not (Test-Path $layoutBackup)) {
  Copy-Item $layout $layoutBackup -Force
}

$globalContent = Get-Content $globals -Raw
$themeImport = '@import "../styles/chalkboard-white-sidebar.css";'

$globalContent = $globalContent.Replace($themeImport + "`r`n", "")
$globalContent = $globalContent.Replace($themeImport + "`n", "")
$globalContent = $globalContent.Replace($themeImport, "")

$imports = [regex]::Matches(
  $globalContent,
  '^\s*@import\s+[^;]+;\s*$',
  [System.Text.RegularExpressions.RegexOptions]::Multiline
)

if ($imports.Count -gt 0) {
  $lastImport = $imports[$imports.Count - 1]
  $insertAt = $lastImport.Index + $lastImport.Length

  $globalContent =
    $globalContent.Substring(0, $insertAt) +
    "`r`n" +
    $themeImport +
    $globalContent.Substring($insertAt)
}
else {
  $globalContent = $themeImport + "`r`n" + $globalContent
}

[System.IO.File]::WriteAllText(
  (Resolve-Path $globals),
  $globalContent,
  [System.Text.UTF8Encoding]::new($false)
)

$layoutContent = Get-Content $layout -Raw
$componentImport =
  "import SidebarIconEnhancer from '../components/SidebarIconEnhancer';"

if (-not $layoutContent.Contains($componentImport)) {
  $layoutImports = [regex]::Matches(
    $layoutContent,
    '^import .*?;\r?$',
    [System.Text.RegularExpressions.RegexOptions]::Multiline
  )

  if ($layoutImports.Count -eq 0) {
    throw "No import block was found in app\layout.js."
  }

  $lastLayoutImport = $layoutImports[$layoutImports.Count - 1]

  $layoutContent =
    $layoutContent.Substring(
      0,
      $lastLayoutImport.Index + $lastLayoutImport.Length
    ) +
    "`r`n" +
    $componentImport +
    $layoutContent.Substring(
      $lastLayoutImport.Index + $lastLayoutImport.Length
    )
}

if (-not $layoutContent.Contains("<SidebarIconEnhancer")) {
  $bodyOpen = [regex]::Match(
    $layoutContent,
    '<body[^>]*>'
  )

  if (-not $bodyOpen.Success) {
    throw "The body tag was not found in app\layout.js."
  }

  $replacement =
    $bodyOpen.Value +
    "`r`n        <SidebarIconEnhancer />"

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

Write-Host "White sidebar installed."
Write-Host "Sidebar text changed to dark navy."
Write-Host "Navigation spacing reduced."
Write-Host "Icons added to sidebar navigation items."
