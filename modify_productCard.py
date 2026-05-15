import re

with open("c:\\Users\\Sweta Shukla\\Desktop\\VEDASHI\\Storefront-Vedashi\\components\\ProductCard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Remove GSAP import
content = re.sub(r"import\s*\{\s*gsap\s*\}\s*from\s*['\"]gsap['\"];\n", "", content)

# 2. Remove the GSAP useEffect
gsap_effect_pattern = r"// ─── Multi-layer GSAP timeline ────────────────────────────────────────────\s*useEffect\(\(\) => \{.*?(?:(?!\n    \}, \[showInlineOptions, isList\]\);\n)[\s\S])*\n    \}, \[showInlineOptions, isList\]\);\n"
content = re.sub(gsap_effect_pattern, "", content)

# 3. Replace inlineOptionsRef wrapper
wrapper_search = """            <div
                ref={inlineOptionsRef}
                className="relative h-full flex-shrink-0 overflow-hidden"
                style={{ width: 0, clipPath: 'inset(0 100% 0 0 round 12px)' }}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >"""
wrapper_replace = """            <div
                ref={inlineOptionsRef}
                className={`relative h-full flex-shrink-0 overflow-hidden transition-all duration-500 ease-in-out ${showInlineOptions ? 'w-[344px] [clip-path:inset(0_0%_0_0_round_0px)] opacity-100' : 'w-0 [clip-path:inset(0_100%_0_0_round_12px)] opacity-0'}`}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >"""
content = content.replace(wrapper_search, wrapper_replace)

# 4. Replace borderLineRef
border_search = """                <div
                    ref={borderLineRef}
                    className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#FF0000] via-[#ff4d4d] to-transparent rounded-b"
                    style={{ transform: 'scaleX(0)', transformOrigin: 'left center' }}
                />"""
border_replace = """                <div
                    ref={borderLineRef}
                    className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#FF0000] via-[#ff4d4d] to-transparent rounded-b transition-transform duration-500 origin-left delay-75 ${showInlineOptions ? 'scale-x-100' : 'scale-x-0'}`}
                />"""
content = content.replace(border_search, border_replace)

# 5. Replace inlineContentRef
content_search = """                <div
                    ref={inlineContentRef}
                    className="relative w-[320px] h-full flex flex-col py-3 px-4"
                    style={{ opacity: 0 }}
                >"""
content_replace = """                <div
                    ref={inlineContentRef}
                    className={`relative w-[320px] h-full flex flex-col py-3 px-4 transition-all duration-500 delay-100 ${showInlineOptions ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}
                >"""
content = content.replace(content_search, content_replace)

# 6. Add stagger logic to variant buttons
# First we need to get the map index: {variants.map((v: ProductVariant) => { => {variants.map((v: ProductVariant, i: number) => {
content = content.replace("{variants.map((v: ProductVariant) => {", "{variants.map((v: ProductVariant, i: number) => {")

button_search = """                                        <button
                                            key={v.variant_id}
                                            data-variant-btn
                                            onClick={() => {"""

button_replace = """                                        <button
                                            key={v.variant_id}
                                            data-variant-btn
                                            style={{ transitionDelay: showInlineOptions ? `${i * 50 + 150}ms` : '0ms' }}
                                            onClick={() => {"""
content = content.replace(button_search, button_replace)

# Modify button class to include transition styles for the stagger
# Find the button className wrapper
class_search = """                                                overflow-hidden group
                                                ${isSelected
                                                    ? 'bg-[#FF0000] shadow-[0_3px_12px_rgba(255,0,0,0.28)] scale-[1.01]'
                                                    : isDisabled
                                                        ? 'bg-gray-50 opacity-40 cursor-not-allowed'
                                                        : 'bg-white border border-gray-100 hover:border-[#FF0000]/25 hover:bg-[#fff5f5] hover:shadow-sm'
                                                }
                                            `}"""
class_replace = """                                                overflow-hidden group
                                                ${showInlineOptions ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-3 opacity-0 scale-95'}
                                                ${isSelected
                                                    ? 'bg-[#FF0000] shadow-[0_3px_12px_rgba(255,0,0,0.28)] scale-[1.01]'
                                                    : isDisabled
                                                        ? 'bg-gray-50 opacity-40 cursor-not-allowed'
                                                        : 'bg-white border border-gray-100 hover:border-[#FF0000]/25 hover:bg-[#fff5f5] hover:shadow-sm'
                                                }
                                            `}"""
content = content.replace(class_search, class_replace)

with open("c:\\Users\\Sweta Shukla\\Desktop\\VEDASHI\\Storefront-Vedashi\\components\\ProductCard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
