// test-prisma.js
// ------------------------------------------------
// Verifica se o client Prisma consegue abrir a conexão
// ------------------------------------------------
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Uma query mínima que funciona em todo PostgreSQL
  const result = await prisma.$queryRaw`SELECT 1`;
  console.log("✅ Conexão OK →", result);
}

// Executa e garante que a conexão será fechada
main()
  .catch((e) => {
    console.error("❌ Erro de conexão:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
