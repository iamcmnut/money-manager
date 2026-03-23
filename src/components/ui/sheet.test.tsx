import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetClose,
  SheetOverlay,
} from './sheet';

describe('Sheet', () => {
  it('renders trigger and opens content on click', async () => {
    const user = userEvent.setup();
    render(
      <Sheet>
        <SheetTrigger>Open Sheet</SheetTrigger>
        <SheetContent>
          <SheetTitle>Sheet Title</SheetTitle>
          <SheetDescription>Sheet Description</SheetDescription>
          <p>Sheet body</p>
        </SheetContent>
      </Sheet>
    );

    await user.click(screen.getByText('Open Sheet'));
    expect(screen.getByText('Sheet body')).toBeInTheDocument();
  });

  it('renders SheetHeader', async () => {
    const user = userEvent.setup();
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Header Title</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );

    await user.click(screen.getByText('Open'));
    expect(screen.getByText('Header Title')).toBeInTheDocument();
  });

  it('renders SheetFooter', async () => {
    const user = userEvent.setup();
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent>
          <SheetTitle>Title</SheetTitle>
          <SheetFooter>
            <button>Save</button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );

    await user.click(screen.getByText('Open'));
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('renders SheetDescription', async () => {
    const user = userEvent.setup();
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent>
          <SheetTitle>Title</SheetTitle>
          <SheetDescription>My description text</SheetDescription>
        </SheetContent>
      </Sheet>
    );

    await user.click(screen.getByText('Open'));
    expect(screen.getByText('My description text')).toBeInTheDocument();
  });

  it('renders with side="left"', async () => {
    const user = userEvent.setup();
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent side="left">
          <SheetTitle>Left Sheet</SheetTitle>
          <p>Left content</p>
        </SheetContent>
      </Sheet>
    );

    await user.click(screen.getByText('Open'));
    expect(screen.getByText('Left content')).toBeInTheDocument();
  });

  it('renders with side="top"', async () => {
    const user = userEvent.setup();
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent side="top">
          <SheetTitle>Top Sheet</SheetTitle>
          <p>Top content</p>
        </SheetContent>
      </Sheet>
    );

    await user.click(screen.getByText('Open'));
    expect(screen.getByText('Top content')).toBeInTheDocument();
  });

  it('renders with side="bottom"', async () => {
    const user = userEvent.setup();
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent side="bottom">
          <SheetTitle>Bottom Sheet</SheetTitle>
          <p>Bottom content</p>
        </SheetContent>
      </Sheet>
    );

    await user.click(screen.getByText('Open'));
    expect(screen.getByText('Bottom content')).toBeInTheDocument();
  });

  it('renders close button with sr-only text', async () => {
    const user = userEvent.setup();
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent>
          <SheetTitle>Title</SheetTitle>
          <p>Content</p>
        </SheetContent>
      </Sheet>
    );

    await user.click(screen.getByText('Open'));
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('renders SheetHeader with custom className', async () => {
    const user = userEvent.setup();
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent>
          <SheetHeader className="custom-header">
            <SheetTitle>Title</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );

    await user.click(screen.getByText('Open'));
    expect(screen.getByText('Title')).toBeInTheDocument();
  });

  it('renders SheetFooter with custom className', async () => {
    const user = userEvent.setup();
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent>
          <SheetTitle>Title</SheetTitle>
          <SheetFooter className="custom-footer">
            <span>Footer content</span>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );

    await user.click(screen.getByText('Open'));
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });
});
