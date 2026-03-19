import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('accepts and applies custom className', () => {
    render(<Card className="custom-class">Content</Card>);
    expect(screen.getByText('Content')).toHaveClass('custom-class');
  });
});

describe('CardHeader', () => {
  it('renders children', () => {
    render(<CardHeader>Header content</CardHeader>);
    expect(screen.getByText('Header content')).toBeInTheDocument();
  });

  it('accepts and applies custom className', () => {
    render(<CardHeader className="header-class">Header</CardHeader>);
    expect(screen.getByText('Header')).toHaveClass('header-class');
  });
});

describe('CardTitle', () => {
  it('renders with a div tag', () => {
    render(<CardTitle>Title text</CardTitle>);
    const element = screen.getByText('Title text');
    expect(element).toBeInTheDocument();
    expect(element.tagName).toBe('DIV');
  });

  it('accepts and applies custom className', () => {
    render(<CardTitle className="title-class">Title</CardTitle>);
    expect(screen.getByText('Title')).toHaveClass('title-class');
  });
});

describe('CardDescription', () => {
  it('renders children', () => {
    render(<CardDescription>Description text</CardDescription>);
    expect(screen.getByText('Description text')).toBeInTheDocument();
  });

  it('accepts and applies custom className', () => {
    render(<CardDescription className="desc-class">Desc</CardDescription>);
    expect(screen.getByText('Desc')).toHaveClass('desc-class');
  });
});

describe('CardContent', () => {
  it('renders children', () => {
    render(<CardContent>Content body</CardContent>);
    expect(screen.getByText('Content body')).toBeInTheDocument();
  });

  it('accepts and applies custom className', () => {
    render(<CardContent className="content-class">Body</CardContent>);
    expect(screen.getByText('Body')).toHaveClass('content-class');
  });
});

describe('CardFooter', () => {
  it('renders children', () => {
    render(<CardFooter>Footer content</CardFooter>);
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('accepts and applies custom className', () => {
    render(<CardFooter className="footer-class">Footer</CardFooter>);
    expect(screen.getByText('Footer')).toHaveClass('footer-class');
  });
});
