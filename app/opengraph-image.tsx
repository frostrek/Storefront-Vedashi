import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const alt = 'Vedashi | Premium Ayurvedic Wellness';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
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
          fontFamily: 'serif',
          position: 'relative',
        }}
      >
        {/* Subtle Decorative Elements */}
        <div 
          style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            background: 'rgba(145, 201, 52, 0.1)',
            borderRadius: '50%',
          }} 
        />
        <div 
          style={{
            position: 'absolute',
            bottom: -50,
            left: -50,
            width: 300,
            height: 300,
            background: 'rgba(212, 175, 55, 0.05)',
            borderRadius: '50%',
          }} 
        />

        {/* Brand Content */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h1 
            style={{ 
              fontSize: 100, 
              fontWeight: 800, 
              margin: 0, 
              letterSpacing: '0.1em',
              color: '#d4af37' // Gold
            }}
          >
            VEDASHI
          </h1>
          <div 
            style={{ 
              height: 2, 
              width: 150, 
              background: '#91C934', // Brand Green
              margin: '20px 0' 
            }} 
          />
          <p 
            style={{ 
              fontSize: 32, 
              letterSpacing: '0.2em', 
              textTransform: 'uppercase',
              opacity: 0.9
            }}
          >
            Premium Ayurvedic Wellness
          </p>
        </div>

        {/* Footer info */}
        <div 
          style={{ 
            position: 'absolute', 
            bottom: 40, 
            display: 'flex', 
            alignItems: 'center',
            fontSize: 24,
            opacity: 0.7
          }}
        >
          <span>Authentic</span>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#d4af37', margin: '0 15px' }} />
          <span>Natural</span>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#d4af37', margin: '0 15px' }} />
          <span>Timeless</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
