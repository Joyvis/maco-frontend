'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/services/api-client';
import type { ApiResponse } from '@/types/api';
import type {
  StaffQualification,
  QualifiedStaff,
  GrantQualificationInput,
  RevokeQualificationInput,
} from '@/types/qualification';

// ─── Query key factory ─────────────────────────────────────────────────────────
export const qualificationKeys = {
  all: ['qualifications'] as const,
  staffQualifications: (staffId: string) =>
    [...qualificationKeys.all, 'staff', staffId] as const,
  serviceQualifiedStaff: (serviceId: string) =>
    [...qualificationKeys.all, 'service', serviceId] as const,
};

// ─── Hooks ─────────────────────────────────────────────────────────────────────
export function useStaffQualifications(staffId: string) {
  const { data, ...rest } = useQuery({
    queryKey: qualificationKeys.staffQualifications(staffId),
    queryFn: () =>
      apiClient.get<ApiResponse<StaffQualification[]>>(
        `/staff/${staffId}/qualifications`,
      ),
    enabled: Boolean(staffId),
  });
  return { data: data?.data, ...rest };
}

export function useQualifiedStaff(serviceId: string) {
  const { data, ...rest } = useQuery({
    queryKey: qualificationKeys.serviceQualifiedStaff(serviceId),
    queryFn: () =>
      apiClient.get<ApiResponse<QualifiedStaff[]>>(
        `/services/${serviceId}/qualified-staff`,
      ),
    enabled: Boolean(serviceId),
  });
  return { data: data?.data, ...rest };
}

export function useGrantQualification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ staffId, serviceId }: GrantQualificationInput) =>
      apiClient.post<ApiResponse<StaffQualification>>(
        `/staff/${staffId}/qualifications`,
        { service_id: serviceId },
      ),
    onSuccess: (_, { staffId, serviceId }) => {
      void queryClient.invalidateQueries({
        queryKey: qualificationKeys.staffQualifications(staffId),
      });
      void queryClient.invalidateQueries({
        queryKey: qualificationKeys.serviceQualifiedStaff(serviceId),
      });
    },
  });
}

export function useRevokeQualification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ staffId, serviceId }: RevokeQualificationInput) =>
      apiClient.delete<void>(`/staff/${staffId}/qualifications/${serviceId}`),
    onSuccess: (_, { staffId, serviceId }) => {
      void queryClient.invalidateQueries({
        queryKey: qualificationKeys.staffQualifications(staffId),
      });
      void queryClient.invalidateQueries({
        queryKey: qualificationKeys.serviceQualifiedStaff(serviceId),
      });
    },
  });
}
