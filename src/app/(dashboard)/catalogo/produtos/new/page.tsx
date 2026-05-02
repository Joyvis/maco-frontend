'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { PageHeader } from '@/components/common/page-header';
import { ProductForm } from '@/components/common/product-form';
import { useCreateProduct } from '@/services/products';
import type { CreateProductInput } from '@/types/product';

export default function NewProductPage() {
  const router = useRouter();
  const { mutateAsync: createProduct, isPending } = useCreateProduct();

  async function handleSubmit(input: CreateProductInput) {
    await createProduct(input);
    toast.success('Produto criado com sucesso.');
    router.push('/catalogo/produtos');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Produto"
        description="Adicione um novo produto ao catálogo."
      />
      <ProductForm onSubmit={handleSubmit} isLoading={isPending} />
    </div>
  );
}
