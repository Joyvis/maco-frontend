'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { PageHeader } from '@/components/common/page-header';
import { ProductForm } from '@/components/common/product-form';
import { LifecycleActions } from '@/components/common/lifecycle-actions';
import {
  useProduct,
  useUpdateProduct,
  useActivateProduct,
  useArchiveProduct,
} from '@/services/products';
import { PRODUCT_STATUS_LABELS } from '@/types/product';
import type { CreateProductInput } from '@/types/product';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: product, isLoading } = useProduct(id);
  const { mutateAsync: updateProduct, isPending: isUpdating } =
    useUpdateProduct(id);
  const { mutateAsync: activate, isPending: isActivating } =
    useActivateProduct();
  const { mutateAsync: archive, isPending: isArchiving } = useArchiveProduct();

  async function handleSubmit(input: CreateProductInput) {
    await updateProduct(input);
    toast.success('Produto atualizado com sucesso.');
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Editar Produto" />
        <p className="text-muted-foreground text-sm">Carregando...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <PageHeader title="Editar Produto" />
        <p className="text-muted-foreground text-sm">Produto não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`Editar Produto: ${product.name}`}>
        <LifecycleActions
          status={product.status}
          statusLabel={PRODUCT_STATUS_LABELS[product.status]}
          entityName={product.name}
          archiveDescription={`Tem certeza que deseja arquivar "${product.name}"? O produto ficará indisponível.`}
          isActivating={isActivating}
          isArchiving={isArchiving}
          onActivate={async () => {
            await activate(id);
            toast.success('Produto ativado com sucesso.');
          }}
          onArchive={async () => {
            await archive(id);
            toast.success('Produto arquivado com sucesso.');
            router.push('/catalogo/produtos');
          }}
        />
      </PageHeader>
      <ProductForm
        product={product}
        onSubmit={handleSubmit}
        isLoading={isUpdating}
      />
    </div>
  );
}
