import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Mock } from 'vitest';

import { apiClient } from '@/services/api-client';
import type { ApiResponse } from '@/types/api';
import type { StaffSchedule } from '@/types/schedule';

import {
  WeeklyScheduleEditor,
  buildBulkPayload,
} from '../_components/weekly-schedule-editor';

vi.mock('@/config/env', () => ({
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:8000',
    NEXT_PUBLIC_APP_NAME: 'Maco',
  },
}));

vi.mock('@/services/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
  usePathname: () => '/schedules',
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const MOCK_SCHEDULE: StaffSchedule = {
  id: 'sched-1',
  staff_id: 'staff-1',
  effective_from: '2024-01-01T00:00:00Z',
  days: [
    { day: 'monday', start_time: '09:00', end_time: '18:00' },
    { day: 'tuesday', start_time: '09:00', end_time: '18:00' },
    { day: 'wednesday', start_time: '09:00', end_time: '18:00' },
    { day: 'thursday', start_time: '09:00', end_time: '18:00' },
    { day: 'friday', start_time: '09:00', end_time: '18:00' },
  ],
};

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('buildBulkPayload — unit tests', () => {
  it('excludes closed days from payload', () => {
    const state = {
      monday: { closed: false, start_time: '09:00', end_time: '18:00' },
      tuesday: { closed: true, start_time: '09:00', end_time: '18:00' },
      wednesday: { closed: false, start_time: '08:00', end_time: '17:00' },
      thursday: { closed: true, start_time: '09:00', end_time: '18:00' },
      friday: { closed: false, start_time: '09:00', end_time: '18:00' },
      saturday: { closed: true, start_time: '09:00', end_time: '18:00' },
      sunday: { closed: true, start_time: '09:00', end_time: '18:00' },
    };

    const payload = buildBulkPayload(state);

    expect(payload).toHaveLength(3);
    expect(payload.map((d) => d.day)).toEqual([
      'monday',
      'wednesday',
      'friday',
    ]);
    expect(payload.find((d) => d.day === 'tuesday')).toBeUndefined();
    expect(payload.find((d) => d.day === 'saturday')).toBeUndefined();
  });

  it('returns empty array when all days are closed', () => {
    const state = Object.fromEntries(
      [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ].map((d) => [
        d,
        { closed: true, start_time: '09:00', end_time: '18:00' },
      ]),
    ) as Parameters<typeof buildBulkPayload>[0];

    expect(buildBulkPayload(state)).toHaveLength(0);
  });

  it('preserves correct times for open days', () => {
    const state = {
      monday: { closed: false, start_time: '08:30', end_time: '17:30' },
      tuesday: { closed: true, start_time: '09:00', end_time: '18:00' },
      wednesday: { closed: true, start_time: '09:00', end_time: '18:00' },
      thursday: { closed: true, start_time: '09:00', end_time: '18:00' },
      friday: { closed: true, start_time: '09:00', end_time: '18:00' },
      saturday: { closed: true, start_time: '09:00', end_time: '18:00' },
      sunday: { closed: true, start_time: '09:00', end_time: '18:00' },
    };

    const payload = buildBulkPayload(state);
    expect(payload[0]).toEqual({
      day: 'monday',
      start_time: '08:30',
      end_time: '17:30',
    });
  });
});

describe('WeeklyScheduleEditor — AC: no schedule shows CTA', () => {
  it('shows "Sem agenda" CTA when schedule is null and not loading', () => {
    render(
      <WeeklyScheduleEditor
        staffId="staff-1"
        schedule={null}
        isLoading={false}
      />,
      { wrapper: makeWrapper() },
    );

    expect(
      screen.getByText(/Sem agenda — defina os horários de trabalho/i),
    ).toBeInTheDocument();
  });

  it('shows loading spinner while fetching', () => {
    render(
      <WeeklyScheduleEditor
        staffId="staff-1"
        schedule={null}
        isLoading={true}
      />,
      { wrapper: makeWrapper() },
    );

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText(/Sem agenda/i)).not.toBeInTheDocument();
  });
});

describe('WeeklyScheduleEditor — AC: renders 7 rows', () => {
  it('shows all 7 days with time inputs and closed checkboxes', () => {
    render(
      <WeeklyScheduleEditor
        staffId="staff-1"
        schedule={MOCK_SCHEDULE}
        isLoading={false}
      />,
      { wrapper: makeWrapper() },
    );

    const days = [
      'Segunda',
      'Terça',
      'Quarta',
      'Quinta',
      'Sexta',
      'Sábado',
      'Domingo',
    ];
    for (const day of days) {
      expect(screen.getByText(day)).toBeInTheDocument();
    }
  });

  it('marks saturday and sunday as closed when not in schedule', () => {
    render(
      <WeeklyScheduleEditor
        staffId="staff-1"
        schedule={MOCK_SCHEDULE}
        isLoading={false}
      />,
      { wrapper: makeWrapper() },
    );

    const saturdayCheckbox = screen.getByRole('checkbox', {
      name: /Fechado — Sábado/i,
    });
    const sundayCheckbox = screen.getByRole('checkbox', {
      name: /Fechado — Domingo/i,
    });

    expect(saturdayCheckbox).toBeChecked();
    expect(sundayCheckbox).toBeChecked();
  });

  it('marks weekdays as open when in schedule', () => {
    render(
      <WeeklyScheduleEditor
        staffId="staff-1"
        schedule={MOCK_SCHEDULE}
        isLoading={false}
      />,
      { wrapper: makeWrapper() },
    );

    const mondayCheckbox = screen.getByRole('checkbox', {
      name: /Fechado — Segunda/i,
    });
    expect(mondayCheckbox).not.toBeChecked();
  });
});

describe('WeeklyScheduleEditor — AC: save → success toast', () => {
  it('calls PUT bulk endpoint and shows success toast on save', async () => {
    const mockResponse: ApiResponse<StaffSchedule> = {
      data: { ...MOCK_SCHEDULE },
    };
    (apiClient.put as Mock).mockResolvedValue(mockResponse);

    render(
      <WeeklyScheduleEditor
        staffId="staff-1"
        schedule={MOCK_SCHEDULE}
        isLoading={false}
      />,
      { wrapper: makeWrapper() },
    );

    const saveBtn = screen.getByRole('button', { name: /Salvar/i });
    await userEvent.click(saveBtn);

    await waitFor(() =>
      expect(apiClient.put).toHaveBeenCalledWith(
        '/staff/staff-1/schedules/bulk',
        expect.objectContaining({ days: expect.any(Array) }),
      ),
    );

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Agenda atualizada'),
    );
  });

  it('closed days are excluded from PUT payload', async () => {
    const mockResponse: ApiResponse<StaffSchedule> = {
      data: { ...MOCK_SCHEDULE },
    };
    (apiClient.put as Mock).mockResolvedValue(mockResponse);

    render(
      <WeeklyScheduleEditor
        staffId="staff-1"
        schedule={MOCK_SCHEDULE}
        isLoading={false}
      />,
      { wrapper: makeWrapper() },
    );

    const saveBtn = screen.getByRole('button', { name: /Salvar/i });
    await userEvent.click(saveBtn);

    await waitFor(() => expect(apiClient.put).toHaveBeenCalled());

    const [, body] = (apiClient.put as Mock).mock.calls[0] as [
      string,
      { days: Array<{ day: string }> },
    ];
    expect(body?.days.map((d) => d.day)).not.toContain('saturday');
    expect(body?.days.map((d) => d.day)).not.toContain('sunday');
  });
});
