# Serveur local minimal (secours de serve.bat quand ni PHP, ni Python, ni Node, ni Ruby ne sont installes).
param([int]$Port = 8000)

$root = (Get-Location).Path
$types = @{
  '.html'='text/html; charset=utf-8'; '.htm'='text/html; charset=utf-8'; '.css'='text/css; charset=utf-8';
  '.js'='application/javascript; charset=utf-8'; '.json'='application/json; charset=utf-8';
  '.csv'='text/csv; charset=utf-8'; '.txt'='text/plain; charset=utf-8'; '.svg'='image/svg+xml';
  '.png'='image/png'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'; '.gif'='image/gif'; '.ico'='image/x-icon';
  '.woff'='font/woff'; '.woff2'='font/woff2'; '.ttf'='font/ttf'; '.otf'='font/otf'; '.pdf'='application/pdf'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
try { $listener.Start() } catch { Write-Host "Impossible de demarrer le serveur sur le port $Port : $($_.Exception.Message)"; exit 1 }

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $res = $ctx.Response
    try {
      $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/') -replace '/', '\'
      if ($rel -eq '') { $rel = 'index.html' }
      $file = [System.IO.Path]::GetFullPath((Join-Path $root $rel))
      if (Test-Path $file -PathType Container) { $file = Join-Path $file 'index.html' }
      if ($file.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -and (Test-Path $file -PathType Leaf)) {
        $ext = [System.IO.Path]::GetExtension($file).ToLower()
        $res.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' }
        $bytes = [System.IO.File]::ReadAllBytes($file)
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
      } else {
        $res.StatusCode = 404
      }
    } catch { $res.StatusCode = 500 }
    finally { $res.Close() }
  }
} finally { $listener.Stop() }
