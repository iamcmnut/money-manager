import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WebsiteJsonLd, SoftwareApplicationJsonLd } from './json-ld';

describe('WebsiteJsonLd', () => {
  it('renders script tag with type application/ld+json', () => {
    const { container } = render(
      <WebsiteJsonLd name="Test Site" description="A test site" url="https://example.com" />
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
  });

  it('renders correct JSON-LD structure', () => {
    const { container } = render(
      <WebsiteJsonLd name="Test Site" description="A test site" url="https://example.com" />
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script!.textContent!);

    expect(data).toEqual({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Test Site',
      description: 'A test site',
      url: 'https://example.com',
    });
  });
});

describe('SoftwareApplicationJsonLd', () => {
  it('renders script tag with type application/ld+json', () => {
    const { container } = render(
      <SoftwareApplicationJsonLd
        name="Test App"
        description="A test app"
        applicationCategory="FinanceApplication"
        operatingSystem="Web"
      />
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
  });

  it('renders correct JSON-LD structure with offer', () => {
    const { container } = render(
      <SoftwareApplicationJsonLd
        name="Test App"
        description="A test app"
        applicationCategory="FinanceApplication"
        operatingSystem="Web"
      />
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script!.textContent!);

    expect(data).toEqual({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Test App',
      description: 'A test app',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    });
  });
});
