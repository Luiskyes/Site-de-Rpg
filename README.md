# ⚽ RPG Character Manager – Blue Lock Inspired

Sistema web para criação, gerenciamento e progressão de fichas de personagens para RPGs inspirados no universo competitivo de **Blue Lock**.

O projeto foi desenvolvido como aplicação **full-stack** utilizando **Next.js + PostgreSQL**, com sistema de autenticação, gerenciamento de personagens e painel de mestre para controle do jogo.

---

# 🌐 Demo

A aplicação está disponível publicamente:

**🔗 Acesse o site:**
https://site-keys-lock.vercel.app/register
---

# 📷 Interface

<img width="1877" height="1004" alt="Captura de tela 2026-03-24 234816" src="https://github.com/user-attachments/assets/cc719d58-9c3b-4c19-9a5f-678ce72c7afa" />
<img width="1876" height="1006" alt="Captura de tela 2026-03-24 234824" src="https://github.com/user-attachments/assets/a6124e17-1c9b-496d-890a-3a628cf0f346" />
<img width="1875" height="1008" alt="Captura de tela 2026-03-24 234831" src="https://github.com/user-attachments/assets/2cc60274-6c39-4ebb-87a6-525c45b79b5e" />
<img width="1875" height="1008" alt="Captura de tela 2026-03-24 234831" src="https://github.com/user-attachments/assets/bd3c2891-91b8-42c1-93dd-72366623e338" />





---

# 🚀 Tecnologias Utilizadas

### Frontend

* Next.js (App Router)
* React
* JavaScript / TypeScript
* CSS

### Backend

* Next.js API Routes
* Node.js runtime

### Banco de Dados

* PostgreSQL
* Neon Database (serverless)

### Autenticação

* JWT
* bcryptjs

### Deploy

* Vercel

---

# 🧠 Funcionalidades

## 👤 Sistema de Usuários

* Registro de usuário
* Login com autenticação JWT
* Sessões seguras

---

## 🎮 Sistema de Personagens

Cada personagem possui:

* Classe
* Atributos
* Perícias
* Habilidades
* Estamina
* Progressão

Os personagens podem evoluir ao longo das partidas.

---

## 🧬 Classes disponíveis

O sistema possui múltiplas classes inspiradas em arquétipos de jogadores:

* Playmaker
* Dominador Superior
* Especialista Espacial
* Velocista
* Finalizador Clínico
* Driblador
* Atacante Completo
* Caçador de Gols
* Atacante Controlador
* Multi-Funções
* Atacante Saltador
* Defensor Espacial
* Louco da Estamina
* Vilão do Campo
* Goleiro
* Ninja
* Imperador
* Devorador de Ás
* Duelista
* Cachorro Louco

Cada classe possui:

* bônus de atributos
* bônus de perícias
* habilidades únicas

---

## 📈 Sistema de Progressão

Após partidas, o mestre pode conceder **pontos de progresso**.

Os pontos podem ser utilizados para:

* aumentar atributos
* aumentar perícias
* comprar habilidades
* criar habilidades personalizadas

---

## 👑 Painel do Mestre

O mestre possui controle total do sistema:

* visualizar todas as fichas
* editar personagens
* conceder pontos
* alterar estamina
* remover fichas

---

# 🗄️ Estrutura do Banco de Dados

Principais tabelas:

```
users
Character
Class
GameConfig
```

### users

Armazena os usuários registrados.

### Character

Armazena as fichas dos jogadores.

### Class

Define todas as classes disponíveis.

### GameConfig

Configuração geral do sistema.

---

# 📦 Estrutura do Projeto

```
app/
 ├ api/
 │ ├ login
 │ ├ register
 │ ├ characters
 │ ├ classes
 │ └ master
 │
 ├ characters/
 │ ├ create
 │ ├ [id]
 │ └ me
 │
 ├ login
 ├ register
 └ master

lib/
 ├ db.ts
 ├ auth.js
 ├ master-auth.js
 ├ character-rules.js
 └ character-calculations.js

scripts/
 └ sync-classes-from-book.mjs
```

---

# ⚙️ Configuração Local

Clone o projeto:

```
git clone https://github.com/Luiskyes/Site-de-Rpg
```

Entre na pasta:

```
cd Site-de-Rpg
```

Instale as dependências:

```
npm install
```

Crie um arquivo `.env`:

```
DATABASE_URL=
JWT_SECRET=
MASTER_EMAILS=
```

Execute o projeto:

```
npm run dev
```

O site estará disponível em:

```
http://localhost:3000
```

---

# 🧪 Scripts

Sincronizar classes do livro:

```
npm run sync:classes
```

Build de produção:

```
npm run build
```

---

# 📌 Objetivo do Projeto

Este projeto foi desenvolvido para:

* uso em campanhas de RPG
* gerenciamento digital de fichas
* aprendizado e prática de desenvolvimento full-stack

Também serve como **projeto de portfólio** demonstrando:

* backend com Node
* integração com banco de dados
* autenticação
* arquitetura de aplicação real

---

# 📈 Melhorias Futuras

Planejado para próximas versões:

* Login com Google
* Sistema de ranking de jogadores
* Histórico de partidas
* Sistema de temporadas
* Interface para mobile
* Logs de ações do mestre

---

# 👨‍💻 Autor

Luís

Desenvolvedor focado em **backend e aplicações web**.

GitHub:
https://github.com/Luiskyes

---

# 📄 Licença

Este projeto é open-source para fins educacionais e de uso pessoal em campanhas de RPG.
