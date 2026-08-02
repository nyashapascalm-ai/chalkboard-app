$ErrorActionPreference = "Stop"
Set-Location "C:\Users\Dell\Downloads\chalkboard-x\chalkboard"

$file = ".\app\app\admin\page.js"
if (-not (Test-Path $file)) { throw "app\app\admin\page.js was not found." }
if (-not (Test-Path ".\components\CommunicationCentre.js")) { throw "components\CommunicationCentre.js was not found." }

$backup = ".\app\app\admin\page.before-communications-centre.js"
if (-not (Test-Path $backup)) {
  Copy-Item $file $backup -Force
  Write-Host "Created backup: $backup"
}

$content = Get-Content $file -Raw
$import = "import CommunicationCentre from '../../../components/CommunicationCentre';"

if (-not $content.Contains($import)) {
  $imports = [regex]::Matches($content, '^import .*?;\r?$', [System.Text.RegularExpressions.RegexOptions]::Multiline)
  if ($imports.Count -eq 0) { throw "No import block was found in the Admin page." }
  $last = $imports[$imports.Count - 1]
  $content = $content.Substring(0, $last.Index + $last.Length) + "`r`n" + $import + $content.Substring($last.Index + $last.Length)
}

$content = $content.Replace("['announcements', 'Announcements', '']", "['communications', 'Communications', '']")
$content = $content.Replace("announcements: 'Announcements',", "announcements: 'Announcements',`r`n    communications: 'Communications',")

if (-not $content.Contains("nav === 'communications' ? <CommunicationCentre")) {
  $content = $content.Replace(
    "nav === 'announcements' ? <AnnouncementsPanel",
    "nav === 'communications' ? <CommunicationCentre schoolId={schoolId} /> :`r`n        nav === 'announcements' ? <AnnouncementsPanel"
  )
}

[System.IO.File]::WriteAllText((Resolve-Path $file), $content, [System.Text.UTF8Encoding]::new($false))

Write-Host "Chalkboard Communications Centre installed."
Write-Host "Run the Supabase communications SQL before testing."
Write-Host "Backup: $backup"
