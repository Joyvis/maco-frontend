import Link from 'next/link';

import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';

export default function QualificacoesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Qualificações"
        description="Gerencie quais serviços cada funcionário está qualificado para realizar."
      />
      <div className="flex gap-4">
        <Button asChild variant="outline">
          <Link href="/equipe/usuarios">Ver por Funcionário</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/catalogo/servicos">Ver por Serviço</Link>
        </Button>
      </div>
    </div>
  );
}
