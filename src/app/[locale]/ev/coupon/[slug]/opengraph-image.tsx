import { ImageResponse } from 'next/og';
import { getCachedNetworkCoupons } from '@/lib/coupon-cache';

export const runtime = 'edge';

export const alt = 'Coupon - Manager.money';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const { network } = await getCachedNetworkCoupons(slug);

  // If a custom OG image was uploaded, fetch and return it directly
  const customImage = locale === 'th' ? network?.couponOgImageTh : network?.couponOgImageEn;
  if (customImage) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://manager.money';
      const imageUrl = customImage.startsWith('http') ? customImage : `${baseUrl}${customImage}`;
      const res = await fetch(imageUrl);
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        return new Response(buffer, {
          headers: {
            'Content-Type': res.headers.get('Content-Type') || 'image/png',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
          },
        });
      }
    } catch {
      // Fall through to generated image
    }
  }

  const networkName = network?.name || slug;
  const brandColor = network?.brandColor || '#0d9488';

  const title = locale === 'th'
    ? `คูปองสำหรับ ${networkName}`
    : `Coupons for ${networkName}`;
  const description = locale === 'th'
    ? 'ดูคูปองและรหัสแนะนำสำหรับการชาร์จ EV'
    : 'View active coupons and referral codes for EV charging';

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
              background: `${brandColor}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
            }}
          >
            🏷️
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
            fontSize: '56px',
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
            fontSize: '26px',
            color: '#78716c',
            lineHeight: 1.4,
          }}
        >
          {description}
        </div>
        <div
          style={{
            marginTop: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '6px',
              borderRadius: '3px',
              background: brandColor,
            }}
          />
          <div
            style={{
              fontSize: '20px',
              color: brandColor,
              fontWeight: 600,
            }}
          >
            {networkName}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
