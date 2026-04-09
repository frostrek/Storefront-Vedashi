'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

interface Category {
  id: string;
  label: string;
  image?: string;
  emoji?: string;
  query: string;
  bg: string;
  labelColor: string;
  arrowBg: string;
}

const categories: Category[] = [
  // ── Beauty & Personal Care ──
  {
    id: 'lipstick',
    label: 'Lipstick',
    image: '/help-lipstick.png',
    query: '?category=cosmetics&sub_category=lip-care',
    bg: '#FFF0F3',
    labelColor: '#E83E6C',
    arrowBg: '#E83E6C',
  },
  {
    id: 'toothpaste',
    label: 'Toothpaste',
    image: '/help-toothpaste.png',
    query: '?category=personal-care&sub_category=oral-care',
    bg: '#F0F8FF',
    labelColor: '#1976D2',
    arrowBg: '#1976D2',
  },
  {
    id: 'face-wash',
    label: 'Face Wash',
    image: '/help-facewash.png',
    query: '?category=cosmetics&sub_category=face-wash',
    bg: '#F0FAF4',
    labelColor: '#27AE60',
    arrowBg: '#27AE60',
  },
  {
    id: 'face-oils',
    label: 'Face Oils',
    image: '/help-faceoil.png',
    query: '?category=cosmetics&sub_category=face-oils',
    bg: '#FEF9E7',
    labelColor: '#D4AC0D',
    arrowBg: '#D4AC0D',
  },
  {
    id: 'kajal-eyeliner',
    label: 'Kajal & Eyeliner',
    image: '/help-kajal.png',
    query: '?category=cosmetics&sub_category=kajal-eyeliner',
    bg: '#F5F5F5',
    labelColor: '#444444',
    arrowBg: '#444444',
  },
  {
    id: 'shampoo',
    label: 'Shampoo & Conditioner',
    image: '/help-shampoo.png',
    query: '?category=cosmetics&sub_category=hair-care',
    bg: '#EFF9FF',
    labelColor: '#2196F3',
    arrowBg: '#2196F3',
  },
  {
    id: 'hair-oils',
    label: 'Hair Oils',
    emoji: '🫙',
    query: '?category=cosmetics&sub_category=hair-oils',
    bg: '#FFF8E1',
    labelColor: '#F57C00',
    arrowBg: '#F57C00',
  },
  // ── Food & Nutrition ──
  {
    id: 'lentils',
    label: 'Lentils',
    image: '/help-lentils.png',
    query: '?category=foods&sub_category=lentils',
    bg: '#FFF3E0',
    labelColor: '#E65100',
    arrowBg: '#E65100',
  },
  {
    id: 'pickles',
    label: 'Pickles',
    image: '/help-pickles.png',
    query: '?category=foods&sub_category=pickles',
    bg: '#FFFDE7',
    labelColor: '#F9A825',
    arrowBg: '#F9A825',
  },
  {
    id: 'masala-chai',
    label: 'Masala Chai',
    image: '/help-masalachai.png',
    query: '?category=teas-and-superfoods&sub_category=masala-chai',
    bg: '#FBE9E7',
    labelColor: '#BF360C',
    arrowBg: '#BF360C',
  },
  {
    id: 'spices',
    label: 'Spices',
    image: '/help-spices.png',
    query: '?category=spices-and-masala',
    bg: '#FCE4EC',
    labelColor: '#C2185B',
    arrowBg: '#C2185B',
  },
  {
    id: 'nuts',
    label: 'Nuts (Kaju, Badam)',
    emoji: '🥜',
    query: '?category=dry-fruits--snacks&sub_category=nuts',
    bg: '#F3E5F5',
    labelColor: '#7B1FA2',
    arrowBg: '#7B1FA2',
  },
  {
    id: 'makhana',
    label: 'Makhana',
    emoji: '🍿',
    query: '?category=dry-fruits--snacks&sub_category=makhana',
    bg: '#E8F5E9',
    labelColor: '#2E7D32',
    arrowBg: '#2E7D32',
  },
  {
    id: 'instant-mixes',
    label: 'Instant Mixes',
    emoji: '📦',
    query: '?category=foods&sub_category=instant-mixes',
    bg: '#E3F2FD',
    labelColor: '#1565C0',
    arrowBg: '#1565C0',
  },
];

export default function NeedHelpSection() {
  const params = useParams();
  const country = (Array.isArray(params?.country) ? params?.country[0] : params?.country) || 'in';

  return (
    <section className="relative py-6 sm:py-8 bg-[#FAF9F6] overflow-hidden">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.12] pointer-events-none mix-blend-multiply" 
        style={{
          backgroundImage: 'url(/flower-pattern.jpg)',
          backgroundSize: '1000px',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat'
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="mb-7">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
            Need Help Choosing?{' '}
            <span className="text-[#3B5D3B]">Start Here!</span>
          </h2>
          <p className="mt-1.5 text-sm text-[#6B6B60]">
            Explore our most-loved categories and find exactly what you need.
          </p>
        </div>

        {/* Grid Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 pb-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/${country}/products${cat.query}`}
              id={`help-card-${cat.id}`}
              className="group focus:outline-none"
            >
              <div
                className="relative w-full rounded-2xl overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1"
                style={{ backgroundColor: cat.bg, height: '190px' }}
              >
                {/* Category Label — top */}
                <div className="px-3.5 pt-3.5 pb-1">
                  <p
                    className="text-[12.5px] font-bold leading-snug"
                    style={{ color: cat.labelColor }}
                  >
                    {cat.label}
                  </p>
                </div>

                {/* Product — image or emoji placeholder */}
                <div
                  className="absolute bottom-0 right-0 w-full flex items-end justify-center overflow-hidden"
                  style={{ height: '145px' }}
                >
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.label}
                      className="h-full w-auto object-contain object-bottom mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
                      style={{ maxWidth: '85%' }}
                    />
                  ) : (
                    <span
                      className="transition-transform duration-300 group-hover:scale-110 select-none"
                      style={{ fontSize: '90px', lineHeight: 1, paddingBottom: '12px' }}
                    >
                      {cat.emoji}
                    </span>
                  )}
                </div>

                {/* Arrow button — bottom left */}
                <div
                  className="absolute bottom-3 left-3 h-7 w-7 rounded-full flex items-center justify-center shadow-sm transition-transform duration-200 group-hover:scale-110"
                  style={{ backgroundColor: cat.arrowBg }}
                >
                  <ArrowRight className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
