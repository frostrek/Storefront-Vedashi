import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

async function getPrivacyPolicy() {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/gdpr/policy/active`, { cache: 'no-store' });
        if (!res.ok) return null;
        const data = await res.json();
        return data.data; // { version, content, published_at }
    } catch {
        return null; // fallback
    }
}

export default async function PrivacyPolicyPage() {
    const policy = await getPrivacyPolicy();

    return (
        <div className="min-h-screen bg-cream flex flex-col">
            <div className="flex-1 max-w-4xl mx-auto px-4 py-16 w-full">
                <div className="bg-white rounded-2xl shadow-sm border border-light-border p-8 md:p-12">
                    <h1 className="text-3xl font-bold text-charcoal mb-4">Privacy & Cookie Policy</h1>

                    {policy ? (
                        <>
                            <div className="flex items-center gap-4 text-sm text-warm-gray mb-8 border-b border-light-border pb-6">
                                <span>Version: {policy.version}</span>
                                <span>|</span>
                                <span>Last Updated: {new Date(policy.published_at).toLocaleDateString()}</span>
                            </div>

                            <div
                                className="prose prose-emerald prose-a:text-burgundy max-w-none text-charcoal"
                                dangerouslySetInnerHTML={{ __html: policy.content.replace(/\n/g, '<br/>') }}
                            />
                        </>
                    ) : (
                        <div className="text-center py-16 text-warm-gray">
                            <p>Unable to load the current privacy policy. Please contact support.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
