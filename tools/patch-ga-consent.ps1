$root = Join-Path $PSScriptRoot ".."
$utf8 = New-Object System.Text.UTF8Encoding $false
$oldBlock = @'
<script async src="https://www.googletagmanager.com/gtag/js?id=G-RSL3XMXCFC"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-RSL3XMXCFC');
</script>
'@
$newBlock = '<script src="/js/ga-consent-loader.js"></script>'
$commentOld1 = '  <!-- Google tag (gtag.js) -->'
$commentOld2 = '<!-- Google tag (gtag.js) -->'
$commentNew = '  <!-- Google Analytics 4 + Consent Mode v2 -->'
$commentNew2 = '<!-- Google Analytics 4 + Consent Mode v2 -->'

Get-ChildItem -Path $root -Recurse -Filter *.html | Where-Object { $_.FullName -notmatch '\\legal\\' } | ForEach-Object {
  $path = $_.FullName
  $c = [System.IO.File]::ReadAllText($path, $utf8)
  if ($c -notmatch 'googletagmanager\.com/gtag') { return }
  $orig = $c
  $c = $c.Replace($oldBlock, $newBlock)
  if ($c -match [regex]::Escape($commentOld1)) {
    $c = $c.Replace($commentOld1, $commentNew)
  }
  elseif ($c -match [regex]::Escape($commentOld2)) {
    $c = $c.Replace($commentOld2, $commentNew2)
  }
  if ($c -ne $orig) {
    [System.IO.File]::WriteAllText($path, $c, $utf8)
    Write-Host "Patched: $path"
  }
}
