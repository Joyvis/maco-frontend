import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LifecycleActions } from '@/components/common/lifecycle-actions';

const defaultProps = {
  status: 'draft' as const,
  statusLabel: 'Rascunho',
  entityName: 'Produto Teste',
  onActivate: vi.fn().mockResolvedValue(undefined),
  onArchive: vi.fn().mockResolvedValue(undefined),
};

describe('LifecycleActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders status label', () => {
    render(<LifecycleActions {...defaultProps} />);
    expect(screen.getByText('Rascunho')).toBeInTheDocument();
  });

  it('shows Ativar button for draft status', () => {
    render(<LifecycleActions {...defaultProps} status="draft" />);
    expect(screen.getByRole('button', { name: /ativar/i })).toBeInTheDocument();
  });

  it('hides Ativar button for active status', () => {
    render(
      <LifecycleActions
        {...defaultProps}
        status="active"
        statusLabel="Ativo"
      />,
    );
    expect(
      screen.queryByRole('button', { name: /ativar/i }),
    ).not.toBeInTheDocument();
  });

  it('shows Arquivar button for draft status', () => {
    render(<LifecycleActions {...defaultProps} status="draft" />);
    expect(
      screen.getByRole('button', { name: /arquivar/i }),
    ).toBeInTheDocument();
  });

  it('hides Arquivar button for archived status', () => {
    render(
      <LifecycleActions
        {...defaultProps}
        status="archived"
        statusLabel="Arquivado"
      />,
    );
    expect(
      screen.queryByRole('button', { name: /arquivar/i }),
    ).not.toBeInTheDocument();
  });

  it('calls onActivate when Ativar is clicked', async () => {
    const onActivate = vi.fn().mockResolvedValue(undefined);
    render(<LifecycleActions {...defaultProps} onActivate={onActivate} />);
    await userEvent.click(screen.getByRole('button', { name: /ativar/i }));
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it('disables Ativar button while activating', () => {
    render(<LifecycleActions {...defaultProps} isActivating />);
    expect(screen.getByRole('button', { name: /ativar/i })).toBeDisabled();
  });

  it('disables Arquivar button while archiving', () => {
    render(<LifecycleActions {...defaultProps} isArchiving />);
    expect(screen.getByRole('button', { name: /arquivar/i })).toBeDisabled();
  });
});
