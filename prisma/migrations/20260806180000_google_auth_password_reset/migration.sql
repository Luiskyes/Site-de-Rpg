-- Allow accounts created exclusively through Google Identity Services.
ALTER TABLE users
  ALTER COLUMN "passwordHash" DROP NOT NULL,
  ADD COLUMN "googleSub" TEXT,
  ADD COLUMN "emailVerifiedAt" TIMESTAMP(6);

CREATE UNIQUE INDEX "users_googleSub_key" ON users("googleSub");

-- Store only a SHA-256 hash of password-recovery tokens.
CREATE TABLE "PasswordResetToken" (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(6) NOT NULL,
  "usedAt" TIMESTAMP(6),
  "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PasswordResetToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key"
  ON "PasswordResetToken"("tokenHash");

CREATE INDEX "PasswordResetToken_userId_expiresAt_idx"
  ON "PasswordResetToken"("userId", "expiresAt");
