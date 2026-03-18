    import re

    with open("components/ProductCard.tsx", "r", encoding="utf-8") as f:
        text = f.read()

    # 1. Import gsap
    if "import { gsap }" not in text:
        text = text.replace("import Link from 'next/link';", "import Link from 'next/link';\nimport { gsap } from 'gsap';")

    # 2. Add State and Ref
    state_code = """
        const [justAdded, setJustAdded] = useState(false);
        const cardRef = useRef<HTMLDivElement>(null);
        const [showInlineOptions, setShowInlineOptions] = useState(false);
        const inlineOptionsRef = useRef<HTMLDivElement>(null);
    """
    text = re.sub(r'const \[justAdded, setJustAdded\] = useState\(false\);\s*const cardRef = useRef<HTMLDivElement>\(null\);', state_code.strip(), text)


    # 3. Add GSAP hook & handlers
    gsap_hooks_code = """
        const closeInlineOptions = useCallback((e?: React.MouseEvent) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            setShowInlineOptions(false);
        }, []);

        const isList = layout === 'list'; // Moved up for GSAP

        useEffect(() => {
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
        }, [showInlineOptions, isList]);
    """
    # insert before triggerAddedFeedback
    text = text.replace("const triggerAddedFeedback = useCallback(() => {", gsap_hooks_code + "\n    const triggerAddedFeedback = useCallback(() => {")

    # 4. click outside
    old_outside = """        const handleClickOutside = (event: MouseEvent) => {
                if (showCartModal && cardRef.current && !cardRef.current.contains(event.target as Node)) {
                    closeCartModal();
                }
            };

            if (showCartModal) {
                document.addEventListener('mousedown', handleClickOutside);
            }

            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };"""

    new_outside = """        const handleClickOutside = (event: MouseEvent) => {
                if (showCartModal && cardRef.current && !cardRef.current.contains(event.target as Node)) {
                    closeCartModal();
                }
                if (showInlineOptions && cardRef.current && !cardRef.current.contains(event.target as Node)) {
                    closeInlineOptions();
                }
            };

            if (showCartModal || showInlineOptions) {
                document.addEventListener('mousedown', handleClickOutside);
            }

            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };"""
    text = text.replace(old_outside, new_outside)
    text = text.replace("}, [showCartModal, closeCartModal]);", "}, [showCartModal, closeCartModal, showInlineOptions, closeInlineOptions]);")

    # 5. openCartModal update
    old_open = """        setShowCartModal(true);
            setIsClosing(false);

            if (variants.length > 0) {"""
    new_open = """        if (isList) {
                setShowInlineOptions(true);
            } else {
                setShowCartModal(true);
                setIsClosing(false);
            }

            if (variants.length > 0) {"""
    text = text.replace(old_open, new_open)

    # Remove the duplicated isList declaration later in the file
    text = text.replace("const isList = layout === 'list';", "", 1)


    # 6. Add renderInlineOptions
    inline_options_func = """
        const renderInlineOptions = () => {
            if (!isList) return null;
            return (
                <div
                    ref={inlineOptionsRef}
                    className="h-full flex flex-col border-l border-gray-100 overflow-hidden bg-white"
                    style={{ width: 0, opacity: 0, paddingLeft: 0, paddingRight: 0 }}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                >
                    <div className="w-[306px] h-full flex flex-col py-3">
                        <div className="flex justify-between items-center mb-3">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                Select Option
                            </p>
                            <button onClick={closeInlineOptions} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto max-h-[160px] custom-scrollbar pr-1 hidden-scroll">
                            {loadingVariants ? (
                                <div className="flex flex-col items-center justify-center py-6 gap-2">
                                    <Loader2 className="h-6 w-6 text-gray-300 animate-spin-slow" />
                                </div>
                            ) : variants.length > 0 ? (
                                <div className="grid grid-cols-1 gap-1.5">
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
                                        const volLabel = formatVolume(v.volume_ml);
                                        const weightLabel = formatWeight(v.weight_g);
                                        const countLabel = v.units_count ? `${v.units_count} ${v.form_factor || 'Units'}` : '';
                                        const strengthLabel = v.strength ? `${v.strength} ${v.strength_unit || ''}`.trim() : '';
                                        
                                        const labelParts = [
                                            v.size_label,
                                            weightLabel,
                                            volLabel,
                                            countLabel,
                                            strengthLabel,
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
                                                className={`w-full group relative flex items-center justify-between p-2 rounded-xl border-2 text-left transition-all duration-300 transform outline-none focus:ring-2 focus:ring-[#3d5c3a]/50 ${isSelected
                                                    ? 'border-[#3d5c3a] bg-[#3d5c3a]/[0.02] shadow-[0_2px_10px_rgba(61,92,58,0.1)]'
                                                    : isInactive
                                                        ? 'border-gray-100 bg-gray-50 text-gray-300 opacity-50 cursor-not-allowed'
                                                    : isOut
                                                        ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                                                        : 'border-gray-100 hover:border-[#3d5c3a]/30 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2 w-full pr-1">
                                                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${isSelected ? 'border-[#3d5c3a] bg-[#3d5c3a]' : 'border-gray-300'}`}>
                                                        <Check className={`h-2.5 w-2.5 text-white transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-[11px] font-semibold truncate ${isSelected ? 'text-[#3d5c3a]' : 'text-gray-900'}`}>{label}</p>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className={`text-[11px] font-bold ${isSelected ? 'text-[#3d5c3a]' : 'text-gray-900'}`}>{formatPrice(v.price)}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400 text-center py-4">No options available.</p>
                            )}
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            {!isInCart ? (
                                <button
                                    onClick={(e) => handleModalAddToCart(e)}
                                    disabled={(hasVariants && !selectedVariant) || addingToCart || cartLoading || justAdded || (hasVariants && selectedVariant?.stock_quantity <= 0)}
                                    className={`w-full py-2.5 rounded-xl text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${justAdded ? 'bg-[#2a4d2e]' : 'bg-[#3d5c3a] hover:bg-[#2d4a2a]'}`}
                                >
                                    {addingToCart ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : justAdded ? <Check className="h-3.5 w-3.5" /> : <ShoppingCart className="h-3.5 w-3.5" />}
                                    {addingToCart ? 'Processing...' : `Add to Cart • ${formatPrice((hasVariants ? (selectedVariant?.price ?? 0) : displayPrice) * quantity)}`}
                                </button>
                            ) : (
                                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDecrement(); }} disabled={addingToCart} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-500 cursor-pointer">
                                        {currentItemInCart.quantity > 1 ? <Minus className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                                    </button>
                                    <div className="flex-1 text-center font-bold text-sm text-[#3d5c3a]">{currentItemInCart.quantity}</div>
                                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleIncrement(); }} disabled={addingToCart} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#3d5c3a] text-white hover:bg-[#2d4a2a] cursor-pointer">
                                        <Plus className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        };
    """

    text = text.replace("    const renderCartModal = () => {", inline_options_func + "\n    const renderCartModal = () => {")

    # 7. Add inline options to JSX
    search_str = """                                        <Heart className={`h-4 w-4 sm:h-4 sm:w-4 ${wishlisted ? 'fill-[#3d5c3a] text-[#3d5c3a]' : 'text-gray-400'}`} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Link>"""

    replace_str = """                                        <Heart className={`h-4 w-4 sm:h-4 sm:w-4 ${wishlisted ? 'fill-[#3d5c3a] text-[#3d5c3a]' : 'text-gray-400'}`} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Inline Options (List View Only) */}
                            {isList && renderInlineOptions()}
                        </div>
                    </Link>"""

    text = text.replace(search_str, replace_str)

    # Disable the list view portal logic in renderCartModal since we are using inline now
    text = text.replace("if (isList && typeof document !== 'undefined') {", "if (false && isList && typeof document !== 'undefined') {")

    with open("components/ProductCard.tsx", "w", encoding="utf-8") as f:
        f.write(text)

    print("Modification complete.")
