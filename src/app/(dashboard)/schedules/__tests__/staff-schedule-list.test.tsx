import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Mock } from 'vitest';

import { apiClient } from '@/services/api-client';
import type { PaginatedResponse, ApiResponse } from '@/types/api';
import type { ManagedUser } from '@/types/user-management';
import type { StaffSchedule, ScheduleBlock } from '@/types/schedule';

import { StaffScheduleList } from '../_components/staff-schedule-list';

vi.mock('@/config/env', () => ({
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:8000',
    NEXT_PUBLIC_APP_NAME: 'Maco',
  },
}));

vi.mock('@/services/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
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

const MOCK_STAFF: ManagedUser[] = [
  {
    id: 'staff-1',
    name: 'Ana Pereira',
    email: 'ana@example.com',
    roles: [{ id: 'r1', name: 'Staff' }],
    status: 'active',
    created_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'staff-2',
    name: 'Bruno Costa',
    email: 'bruno@example.com',
    roles: [{ id: 'r1', name: 'Staff' }],
    status: 'active',
    created_at: '2024-02-01T00:00:00Z',
  },
];

const MOCK_SCHEDULE: StaffSchedule = {
  id: 'sched-1',
  staff_id: 'staff-1',
  effective_from: '2024-01-01T00:00:00Z',
  days: [
    { day: 'monday', start_time: '09:00', end_time: '18:00' },
    { day: 'friday', start_time: '09:00', end_time: '18:00' },
  ],
};

const MOCK_BLOCKS: ScheduleBlock[] = [];

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

function mockApiResponses() {
  const staffResponse: PaginatedResponse<ManagedUser> = {
    data: MOCK_STAFF,
    meta: { total: 2, page: 1, page_size: 100 },
  };
  const scheduleResponse: ApiResponse<StaffSchedule> = {
    data: MOCK_SCHEDULE,
  };
  const blocksResponse: ApiResponse<ScheduleBlock[]> = { data: MOCK_BLOCKS };

  (apiClient.get as Mock).mockImplementation((path: string) => {
    if (path === '/users') return Promise.resolve(staffResponse);
    if (path.includes('/schedules')) return Promise.resolve(scheduleResponse);
    if (path.includes('/blocks')) return Promise.resolve(blocksResponse);
    return Promise.reject(new Error(`Unknown path: ${path}`));
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AC: Staff list loads with data', () => {
  it('renders staff rows after loading', async () => {
    mockApiResponses();
    render(<StaffScheduleList />, { wrapper: makeWrapper() });

    expect(await screen.findByText('Ana Pereira')).toBeInTheDocument();
    expect(screen.getByText('Bruno Costa')).toBeInTheDocument();
  });

  it('fetches staff with q[roles_slug_eq]=staff filter', async () => {
    mockApiResponses();
    render(<StaffScheduleList />, { wrapper: makeWrapper() });

    await screen.findByText('Ana Pereira');

    expect(apiClient.get).toHaveBeenCalledWith(
      '/users',
      expect.objectContaining({ 'q[roles_slug_eq]': 'staff' }),
    );
  });

  it('shows empty message when no staff found', async () => {
    const emptyResponse: PaginatedResponse<ManagedUser> = {
      data: [],
      meta: { total: 0, page: 1, page_size: 100 },
    };
    (apiClient.get as Mock).mockResolvedValue(emptyResponse);

    render(<StaffScheduleList />, { wrapper: makeWrapper() });

    expect(
      await screen.findByText(/Nenhum membro da equipe encontrado/i),
    ).toBeInTheDocument();
  });
});

describe('AC: TA clicks staff member — schedule editor opens', () => {
  it('opens schedule sheet when clicking Gerenciar Agenda', async () => {
    mockApiResponses();
    render(<StaffScheduleList />, { wrapper: makeWrapper() });

    await screen.findByText('Ana Pereira');

    const buttons = screen.getAllByRole('button', {
      name: /Gerenciar Agenda/i,
    });
    await userEvent.click(buttons[0]!);

    expect(
      await screen.findByText(/Agenda — Ana Pereira/i),
    ).toBeInTheDocument();
  });

  it('fetches schedule for selected staff', async () => {
    mockApiResponses();
    render(<StaffScheduleList />, { wrapper: makeWrapper() });

    await screen.findByText('Ana Pereira');

    const buttons = screen.getAllByRole('button', {
      name: /Gerenciar Agenda/i,
    });
    await userEvent.click(buttons[0]!);

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenCalledWith('/staff/staff-1/schedules'),
    );
  });
});

describe('AC: Schedule editor shows 7 rows', () => {
  it('shows all 7 day rows when editor is open', async () => {
    mockApiResponses();
    render(<StaffScheduleList />, { wrapper: makeWrapper() });

    await screen.findByText('Ana Pereira');

    const buttons = screen.getAllByRole('button', {
      name: /Gerenciar Agenda/i,
    });
    await userEvent.click(buttons[0]!);

    await screen.findByText(/Agenda — Ana Pereira/i);

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
});

describe('AC: Add Block button shows dialog', () => {
  it('shows Adicionar Bloqueio button in schedule sheet', async () => {
    mockApiResponses();
    render(<StaffScheduleList />, { wrapper: makeWrapper() });

    await screen.findByText('Ana Pereira');

    const buttons = screen.getAllByRole('button', {
      name: /Gerenciar Agenda/i,
    });
    await userEvent.click(buttons[0]!);

    await screen.findByText(/Agenda — Ana Pereira/i);

    expect(
      screen.getByRole('button', { name: /Adicionar Bloqueio/i }),
    ).toBeInTheDocument();
  });
});
