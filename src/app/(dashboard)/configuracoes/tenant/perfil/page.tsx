'use client';

import { useAuth } from '@/hooks/use-auth';
import { TenantProfileForm } from '@/components/common/tenant-profile-form';

export default function TenantPerfilPage() {
  const { user } = useAuth();
  const tenantId = user?.tenant_id ?? '';

  return <TenantProfileForm tenantId={tenantId} />;
}
