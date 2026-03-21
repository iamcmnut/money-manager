import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'EV Charging Price - Manager.money';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const title = locale === 'th' ? 'ราคาชาร์จ EV' : 'EV Charging Price';
  const description =
    locale === 'th'
      ? 'คำนวณและเปรียบเทียบค่าใช้จ่ายในการชาร์จรถยนต์ไฟฟ้า'
      : 'Calculate and compare electric vehicle charging costs';

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
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: '#e8f5e9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
            }}
          >
            ⚡
          </div>
          <div
            style={{
              fontSize: '20px',
              color: '#78716c',
              fontWeight: 500,
            }}
          >
            Manager.money
          </div>
        </div>
        <div
          style={{
            fontSize: '64px',
            fontWeight: 700,
            color: '#1c1917',
            lineHeight: 1.1,
            marginBottom: '20px',
          }}
        >
          {title}
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
