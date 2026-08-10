'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { API_URL } from '@/lib/api';
import { RU_DICTIONARY } from '@/content/ru';

interface NeedHelpCategory {
  id: string;
  name: string;
  image_url: string;
  bg_color: string;
  text_color: string;
  link_url: string;
}

export default function NeedHelpSection() {
  const [categories, setCategories] = useState<NeedHelpCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/api/need-help/active`);
        const data = await res.json();
        if (data.success) {
          setCategories(data.data || []);
        }
      } catch (err) {
        console.warn('Failed to fetch Need Help categories (API might be unreachable).');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, []);

  if (!loading && categories.length === 0) return null;

  return (
    <section className="relative py-4 sm:py-5 bg-white overflow-hidden">
      <div className="relative z-10 mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="mb-4 sm:mb-7 text-center sm:text-left">
          <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">
            {RU_DICTIONARY.home.needHelpTitle}
          </h2>
        </div>

        {/* Grid Cards Row */}
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 lg:gap-4 pb-3">
          {loading ? (
            // Skeletons
            Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="relative rounded-2xl overflow-hidden aspect-square bg-gray-100 animate-pulse">
                <div className="absolute bottom-0 left-0 right-0 h-[44px] bg-gray-200" />
              </div>
            ))
          ) : (
            // Dynamic Categories
            categories.map((category) => (
              <Link key={category.id} href={category.link_url} prefetch={false}>
                <div
                  className="relative rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                >
                  <Image
                    src={category.image_url}
                    alt={category.name}
                    width={400}
                    height={400}
                    sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw"
                    className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  
                  {/* HTML text overlay replacing the baked-in green bar */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-[44px] flex items-center justify-center text-[13px] font-bold tracking-[0.05em] z-10"
                    style={{ backgroundColor: category.bg_color, color: category.text_color }}
                  >
                    {category.name}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
