'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MoreHorizontal, Pencil, CheckCircle, Archive } from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';

import { PageHeader } from '@/components/common/page-header';
import { DataTable } from '@/components/common/data-table';
import { ProductStatusBadge } from '@/components/common/product-status-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useProducts,
  useActivateProduct,
  useArchiveProduct,
} from '@/services/products';
import { PRODUCT_UNIT_LABELS } from '@/types/product';
import type { Product, ProductStatus } from '@/types/product';

function ProductRowActions({ product }: { product: Product }) {
  const router = useRouter();
  const { mutateAsync: activate } = useActivateProduct();
  const { mutateAsync: archive } = useArchiveProduct();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Ações">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => router.push(`/catalogo/produtos/${product.id}`)}
        >
          <Pencil className="mr-2 size-4" />
          Editar
        </DropdownMenuItem>
        {product.status !== 'active' && (
          <DropdownMenuItem
            onClick={async () => {
              await activate(product.id);
              toast.success('Produto ativado com sucesso.');
            }}
          >
            <CheckCircle className="mr-2 size-4" />
            Ativar
          </DropdownMenuItem>
        )}
        {product.status !== 'archived' && (
          <DropdownMenuItem
            onClick={async () => {
              await archive(product.id);
              toast.success('Produto arquivado com sucesso.');
            }}
            className="text-destructive focus:text-destructive"
          >
            <Archive className="mr-2 size-4" />
            Arquivar
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const columns: ColumnDef<Product>[] = [
  { accessorKey: 'name', header: 'Nome' },
  {
    accessorKey: 'category',
    header: 'Categoria',
    cell: ({ row }) => row.original.category ?? '—',
  },
  {
    accessorKey: 'unit',
    header: 'Unidade',
    cell: ({ row }) =>
      PRODUCT_UNIT_LABELS[row.original.unit] ?? row.original.unit,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <ProductStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: 'base_price',
    header: 'Preço',
    cell: ({ row }) =>
      row.original.base_price.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
  },
  {
    accessorKey: 'created_at',
    header: 'Criado em',
    cell: ({ row }) =>
      new Date(row.original.created_at).toLocaleDateString('pt-BR'),
  },
  {
    id: 'actions',
    cell: ({ row }) => <ProductRowActions product={row.original} />,
  },
];

export default function ProductsPage() {
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>(
    'all',
  );
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const apiStatus = statusFilter !== 'all' ? statusFilter : undefined;
  const apiCategory = categoryFilter !== 'all' ? categoryFilter : undefined;
  const { data, isLoading } = useProducts({
    status: apiStatus,
    category: apiCategory,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produtos"
        description="Gerencie o catálogo de produtos."
      >
        <Button asChild>
          <Link href="/catalogo/produtos/new">Novo Produto</Link>
        </Button>
      </PageHeader>
      <div className="flex flex-wrap gap-2">
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as ProductStatus | 'all')}
        >
          <SelectTrigger className="w-40" aria-label="Filtrar por status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="archived">Arquivado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40" aria-label="Filtrar por categoria">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : (
        <DataTable columns={columns} data={data ?? []} searchColumn="name" />
      )}
    </div>
  );
}
