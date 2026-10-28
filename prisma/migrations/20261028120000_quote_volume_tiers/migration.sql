-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "volumeTiers" JSONB NOT NULL DEFAULT '[]';

-- Los presupuestos que ya existen se quedan con los descuentos de Ajustes de hoy.
UPDATE "Quote" SET "volumeTiers" = COALESCE(
  (SELECT jsonb_agg(jsonb_build_object('minQuantity', "minQuantity", 'discountPercent', "discountPercent"::text) ORDER BY "minQuantity") FROM "VolumeTier"),
  '[]'::jsonb
);
