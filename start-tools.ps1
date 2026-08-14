# start-tools.ps1
# Script to launch opencode and omniroute in separate windows.

param(
    [string]$Tool = "both"
)

# Set portable Node.js environment variables for the session
$nodePath = "B:\NodeJS-Portable\node-v22.23.1-win-x64"
$env:PATH = "$nodePath;$nodePath\node_modules\npm\bin;$env:PATH"
$env:NODE_PATH = $nodePath
$env:NPM_CONFIG_PREFIX = "B:\NodeJS-Portable\node_modules"
$env:NPM_CONFIG_CACHE = "B:\NodeJS-Portable\npm-cache"

$OpencodePath = "B:\NodeJS-Portable\node_modules\opencode.cmd"
$OmniroutePath = "B:\NodeJS-Portable\node_modules\omniroute.cmd"

function Start-Tool {
    param(
        [string]$Name,
        [string]$Path
    )
    if (Test-Path $Path) {
        Write-Host "Starting $Name in a new window..." -ForegroundColor Green
        Start-Process cmd -ArgumentList "/k `"$Path`"" -WorkingDirectory $PSScriptRoot
    } else {
        Write-Warning "Could not find $Name at $Path"
    }
}

switch ($Tool.ToLower()) {
    "opencode" {
        Start-Tool "opencode" $OpencodePath
    }
    "omniroute" {
        Start-Tool "omniroute" $OmniroutePath
    }
    "both" {
        Start-Tool "opencode" $OpencodePath
        Start-Tool "omniroute" $OmniroutePath
    }
    default {
        Write-Host "Usage:"
        Write-Host "  .\start-tools.ps1             - Starts both tools in separate windows"
        Write-Host "  .\start-tools.ps1 opencode    - Starts opencode only"
        Write-Host "  .\start-tools.ps1 omniroute   - Starts omniroute only"
    }
}
