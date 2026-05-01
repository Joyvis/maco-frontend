import { render, screen, act } from '@testing-library/react';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: mockPush, replace: vi.fn() })),
  usePathname: vi.fn().mockReturnValue('/catalogo/servicos/new'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('@/services/services', () => ({
  useCreateService: vi.fn(),
}));

vi.mock('@/services/products', () => ({
  useCategories: vi.fn(),
}));

async function setup() {
  const { useCreateService } = await vi.importMock<{
    useCreateService: ReturnType<typeof vi.fn>;
  }>('@/services/services');

  const { useCategories } = await vi.importMock<{
    useCategories: ReturnType<typeof vi.fn>;
  }>('@/services/products');

  const mockMutateAsync = vi
    .fn()
    .mockResolvedValue({ data: { id: 'svc-new' } });
  useCreateService.mockReturnValue({
    mutateAsync: mockMutateAsync,
    isPending: false,
  });
  useCategories.mockReturnValue({ data: [], isLoading: false });

  const { default: NewServicePage } = await import('../page');
  let result!: ReturnType<typeof render>;
  await act(async () => {
    result = render(<NewServicePage />);
  });
  return { result, mockMutateAsync };
}

describe('NewServicePage', () => {
  it('renders the page header', async () => {
    await setup();
    expect(screen.getByText('Novo Serviço')).toBeInTheDocument();
  });

  it('renders the service form', async () => {
    await setup();
    expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument();
  });

  it('renders name input field', async () => {
    await setup();
    expect(
      screen.getByPlaceholderText(/ex: corte de cabelo/i),
    ).toBeInTheDocument();
  });

  it('renders duration field', async () => {
    await setup();
    expect(screen.getByPlaceholderText('60')).toBeInTheDocument();
  });

  it('renders price field', async () => {
    await setup();
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
  });
});
