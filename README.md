# Keys Lock — Ficha Web

Aplicação full-stack para criação, gerenciamento e progressão de fichas de RPG
inspiradas no universo competitivo de **Blue Lock**. Jogadores administram seus
personagens e o mestre acompanha toda a campanha em um painel exclusivo.

## Demo

[Acessar o Keys Lock](https://site-keys-lock.vercel.app/)

## Principais funcionalidades

### Jogadores

- Cadastro e login com e-mail e senha.
- Login e validação de conta com Google Identity Services.
- Recuperação de senha com token temporário e envio por e-mail.
- Criação responsiva de personagem com classe, atributos, perícias e habilidade inicial.
- Ficha completa com atributos, perícias, habilidades, fôlego e progressão.
- Compra de melhorias usando pontos concedidos pelo mestre.
- Compra de fôlego por 5 pontos com rolagem animada de `2d6`.
- Compra de habilidades da classe sem permitir recomprar a habilidade inicial.
- Criação de habilidades personalizadas com nome e descrição persistentes.

### Mestre

- Painel com todas as fichas e configurações globais da campanha.
- Visualização da ficha no mesmo formato apresentado ao jogador.
- Consulta de pontos disponíveis, pontos gastos e fôlego atual.
- Concessão de pontos de progressão.
- Alteração manual do fôlego e exclusão de fichas.
- Ranking editável com as categorias **Artilharia**, **Mestre das Assistências**
  e **Melhores Jogadores**.
- Rascunho privado do ranking e publicação controlada pelo mestre.
- Notas dos melhores jogadores entre `0,0` e `10,0`.

### Interface e desempenho

- Layout responsivo para desktop e dispositivos móveis.
- Identidade visual própria em azul, ciano e violeta.
- Componentes reutilizáveis e carregamento consolidado dos painéis.
- Pool de conexões PostgreSQL reutilizado entre execuções do servidor.

## Tecnologias

- Next.js 16 com App Router
- React 18
- JavaScript e TypeScript
- CSS Modules
- PostgreSQL
- Prisma
- Neon Postgres com connection pooling
- JWT e bcryptjs
- Google Identity Services
- Resend para recuperação de senha
- Vercel para hospedagem

## Estrutura principal

```text
app/
├── api/                   # autenticação, fichas, progressão e mestre
├── characters/            # criação e visualização das fichas
├── components/            # componentes compartilhados
├── forgot-password/       # solicitação de recuperação
├── login/                 # acesso à conta
├── master/                # painel e consulta de fichas pelo mestre
├── register/              # criação de conta
└── reset-password/        # definição da nova senha

lib/
├── auth.js
├── character-rules.js
├── custom-abilities.js
├── db.ts
├── password-policy.js
├── rankings.js
└── stamina-upgrades.js

prisma/
├── migrations/
└── schema.prisma

scripts/
├── local-db.ps1
├── neon-db.ps1
└── sync-classes-from-book.mjs
```

## Banco de dados

As tabelas principais são:

- `users`: contas locais e identidades Google.
- `PasswordResetToken`: tokens de recuperação de senha com expiração e uso único.
- `Character`: dados completos e progressão das fichas.
- `Class`: catálogo das 20 classes e suas habilidades.
- `GameConfig`: limites e pontos configuráveis pelo mestre.
- `RankingBoard`: rascunho privado e versão publicada dos rankings.

## Configuração do ambiente

Requisitos:

- Node.js 20 ou superior.
- npm.
- Uma conexão PostgreSQL local ou um projeto no Neon.

Instale as dependências:

```bash
npm install
```

Copie `.env.example` para `.env.local` e preencha:

```env
DATABASE_URL="postgresql://usuario:senha@host/banco?sslmode=require"
DATABASE_POOL_MAX=5
JWT_SECRET="uma-chave-longa-e-aleatoria"
MASTER_EMAILS="mestre@example.com"
APP_URL="http://localhost:3000"
NEXT_PUBLIC_GOOGLE_CLIENT_ID=""
RESEND_API_KEY=""
PASSWORD_RESET_FROM_EMAIL="Keys Lock <noreply@example.com>"
```

Arquivos `.env*` reais são ignorados pelo Git. Nunca envie URLs de banco,
senhas, chaves OAuth ou tokens para o repositório.

## PostgreSQL local

No Windows, com PostgreSQL 18 instalado, prepare o banco local:

```bash
npm run db:local:setup
```

Comandos disponíveis:

```bash
npm run db:local:start
npm run db:local:status
npm run db:local:stop
```

O ambiente local usa `postgresql://rpg_local@127.0.0.1:5433/site_rpg`.

## Neon Postgres

No painel do Neon, abra **Connect**, selecione a connection string com pooling
e copie a URL que contém `-pooler` e `sslmode=require`. Salve-a em
`DATABASE_URL` no `.env.local`.

Crie ou atualize as tabelas, os registros obrigatórios e as classes:

```bash
npm run db:neon:setup
```

Confira a conexão e execute um teste transacional sem deixar dados temporários:

```bash
npm run db:neon:status
npm run db:neon:test
```

## Login com Google

Crie um OAuth Client ID do tipo **Aplicativo da Web** no Google Cloud e adicione
as origens utilizadas pelo projeto, por exemplo:

```text
http://localhost:3000
https://seu-dominio.vercel.app
```

Salve o Client ID em `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. O projeto valida o token
Google no servidor antes de criar a sessão local.

## Recuperação de senha

Em produção, configure `RESEND_API_KEY` e um remetente autorizado em
`PASSWORD_RESET_FROM_EMAIL`. Sem o Resend, o ambiente de desenvolvimento pode
exibir o link de redefinição diretamente para facilitar testes locais.

## Executar e validar

Inicie o desenvolvimento:

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

Gere o build de produção:

```bash
npm run build
```

Sincronize novamente o catálogo de classes quando necessário:

```bash
npm run sync:classes
```

## Deploy na Vercel

Cadastre na Vercel as mesmas variáveis usadas em produção:

- `DATABASE_URL`
- `DATABASE_POOL_MAX=5`
- `JWT_SECRET`
- `MASTER_EMAILS`
- `APP_URL`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `RESEND_API_KEY`
- `PASSWORD_RESET_FROM_EMAIL`

Depois de atualizar variáveis públicas como o Client ID do Google, faça um novo
deploy para que o Next.js gere o frontend com o valor atualizado.

## Próximas evoluções

- Histórico de partidas e temporadas.
- Histórico das ações realizadas pelo mestre.
- Auditoria das alterações de progressão.
- Testes automatizados de interface e API no pipeline de deploy.

## Autor

**Luís** — desenvolvimento backend e aplicações web.

[GitHub](https://github.com/Luiskyes)

## Licença

Projeto open-source destinado a estudos e uso pessoal em campanhas de RPG.
