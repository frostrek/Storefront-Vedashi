'use client';

import React from 'react';
import { ShieldCheck, Microscope, Leaf, RefreshCcw, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const QualityPromise = () => {
  const features = [
    {
      icon: <ShieldCheck className="h-6 w-6 text-[#1a5b2e]" />,
      title: 'Authentic products',
    },
    {
      icon: <Microscope className="h-6 w-6 text-[#1a5b2e]" />,
      title: 'Tested ingredients',
    },
    {
      icon: <Leaf className="h-6 w-6 text-[#1a5b2e]" />,
      title: 'Preserved freshness',
    },
    {
      icon: <RefreshCcw className="h-6 w-6 text-[#1a5b2e]" />,
      title: 'Easy returns and refunds',
    },
  ];

  return (
    <section className="bg-[#c1d3beff] py-16 lg:py-10 border-t border-gray-100">
      <div className="mx-auto max-w-[1700px] px-6 lg:px-12">
        <div className="flex flex-col xl:flex-row items-center justify-between gap-12">

          {/* Brand Header */}
          <div className="flex-none lg:max-w-md text-center xl:text-left">
            <div className="flex items-center justify-center xl:justify-start gap-4">
              <div className="bg-[#1a5b2e] p-0.5 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-[#00472f]">
                Vedashi Quality Promise
              </h2>
            </div>
            <p className="text-gray-600 text-[15px] leading-relaxed">
              Quality you can trust, backed by how we source, verify and store.
            </p>
          </div>

          {/* Features Cards Grid */}
          <div className="flex-1 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-4 gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white px-6 py-5 rounded-xl border border-white flex items-center gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow cursor-default group"
                >
                  <div className="flex-shrink-0">
                    {feature.icon}
                  </div>
                  <h3 className="text-[15px] font-bold text-gray-800 leading-tight">
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