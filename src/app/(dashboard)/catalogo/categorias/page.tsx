'use client';

import { PageHeader } from '@/components/common/page-header';
import { CategoryList } from '@/components/common/category-list';

export default function CategoriasPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorias"
        description="Gerencie e organize as categorias do catálogo."
      />
      <CategoryList />
    </div>
  );
}
