'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calculator, Settings, Network } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const tabs = [
    { name: 'Calculadora', href: '/', icon: Calculator },
    { name: 'Regras & Pesos', href: '/admin', icon: Settings },
    { name: 'Integrações', href: '/integrations', icon: Network },
];

export function Navigation() {
    const pathname = usePathname();

    return (
        <nav className="bg-white border-b border-gold-200 shadow-sm sticky top-0 z-50">
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex space-x-1 md:space-x-8 h-16 items-center overflow-x-auto">
                    <div className="font-bold text-xl text-gold-600 mr-4 md:mr-8 whitespace-nowrap">Score Weddings</div>
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = pathname === tab.href;
                        return (
                            <Link
                                key={tab.name}
                                href={tab.href}
                                className={twMerge(
                                    'flex items-center px-3 py-2 text-sm font-medium border-b-2 transition-colors duration-200 whitespace-nowrap',
                                    isActive
                                        ? 'border-gold-500 text-gold-600'
                                        : 'border-transparent text-gray-500 hover:text-gold-500 hover:border-gold-300'
                                )}
                            >
                                <Icon className="w-4 h-4 mr-2" />
                                {tab.name}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
