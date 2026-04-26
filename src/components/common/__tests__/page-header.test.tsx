import { render, screen } from '@testing-library/react';

import { PageHeader } from '../page-header';

describe('PageHeader', () => {
  it('renders title as h1', () => {
    render(<PageHeader title="Serviços" />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Serviços' }),
    ).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <PageHeader title="Serviços" description="Gerencie seus serviços" />,
    );
    expect(screen.getByText('Gerencie seus serviços')).toBeInTheDocument();
  });

  it('does not render description when omitted', () => {
    render(<PageHeader title="Serviços" />);
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });

  it('renders children in actions slot', () => {
    render(
      <PageHeader title="Serviços">
        <button>Add</button>
      </PageHeader>,
    );
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });
});
