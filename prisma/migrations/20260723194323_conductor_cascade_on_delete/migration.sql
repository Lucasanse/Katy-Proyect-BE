-- DropForeignKey
ALTER TABLE "Conductor" DROP CONSTRAINT "Conductor_siniestroId_fkey";

-- AddForeignKey
ALTER TABLE "Conductor" ADD CONSTRAINT "Conductor_siniestroId_fkey" FOREIGN KEY ("siniestroId") REFERENCES "Siniestro"("id") ON DELETE CASCADE ON UPDATE CASCADE;
