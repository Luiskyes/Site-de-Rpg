CREATE TABLE "RankingBoard" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "scorersDraft" JSONB NOT NULL DEFAULT '[]',
  "assistsDraft" JSONB NOT NULL DEFAULT '[]',
  "bestPlayersDraft" JSONB NOT NULL DEFAULT '[]',
  "scorersPublished" JSONB NOT NULL DEFAULT '[]',
  "assistsPublished" JSONB NOT NULL DEFAULT '[]',
  "bestPlayersPublished" JSONB NOT NULL DEFAULT '[]',
  "publishedAt" TIMESTAMP(6),
  "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RankingBoard_pkey" PRIMARY KEY ("id")
);

INSERT INTO "RankingBoard" ("id") VALUES (1);
