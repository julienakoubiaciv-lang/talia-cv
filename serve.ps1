$port = 3333
$root = $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Server running at http://localhost:$port"

$mimes = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css'
  '.js'   = 'application/javascript'
  '.json' = 'application/json'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.ico'  = 'image/x-icon'
  '.svg'  = 'image/svg+xml'
  '.pdf'  = 'application/pdf'
}

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $req = $ctx.Request
  $res = $ctx.Response
  $path = $req.Url.LocalPath
  if ($path -eq '/') { $path = '/talia-app.html' }
  $file = Join-Path $root $path.TrimStart('/')
  if (Test-Path $file -PathType Leaf) {
    $ext = [System.IO.Path]::GetExtension($file)
    $mime = if ($mimes[$ext]) { $mimes[$ext] } else { 'application/octet-stream' }
    $bytes = [System.IO.File]::ReadAllBytes($file)
    $res.ContentType = $mime
    $res.ContentLength64 = $bytes.Length
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $res.StatusCode = 404
    $msg = [System.Text.Encoding]::UTF8.GetBytes("Not found: $path")
    $res.OutputStream.Write($msg, 0, $msg.Length)
  }
  $res.OutputStream.Close()
}
