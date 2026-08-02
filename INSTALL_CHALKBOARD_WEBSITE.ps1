$ErrorActionPreference = "Stop"
Set-Location "C:\Users\Dell\Downloads\chalkboard-x\chalkboard"
if (-not (Test-Path ".\app\page.js")) { throw "Existing app\page.js not found." }
New-Item -ItemType Directory -Path ".\app\app" -Force | Out-Null
Copy-Item ".\app\page.js" ".\app\app\page.js" -Force
$appFile = ".\app\app\page.js"
$appContent = Get-Content $appFile -Raw
$appContent = $appContent.Replace("import { supabase } from '../lib/supabaseClient';", "import { supabase } from '../../lib/supabaseClient';")
$appContent = $appContent.Replace("{ redirectTo: window.location.origin }", "{ redirectTo: window.location.origin + '/app' }")
[System.IO.File]::WriteAllText((Resolve-Path $appFile), $appContent, [System.Text.UTF8Encoding]::new($false))
$payFile = ".\app\api\subscription-pay\route.js"
$payContent = Get-Content $payFile -Raw
$payContent = $payContent.Replace("returnurl: base + '/?subpay=1'", "returnurl: base + '/app?subpay=1'")
[System.IO.File]::WriteAllText((Resolve-Path $payFile), $payContent, [System.Text.UTF8Encoding]::new($false))
Write-Host "Existing Chalkboard application moved to /app and callback URLs updated."
