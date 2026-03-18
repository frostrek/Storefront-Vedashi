import React from 'react';

interface Block {
    type: 'heading' | 'paragraph';
    text: string;
}

interface LegalContentRendererProps {
    content: string;
}

export default function LegalContentRenderer({ content }: LegalContentRendererProps) {
    if (!content) {
        return <p className="text-gray-500 italic">Content is currently being updated. Please check back later.</p>;
    }

    try {
        const blocks = JSON.parse(content);
        if (Array.isArray(blocks) && blocks.length > 0 && blocks[0].type) {
            return (
                <div className="space-y-8">
                    {blocks.map((block: Block, idx: number) => (
                        <div key={idx}>
                            {block.type === 'heading' ? (
                                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mt-12 mb-6 first:mt-0">
                                    {block.text}
                                </h2>
                            ) : (
                                <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap mb-6 last:mb-0 text-left">
                                    {block.text}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            );
        }
    } catch (e) {
        // Fallback for legacy HTML content
    }

    return (
        <div 
            className="legal-rich-text max-w-none text-left"
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
}
