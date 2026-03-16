'use client';

import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';

const LeafIcon = ({ color = '#4F7942', size = 40, className = "" }: { color?: string; size?: number; className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.08))' }}
  >
    <path 
      d="M12 22C12 22 12 18 17 13C22 8 18 2 12 2C6 2 2 8 7 13C12 18 12 22 12 22Z" 
      fill={color} 
      fillOpacity="0.35"
      stroke={color}
      strokeWidth="0.8"
    />
    <path 
      d="M12 2V22" 
      stroke={color} 
      strokeWidth="0.8" 
      strokeLinecap="round"
    />
    <path 
      d="M12 7L15 10" 
      stroke={color} 
      strokeWidth="0.8" 
      strokeLinecap="round"
    />
    <path 
      d="M12 12L9 15" 
      stroke={color} 
      strokeWidth="0.8" 
      strokeLinecap="round"
    />
  </svg>
);

const Leaf = ({ delay = 0, xPos = "10%", rotationStart = 0, speed = 1, size = 64 }) => {
  const { scrollYProgress } = useScroll();
  
  // Adjusted for a more "floating" feel (higher damping, lower stiffness)
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 40,
    damping: 30,
    restDelta: 0.001
  });

  // Vertical movement - ensuring they start falling from the very top
  // Scroll 0 = -100px (just off-screen or peeking)
  // Scroll 1 = footer area
  const y = useTransform(smoothProgress, [0, 1], ["-50px", `${85 * speed}vh`]);
  
  // Swaying movement
  const xOffset = useTransform(
    smoothProgress, 
    [0, 0.2, 0.4, 0.6, 0.8, 1], 
    ["0px", "40px", "-40px", "40px", "-40px", "0px"]
  );
  
  // Rotation - slowed down significantly
  const rotate = useTransform(smoothProgress, [0, 1], [rotationStart, rotationStart + 360 * speed]);
  
  // Opacity - visible from the very start of the scroll
  const opacity = useTransform(smoothProgress, [0, 0.1, 0.9, 1], [0.4, 0.5, 0.5, 0]);

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
      {/* Strategic placement of leaves */}
      {/* Strategic placement of leaves with gentler speed multipliers */}
      <Leaf xPos="5%" rotationStart={45} speed={0.8} size={120} />
      <Leaf xPos="12%" rotationStart={120} speed={0.5} size={70} />
      <Leaf xPos="30%" rotationStart={10} speed={1.1} size={90} />
      <Leaf xPos="45%" rotationStart={180} speed={0.7} size={65} />
      <Leaf xPos="60%" rotationStart={280} speed={0.9} size={85} />
      <Leaf xPos="75%" rotationStart={190} speed={0.6} size={100} />
      <Leaf xPos="88%" rotationStart={320} speed={1.2} size={80} />
      <Leaf xPos="95%" rotationStart={60} speed={0.8} size={95} />
    </div>
  );
}
