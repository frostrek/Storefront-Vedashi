'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface ButterflyInstance {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

// ─── Main Butterfly Component ───
export default function ButterflyEffect() {
  const [butterflies, setButterflies] = useState<ButterflyInstance[]>([]);
  const [cartTarget, setCartTarget] = useState({ x: 0, y: 0 });

  // Continuously track cart position for any active butterflies to land accurately
  useEffect(() => {
    const updateCartTarget = () => {
      const cartIcon = document.getElementById('navbar-cart-icon');
      if (cartIcon) {
        const rect = cartIcon.getBoundingClientRect();
        const svg = cartIcon.querySelector('svg');
        if (svg) {
          const sRect = svg.getBoundingClientRect();
          setCartTarget({
            x: sRect.left + sRect.width / 2,
            y: sRect.top + sRect.height / 2 - 15 // Sit slightly on TOP of the icon
          });
        } else {
          setCartTarget({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2 - 15
          });
        }
      }
    };

    updateCartTarget();
    window.addEventListener('resize', updateCartTarget);
    window.addEventListener('scroll', updateCartTarget, true);
    return () => {
      window.removeEventListener('resize', updateCartTarget);
      window.removeEventListener('scroll', updateCartTarget, true);
    };
  }, []);

  useEffect(() => {
    const handleTrigger = (event: any) => {
      const { startX, startY } = event.detail;
      setButterflies(prev => [...prev, {
        id: Date.now() + Math.random(),
        startX,
        startY,
        endX: cartTarget.x,
        endY: cartTarget.y,
      }]);
    };

    window.addEventListener('add-to-cart-butterfly', handleTrigger);
    return () => window.removeEventListener('add-to-cart-butterfly', handleTrigger);
  }, [cartTarget]);

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 2147483647 }}>
      <AnimatePresence>
        {butterflies.map(b => (
          <motion.div
            key={b.id}
            initial={{
              x: b.startX - 40,
              y: b.startY - 40,
              scale: 0.2,
              opacity: 1,
              rotateZ: 0,
            }}
            animate={{
              // Majestic organic path - using current cartTarget for dynamic landing
              x: [
                b.startX - 40, 
                b.startX - 100, 
                b.startX + 100, 
                cartTarget.x + 20, 
                cartTarget.x - 40,
                cartTarget.x - 40
              ],
              y: [
                b.startY - 40, 
                b.startY - 250, 
                b.startY - 450, 
                cartTarget.y - 60, 
                cartTarget.y - 40,
                cartTarget.y - 40
              ],
              scale: [0.2, 1.5, 1.2, 0.8, 0.4, 0],
              opacity: [1, 1, 1, 1, 1, 0],
              rotateZ: [0, -25, 35, -15, 0, 0],
            }}
            transition={{
              duration: 6.5,
              ease: "easeInOut",
              times: [0, 0.2, 0.5, 0.8, 0.92, 1] 
            }}
            onAnimationComplete={() => setButterflies(prev => prev.filter(item => item.id !== b.id))}
            className="absolute w-[80px] h-[80px]"
          >
            <div className="relative w-full h-full flex items-center justify-center" style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}>
              {/* Left Wing */}
              <motion.div
                className="absolute w-full h-full origin-center"
                style={{ clipPath: 'inset(0 50% 0 0)' }}
                animate={{ 
                  rotateY: [0, -80, 0, -80, 0, -20, 0, -50, 0, -50, 0] 
                }}
                transition={{ 
                  duration: 2.8, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  times: [0, 0.08, 0.16, 0.24, 0.32, 0.5, 0.7, 0.8, 0.85, 0.9, 1]
                }}
              >
                <div className="relative w-full h-full">
                  <Image
                    src="/botanical-butterfly1.png"
                    alt=""
                    fill
                    sizes="80px"
                    className="object-contain"
                    priority
                  />
                </div>
              </motion.div>

              {/* Right Wing */}
              <motion.div
                className="absolute w-full h-full origin-center"
                style={{ clipPath: 'inset(0 0 0 50%)' }}
                animate={{ 
                  rotateY: [0, 80, 0, 80, 0, 20, 0, 50, 0, 50, 0] 
                }}
                transition={{ 
                  duration: 2.8, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  times: [0, 0.08, 0.16, 0.24, 0.32, 0.5, 0.7, 0.8, 0.85, 0.9, 1]
                }}
              >
                <div className="relative w-full h-full">
                  <Image
                    src="/botanical-butterfly1.png"
                    alt=""
                    fill
                    sizes="80px"
                    className="object-contain"
                    priority
                  />
                </div>
              </motion.div>

              {/* Magical Botanical Aura */}
              <motion.div
                className="absolute inset-0 bg-[#3B5D3B]/10 blur-2xl rounded-full -z-10"
                animate={{ 
                  scale: [1, 2.5, 1], 
                  opacity: [0.2, 0.5, 0.2]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
