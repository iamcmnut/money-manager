import path from 'path';
import { fileURLToPath } from 'url';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

initOpenNextCloudflareForDev();

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Anchor Turbopack to this file's directory regardless of where `next dev` is
// launched from (e.g. via `wrangler pages dev`, where CWD may differ). A stray
// lockfile in /home/iamcmnut/project/ would otherwise hijack workspace inference.
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  images: {
    unoptimized: true,
  },
};

export default withNextIntl(nextConfig);
