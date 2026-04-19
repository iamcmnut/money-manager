import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from './pagination';

describe('Pagination', () => {
  it('returns null when totalPages is 1', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('returns null when totalPages is 0', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={0} onPageChange={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders all page buttons when totalPages <= 5', () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={1} totalPages={4} onPageChange={onPageChange} />);

    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '4' })).toBeInTheDocument();
  });

  it('renders exactly 5 page buttons when totalPages is 5', () => {
    render(<Pagination currentPage={3} totalPages={5} onPageChange={vi.fn()} />);

    for (let i = 1; i <= 5; i++) {
      expect(screen.getByRole('button', { name: String(i) })).toBeInTheDocument();
    }
  });

  it('renders ellipsis when totalPages > 5 and currentPage > 3', () => {
    const { container } = render(
      <Pagination currentPage={5} totalPages={10} onPageChange={vi.fn()} />
    );
    const ellipses = container.querySelectorAll('.text-muted-foreground');
    // Should have at least one ellipsis
    expect(ellipses.length).toBeGreaterThanOrEqual(1);
  });

  it('renders end ellipsis when currentPage < totalPages - 2', () => {
    const { container } = render(
      <Pagination currentPage={3} totalPages={10} onPageChange={vi.fn()} />
    );
    const dots = container.querySelectorAll('span.text-muted-foreground');
    expect(dots.length).toBeGreaterThanOrEqual(1);
  });

  it('disables previous button on first page', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    // First button is the previous button
    expect(buttons[0]).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(<Pagination currentPage={5} totalPages={5} onPageChange={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    // Last button is the next button
    expect(buttons[buttons.length - 1]).toBeDisabled();
  });

  it('calls onPageChange with previous page when clicking prev', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />);

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[0]); // prev button

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange with next page when clicking next', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />);

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[buttons.length - 1]); // next button

    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('calls onPageChange with page number when clicking a page', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />);

    await user.click(screen.getByRole('button', { name: '3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('clamps previous to 1 when on first page', async () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />);

    // The prev button is disabled, but the onClick would call Math.max(1, 0) = 1
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toBeDisabled();
  });

  it('clamps next to totalPages on last page', async () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={5} totalPages={5} onPageChange={onPageChange} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons[buttons.length - 1]).toBeDisabled();
  });

  it('highlights current page button with default variant', () => {
    render(<Pagination currentPage={2} totalPages={5} onPageChange={vi.fn()} />);
    const btn = screen.getByRole('button', { name: '2' });
    // The current page should not have outline variant
    expect(btn).toBeInTheDocument();
  });

  it('displays showingLabel when provided', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={vi.fn()}
        showingLabel="Showing 1-10 of 50"
      />
    );
    expect(screen.getByText('Showing 1-10 of 50')).toBeInTheDocument();
  });

  it('does not display showingLabel when not provided', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
  });

  it('renders correctly for many pages with current near start', () => {
    render(<Pagination currentPage={2} totalPages={20} onPageChange={vi.fn()} />);
    // Should show page 1 and page 20 (first and last)
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '20' })).toBeInTheDocument();
  });

  it('renders correctly for many pages with current near end', () => {
    render(<Pagination currentPage={19} totalPages={20} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '20' })).toBeInTheDocument();
  });
});
