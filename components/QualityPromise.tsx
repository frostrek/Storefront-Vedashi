'use client';

import React from 'react';
import { ShieldCheck, Microscope, Leaf, RefreshCcw, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const QualityPromise = () => {
  const features = [
    {
      icon: <ShieldCheck className="h-6 w-6 transition-colors duration-300" />,
      title: 'Authentic products',
    },
    {
      icon: <Microscope className="h-6 w-6 transition-colors duration-300" />,
      title: 'Tested ingredients',
    },
    {
      icon: <Leaf className="h-6 w-6 transition-colors duration-300" />,
      title: 'Preserved freshness',
    },
    {
      icon: <RefreshCcw className="h-6 w-6 transition-colors duration-300" />,
      title: 'Easy returns and refunds',
    },
  ];

  return (
    <section className="relative bg-gradient-to-br from-[#e1fade] to-[#c5f6bd] py-10 lg:py-8 border-t border-white/20 overflow-hidden">
      {/* Decorative patterns */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-60 h-60 bg-white rounded-full blur-[100px]" />
      </div>

      <div className="mx-auto max-w-[1700px] px-6 lg:px-12 relative z-10">
        <div className="flex flex-col xl:flex-row items-center justify-between gap-10">

          {/* Brand Header */}
          <div className="flex-none lg:max-w-md text-center xl:text-left">
            <div className="flex items-center justify-center xl:justify-start gap-4 mb-2">
              <div className="bg-[#00472F] p-1.5 rounded-full shadow-lg shadow-[#00472F]/20">
                <CheckCircle2 className="h-5 w-5 text-[#c5f6bd]" />
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-[#00472F] tracking-tight">
                Vedashi Quality Promise
              </h2>
            </div>
            <p className="text-[#00472F]/70 text-[16px] leading-relaxed font-medium">
              Quality you can trust, backed by how we source, verify and store.
            </p>
          </div>

          {/* Features Cards Grid */}
          <div className="flex-1 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-4 gap-5">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -5, backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.1,
                    type: 'spring',
                    stiffness: 100
                  }}
                  className="bg-white/70 backdrop-blur-md px-6 py-5 rounded-2xl border border-white/60 flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all cursor-default group"
                >
                  <div className="flex-shrink-0 bg-[#00472F]/5 p-3 rounded-xl group-hover:bg-[#00472F] group-hover:rotate-[360deg] transition-all duration-700 text-[#00472F] group-hover:text-white">
                    {feature.icon}
                  </div>
                  <h3 className="text-[17px] font-bold text-[#00472F] leading-tight tracking-tight">
                    {feature.title}
                  </h3>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default QualityPromise;