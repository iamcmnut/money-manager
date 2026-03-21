import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Manager.money - Personal Finance';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const title = locale === 'th' ? 'Manager.money' : 'Manager.money';
  const subtitle =
    locale === 'th' ? 'การเงินส่วนบุคคล' : 'Personal Finance';
  const description =
    locale === 'th'
      ? 'จัดการค่าใช้จ่าย EV ค่าครองชีพ และการออม'
      : 'Manage EV costs, living expenses, and savings';

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #faf7f2 0%, #f0ebe3 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            fontSize: '64px',
            fontWeight: 700,
            color: '#1c1917',
            lineHeight: 1.1,
            marginBottom: '8px',
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: '36px',
            fontWeight: 500,
            color: '#57534e',
            marginBottom: '24px',
          }}
        >
          {subtitle}
        </div>
        <div
          style={{
            fontSize: '28px',
            color: '#78716c',
            lineHeight: 1.4,
          }}
        >
          {description}
        </div>
      </div>
    ),
    { ...size },
  );
}
