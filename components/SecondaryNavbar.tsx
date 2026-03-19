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
}

export default function SecondaryNavbar() {
  const params = useParams();
  const country = params?.country || 'in';
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getCategories(),
      getFilterOptions()
    ]).then(([cats, filterOpt]) => {
      if (Array.isArray(cats)) {
        setCategories(cats);
      }
      if (filterOpt && filterOpt.brands) {
        setBrands(filterOpt.brands);
      }
      setLoading(false);
    }).catch(console.error);
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
      <div className="mx-auto max-w-[1600px] px-4">
        <div className="flex h-[46px] items-center justify-between text-[14px] font-bold text-gray-700">

          <div className="flex items-center gap-0 h-full overflow-x-auto no-scrollbar scroll-smooth">
            {/* Individual Categories */}
            {!loading && parentCategories.map(parent => {
              const subcats = categories.filter(c => c.parent_id === parent.category_id);
              return (
                <div key={parent.category_id} className="group/nav-item h-full flex items-center shrink-0">
                  <Link
                    href={`/products?category=${parent.slug}`}
                    className="flex items-center gap-1 h-full px-1.5 hover:text-[#3B5D3B] transition-colors cursor-pointer border-b-2 border-transparent group-hover/nav-item:border-[#3B5D3B]"
                  >
                    {parent.name}
                  </Link>

                  {/* Subcategories Dropdown (Mega Menu) */}
                  {subcats.length > 0 && (
                    <div className="absolute top-full left-0 w-full bg-white shadow-[0_10px_40px_rgba(0,0,0,0.1)] opacity-0 invisible group-hover/nav-item:opacity-100 group-hover/nav-item:visible transition-all duration-300 z-[100] border-t-[3px] border-[#3B5D3B]">
                      <div className="mx-auto max-w-[1600px] px-8 py-8 flex gap-8 min-h-[250px]">
                        <div className="w-1/4 border-r border-[#3B5D3B]/10 pr-6">
                          <h3 className="text-xl font-extrabold text-gray-900 mb-2">{parent.name}</h3>
                          <p className="text-sm text-gray-500 font-normal">Explore our collection of {parent.name.toLowerCase()}.</p>
                          <Link href={`/products?category=${parent.slug}`} className="text-[#3B5D3B] hover:underline mt-4 inline-block font-semibold">View All {parent.name}</Link>
                        </div>
                        <div className="w-3/4">
                          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-4">
                            {subcats.map(sub => (
                              <div key={sub.category_id} className="break-inside-avoid">
                                <Link
                                  href={`/products?category=${parent.slug}&sub_category=${sub.slug}`}
                                  className="text-[14px] text-gray-600 hover:text-[#3B5D3B] hover:translate-x-1 transition-all inline-block font-semibold py-1"
                                >
                                  {sub.name}
                                </Link>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Vertical Divider */}
            {!loading && parentCategories.length > 0 && (
              <div className="h-5 w-[1px] bg-gray-200 self-center shrink-0 mx-1" />
            )}

            {/* Brands A-Z Dropdown */}
            <div className="group/nav-item h-full flex items-center shrink-0">
              <span className="flex items-center gap-1 h-full px-1.5 text-[#3B5D3B] transition-colors cursor-pointer border-b-2 border-transparent group-hover/nav-item:border-[#3B5D3B]">
                Brands A-Z
              </span>

              {/* Brands Mega Dropdown */}
              {!loading && brands.length > 0 && (
                <div className="absolute top-full left-0 w-full bg-white shadow-[0_10px_40px_rgba(0,0,0,0.1)] opacity-0 invisible group-hover/nav-item:opacity-100 group-hover/nav-item:visible transition-all duration-300 z-[100] border-t-[3px] border-[#3B5D3B]">
                  <div className="mx-auto max-w-[1600px] px-8 py-8 max-h-[450px] overflow-y-auto w-full">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-6">
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
                          <h4 className="text-[18px] font-black text-[#3B5D3B] mb-3 border-b-2 border-[#3B5D3B] inline-block px-1 min-w-[30px]">{letter}</h4>
                          <ul className="space-y-2 flex flex-col">
                            {groupedBrands[letter].map(brand => (
                              <li key={brand}>
                                <Link
                                  href={`/products?brand=${encodeURIComponent(brand)}`}
                                  className="text-[13px] text-gray-600 font-medium hover:text-[#3B5D3B] hover:underline transition-all block truncate"
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

          <div className="flex items-center gap-6 h-full text-[13px] font-bold tracking-wide shrink-0 ml-4">
            <Link href={`/${country}/products?bestSellers=true`} className="text-gray-900 hover:text-[#3B5D3B] h-full flex items-center">Best Sellers</Link>
            <Link href={`/${country}/products?newArrivals=true`} className="text-gray-900 hover:text-[#3B5D3B] h-full flex items-center">New Arrivals</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
