import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WebsiteJsonLd, SoftwareApplicationJsonLd, BreadcrumbJsonLd, WebApplicationJsonLd } from './json-ld';

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

describe('BreadcrumbJsonLd', () => {
  it('renders script tag with type application/ld+json', () => {
    const { container } = render(
      <BreadcrumbJsonLd items={[{ name: 'Home', url: 'https://example.com' }]} />
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
  });

  it('renders correct JSON-LD structure with multiple items', () => {
    const items = [
      { name: 'Home', url: 'https://example.com' },
      { name: 'EV', url: 'https://example.com/ev' },
      { name: 'Charging', url: 'https://example.com/ev/charging' },
    ];
    const { container } = render(<BreadcrumbJsonLd items={items} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script!.textContent!);

    expect(data).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://example.com' },
        { '@type': 'ListItem', position: 2, name: 'EV', item: 'https://example.com/ev' },
        { '@type': 'ListItem', position: 3, name: 'Charging', item: 'https://example.com/ev/charging' },
      ],
    });
  });

  it('renders empty itemListElement for empty items array', () => {
    const { container } = render(<BreadcrumbJsonLd items={[]} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script!.textContent!);

    expect(data.itemListElement).toEqual([]);
  });
});

describe('WebApplicationJsonLd', () => {
  it('renders script tag with type application/ld+json', () => {
    const { container } = render(
      <WebApplicationJsonLd
        name="Test App"
        description="A test app"
        url="https://example.com"
        applicationCategory="FinanceApplication"
        inLanguage={['en', 'th']}
      />
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
  });

  it('renders correct JSON-LD structure with THB currency', () => {
    const { container } = render(
      <WebApplicationJsonLd
        name="Manage Money"
        description="Finance app"
        url="https://manage.money"
        applicationCategory="FinanceApplication"
        inLanguage={['en', 'th']}
      />
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script!.textContent!);

    expect(data).toEqual({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Manage Money',
      description: 'Finance app',
      url: 'https://manage.money',
      applicationCategory: 'FinanceApplication',
      inLanguage: ['en', 'th'],
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'THB',
      },
    });
  });
});
