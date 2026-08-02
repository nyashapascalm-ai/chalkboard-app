$ErrorActionPreference = "Stop"
Set-Location "C:\Users\Dell\Downloads\chalkboard-x\chalkboard"

$file = ".\app\app\admin\page.js"
if (-not (Test-Path $file)) { throw "app\app\admin\page.js was not found." }

$backup = ".\app\app\admin\page.before-personnel-governance.js"
if (-not (Test-Path $backup)) { Copy-Item $file $backup -Force }

$content = Get-Content $file -Raw

$personnelImport = "import PersonnelPanel from '../../../components/PersonnelPanel';"
$boardImport = "import GovernanceBoardPanel from '../../../components/GovernanceBoardPanel';"

if (-not $content.Contains($personnelImport)) {
  $imports = [regex]::Matches($content, '^import .*?;\r?$', [System.Text.RegularExpressions.RegexOptions]::Multiline)
  if ($imports.Count -eq 0) { throw "Could not find imports in Admin page." }
  $last = $imports[$imports.Count - 1]
  $content = $content.Substring(0, $last.Index + $last.Length) + "`r`n" + $personnelImport + "`r`n" + $boardImport + $content.Substring($last.Index + $last.Length)
}

if (-not $content.Contains("['personnel', 'Personnel records', '']")) {
  $content = $content.Replace("['staff', 'Human Resources', '']", "['staff', 'Human Resources', ''],`r`n        ['personnel', 'Personnel records', '']")
}
if (-not $content.Contains("['board', 'Governing board', '']")) {
  $content = $content.Replace("['meetings', 'Meetings and resolutions', '']", "['board', 'Governing board', ''],`r`n        ['meetings', 'Meetings and resolutions', '']")
}

$content = $content.Replace("staff: 'Human Resources',", "staff: 'Human Resources',`r`n    personnel: 'Personnel records',")
$content = $content.Replace("meetings: 'Meetings and resolutions',", "meetings: 'Meetings and resolutions',`r`n    board: 'Governing board',")

if (-not $content.Contains("nav === 'personnel'")) {
  $content = $content.Replace("nav === 'staff' ? <StaffPanel", "nav === 'personnel' ? <PersonnelPanel schoolId={schoolId} /> :`r`n        nav === 'staff' ? <StaffPanel")
}
if (-not $content.Contains("nav === 'board'")) {
  $content = $content.Replace("nav === 'meetings' ? <MeetingsPanel", "nav === 'board' ? <GovernanceBoardPanel schoolId={schoolId} /> :`r`n        nav === 'meetings' ? <MeetingsPanel")
}

[System.IO.File]::WriteAllText((Resolve-Path $file), $content, [System.Text.UTF8Encoding]::new($false))
Write-Host "Personnel records and governing board modules added."
Write-Host "Run the included Supabase SQL before testing."
Write-Host "Backup: $backup"
