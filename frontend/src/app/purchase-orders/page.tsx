'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient, PurchaseOrder } from '@/lib/api';

export default function PurchaseOrdersPage() {
    const [pos, setPos] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'local' | 'import'>('all');

    useEffect(() => {
        fetchPOs();
    }, [filter]);

    const fetchPOs = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getPurchaseOrders(filter === 'all' ? undefined : filter);
            setPos(data);
        } catch (error) {
            console.error('Error fetching POs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return 'badge-warning';
            case 'qc_inspection': return 'badge-info';
            case 'completed': return 'badge-success';
            case 'partially_rejected': return 'badge-danger';
            default: return 'badge-info';
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                        Purchase Orders
                    </h1>
                    <p className="text-gray-600">Manage local and import purchase orders</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/purchase-orders/create/local">
                        <button className="btn btn-primary">
                            <span className="text-lg">➕</span>
                            Local PO
                        </button>
                    </Link>
                    <Link href="/purchase-orders/create/import">
                        <button className="btn btn-secondary">
                            <span className="text-lg">🌍</span>
                            Import PO
                        </button>
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div className="flex gap-4">
                    <button
                        onClick={() => setFilter('all')}
                        className={`btn ${filter === 'all' ? 'btn-primary' : 'bg-gray-200 text-gray-700'}`}
                    >
                        All Orders
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

            {loading ? (
                <div className="card text-center py-12">
                    <div className="text-4xl mb-4">⏳</div>
                    <p className="text-gray-600">Loading purchase orders...</p>
                </div>
            ) : pos.length === 0 ? (
                <div className="card text-center py-12">
                    <div className="text-6xl mb-4">📝</div>
                    <h3 className="text-xl font-semibold mb-2">No purchase orders found</h3>
                    <p className="text-gray-600 mb-6">Create your first purchase order</p>
                    <div className="flex gap-3 justify-center">
                        <Link href="/purchase-orders/create/local">
                            <button className="btn btn-primary">Local PO</button>
                        </Link>
                        <Link href="/purchase-orders/create/import">
                            <button className="btn btn-secondary">Import PO</button>
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid gap-6">
                    {pos.map((po) => (
                        <div key={po.id} className="card hover:shadow-md transition-shadow">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-bold">{po.po_number}</h3>
                                        <span className={`badge ${getStatusBadge(po.status)}`}>
                                            {po.status.replace('_', ' ')}
                                        </span>
                                        <span className={`badge ${po.supplier_type === 'local' ? 'badge-info' : 'badge-warning'}`}>
                                            {po.supplier_type}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 mb-1">
                                        <span className="font-medium">Supplier:</span> {po.supplier.name}
                                    </p>
                                    <p className="text-gray-600">
                                        <span className="font-medium">Date:</span> {new Date(po.created_at).toLocaleDateString()}
                                    </p>
                                </div>

                                <div className="flex flex-col items-end justify-between">
                                    <div className="text-right mb-4">
                                        <p className="text-sm text-gray-500">Total Amount</p>
                                        <p className="text-2xl font-bold text-blue-600">
                                            {po.total_amount.toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        {po.status === 'pending' && (
                                            <Link href={`/qc-reports/create/${po.id}`}>
                                                <button className="btn btn-success text-sm">
                                                    🔍 QC Inspect
                                                </button>
                                            </Link>
                                        )}
                                        <Link href={`/purchase-orders/${po.id}`}>
                                            <button className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm">
                                                View Details
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
