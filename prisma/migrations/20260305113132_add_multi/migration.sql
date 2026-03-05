-- CreateEnum
CREATE TYPE "StatutSalle" AS ENUM ('ATTENTE', 'EN_JEU', 'TERMINEE');

-- CreateTable
CREATE TABLE "Salle" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "niveauId" INTEGER NOT NULL,
    "hostId" TEXT NOT NULL,
    "statut" "StatutSalle" NOT NULL DEFAULT 'ATTENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Salle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalleJoueur" (
    "id" TEXT NOT NULL,
    "salleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "bloque" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SalleJoueur_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Salle_code_key" ON "Salle"("code");

-- AddForeignKey
ALTER TABLE "Salle" ADD CONSTRAINT "Salle_niveauId_fkey" FOREIGN KEY ("niveauId") REFERENCES "Niveau"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalleJoueur" ADD CONSTRAINT "SalleJoueur_salleId_fkey" FOREIGN KEY ("salleId") REFERENCES "Salle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalleJoueur" ADD CONSTRAINT "SalleJoueur_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
