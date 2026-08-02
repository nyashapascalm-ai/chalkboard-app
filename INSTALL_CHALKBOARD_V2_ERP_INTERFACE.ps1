$ErrorActionPreference = "Stop"
Set-Location "C:\Users\Dell\Downloads\chalkboard-x\chalkboard"

$globals = ".\app\globals.css"
$admin = ".\app\app\admin\page.js"

if (-not (Test-Path $globals)) { throw "app\globals.css was not found." }
if (-not (Test-Path $admin)) { throw "app\app\admin\page.js was not found." }
if (-not (Test-Path ".\styles\chalkboard-v2.css")) { throw "styles\chalkboard-v2.css was not found." }
if (-not (Test-Path ".\components\AdminExecutiveDashboard.js")) { throw "components\AdminExecutiveDashboard.js was not found." }

$globalsBackup = ".\app\globals.before-v2.css"
$adminBackup = ".\app\app\admin\page.before-v2.js"

if (-not (Test-Path $globalsBackup)) { Copy-Item $globals $globalsBackup -Force }
if (-not (Test-Path $adminBackup)) { Copy-Item $admin $adminBackup -Force }

$globalContent = Get-Content $globals -Raw
$themeImport = '@import "../styles/chalkboard-v2.css";'

if (-not $globalContent.Contains($themeImport)) {
  $globalContent = $themeImport + "`r`n" + $globalContent
}

[System.IO.File]::WriteAllText(
  (Resolve-Path $globals),
  $globalContent,
  [System.Text.UTF8Encoding]::new($false)
)

$content = Get-Content $admin -Raw
$import = "import AdminExecutiveDashboard from '../../../components/AdminExecutiveDashboard';"

if (-not $content.Contains($import)) {
  $imports = [regex]::Matches(
    $content,
    '^import .*?;\r?$',
    [System.Text.RegularExpressions.RegexOptions]::Multiline
  )

  if ($imports.Count -eq 0) { throw "No imports were found in the Admin page." }

  $lastImport = $imports[$imports.Count - 1]

  $content =
    $content.Substring(0, $lastImport.Index + $lastImport.Length) +
    "`r`n" +
    $import +
    $content.Substring($lastImport.Index + $lastImport.Length)
}

$startMarker = "function DashboardPanel({ schoolId, school }) {"
$endMarker = "function AnnouncementsPanel"

$start = $content.IndexOf($startMarker)
$end = $content.IndexOf($endMarker, $start + $startMarker.Length)

if ($start -lt 0 -or $end -lt 0) {
  throw "Could not locate DashboardPanel boundaries."
}

$replacement = @'
function DashboardPanel({ schoolId, school }) {
  return (
    <AdminExecutiveDashboard
      schoolId={schoolId}
      school={school}
    />
  );
}

'@

$content =
  $content.Substring(0, $start) +
  $replacement +
  $content.Substring($end)

[System.IO.File]::WriteAllText(
  (Resolve-Path $admin),
  $content,
  [System.Text.UTF8Encoding]::new($false)
)

Write-Host "Chalkboard V2 ERP interface installed."
Write-Host "Executive dashboard installed."
Write-Host "Navy and blue controls forced across the portal."
Write-Host "Backups:"
Write-Host $globalsBackup
Write-Host $adminBackup
