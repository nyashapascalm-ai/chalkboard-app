$ErrorActionPreference = "Stop"

Set-Location "C:\Users\Dell\Downloads\chalkboard-x\chalkboard"

if (-not (Test-Path ".\components\ExportToolbar.js")) {
  throw "components\ExportToolbar.js was not found. Extract the ZIP into the project first."
}

$targets = @(
  @{
    Path = ".\app\app\admin\page.js"
    Import = "import ExportToolbar from '../../../components/ExportToolbar';"
    TitleExpression = "title || 'Chalkboard'"
    Scope = ".main"
    Kind = "admin"
  },
  @{
    Path = ".\app\app\operator\page.js"
    Import = "import ExportToolbar from '../../../components/ExportToolbar';"
    TitleExpression = "'Platform Operator'"
    Scope = ".cb-portal-main"
    Kind = "portal"
  },
  @{
    Path = ".\app\app\ministry\page.js"
    Import = "import ExportToolbar from '../../../components/ExportToolbar';"
    TitleExpression = "'Ministry Oversight'"
    Scope = ".cb-portal-main"
    Kind = "portal"
  }
)

foreach ($target in $targets) {
  $file = $target.Path

  if (-not (Test-Path $file)) {
    Write-Host "Skipped missing file: $file"
    continue
  }

  $backup = "$file.before-platform-export"

  if (-not (Test-Path $backup)) {
    Copy-Item $file $backup -Force
  }

  $content = Get-Content $file -Raw

  # Replace runs of corrupted non-ASCII source characters.
  # Database content is not changed.
  $content = [regex]::Replace(
    $content,
    '[^\x00-\x7F]+',
    ' - '
  )

  # Collapse repeated separators created by the cleanup.
  $content = [regex]::Replace(
    $content,
    '\s+-\s+-\s+',
    ' - '
  )

  if (-not $content.Contains($target.Import)) {
    $imports = [regex]::Matches(
      $content,
      '^import .*?;\r?$',
      [System.Text.RegularExpressions.RegexOptions]::Multiline
    )

    if ($imports.Count -eq 0) {
      throw "No import block found in $file"
    }

    $lastImport = $imports[$imports.Count - 1]

    $content =
      $content.Substring(
        0,
        $lastImport.Index + $lastImport.Length
      ) +
      "`r`n" +
      $target.Import +
      $content.Substring(
        $lastImport.Index + $lastImport.Length
      )
  }

  if (-not $content.Contains("<ExportToolbar")) {
    if ($target.Kind -eq "admin") {
      $marker = "<h1>{title}</h1>"
      $index = $content.IndexOf($marker)

      if ($index -lt 0) {
        throw "Could not find <h1>{title}</h1> in the Admin portal."
      }

      $replacement =
        $marker +
        "`r`n          <ExportToolbar title={$($target.TitleExpression)} scopeSelector=`"$($target.Scope)`" />"

      $content =
        $content.Substring(0, $index) +
        $replacement +
        $content.Substring($index + $marker.Length)
    }
    else {
      $marker = "</header>"
      $index = $content.IndexOf($marker)

      if ($index -lt 0) {
        throw "Could not find the header in $file"
      }

      $replacement =
        $marker +
        "`r`n        <ExportToolbar title={$($target.TitleExpression)} scopeSelector=`"$($target.Scope)`" />"

      $content =
        $content.Substring(0, $index) +
        $replacement +
        $content.Substring($index + $marker.Length)
    }
  }

  [System.IO.File]::WriteAllText(
    (Resolve-Path $file),
    $content,
    [System.Text.UTF8Encoding]::new($false)
  )

  Write-Host "Updated: $file"
}

Write-Host ""
Write-Host "Platform exports installed."
Write-Host "Broken source separators repaired."
Write-Host "Backups end with .before-platform-export"