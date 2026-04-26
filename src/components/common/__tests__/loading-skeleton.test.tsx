import { render } from '@testing-library/react';
import { LoadingSkeleton } from '../loading-skeleton';

describe('LoadingSkeleton', () => {
  it('renders sidebar and content area layout', () => {
    const { container } = render(<LoadingSkeleton />);
    const root = container.firstElementChild;
    expect(root).toBeInTheDocument();
    // Two panels: sidebar (left) + content (right)
    expect(root?.children.length).toBe(2);
  });

  it('renders skeleton items in the sidebar panel', () => {
    const { container } = render(<LoadingSkeleton />);
    const sidebarPanel = container.firstElementChild?.firstElementChild;
    // Header skeleton + 5 nav-item skeletons
    expect(
      sidebarPanel?.querySelectorAll('[class*="animate-pulse"]').length
    ).toBeGreaterThanOrEqual(6);
  });
});
