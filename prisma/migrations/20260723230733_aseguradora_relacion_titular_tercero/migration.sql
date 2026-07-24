/*
  Warnings:

  - You are about to drop the column `aseguradora` on the `Tercero` table. All the data in the column will be lost.
  - You are about to drop the column `seguro` on the `Titular` table. All the data in the column will be lost.
  - Added the required column `aseguradoraId` to the `Titular` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Tercero" DROP COLUMN "aseguradora",
ADD COLUMN     "aseguradoraId" INTEGER;

-- AlterTable
ALTER TABLE "Titular" DROP COLUMN "seguro",
ADD COLUMN     "aseguradoraId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Titular" ADD CONSTRAINT "Titular_aseguradoraId_fkey" FOREIGN KEY ("aseguradoraId") REFERENCES "Aseguradora"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tercero" ADD CONSTRAINT "Tercero_aseguradoraId_fkey" FOREIGN KEY ("aseguradoraId") REFERENCES "Aseguradora"("id") ON DELETE SET NULL ON UPDATE CASCADE;
