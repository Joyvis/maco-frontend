import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ErrorBoundary from '../error-boundary';

describe('ErrorBoundary', () => {
  it('renders error message and digest', () => {
    const error = new Error('Something went wrong');
    render(<ErrorBoundary error={error} reset={() => {}} />);
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('calls reset when Tentar Novamente is clicked', async () => {
    const reset = vi.fn();
    render(<ErrorBoundary error={new Error('Test error')} reset={reset} />);
    await userEvent.click(
      screen.getByRole('button', { name: /tentar novamente/i }),
    );
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
