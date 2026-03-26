$root = Join-Path $PSScriptRoot ".."
$utf8 = New-Object System.Text.UTF8Encoding $false
$needle = '<script src="/js/tracking.js"></script>'
$insert = "<script src=`"/js/cookies.js`"></script>`r`n<script src=`"/js/tracking.js`"></script>"

Get-ChildItem -Path $root -Recurse -Filter *.html | Where-Object { $_.FullName -notmatch '\\legal\\' } | ForEach-Object {
  $path = $_.FullName
  $c = [System.IO.File]::ReadAllText($path, $utf8)
  if ($c -notmatch 'cookies\.js') {
    if ($c.Contains($needle)) {
      $c2 = $c.Replace($needle, $insert)
      if ($c2 -ne $c) {
        [System.IO.File]::WriteAllText($path, $c2, $utf8)
        Write-Host "Added cookies.js: $path"
      }
    }
  }
}
