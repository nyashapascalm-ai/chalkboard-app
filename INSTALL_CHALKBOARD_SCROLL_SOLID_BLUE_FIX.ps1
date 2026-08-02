$ErrorActionPreference = "Stop"

Set-Location "C:\Users\Dell\Downloads\chalkboard-x\chalkboard"

$globals = ".\app\globals.css"
$theme = ".\styles\chalkboard-scroll-solid-blue.css"

if (-not (Test-Path $globals)) {
  throw "app\globals.css was not found."
}

if (-not (Test-Path $theme)) {
  throw "styles\chalkboard-scroll-solid-blue.css was not found."
}

$backup = ".\app\globals.before-scroll-solid-blue.css"

if (-not (Test-Path $backup)) {
  Copy-Item $globals $backup -Force
  Write-Host "Created backup: $backup"
}

$content = Get-Content $globals -Raw
$import = '@import "../styles/chalkboard-scroll-solid-blue.css";'

# Remove an older copy before inserting it in the correct final import position.
$content = $content.Replace($import + "`r`n", "")
$content = $content.Replace($import + "`n", "")
$content = $content.Replace($import, "")

$importMatches = [regex]::Matches(
  $content,
  '^\s*@import\s+[^;]+;\s*$',
  [System.Text.RegularExpressions.RegexOptions]::Multiline
)

if ($importMatches.Count -gt 0) {
  $lastImport = $importMatches[$importMatches.Count - 1]
  $insertAt = $lastImport.Index + $lastImport.Length

  $content =
    $content.Substring(0, $insertAt) +
    "`r`n" +
    $import +
    $content.Substring($insertAt)
}
else {
  $content = $import + "`r`n" + $content
}

[System.IO.File]::WriteAllText(
  (Resolve-Path $globals),
  $content,
  [System.Text.UTF8Encoding]::new($false)
)

Write-Host "Normal site and login scrolling restored."
Write-Host "Sticky portal sidebar retained."
Write-Host "Solid #1E5EF7 applied as the platform primary colour."
Write-Host "All branded gradients disabled."
Write-Host "Backup: $backup"
