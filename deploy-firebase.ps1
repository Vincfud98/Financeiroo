$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$publicRoot = Join-Path $projectRoot "public"
$publishFiles = @("index.html", "styles.css", "app.js", "firebase-sync.js")

if (-not (Test-Path -LiteralPath $publicRoot)) {
  New-Item -ItemType Directory -Path $publicRoot | Out-Null
}

foreach ($file in $publishFiles) {
  Copy-Item -LiteralPath (Join-Path $projectRoot $file) -Destination $publicRoot -Force
}

$firebaseCommand = Get-Command firebase -ErrorAction SilentlyContinue
if (-not $firebaseCommand) {
  throw "Firebase CLI nao encontrado. Instale o firebase-tools antes de publicar."
}

& $firebaseCommand.Source deploy --project financeiro-cccab
if ($LASTEXITCODE -ne 0) {
  throw "A publicacao no Firebase falhou."
}
