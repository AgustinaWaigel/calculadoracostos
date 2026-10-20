import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

async function main() {
  // Arrancamos de cero para que el seed sea reproducible.
  await prisma.$transaction([
    prisma.quoteItem.deleteMany(),
    prisma.quote.deleteMany(),
    prisma.productSupply.deleteMany(),
    prisma.productLabor.deleteMany(),
    prisma.productMachine.deleteMany(),
    prisma.product.deleteMany(),
    prisma.supplyPriceHistory.deleteMany(),
    prisma.supply.deleteMany(),
    prisma.laborProfile.deleteMany(),
    prisma.marketRate.deleteMany(),
    prisma.fixedCost.deleteMany(),
    prisma.machine.deleteMany(),
    prisma.salesChannel.deleteMany(),
    prisma.volumeTier.deleteMany(),
    prisma.business.deleteMany(),
  ]);

  await prisma.business.create({
    data: {
      name: "Mi Emprendimiento",
      phone: "11 1234-5678",
      email: "hola@miemprendimiento.com.ar",
      instagram: "@miemprendimiento",
      taxCondition: "MONOTRIBUTO",
      monthlyUnitsEstimate: 200,
      defaultMarginPercent: 40,
      pricingMode: "MARGIN",
      roundTo: 10,
    },
  });

  const pouch = await prisma.supply.create({
    data: {
      name: "Pouch plastificado A4",
      kind: "MATERIAL",
      category: "Plastificado",
      purchaseUnit: "paquete",
      usageUnit: "pouch",
      packQuantity: 100,
      packPrice: 28949,
      supplier: "Librería mayorista",
      priceUpdatedAt: daysAgo(3),
      priceHistory: {
        create: [
          { packPrice: 23500, packQuantity: 100, recordedAt: daysAgo(120) },
          { packPrice: 25900, packQuantity: 100, recordedAt: daysAgo(75) },
          { packPrice: 27400, packQuantity: 100, recordedAt: daysAgo(35) },
          { packPrice: 28949, packQuantity: 100, recordedAt: daysAgo(3) },
        ],
      },
    },
  });

  const papel = await prisma.supply.create({
    data: {
      name: "Papel fotográfico A4",
      kind: "MATERIAL",
      category: "Papel",
      purchaseUnit: "hoja",
      usageUnit: "hoja",
      packQuantity: 1,
      packPrice: 300,
      priceUpdatedAt: daysAgo(45), // dispara la alerta de "+30 días sin actualizar"
      priceHistory: {
        create: [
          { packPrice: 250, packQuantity: 1, recordedAt: daysAgo(100) },
          { packPrice: 300, packQuantity: 1, recordedAt: daysAgo(45) },
        ],
      },
    },
  });

  const impresion = await prisma.supply.create({
    data: {
      name: "Impresión A4 color",
      kind: "SERVICE",
      category: "Servicios",
      purchaseUnit: "unidad",
      usageUnit: "impresión",
      packQuantity: 1,
      packPrice: 600,
      supplier: "Copiadora del barrio",
      priceUpdatedAt: daysAgo(10),
      priceHistory: { create: [{ packPrice: 600, packQuantity: 1, recordedAt: daysAgo(10) }] },
    },
  });

  await prisma.laborProfile.createMany({
    data: [
      { name: "Diseño", hourlyRate: 8000, color: "#6366f1" },
      { name: "Producción", hourlyRate: 6000, color: "#f59e0b" },
      { name: "Armado", hourlyRate: 5000, color: "#10b981" },
    ],
  });

  await prisma.fixedCost.createMany({
    data: [
      { name: "Alquiler del taller", category: "ALQUILER", monthlyAmount: 180000 },
      { name: "Luz", category: "SERVICIOS", monthlyAmount: 25000 },
      { name: "Internet", category: "INTERNET", monthlyAmount: 18000 },
      { name: "Monotributo", category: "IMPUESTOS", monthlyAmount: 40000 },
      { name: "Canva Pro", category: "SUSCRIPCIONES", monthlyAmount: 9000 },
    ],
  });

  await prisma.machine.create({
    data: { name: "Plastificadora A4", price: 120000, usefulLife: 20000, lifeUnit: "UNITS" },
  });

  await prisma.salesChannel.createMany({
    data: [
      { name: "Venta directa", type: "DIRECT", sortOrder: 0 },
      { name: "Mercado Libre Clásica", type: "MELI_CLASSIC", commissionPercent: 14, sortOrder: 1 },
      { name: "Mercado Libre Premium", type: "MELI_PREMIUM", commissionPercent: 29, sortOrder: 2 },
      { name: "Mayorista", type: "WHOLESALE", priceAdjustPercent: -20, sortOrder: 3 },
    ],
  });

  await prisma.volumeTier.createMany({
    data: [
      { minQuantity: 1, discountPercent: 0 },
      { minQuantity: 10, discountPercent: 5 },
      { minQuantity: 50, discountPercent: 10 },
      { minQuantity: 100, discountPercent: 15 },
    ],
  });

  // Costo esperado: 289,49 + 300 + 600 = $1.189,49 (sin fijos ni mano de obra).
  await prisma.product.create({
    data: {
      name: "Foto plastificada A4",
      description: "Foto impresa en papel fotográfico y plastificada. Ejemplo sin mano de obra ni fijos.",
      category: "Plastificados",
      includeFixedCosts: false,
      supplies: {
        create: [
          { supplyId: pouch.id, quantity: 1 },
          { supplyId: papel.id, quantity: 1 },
          { supplyId: impresion.id, quantity: 1 },
        ],
      },
    },
  });

  console.log("✔ Datos de ejemplo cargados");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
