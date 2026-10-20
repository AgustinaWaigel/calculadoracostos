import { PageHeader } from "@/components/shared/ui-bits";
import { ProductEditor } from "@/components/products/product-editor";
import { getEditorOptions } from "@/server/editor-options";

export const metadata = { title: "Nuevo producto" };

export default async function NuevoProductoPage() {
  const options = await getEditorOptions();
  return (
    <>
      <PageHeader title="Nuevo producto" description="El costo se calcula en vivo mientras armás la receta." />
      <ProductEditor options={options} />
    </>
  );
}
