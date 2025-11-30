'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface NavItem {
    name: string;
    href: string;
    icon: string;
}

const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'Suppliers', href: '/suppliers', icon: '🏢' },
    { name: 'Products', href: '/products', icon: '📦' },
    { name: 'Purchase Orders', href: '/purchase-orders', icon: '📝' },
    { name: 'QC Reports', href: '/qc-reports', icon: '✅' },
    { name: 'Receipts', href: '/receipts', icon: '🧾' },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 min-h-screen bg-[var(--sidebar-bg)] text-white flex flex-col animate-slide-in">
            {/* Logo */}
            <div className="p-6 border-b border-gray-700">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Pharma Factory
                </h1>
                <p className="text-sm text-gray-400 mt-1">Management System</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg'
                                    : 'hover:bg-[var(--sidebar-hover)]'
                                }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-700">
                <div className="text-xs text-gray-400 text-center">
                    <p>Procurement Module v1.0</p>
                    <p className="mt-1">© 2025 Pharma Factory</p>
                </div>
            </div>
        </aside>
    );
}
