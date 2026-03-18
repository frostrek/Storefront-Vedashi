import { Leaf } from 'lucide-react';

export default function MaintenancePage({ message }: { message?: string }) {
    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #1A1814 0%, #0F0D0A 100%)' }}>
            {/* Animated background pattern */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                {/* Radial glow */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                        width: '600px',
                        height: '600px',
                        background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)',
                    }}
                />
                {/* Decorative lines */}
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-full"
                    style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(212,175,55,0.08) 30%, rgba(212,175,55,0.08) 70%, transparent 100%)' }}
                />
            </div>

            <div className="relative z-10 text-center max-w-xl px-6">

                {/* Logo / Icon */}
                <div className="relative w-24 h-24 mx-auto mb-10">
                    <div
                        className="absolute inset-0 rounded-full"
                        style={{
                            background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.03))',
                            border: '1px solid rgba(212,175,55,0.15)',
                        }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Leaf style={{ width: '36px', height: '36px', color: '#D4AF37' }} />
                    </div>
                    {/* Pulse ring */}
                    <div
                        className="absolute inset-0 rounded-full animate-ping"
                        style={{
                            background: 'transparent',
                            border: '1px solid rgba(212,175,55,0.1)',
                            animationDuration: '3s',
                        }}
                    />
                </div>

                {/* Headline */}
                <h1 style={{
                    fontFamily: 'var(--font-roboto), Roboto, sans-serif',
                    fontSize: 'clamp(2rem, 5vw, 3rem)',
                    fontWeight: 700,
                    color: '#FAF7F2',
                    lineHeight: 1.3,
                    marginBottom: '8px',
                    letterSpacing: '-0.02em',
                }}>
                    We&apos;ll Be Back <br />
                    <span style={{ color: '#D4AF37', fontStyle: 'italic' }}>Shortly</span>
                </h1>

                {/* Separator */}
                <div className="flex items-center justify-center gap-4 my-8">
                    <div style={{ width: '60px', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4))' }} />
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#D4AF37', opacity: 0.5 }} />
                    <div style={{ width: '60px', height: '1px', background: 'linear-gradient(90deg, rgba(212,175,55,0.4), transparent)' }} />
                </div>

                {/* Message */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(45,41,38,0.5), rgba(30,27,24,0.5))',
                    border: '1px solid rgba(212,175,55,0.1)',
                    borderRadius: '16px',
                    padding: '24px 28px',
                    backdropFilter: 'blur(10px)',
                }}>
                    <p style={{
                        fontSize: '15px',
                        color: 'rgba(232,216,185,0.7)',
                        lineHeight: 1.7,
                        fontWeight: 300,
                    }}>
                        {message || "Our systems are currently undergoing scheduled maintenance to improve your experience. We appreciate your patience and will be back with ayurvedic wellness products shortly."}
                    </p>
                </div>

                {/* Footer info */}
                <div className="mt-12 space-y-4">
                    {/* Status badges */}
                    <div className="flex items-center justify-center gap-3">
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            background: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.15)',
                        }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#EF4444' }} className="animate-pulse" />
                            <span style={{ fontSize: '11px', color: '#EF4444', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                Maintenance Active
                            </span>
                        </div>
                    </div>

                    {/* Separator */}
                    <div style={{ width: '40px', height: '1px', backgroundColor: 'rgba(212,175,55,0.1)', margin: '0 auto' }} />

                    <p style={{
                        fontSize: '12px',
                        color: 'rgba(232,216,185,0.3)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.15em',
                        fontWeight: 500,
                    }}>
                        Vedashi Premium Wellness
                    </p>
                </div>
            </div>
        </div>
    );
}
