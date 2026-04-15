'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getCategories, getFilterOptions } from '@/lib/api';


interface Category {
  category_id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  image_url?: string;
  children?: Category[];
}

const SecondaryMegaMenuLinks = ({ item, country, topLevelSlug, secondLevelSlug, level = 0 }: { item: Category, country: string, topLevelSlug: string, secondLevelSlug?: string, level?: number }) => {
  const hasChildren = item.children && item.children.length > 0;

  let href = `/${country}/products?category=${topLevelSlug}`;
  if (level === 0) {
    href += `&sub_category=${item.slug}`;
  } else if (level === 1) {
    href += `&sub_category=${secondLevelSlug}&sub_sub_category=${item.slug}`;
  } else {
    href += `&sub_category=${secondLevelSlug}&sub_sub_category=${item.slug}`; // Fallback for deeper levels
  }

  return (
    <div className={`flex flex-col items-start ${level === 0 ? 'mb-6' : 'mb-0'}`}>
      <Link
        href={href}
        className={`transition-colors duration-200 inline-block mb-3 ${level === 0
          ? 'text-[15px] font-black text-black uppercase tracking-wide'
          : 'text-[13px] text-gray-500 font-semibold hover:text-[#FF0000] uppercase tracking-tight'
          }`}
      >

        <span>{item.name}</span>
      </Link>

      {hasChildren && (
        <div className={`flex flex-col gap-1.5 ${level === 0 ? 'mt-1' : ''}`}>
          {item.children!.map(child => (
            <SecondaryMegaMenuLinks
              key={child.category_id}
              item={child}
              country={country}
              topLevelSlug={topLevelSlug}
              secondLevelSlug={level === 0 ? item.slug : secondLevelSlug}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function SecondaryNavbar() {
  const params = useParams();
  const country = (Array.isArray(params?.country) ? params?.country[0] : params?.country) || 'in';
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getCategories(true), // Fetch the full tree
      getFilterOptions()
    ]).then(([cats, filterOpt]) => {
      if (Array.isArray(cats)) {
        setCategories(cats);
      }
      if (filterOpt && filterOpt.brands) {
        setBrands(filterOpt.brands);
      }
      setLoading(false);
    }).catch(e => console.warn('Failed to init navbar', e));
  }, []);

  const parentCategories = categories.filter(c => !c.parent_id);

  // Group brands by first letter
  const groupedBrands = brands.reduce((acc, brand) => {
    const firstLetter = brand.charAt(0).toUpperCase();
    const key = /[A-Z]/.test(firstLetter) ? firstLetter : '#';
    if (!acc[key]) acc[key] = [];
    acc[key].push(brand);
    return acc;
  }, {} as Record<string, string[]>);

  const alphabetKeys = Object.keys(groupedBrands).sort();

  return (
    <div className="hidden md:block bg-white border-b border-gray-200 shadow-sm relative z-[90]">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-[32px] items-center justify-between text-[14px] uppercase font-bold text-black-700 font-sans">

          <div className="flex items-center gap-0 h-full overflow-x-auto no-scrollbar scroll-smooth">
            {/* Individual Categories */}
            {!loading && parentCategories.map((parent, index) => {
              const subcats = parent.children || [];

              return (
                <div key={parent.category_id} className="flex items-center h-full">
                  <div className="group/nav-item h-full flex items-center shrink-0">
                    <Link
                      href={`/${country}/products?category=${parent.slug}`}
                      className={`flex items-center h-full px-1.5 transition-colors cursor-pointer border-b-2 border-transparent group-hover/nav-item:border-[#FF0000] ${
                        parent.name.toUpperCase() === 'SPICES' ? 'text-[#FF0000]' : 'hover:text-[#FF0000]'
                      }`}
                    >
                      {parent.name}
                    </Link>

                    {/* Subcategories Dropdown (Mega Menu) */}
                    {subcats.length > 0 && (
                      <div className="absolute top-full left-0 w-[97vw] rounded-br-xl bg-white shadow-[0_15px_50px_rgba(0,0,0,0.15)] opacity-0 invisible group-hover/nav-item:opacity-100 group-hover/nav-item:visible transition-all duration-300 z-[100]">
                        <div className="mx-auto px-8 pb-8 pt-4 flex flex-col gap-6 min-h-[250px] relative">
                          {/* Category Name on top */}
                          <div className="border-b border-[#3B5D3B]/10 pb-3">
                            <h3 className="text-xl font-extrabold text-[#FFD801]">{parent.name}</h3>
                          </div>

                          <div className="flex flex-col justify-between flex-1">
                            {/* Subcategories and Sub-subcategories below */}
                            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-10 mb-2">
                              {subcats.map(sub => (
                                <div key={sub.category_id} className="break-inside-avoid">
                                  <SecondaryMegaMenuLinks item={sub} country={country} topLevelSlug={parent.slug} />
                                </div>
                              ))}
                            </div>

                            {/* "View All" link positioned at the bottom right */}
                            <div className="flex justify-end mt-auto pt-4 border-t border-gray-50/50">
                              <Link href={`/${country}/products?category=${parent.slug}`} className="text-[#3B5D3B] hover:text-[#FF0000] flex items-center gap-1 font-bold text-[13px] group/view-all">
                                Explore All {parent.name} <span className="transition-transform group-hover/view-all:translate-x-1">→</span>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Vertical Divider before Brands */}
            {!loading && parentCategories.length > 0 && (
              <div className="h-4 w-[1px] bg-gray-200 self-center shrink-0 mx-2" />
            )}

            {/* Brands A-Z Dropdown */}
            <div className="group/nav-item h-full flex items-center shrink-0">
              <span className="flex items-center h-full px-1.5 hover:text-[#FF0000] transition-colors cursor-pointer border-b-2 border-transparent group-hover/nav-item:border-[#FF0000]">
                Brands A-Z
              </span>

              {/* Brands Mega Dropdown */}
              {!loading && brands.length > 0 && (
                <div className="absolute top-full left-0 w-[90vw] rounded-br-xl bg-white shadow-[0_15px_50px_rgba(0,0,0,0.15)] opacity-0 invisible group-hover/nav-item:opacity-100 group-hover/nav-item:visible transition-all duration-300 z-[100]">
                  <div className="mx-auto px-8 pt-4 pb-8 max-h-[450px] overflow-y-auto w-full">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-4">
                      <h3 className="text-xl font-bold text-gray-900">All Brands A-Z</h3>
                      <div className="flex gap-2 invisible md:visible flex-wrap">
                        {alphabetKeys.map(letter => (
                          <a key={letter} href={`#brand-${letter}`} className="text-xs font-bold text-gray-400 hover:text-[#3B5D3B] py-1 px-2">{letter}</a>
                        ))}
                      </div>
                    </div>

                    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-8">
                      {alphabetKeys.map(letter => (
                        <div key={letter} id={`brand-${letter}`} className="break-inside-avoid mb-8 scroll-mt-6">
                          <h4 className="text-[18px] font-black text-black mb-3 inline-block px-1 min-w-[30px]">{letter}</h4>
                          <ul className="space-y-2 flex flex-col">
                            {groupedBrands[letter].map(brand => (
                              <li key={brand}>
                                <Link
                                  href={`/${country}/products?brand=${encodeURIComponent(brand)}`}
                                  className="text-[13px] text-gray-600 font-medium hover:text-[#FF0000] transition-all block truncate"
                                >
                                  {brand}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center h-full text-[13px] font-bold tracking-wide shrink-0 ml-4">
            <div className="h-4 w-[1px] bg-gray-200 self-center mx-3" />
            <Link href={`/${country}/products?bestSeller=true`} className="text-gray-900 hover:text-[#FF0000] h-full flex items-center">Best Sellers</Link>
            <div className="h-4 w-[1px] bg-gray-200 self-center mx-3" />
            <Link href={`/${country}/products?newArrival=true`} className="text-[#FF0000] font-bold h-full flex items-center gap-1.5 group">
              <span className="flex h-2 w-2 rounded-full bg-[#FF0000] animate-promo-blink shadow-[0_0_8px_rgba(255,0,0,0.5)]"></span>
              New Arrivals
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
