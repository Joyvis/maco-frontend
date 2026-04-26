import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../data-table';

const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: mockReplace })),
  usePathname: jest.fn().mockReturnValue('/test'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

interface Row {
  id: number;
  name: string;
}

const columns: ColumnDef<Row>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
];

const data: Row[] = Array.from({ length: 15 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));

describe('DataTable', () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it('renders column headers', () => {
    render(<DataTable columns={columns} data={data.slice(0, 5)} />);
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('renders rows', () => {
    render(<DataTable columns={columns} data={data.slice(0, 3)} />);
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('shows pagination when data exceeds pageSize', () => {
    render(<DataTable columns={columns} data={data} pageSize={10} />);
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('renders search input when searchColumn is provided', () => {
    render(<DataTable columns={columns} data={data} searchColumn="name" />);
    expect(screen.getByPlaceholderText(/filtrar/i)).toBeInTheDocument();
  });

  it('filters rows by search text', async () => {
    render(<DataTable columns={columns} data={data} searchColumn="name" pageSize={20} />);
    const input = screen.getByPlaceholderText(/filtrar/i);
    await userEvent.type(input, 'Item 1');
    // matches Item 1, Item 10–15 = 7 rows; non-matching rows should be absent
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.queryByText('Item 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Item 9')).not.toBeInTheDocument();
  });

  it('syncs page index to URL when navigating to next page', async () => {
    render(<DataTable columns={columns} data={data} pageSize={10} />);
    mockReplace.mockClear();
    await userEvent.click(screen.getByRole('button', { name: /next page/i }));
    expect(mockReplace).toHaveBeenCalledWith('/test?page=1');
  });

  it('removes page param from URL when back on first page', async () => {
    render(<DataTable columns={columns} data={data} pageSize={10} />);
    mockReplace.mockClear();
    await userEvent.click(screen.getByRole('button', { name: /next page/i }));
    await userEvent.click(screen.getByRole('button', { name: /previous page/i }));
    const lastCall = mockReplace.mock.calls[mockReplace.mock.calls.length - 1]?.[0] as string;
    expect(lastCall).not.toMatch(/[?&]page=/);
  });
});
