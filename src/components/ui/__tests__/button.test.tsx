import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Button } from '../button';

describe('Button', () => {
  it('displays its label text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeTruthy();
  });

  it('is accessible via button role', () => {
    render(<Button>Submit</Button>);
    expect(screen.getByRole('button')).toBeTruthy();
  });

  it('is disabled when the disabled prop is set', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders destructive variant without error', () => {
    render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole('button', { name: 'Delete' })).toBeTruthy();
  });

  it('renders outline variant without error', () => {
    render(<Button variant="outline">Cancel</Button>);
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
  });

  it('renders ghost variant without error', () => {
    render(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button', { name: 'Ghost' })).toBeTruthy();
  });

  it('renders small size without error', () => {
    render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button', { name: 'Small' })).toBeTruthy();
  });

  it('renders large size without error', () => {
    render(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button', { name: 'Large' })).toBeTruthy();
  });

  it('AC3: applies Tailwind classes to the rendered element', () => {
    const { container } = render(<Button>Tailwind</Button>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('inline-flex');
    expect(el.className).toContain('rounded-md');
  });
});
