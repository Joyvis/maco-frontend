import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Service } from '@/types/service';

vi.mock('@/services/products', () => ({
  useCategories: vi.fn(),
}));

const mockService: Service = {
  id: 'svc-1',
  name: 'Corte de Cabelo',
  description: 'Descrição do serviço',
  category: 'cat-1',
  duration_minutes: 60,
  base_price: 50,
  status: 'draft',
  created_at: '2024-01-01T00:00:00Z',
};

async function setupForm(
  service?: Service,
  isLoading = false,
  categories = [{ id: 'cat-1', name: 'Cabelo' }],
) {
  const { useCategories } = await vi.importMock<{
    useCategories: ReturnType<typeof vi.fn>;
  }>('@/services/products');

  useCategories.mockReturnValue({ data: categories, isLoading: false });

  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const { ServiceForm } = await import('../service-form');
  return {
    onSubmit,
    result: render(
      <ServiceForm
        service={service}
        onSubmit={onSubmit}
        isLoading={isLoading}
      />,
    ),
  };
}

describe('ServiceForm', () => {
  it('renders empty form in create mode', async () => {
    await setupForm();
    expect(screen.getByLabelText(/nome/i)).toHaveValue('');
    expect(screen.getByLabelText(/preço/i)).toHaveValue(null);
    expect(screen.getByLabelText(/duração/i)).toHaveValue(null);
  });

  it('pre-fills form with service data in edit mode', async () => {
    await setupForm(mockService);
    expect(screen.getByLabelText(/nome/i)).toHaveValue('Corte de Cabelo');
    expect(screen.getByLabelText(/preço/i)).toHaveValue(50);
    expect(screen.getByLabelText(/duração/i)).toHaveValue(60);
    expect(screen.getByLabelText(/descrição/i)).toHaveValue(
      'Descrição do serviço',
    );
  });

  it('shows spinner when loading', async () => {
    await setupForm(undefined, true);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('disables submit button when loading', async () => {
    await setupForm(undefined, true);
    expect(screen.getByRole('button', { name: /salvar/i })).toBeDisabled();
  });

  it('calls onSubmit with correct data on valid submission', async () => {
    const { onSubmit } = await setupForm();

    await userEvent.clear(screen.getByLabelText(/nome/i));
    await userEvent.type(screen.getByLabelText(/nome/i), 'Novo Serviço');
    await userEvent.clear(screen.getByLabelText(/duração/i));
    await userEvent.type(screen.getByLabelText(/duração/i), '45');
    await userEvent.clear(screen.getByLabelText(/preço/i));
    await userEvent.type(screen.getByLabelText(/preço/i), '80');

    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await vi.waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Novo Serviço',
          duration_minutes: 45,
          base_price: 80,
        }),
      );
    });
  });

  it('passes undefined for empty description', async () => {
    const { onSubmit } = await setupForm(mockService);

    await userEvent.clear(screen.getByLabelText(/descrição/i));
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await vi.waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ description: undefined }),
      );
    });
  });

  it('passes undefined for empty category', async () => {
    const { onSubmit } = await setupForm({
      ...mockService,
      category: undefined,
    });

    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await vi.waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ category: undefined }),
      );
    });
  });

  it('does not submit when name is empty', async () => {
    const { onSubmit } = await setupForm();

    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await vi.waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });
});
