-- CreateTable
CREATE TABLE "Administrador" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Administrador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Siniestro" (
    "id" SERIAL NOT NULL,
    "fechaSiniestro" TEXT NOT NULL,
    "horaSiniestro" TEXT NOT NULL,
    "huboHeridos" BOOLEAN NOT NULL DEFAULT false,
    "lugarCalle" TEXT NOT NULL,
    "lugarLocalidad" TEXT NOT NULL,
    "lugarProvincia" TEXT NOT NULL,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "detallesAccidente" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Siniestro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Titular" (
    "id" SERIAL NOT NULL,
    "tipoDoc" TEXT NOT NULL,
    "numDoc" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "patente" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "seguro" TEXT NOT NULL,
    "siniestroId" INTEGER NOT NULL,

    CONSTRAINT "Titular_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conductor" (
    "id" SERIAL NOT NULL,
    "esMismoConductor" BOOLEAN NOT NULL,
    "nombreCompleto" TEXT,
    "documento" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "licencia" TEXT,
    "vinculo" TEXT,
    "siniestroId" INTEGER NOT NULL,

    CONSTRAINT "Conductor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Productor" (
    "id" SERIAL NOT NULL,
    "esProductor" BOOLEAN NOT NULL DEFAULT false,
    "nombre" TEXT,
    "matricula" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "siniestroId" INTEGER NOT NULL,

    CONSTRAINT "Productor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tercero" (
    "id" SERIAL NOT NULL,
    "dni" TEXT,
    "nombre" TEXT,
    "apellido" TEXT,
    "patente" TEXT,
    "aseguradora" TEXT,
    "siniestroId" INTEGER NOT NULL,

    CONSTRAINT "Tercero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidencia" (
    "id" SERIAL NOT NULL,
    "tipoDocumento" TEXT NOT NULL,
    "urlArchivo" TEXT NOT NULL,
    "siniestroId" INTEGER NOT NULL,

    CONSTRAINT "Evidencia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Administrador_email_key" ON "Administrador"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Titular_siniestroId_key" ON "Titular"("siniestroId");

-- CreateIndex
CREATE UNIQUE INDEX "Conductor_siniestroId_key" ON "Conductor"("siniestroId");

-- CreateIndex
CREATE UNIQUE INDEX "Productor_siniestroId_key" ON "Productor"("siniestroId");

-- AddForeignKey
ALTER TABLE "Titular" ADD CONSTRAINT "Titular_siniestroId_fkey" FOREIGN KEY ("siniestroId") REFERENCES "Siniestro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conductor" ADD CONSTRAINT "Conductor_siniestroId_fkey" FOREIGN KEY ("siniestroId") REFERENCES "Siniestro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Productor" ADD CONSTRAINT "Productor_siniestroId_fkey" FOREIGN KEY ("siniestroId") REFERENCES "Siniestro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tercero" ADD CONSTRAINT "Tercero_siniestroId_fkey" FOREIGN KEY ("siniestroId") REFERENCES "Siniestro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidencia" ADD CONSTRAINT "Evidencia_siniestroId_fkey" FOREIGN KEY ("siniestroId") REFERENCES "Siniestro"("id") ON DELETE CASCADE ON UPDATE CASCADE;
