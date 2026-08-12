import { ImageResponse } from 'next/og';
import { RU_DICTIONARY } from '@/content/ru';
import { readFileSync } from 'fs';
import { join } from 'path';

export const runtime = 'nodejs';

export const alt = RU_DICTIONARY.ogImage.alt;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const logoPath = join(process.cwd(), 'public', 'vedashi-logo-white.png');
  const logoData = readFileSync(logoPath);

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #3d5c3a 0%, #1a2e18 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={`data:image/png;base64,${logoData.toString('base64')}`} 
            alt="Vedashi Logo" 
            width={500} 
            height={500}
            style={{ objectFit: 'contain', opacity: 0.95 }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
