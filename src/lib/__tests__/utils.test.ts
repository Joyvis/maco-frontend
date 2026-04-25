import { cn } from '@/lib/utils';

describe('AC6: path alias resolution', () => {
  it('resolves @/lib/utils and cn merges class names correctly', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  it('cn resolves Tailwind conflicts in favour of the last class', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('cn filters falsy values', () => {
    expect(cn('block', false && 'hidden', undefined, 'text-sm')).toBe(
      'block text-sm',
    );
  });
});
