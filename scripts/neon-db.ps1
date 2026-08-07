param(
  [ValidateSet("setup", "status", "test")]
  [string]$Action = "status",
  [switch]$AcceptVerifiedSchemaWarning
)

$ErrorActionPreference = "Stop"
$ProjectPath = Split-Path -Parent $PSScriptRoot
$EnvPath = Join-Path $ProjectPath ".env.local"

if (-not (Test-Path -LiteralPath $EnvPath)) {
  throw "Arquivo .env.local não encontrado."
}

foreach ($line in Get-Content -LiteralPath $EnvPath) {
  if ($line -notmatch '^([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
    continue
  }

  $name = $Matches[1]
  $value = $Matches[2].Trim()

  if (
    ($value.StartsWith('"') -and $value.EndsWith('"')) -or
    ($value.StartsWith("'") -and $value.EndsWith("'"))
  ) {
    $value = $value.Substring(1, $value.Length - 2)
  }

  [Environment]::SetEnvironmentVariable($name, $value, "Process")
}

if (-not $env:DATABASE_URL) {
  throw "DATABASE_URL não definida no .env.local."
}

if ($env:DATABASE_URL -notmatch '\.neon\.tech(?=[:/?]|$)') {
  throw "A DATABASE_URL atual não pertence ao Neon. Copie a URL em Neon > Connect."
}

if ($env:DATABASE_URL -notmatch 'sslmode=require') {
  throw "A URL do Neon precisa conter sslmode=require."
}

Set-Location -LiteralPath $ProjectPath

if ($Action -eq "status") {
  & node scripts/neon-status.mjs
  if ($LASTEXITCODE -ne 0) {
    throw "Não foi possível conectar ao Neon."
  }
  exit 0
}

if ($Action -eq "test") {
  & node scripts/neon-smoke-test.mjs
  if ($LASTEXITCODE -ne 0) {
    throw "O teste de leitura e escrita no Neon falhou."
  }
  exit 0
}

Write-Host "Aplicando o schema do projeto no Neon..."
if ($AcceptVerifiedSchemaWarning) {
  & node scripts/neon-preflight.mjs
  if ($LASTEXITCODE -ne 0) {
    throw "A verificação de segurança encontrou dados incompatíveis."
  }

  & npx.cmd prisma db push --skip-generate --accept-data-loss
} else {
  & npx.cmd prisma db push --skip-generate
}
if ($LASTEXITCODE -ne 0) {
  throw "Não foi possível aplicar o schema no Neon."
}

Write-Host "Criando os dados obrigatórios..."
& node scripts/seed-required-data.mjs
if ($LASTEXITCODE -ne 0) {
  throw "Não foi possível criar os dados obrigatórios no Neon."
}

Write-Host "Sincronizando as classes..."
& node scripts/sync-classes-from-book.mjs
if ($LASTEXITCODE -ne 0) {
  throw "Não foi possível sincronizar as classes no Neon."
}

Write-Host "Neon configurado e pronto para uso."
