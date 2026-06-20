$ErrorActionPreference = "Stop"

$root = "C:\Users\carol\OneDrive\DOCUME~1\FINANA~1"
$port = 8000
$address = [System.Net.IPAddress]::Parse("127.0.0.1")
$server = [System.Net.Sockets.TcpListener]::new($address, $port)
$server.Start()
Write-Host "Preview server running at http://127.0.0.1:$port/"

$contentTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css" = "text/css; charset=utf-8"
  ".js" = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".png" = "image/png"
  ".jpg" = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".svg" = "image/svg+xml"
}

while ($true) {
  $client = $server.AcceptTcpClient()
  try {
    $stream = $client.GetStream()
    $reader = [System.IO.StreamReader]::new($stream, [Text.Encoding]::ASCII, $false, 1024, $true)
    $requestLine = $reader.ReadLine()
    while ($reader.ReadLine()) {}

    $status = "200 OK"
    $body = [byte[]]::new(0)
    $contentType = "text/plain; charset=utf-8"

    if (-not $requestLine -or -not $requestLine.StartsWith("GET ")) {
      $status = "405 Method Not Allowed"
      $body = [Text.Encoding]::UTF8.GetBytes("Method not allowed")
    } else {
      $urlPath = $requestLine.Split(" ")[1].Split("?")[0].TrimStart("/")
      $urlPath = [Uri]::UnescapeDataString($urlPath)
      if ([string]::IsNullOrWhiteSpace($urlPath)) {
        $urlPath = "index.html"
      }

      $filePath = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($root, $urlPath))
      if (-not $filePath.StartsWith($root, [StringComparison]::OrdinalIgnoreCase)) {
        $status = "403 Forbidden"
        $body = [Text.Encoding]::UTF8.GetBytes("Forbidden")
      } elseif (-not [System.IO.File]::Exists($filePath)) {
        $status = "404 Not Found"
        $body = [Text.Encoding]::UTF8.GetBytes("Not found")
      } else {
        $extension = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
        $contentType = if ($contentTypes.ContainsKey($extension)) { $contentTypes[$extension] } else { "application/octet-stream" }
        $body = [System.IO.File]::ReadAllBytes($filePath)
      }
    }

    $header = "HTTP/1.1 $status`r`nContent-Type: $contentType`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
    $headerBytes = [Text.Encoding]::ASCII.GetBytes($header)
    $stream.Write($headerBytes, 0, $headerBytes.Length)
    if ($body.Length -gt 0) {
      $stream.Write($body, 0, $body.Length)
    }
  } catch {
  } finally {
    $client.Close()
  }
}
