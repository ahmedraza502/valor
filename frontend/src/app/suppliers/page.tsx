'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient, Supplier } from '@/lib/api';

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'local' | 'import'>('all');

    useEffect(() => {
        fetchSuppliers();
    }, [filter]);

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getSuppliers(filter === 'all' ? undefined : filter);
            setSuppliers(data);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Suppliers
                    </h1>
                    <p className="text-gray-600">Manage your local and import suppliers</p>
                </div>
                <Link href="/suppliers/create">
                    <button className="btn btn-primary">
                        <span className="text-lg">➕</span>
                        Add Supplier
                    </button>
                </Link>
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div className="flex gap-4">
                    <button
                        onClick={() => setFilter('all')}
                        className={`btn ${filter === 'all' ? 'btn-primary' : 'bg-gray-200 text-gray-700'}`}
                    >
                        All Suppliers
                    </button>
                    <button
                        onClick={() => setFilter('local')}
                        className={`btn ${filter === 'local' ? 'btn-primary' : 'bg-gray-200 text-gray-700'}`}
                    >
                        Local
                    </button>
                    <button
                        onClick={() => setFilter('import')}
                        className={`btn ${filter === 'import' ? 'btn-primary' : 'bg-gray-200 text-gray-700'}`}
                    >
                        Import
                    </button>
                </div>
            </div>

            {/* Suppliers List */}
            {loading ? (
                <div className="card text-center py-12">
                    <div className="text-4xl mb-4">⏳</div>
                    <p className="text-gray-600">Loading suppliers...</p>
                </div>
            ) : suppliers.length === 0 ? (
                <div className="card text-center py-12">
                    <div className="text-6xl mb-4">📭</div>
                    <h3 className="text-xl font-semibold mb-2">No suppliers found</h3>
                    <p className="text-gray-600 mb-6">Get started by adding your first supplier</p>
                    <Link href="/suppliers/create">
                        <button className="btn btn-primary">
                            <span className="text-lg">➕</span>
                            Add Supplier
                        </button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {suppliers.map((supplier) => (
                        <div key={supplier.id} className="card">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="text-3xl">🏢</div>
                                    <div>
                                        <h3 className="font-bold text-lg">{supplier.name}</h3>
                                        <span className={`badge ${supplier.supplier_type === 'local' ? 'badge-info' : 'badge-warning'}`}>
                                            {supplier.supplier_type}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                {supplier.contact_person && (
                                    <p className="text-gray-600">
                                        <span className="font-medium">Contact:</span> {supplier.contact_person}
                                    </p>
                                )}
                                {supplier.email && (
                                    <p className="text-gray-600">
                                        <span className="font-medium">Email:</span> {supplier.email}
                                    </p>
                                )}
                                {supplier.phone && (
                                    <p className="text-gray-600">
                                        <span className="font-medium">Phone:</span> {supplier.phone}
                                    </p>
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                                <Link href={`/suppliers/${supplier.id}`} className="flex-1">
                                    <button className="btn btn-primary w-full text-sm">View Details</button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
