param(
  [ValidateSet("setup", "start", "stop", "status")]
  [string]$Action = "status"
)

$ErrorActionPreference = "Stop"

$ProjectPath = Split-Path -Parent $PSScriptRoot
$ClusterPath = Join-Path $ProjectPath ".local-postgres"
$DataPath = Join-Path $ClusterPath "data"
$LogPath = Join-Path $ClusterPath "server.log"
$PostgresBin = "C:\Program Files\PostgreSQL\18\bin"
$InitDb = Join-Path $PostgresBin "initdb.exe"
$PgCtl = Join-Path $PostgresBin "pg_ctl.exe"
$Psql = Join-Path $PostgresBin "psql.exe"
$Createdb = Join-Path $PostgresBin "createdb.exe"
$Port = 5433
$DatabaseName = "site_rpg"
$DatabaseUser = "rpg_local"
$ConnectionString = "postgresql://${DatabaseUser}@127.0.0.1:${Port}/${DatabaseName}"

foreach ($binary in @($InitDb, $PgCtl, $Psql, $Createdb)) {
  if (-not (Test-Path -LiteralPath $binary)) {
    throw "PostgreSQL 18 não encontrado em $PostgresBin."
  }
}

function Test-ClusterRunning {
  if (-not (Test-Path -LiteralPath (Join-Path $DataPath "PG_VERSION"))) {
    return $false
  }

  $previousErrorPreference = $ErrorActionPreference
  $ErrorActionPreference = "SilentlyContinue"
  & $Psql `
    -h 127.0.0.1 `
    -p $Port `
    -U $DatabaseUser `
    -d postgres `
    -tAc "SELECT 1" *> $null
  $isRunning = $LASTEXITCODE -eq 0
  $ErrorActionPreference = $previousErrorPreference

  return $isRunning
}

function Initialize-Cluster {
  if (Test-Path -LiteralPath (Join-Path $DataPath "PG_VERSION")) {
    return
  }

  New-Item -ItemType Directory -Path $ClusterPath -Force | Out-Null
  Write-Host "Criando cluster PostgreSQL local..."
  & $InitDb `
    --pgdata=$DataPath `
    --username=$DatabaseUser `
    --auth=trust `
    --encoding=UTF8 `
    --no-locale

  if ($LASTEXITCODE -ne 0) {
    throw "Não foi possível inicializar o PostgreSQL local."
  }
}

function Start-Cluster {
  if (Test-ClusterRunning) {
    Write-Host "PostgreSQL local já está ativo na porta $Port."
    return
  }

  if (-not (Test-Path -LiteralPath (Join-Path $DataPath "PG_VERSION"))) {
    throw "Banco local ainda não configurado. Execute npm run db:local:setup."
  }

  Write-Host "Iniciando PostgreSQL local na porta $Port..."
  & $PgCtl start -D $DataPath -l $LogPath -o "-p $Port -h 127.0.0.1" -w

  if ($LASTEXITCODE -ne 0) {
    throw "Não foi possível iniciar o PostgreSQL local."
  }
}

function Ensure-Database {
  $existing = & $Psql `
    -h 127.0.0.1 `
    -p $Port `
    -U $DatabaseUser `
    -d postgres `
    -tAc "SELECT 1 FROM pg_database WHERE datname = '$DatabaseName'"

  if ($LASTEXITCODE -ne 0) {
    throw "Não foi possível consultar o PostgreSQL local."
  }

  if ($existing.Trim() -ne "1") {
    Write-Host "Criando banco $DatabaseName..."
    & $Createdb -h 127.0.0.1 -p $Port -U $DatabaseUser $DatabaseName
    if ($LASTEXITCODE -ne 0) {
      throw "Não foi possível criar o banco $DatabaseName."
    }
  }
}

switch ($Action) {
  "setup" {
    Initialize-Cluster
    Start-Cluster
    Ensure-Database

    Write-Host "Aplicando o schema Prisma no banco local..."
    $env:DATABASE_URL = $ConnectionString
    & npx.cmd prisma db push --skip-generate
    if ($LASTEXITCODE -ne 0) {
      throw "Não foi possível aplicar o schema Prisma."
    }

    $configExists = 'SELECT 1 FROM "GameConfig" LIMIT 1;' | & $Psql `
      -h 127.0.0.1 `
      -p $Port `
      -U $DatabaseUser `
      -d $DatabaseName `
      -tA
    if ($LASTEXITCODE -ne 0) {
      throw "Não foi possível consultar a configuração inicial do jogo."
    }

    if ((@($configExists) -join "").Trim() -ne "1") {
      'INSERT INTO "GameConfig" DEFAULT VALUES;' | & $Psql `
        -h 127.0.0.1 `
        -p $Port `
        -U $DatabaseUser `
        -d $DatabaseName
      if ($LASTEXITCODE -ne 0) {
        throw "Não foi possível criar a configuração inicial do jogo."
      }
    }

    Write-Host "Carregando classes iniciais..."
    & node --env-file=.env.local scripts/sync-classes-from-book.mjs
    if ($LASTEXITCODE -ne 0) {
      throw "Não foi possível carregar as classes iniciais."
    }

    Write-Host "Banco local pronto: $ConnectionString"
  }
  "start" {
    Start-Cluster
  }
  "stop" {
    if (Test-ClusterRunning) {
      Write-Host "Parando PostgreSQL local..."
      & $PgCtl stop -D $DataPath -m fast -w
    } else {
      Write-Host "PostgreSQL local já está parado."
    }
  }
  "status" {
    if (Test-ClusterRunning) {
      Write-Host "PostgreSQL local ativo na porta $Port."
    } else {
      Write-Host "PostgreSQL local parado."
    }
  }
}
