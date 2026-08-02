$ErrorActionPreference = "Stop"

Set-Location "C:\Users\Dell\Downloads\chalkboard-x\chalkboard"

$globals = ".\app\globals.css"
$dashboard = ".\components\AdminExecutiveDashboard.js"

if (-not (Test-Path $globals)) {
  throw "app\globals.css was not found."
}

if (-not (Test-Path ".\styles\chalkboard-clarity.css")) {
  throw "styles\chalkboard-clarity.css was not found."
}

if (-not (Test-Path ".\components\financeNormaliser.js")) {
  throw "components\financeNormaliser.js was not found."
}

$globalsBackup = ".\app\globals.before-clarity-fix.css"

if (-not (Test-Path $globalsBackup)) {
  Copy-Item $globals $globalsBackup -Force
}

$globalContent = Get-Content $globals -Raw
$themeImport = '@import "../styles/chalkboard-clarity.css";'

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

if (Test-Path $dashboard) {
  $dashboardBackup =
    ".\components\AdminExecutiveDashboard.before-finance-fix.js"

  if (-not (Test-Path $dashboardBackup)) {
    Copy-Item $dashboard $dashboardBackup -Force
  }

  $content = Get-Content $dashboard -Raw
  $import =
    'import { financeTotals } from "./financeNormaliser";'

  if (-not $content.Contains($import)) {
    $dashboardImports = [regex]::Matches(
      $content,
      '^import .*?;\r?$',
      [System.Text.RegularExpressions.RegexOptions]::Multiline
    )

    if ($dashboardImports.Count -gt 0) {
      $lastDashboardImport =
        $dashboardImports[$dashboardImports.Count - 1]

      $content =
        $content.Substring(
          0,
          $lastDashboardImport.Index +
          $lastDashboardImport.Length
        ) +
        "`r`n" +
        $import +
        $content.Substring(
          $lastDashboardImport.Index +
          $lastDashboardImport.Length
        )
    }
  }

  $content = $content.Replace(
    'supabase.from("finance_entries").select("type,amount").eq("school_id", schoolId)',
    'supabase.from("finance_entries").select("*").eq("school_id", schoolId)'
  )

  $oldTotals = @'
    const income = (finance.data || [])
      .filter((row) => row.type === "income")
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);

    const expenses = (finance.data || [])
      .filter((row) => row.type === "expense")
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);
'@

  $newTotals = @'
    const {
      income,
      expenses,
    } = financeTotals(finance.data || []);
'@

  if ($content.Contains($oldTotals)) {
    $content = $content.Replace($oldTotals, $newTotals)
  }

  [System.IO.File]::WriteAllText(
    (Resolve-Path $dashboard),
    $content,
    [System.Text.UTF8Encoding]::new($false)
  )
}

Write-Host "Plain ChatGPT-style sidebar applied."
Write-Host "Login visibility and hierarchy improved."
Write-Host "Dashboard finance query no longer requires finance_entries.type."
Write-Host "Finance entries are normalised from available column names."
