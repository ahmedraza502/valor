'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient, Supplier, PurchaseOrder, QCReport } from '@/lib/api';

export default function SupplierDetailPage() {
    const router = useRouter();
    const params = useParams();
    const supplierId = parseInt(params.id as string);

    const [loading, setLoading] = useState(true);
    const [supplier, setSupplier] = useState<Supplier | null>(null);
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [qcReports, setQcReports] = useState<{ [key: number]: QCReport }>({});

    useEffect(() => {
        fetchSupplierData();
    }, [supplierId]);

    const fetchSupplierData = async () => {
        try {
            setLoading(true);
            
            // Fetch supplier details
            const supplierData = await apiClient.getSupplier(supplierId);
            setSupplier(supplierData);

            // Fetch purchase orders for this supplier
            const poData = await apiClient.getPurchaseOrders(supplierData.supplier_type);
            const supplierPOs = poData.filter(po => po.supplier_id === supplierId);
            setPurchaseOrders(supplierPOs);

            // Fetch QC reports for inspected POs
            const qcData: { [key: number]: QCReport } = {};
            for (const po of supplierPOs) {
                if (po.status !== 'pending') {
                    try {
                        const qcReport = await apiClient.getQCReportByPO(po.id);
                        qcData[po.id] = qcReport;
                    } catch (error) {
                        // QC report might not exist
                    }
                }
            }
            setQcReports(qcData);
        } catch (error) {
            console.error('Error fetching supplier data:', error);
            alert('Failed to fetch supplier details');
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

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!supplier) return <div className="p-8 text-center">Supplier not found</div>;

    return (
        <div className="max-w-6xl mx-auto animate-fade-in">
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                    <button
                        onClick={() => router.back()}
                        className="btn bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                        ← Back
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Supplier Details
                        </h1>
                        <p className="text-gray-600">{supplier.name}</p>
                    </div>
                </div>
            </div>

            {/* Supplier Information */}
            <div className="card mb-6">
                <h2 className="text-xl font-semibold mb-4">Supplier Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-500">Supplier Name</p>
                                <p className="font-medium">{supplier.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Supplier Type</p>
                                <span className={`badge ${supplier.supplier_type === 'local' ? 'badge-info' : 'badge-warning'}`}>
                                    {supplier.supplier_type}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Contact Person</p>
                                <p className="font-medium">{supplier.contact_person || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="font-medium">{supplier.email || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Phone</p>
                                <p className="font-medium">{supplier.phone || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Address</p>
                                <p className="font-medium">{supplier.address || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Purchase Orders */}
            <div className="card">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Purchase Orders ({purchaseOrders.length})</h2>
                    <Link href="/purchase-orders/create">
                        <button className="btn btn-primary text-sm">
                            ➕ Create New PO
                        </button>
                    </Link>
                </div>

                {purchaseOrders.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="text-4xl mb-4">📝</div>
                        <h3 className="text-lg font-semibold mb-2">No Purchase Orders</h3>
                        <p className="text-gray-600">No purchase orders found for this supplier</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {purchaseOrders.map((po) => {
                            const qcReport = qcReports[po.id];
                            return (
                                <div key={po.id} className="border border-gray-200 rounded-lg p-4">
                                    {/* PO Header */}
                                    <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-bold">{po.po_number}</h3>
                                                <span className={`badge ${getStatusBadge(po.status)}`}>
                                                    {po.status.replace('_', ' ')}
                                                </span>
                                                <span className={`badge ${po.supplier_type === 'local' ? 'badge-info' : 'badge-warning'}`}>
                                                    {po.supplier_type}
                                                </span>
                                            </div>
                                            <p className="text-gray-600">
                                                <span className="font-medium">Date:</span> {new Date(po.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">Total Amount</p>
                                            <p className="text-xl font-bold text-blue-600">
                                                {po.total_amount.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Order Items */}
                                    <div className="mb-4">
                                        <h4 className="font-semibold mb-2">Order Items</h4>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="text-left border-b border-gray-200">
                                                        <th className="pb-2">Product</th>
                                                        <th className="pb-2 w-20">Qty</th>
                                                        <th className="pb-2 w-20">Rate</th>
                                                        <th className="pb-2 w-20">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {po.items.map((item, index) => (
                                                        <tr key={index} className="border-b border-gray-100">
                                                            <td className="py-2">
                                                                <div>
                                                                    <p className="font-medium">{item.product?.name || 'Product'}</p>
                                                                    {item.product?.manufacturer && (
                                                                        <p className="text-xs text-gray-500">{item.product.manufacturer}</p>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="py-2">{item.quantity}</td>
                                                            <td className="py-2">{item.rate.toFixed(2)}</td>
                                                            <td className="py-2 font-medium">
                                                                {(item.quantity * item.rate).toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* QC Results (if available) */}
                                    {qcReport && (
                                        <div className="border-t border-gray-200 pt-4">
                                            <h4 className="font-semibold mb-3">QC Inspection Results</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Accepted Items */}
                                                <div className="bg-green-50 rounded-lg p-3">
                                                    <h5 className="text-green-700 font-semibold mb-2">✅ Accepted Items</h5>
                                                    <div className="space-y-1 text-sm">
                                                        <div className="flex justify-between">
                                                            <span>Total Quantity:</span>
                                                            <span className="font-bold text-green-600">{qcReport.total_accepted_qty}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Total Price:</span>
                                                            <span className="font-bold text-green-600">{qcReport.total_accepted_value.toLocaleString()}</span>
                                                        </div>
                                                        
                                                        {qcReport.items.filter(item => item.accepted_qty > 0).length > 0 && (
                                                            <div className="mt-2 space-y-1">
                                                                <p className="text-xs font-medium text-gray-600">Items:</p>
                                                                {qcReport.items
                                                                    .filter(item => item.accepted_qty > 0)
                                                                    .map((item, index) => {
                                                                        const poItem = po.items.find(poItem => poItem.id === item.po_item_id);
                                                                        return (
                                                                            <div key={index} className="text-xs bg-white rounded p-1">
                                                                                <div className="flex justify-between">
                                                                                    <span>{poItem?.product?.name || 'Product'}</span>
                                                                                    <span className="text-green-600">Qty: {item.accepted_qty} @ {poItem?.rate.toFixed(2)}</span>
                                                                                </div>
                                                                                <div className="text-xs text-gray-500">
                                                                                    Price: {item.accepted_value.toFixed(2)}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Rejected Items */}
                                                <div className="bg-red-50 rounded-lg p-3">
                                                    <h5 className="text-red-700 font-semibold mb-2">❌ Rejected Items</h5>
                                                    <div className="space-y-1 text-sm">
                                                        <div className="flex justify-between">
                                                            <span>Total Quantity:</span>
                                                            <span className="font-bold text-red-600">{qcReport.total_rejected_qty}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Total Price:</span>
                                                            <span className="font-bold text-red-600">{qcReport.total_rejected_value.toLocaleString()}</span>
                                                        </div>
                                                        
                                                        {qcReport.items.filter(item => item.rejected_qty > 0).length > 0 && (
                                                            <div className="mt-2 space-y-1">
                                                                <p className="text-xs font-medium text-gray-600">Items:</p>
                                                                {qcReport.items
                                                                    .filter(item => item.rejected_qty > 0)
                                                                    .map((item, index) => {
                                                                        const poItem = po.items.find(poItem => poItem.id === item.po_item_id);
                                                                        return (
                                                                            <div key={index} className="text-xs bg-white rounded p-1">
                                                                                <div className="flex justify-between">
                                                                                    <span>{poItem?.product?.name || 'Product'}</span>
                                                                                    <span className="text-red-600">Qty: {item.rejected_qty} @ {poItem?.rate.toFixed(2)}</span>
                                                                                </div>
                                                                                <div className="text-xs text-gray-500">
                                                                                    Price: {item.rejected_value.toFixed(2)}
                                                                                </div>
                                                                                {item.rejection_reason && (
                                                                                    <div className="text-xs text-red-600 italic mt-1">
                                                                                        Reason: {item.rejection_reason}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2 mt-4">
                                        <Link href={`/purchase-orders/${po.id}`}>
                                            <button className="btn btn-primary text-sm">
                                                View Details
                                            </button>
                                        </Link>
                                        {po.status === 'pending' && (
                                            <Link href={`/qc-reports/create/${po.id}`}>
                                                <button className="btn btn-success text-sm">
                                                    🔍 QC Inspect
                                                </button>
                                            </Link>
                                        )}
                                        {po.status !== 'pending' && (
                                            <Link href={`/receipts/create/${po.id}`}>
                                                <button className="btn bg-orange-100 hover:bg-orange-200 text-orange-700 text-sm">
                                                    🧾 Generate Receipt
                                                </button>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
