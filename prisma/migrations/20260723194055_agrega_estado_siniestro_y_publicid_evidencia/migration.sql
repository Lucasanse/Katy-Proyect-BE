/*
  Warnings:

  - Made the column `nombreCompleto` on table `Conductor` required. This step will fail if there are existing NULL values in that column.
  - Made the column `documento` on table `Conductor` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `publicId` to the `Evidencia` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Siniestro` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EstadoSiniestro" AS ENUM ('pendiente', 'en_revision', 'cerrado');

-- DropForeignKey
ALTER TABLE "Conductor" DROP CONSTRAINT "Conductor_siniestroId_fkey";

-- AlterTable
ALTER TABLE "Conductor" ALTER COLUMN "nombreCompleto" SET NOT NULL,
ALTER COLUMN "documento" SET NOT NULL;

-- AlterTable
ALTER TABLE "Evidencia" ADD COLUMN     "publicId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Siniestro" ADD COLUMN     "estado" "EstadoSiniestro" NOT NULL DEFAULT 'pendiente',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "Conductor" ADD CONSTRAINT "Conductor_siniestroId_fkey" FOREIGN KEY ("siniestroId") REFERENCES "Siniestro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
