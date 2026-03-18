import re

with open("components/ProductCard.tsx", "r", encoding="utf-8") as f:
    text = f.read()

# 1. Update GSAP hook
old_gsap = """    useEffect(() => {
        if (!inlineOptionsRef.current || !isList) return;
        
        if (showInlineOptions) {
            gsap.to(inlineOptionsRef.current, {
                width: 330,
                opacity: 1,
                paddingLeft: 12,
                paddingRight: 12,
                duration: 0.5,
                ease: 'expo.out'
            });
        } else {
            gsap.to(inlineOptionsRef.current, {
                width: 0,
                opacity: 0,
                paddingLeft: 0,
                paddingRight: 0,
                duration: 0.4,
                ease: 'power3.in'
            });
        }
    }, [showInlineOptions, isList]);"""

new_gsap = """    useEffect(() => {
        if (!inlineOptionsRef.current || !isList) return;
        
        if (showInlineOptions) {
            gsap.to(inlineOptionsRef.current, {
                x: '0%',
                duration: 0.4,
                ease: 'expo.out'
            });
        } else {
            gsap.to(inlineOptionsRef.current, {
                x: '100%',
                duration: 0.3,
                ease: 'power3.in'
            });
        }
    }, [showInlineOptions, isList]);"""
text = text.replace(old_gsap, new_gsap)


# 2. Update renderInlineOptions
start_idx = text.find("    const renderInlineOptions = () => {")
end_idx = text.find("    const renderCartModal = () => {")

if start_idx != -1 and end_idx != -1:
    new_render = """    const renderInlineOptions = () => {
        if (!isList) return null;
        return (
            <div
                ref={inlineOptionsRef}
                className="absolute right-0 top-0 bottom-0 z-30 flex flex-col bg-white border-l border-gray-100/80 shadow-[-10px_0_30px_rgba(0,0,0,0.03)] backdrop-blur-md bg-white/95"
                style={{ transform: 'translateX(100%)', width: '340px' }}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
                <div className="w-full h-full flex flex-col p-3 sm:p-4">
                    <div className="flex justify-between items-center mb-2 sm:mb-3 flex-shrink-0">
                        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-400">
                            Select Option
                        </p>
                        <button onClick={closeInlineOptions} className="text-gray-400 hover:text-gray-800 transition-colors cursor-pointer p-1 rounded-full hover:bg-gray-100">
                            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto min-h-0 pb-2 custom-scrollbar hidden-scroll" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {loadingVariants ? (
                            <div className="flex flex-col items-center justify-center h-full gap-2">
                                <Loader2 className="h-5 w-5 text-[#3d5c3a]/50 animate-spin-slow" />
                            </div>
                        ) : variants.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                {variants.map((v: any) => {
                                    const isSelected = selectedVariant?.variant_id === v.variant_id;
                                    const isInactive = v.status === 'Inactive' || v.is_active === false;
                                    const isOut = v.stock_quantity !== null && v.stock_quantity !== undefined && v.stock_quantity <= 0;
                                    const isDisabled = isOut || isInactive;
                                    const formatVolume = (ml: number) => {
                                        if (!ml) return '';
                                        return ml >= 999 ? `${(ml / 1000).toFixed(ml % 1000 === 0 ? 0 : 1)} L` : `${ml} ml`;
                                    };
                                    const formatWeight = (g: number) => {
                                        if (!g) return '';
                                        return g >= 1000 ? `${(g / 1000).toFixed(g % 1000 === 0 ? 0 : g % 100 === 0 ? 1 : 2)} kg` : `${Math.round(g)} g`;
                                    };
                                    
                                    const labelParts = [
                                        v.size_label,
                                        formatWeight(v.weight_g),
                                        formatVolume(v.volume_ml),
                                        v.units_count ? `${v.units_count} ${v.form_factor || 'Units'}` : '',
                                        v.strength ? `${v.strength} ${v.strength_unit || ''}`.trim() : '',
                                        v.flavor,
                                        v.pack_quantity > 1 ? `Pack of ${v.pack_quantity}` : ''
                                    ].filter(Boolean);
                                    const label = labelParts.join(' · ') || v.sku || 'Standard';

                                    return (
                                        <button
                                            key={v.variant_id}
                                            onClick={() => {
                                                if (!isDisabled) {
                                                    setSelectedVariant(v);
                                                    const existing = items.find(i => i.variant_id === v.variant_id);
                                                    setQuantity(existing ? existing.quantity : 1);
                                                }
                                            }}
                                            disabled={isDisabled}
                                            className={`relative flex flex-col items-start px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-lg border text-left transition-all duration-300 outline-none ${isSelected
                                                ? 'border-[#3d5c3a] bg-[#3d5c3a]/5 ring-1 ring-[#3d5c3a]/20'
                                                : isInactive || isOut
                                                    ? 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                                                    : 'border-gray-200 bg-white hover:border-[#3d5c3a]/40 hover:bg-gray-50/50'
                                                }`}
                                        >
                                            <span className={`text-[10px] sm:text-[11px] font-bold leading-tight ${isSelected ? 'text-[#3d5c3a]' : 'text-gray-700'}`}>{label}</span>
                                            <span className={`text-[9px] sm:text-[10px] font-semibold mt-0.5 ${isSelected ? 'text-[#3d5c3a]/80' : 'text-gray-500'}`}>{formatPrice(v.price)}</span>
                                            {isSelected && (
                                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#3d5c3a] rounded-full flex items-center justify-center">
                                                    <Check className="w-2 h-2 text-white" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-[10px] text-gray-400 text-center py-4">No options available.</p>
                        )}
                    </div>
                    
                    <div className="pt-2 sm:pt-3 border-t border-gray-100/80 flex-shrink-0">
                        {!isInCart ? (
                            <button
                                onClick={(e) => handleModalAddToCart(e)}
                                disabled={(hasVariants && !selectedVariant) || addingToCart || cartLoading || justAdded || (hasVariants && selectedVariant?.stock_quantity <= 0)}
                                className={`w-full py-2 sm:py-2.5 rounded-xl text-white text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${justAdded ? 'bg-[#2a4d2e]' : 'bg-[#3d5c3a] hover:bg-[#2d4a2a]'}`}
                            >
                                {addingToCart ? <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" /> : justAdded ? <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <ShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                                {addingToCart ? 'Processing...' : `Add to Cart - ${formatPrice((hasVariants ? (selectedVariant?.price ?? 0) : displayPrice) * quantity)}`}
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 bg-gray-50 p-1 sm:p-1.5 rounded-xl border border-gray-100">
                                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDecrement(); }} disabled={addingToCart} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-500 cursor-pointer">
                                    {currentItemInCart.quantity > 1 ? <Minus className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                                </button>
                                <div className="flex-1 text-center font-bold text-xs sm:text-sm text-[#3d5c3a]">{currentItemInCart.quantity}</div>
                                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleIncrement(); }} disabled={addingToCart} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-[#3d5c3a] text-white hover:bg-[#2d4a2a] cursor-pointer">
                                    <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };
"""
    text = text[:start_idx] + new_render + text[end_idx:]

if "className={`h-full overflow-hidden" in text:
    text = text.replace("className={`h-full overflow-hidden", "className={`h-full relative overflow-hidden")

with open("components/ProductCard.tsx", "w", encoding="utf-8") as f:
    f.write(text)
