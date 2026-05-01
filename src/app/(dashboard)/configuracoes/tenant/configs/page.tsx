'use client';

import { useAuth } from '@/hooks/use-auth';
import { ConfigEditor } from '@/components/common/config-editor';
import { DangerZone } from '@/components/common/danger-zone';

export default function TenantConfigsPage() {
  const { user } = useAuth();
  const tenantId = user?.tenant_id ?? '';

  return (
    <div className="space-y-8">
      <ConfigEditor tenantId={tenantId} />
      <DangerZone tenantId={tenantId} />
    </div>
  );
}
