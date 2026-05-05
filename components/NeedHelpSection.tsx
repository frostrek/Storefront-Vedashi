'use client';

import React from 'react';

const categories = [
  { name: "BODY WASH",  image: "/small banners/1.png", bg: "#d6e8f7", text: "#1a6eb5" },
  { name: "FACE WASH",  image: "/small banners/2.png", bg: "#d4edda", text: "#3a8c4e" },
  { name: "SERUMS",     image: "/small banners/3.png", bg: "#f3e2cc", text: "#8b5e2f" },
  { name: "LIPSTICKS",  image: "/small banners/4.png", bg: "#f2d9e0", text: "#7d3f52" },
  { name: "SHAMPOO",    image: "/small banners/5.png", bg: "#fad4dc", text: "#b83250" },
  { name: "DRY FRUITS", image: "/small banners/6.png", bg: "#eddccc", text: "#7a5230" },
  { name: "PICKLES",    image: "/small banners/7.png", bg: "#fdddd4", text: "#c0390e" },
  { name: "DAIRY",      image: "/small banners/8.png", bg: "#fdf3cc", text: "#c48f00" },
  { name: "TABLETS",    image: "/small banners/9.png", bg: "#d5eeda", text: "#3a7d44" },
  { name: "SPICES",     image: "/small banners/10.png", bg: "#fdebd0", text: "#c47200" },
  { name: "SNACKS",     image: "/small banners/11.png", bg: "#e4ebce", text: "#5a6e2c" },
  { name: "QUICKBITES", image: "/small banners/12.png", bg: "#ddd5cc", text: "#4a3728" },
];

export default function NeedHelpSection() {
  return (
    <section className="relative py-4 sm:py-5 bg-white overflow-hidden">
      <div className="relative z-10 mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="mb-4 sm:mb-7 text-center sm:text-left">
          <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">
            Need Help Choosing? Start Here!
          </h2>
        </div>

        {/* Grid Cards Row */}
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 lg:gap-4 pb-3">
          {categories.map((category, index) => (
            <div key={index}>
              <div
                className="relative rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
              >
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                />
                
                {/* HTML text overlay replacing the baked-in green bar */}
                <div 
                  className="absolute bottom-0 left-0 right-0 py-2 text-center text-[13px] font-bold tracking-[0.05em] z-10"
                  style={{ backgroundColor: category.bg, color: category.text }}
                >
                  {category.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
