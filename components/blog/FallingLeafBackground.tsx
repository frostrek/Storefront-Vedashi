'use client';

import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';
import Image from 'next/image';

const LeafIcon = ({ size = 40, className = "" }: { size?: number; className?: string }) => (
  <div 
    className={className}
    style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.05))' }}
  >
    <Image
      src="/botanical-leaf.png"
      alt="Ведический лист - Vedashi Herbals"
      width={size}
      height={size}
      className="object-contain"
      priority={false}
    />
  </div>
);

const Leaf = ({ xPos = "10%", rotationStart = 0, speed = 1, size = 64, offset = 0 }) => {
  const { scrollYProgress } = useScroll();
  
  // Slow spring physics
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 15,
    damping: 35,
    restDelta: 0.001
  });

  // Number of times the leaves loop as you scroll the entire page
  const loops = 4; 

  const y = useTransform(smoothProgress, (p) => {
    // Continuous loop: (p * loops * multiplier + initial_offset) % 1
    // We use a base multiplier (0.5) to keep it slow
    const progress = (p * loops * speed * 0.5 + offset) % 1;
    // Map 0-1 progress to -30vh to 110vh travel
    return `${progress * 140 - 30}vh`;
  });
  
  const xOffset = useTransform(smoothProgress, (p) => {
    const progress = (p * loops * speed * 0.5 + offset) % 1;
    return Math.sin(progress * Math.PI * 2) * 40 + "px";
  });
  
  const rotate = useTransform(smoothProgress, (p) => {
    const progress = (p * loops * speed * 0.5 + offset) % 1;
    return rotationStart + progress * 240;
  });
  
  const opacity = useTransform(smoothProgress, (p) => {
    const progress = (p * loops * speed * 0.5 + offset) % 1;
    // Fade in/out at edges
    if (progress < 0.1) return progress * 3;
    if (progress > 0.9) return (1 - progress) * 3;
    return 0.35;
  });

  return (
    <motion.div
      style={{
        position: 'fixed',
        left: xPos,
        top: 0,
        y,
        translateX: xOffset,
        rotate,
        opacity,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <LeafIcon size={size} />
    </motion.div>
  );
};

export default function FallingLeafBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      {/* 
          Infinite Waterfall of Leaves (Slowed Down):
          - xPos: horizontal position
          - offset: vertical start position (ensures they are on-screen immediately)
          - speed: relative speed multiplier
          - size: enlarged doodle scale
      */}
      <Leaf xPos="-5%" offset={0.1} speed={0.6} size={320} rotationStart={15} />
      <Leaf xPos="12%" offset={0.6} speed={0.4} size={180} rotationStart={120} />
      <Leaf xPos="25%" offset={0.3} speed={0.7} size={250} rotationStart={45} />
      <Leaf xPos="45%" offset={0.8} speed={0.5} size={150} rotationStart={180} />
      <Leaf xPos="60%" offset={0.25} speed={0.6} size={220} rotationStart={280} />
      <Leaf xPos="78%" offset={0.55} speed={0.4} size={280} rotationStart={190} />
      <Leaf xPos="88%" offset={0.9} speed={0.8} size={200} rotationStart={320} />
      <Leaf xPos="95%" offset={0.15} speed={0.6} size={260} rotationStart={60} />
    </div>
  );
}
