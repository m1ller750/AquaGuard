# Переводит SVG-графики docs/figures в PNG через headless Edge
param([string]$Dir = "..\..\docs\figures")
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edge)) { $edge = "C:\Program Files\Microsoft\Edge\Application\msedge.exe" }
$tmp = Join-Path $env:TEMP "aq_edge_profile"
Get-ChildItem $Dir -Filter *.svg | ForEach-Object {
  $png = [IO.Path]::ChangeExtension($_.FullName, ".png")
  & $edge --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 "--user-data-dir=$tmp" "--window-size=1000,560" "--screenshot=$png" ("file:///" + ($_.FullName -replace "\\", "/")) 2>$null | Out-Null
  Start-Sleep -Milliseconds 300
  "{0} -> {1} bytes" -f $_.Name, (Get-Item $png -ErrorAction SilentlyContinue).Length
}
