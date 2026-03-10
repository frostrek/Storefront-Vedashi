'use client';

interface ToggleSwitchProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export default function ToggleSwitch({ label, checked, onChange }: ToggleSwitchProps) {
    return (
        <label className="flex items-center justify-between cursor-pointer group py-0.5">
            <span className="text-sm text-charcoal/70 group-hover:text-charcoal transition-colors">
                {label}
            </span>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-[22px] w-[40px] items-center rounded-full transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-burgundy focus-visible:ring-offset-2 ${checked ? 'bg-burgundy' : 'bg-warm-gray/30'
                    }`}
            >
                <span
                    className={`inline-block h-[16px] w-[16px] rounded-full bg-white shadow-sm transition-transform duration-300 ${checked ? 'translate-x-[21px]' : 'translate-x-[3px]'
                        }`}
                />
            </button>
        </label>
    );
}
