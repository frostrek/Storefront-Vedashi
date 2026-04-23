import { ImageResponse } from 'next/og';
import { getProductDetails } from '@/lib/api';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: { id: string } }) {
  const product = await getProductDetails(params.id);

  if (!product) {
    return new Response('Product not found', { status: 404 });
  }

  const { product_name, brand, price, category, thumbnail_url } = product;

  return new ImageResponse(
    (
      <div
        style={{
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '60px',
          color: '#1a2e18',
          fontFamily: 'serif',
        }}
      >
        {/* Left Side: Product Info */}
        <div 
            style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                width: '60%',
                height: '100%',
                justifyContent: 'center'
            }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 28, fontWeight: 900, letterSpacing: '0.2em', color: '#3d5c3a' }}>VEDASHI</span>
            {category && (
              <>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#d4af37', margin: '0 20px' }} />
                <span style={{ fontSize: 22, color: '#888', textTransform: 'uppercase', letterSpacing: '0.15em' }}>{category}</span>
              </>
            )}
          </div>
          
          <h1 
            style={{ 
                fontSize: 84, 
                fontWeight: 800, 
                margin: '10px 0 10px 0', 
                lineHeight: 1, 
                color: '#1a2e18',
                letterSpacing: '-0.02em'
            }}
          >
            {product_name}
          </h1>
          
          {brand && (
            <p style={{ fontSize: 32, margin: '0 0 40px 0', color: '#91C934', fontWeight: 600 }}>
              {brand}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', marginTop: 30 }}>
            {price && (
              <div 
                style={{ 
                    background: '#3d5c3a', 
                    color: 'white', 
                    padding: '12px 35px', 
                    borderRadius: 12, 
                    fontSize: 40, 
                    fontWeight: 700 
                }}
              >
                ₹{price}
              </div>
            )}
            <div style={{ fontSize: 24, color: '#999', marginLeft: 30, letterSpacing: '0.05em' }}>
                Pure Ayurvedic Essence
            </div>
          </div>
        </div>

        {/* Right Side: Product Image Wrapper */}
        <div 
            style={{ 
                width: '35%', 
                height: '80%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                borderRadius: 40, 
                overflow: 'hidden', 
                background: '#fafafa', 
                border: '1px solid #f0f0f0',
                padding: '20px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.03)'
            }}
        >
          {thumbnail_url ? (
            <img 
                src={thumbnail_url} 
                style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain' 
                }} 
            />
          ) : (
            <div style={{ fontSize: 40, color: '#eee', fontWeight: 900, letterSpacing: '0.2em' }}>VEDASHI</div>
          )}
        </div>

        {/* Branded Watermark */}
        <div 
          style={{
            position: 'absolute',
            bottom: 30,
            right: 60,
            fontSize: 18,
            color: '#ddd',
            letterSpacing: '0.1em'
          }}
        >
          WWW.VEDASHI.COM
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
