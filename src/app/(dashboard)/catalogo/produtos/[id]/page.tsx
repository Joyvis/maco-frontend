'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { PageHeader } from '@/components/common/page-header';
import { ProductForm } from '@/components/common/product-form';
import { ProductStatusBadge } from '@/components/common/product-status-badge';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
  useProduct,
  useUpdateProduct,
  useActivateProduct,
  useArchiveProduct,
} from '@/services/products';
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
        <div className="flex items-center gap-3">
          <ProductStatusBadge status={product.status} />
          {product.status !== 'active' && (
            <Button
              size="sm"
              disabled={isActivating}
              onClick={async () => {
                await activate(id);
                toast.success('Produto ativado com sucesso.');
              }}
            >
              Ativar
            </Button>
          )}
          {product.status !== 'archived' && (
            <ConfirmDialog
              title="Arquivar Produto"
              description={`Tem certeza que deseja arquivar "${product.name}"? O produto ficará indisponível.`}
              confirmLabel="Arquivar"
              variant="destructive"
              onConfirm={async () => {
                await archive(id);
                toast.success('Produto arquivado com sucesso.');
                router.push('/catalogo/produtos');
              }}
              trigger={
                <Button variant="destructive" size="sm" disabled={isArchiving}>
                  Arquivar
                </Button>
              }
            />
          )}
        </div>
      </PageHeader>
      <ProductForm
        product={product}
        onSubmit={handleSubmit}
        isLoading={isUpdating}
      />
    </div>
  );
}
