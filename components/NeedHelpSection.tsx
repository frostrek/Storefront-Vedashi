'use client';

import React from 'react';

const smallBanners = [
  '/small banners/1.png',
  '/small banners/2.png',
  '/small banners/3.png',
  '/small banners/4.png',
  '/small banners/5.png',
  '/small banners/6.png',
  '/small banners/7.png',
  '/small banners/8.png',
  '/small banners/9.png',
  '/small banners/10.png',
];

export default function NeedHelpSection() {
  return (
    <section className="relative py-4 sm:py-5 bg-[#FAF9F6] overflow-hidden">


      <div className="relative z-10 mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="mb-7">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Need Help Choosing? Start Here!
          </h2>
        </div>

        {/* Grid Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 lg:gap-4 pb-3">
          {smallBanners.map((banner, index) => (
            <div key={index}>
              <div
                className="relative rounded-2xl overflow-hidden cursor-pointer transition-transform duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <img
                  src={banner}
                  alt={`Category banner ${index + 1}`}
                  className="w-full h-auto object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
