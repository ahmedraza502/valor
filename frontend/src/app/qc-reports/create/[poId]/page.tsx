'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient, PurchaseOrder } from '@/lib/api';

interface QCItem {
    po_item_id: number;
    status: 'accepted' | 'rejected';
    accepted_qty: number;
    rejected_qty: number;
    rejection_reason: string;
    remarks: string;
}

export default function CreateQCReportPage() {
    const router = useRouter();
    const params = useParams();
    const poId = parseInt(params.poId as string);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [po, setPo] = useState<PurchaseOrder | null>(null);
    const [inspectorName, setInspectorName] = useState('');
    const [remarks, setRemarks] = useState('');
    const [items, setItems] = useState<QCItem[]>([]);

    useEffect(() => {
        fetchPO();
    }, [poId]);

    const fetchPO = async () => {
        try {
            const data = await apiClient.getPurchaseOrder(poId);
            setPo(data);
            // Initialize QC items
            setItems(data.items.map(item => ({
                po_item_id: item.id!,
                status: 'accepted',
                accepted_qty: item.quantity,
                rejected_qty: 0,
                rejection_reason: '',
                remarks: ''
            })));
        } catch (error) {
            console.error('Error fetching PO:', error);
            alert('Failed to fetch purchase order');
        } finally {
            setLoading(false);
        }
    };

    const handleItemChange = (index: number, field: keyof QCItem, value: any) => {
        const newItems = [...items];
        const item = newItems[index];

        if (field === 'accepted_qty') {
            const qty = parseFloat(value) || 0;
            const poItem = po!.items[index];
            if (qty <= poItem.quantity) {
                item.accepted_qty = qty;
                item.rejected_qty = poItem.quantity - qty;
                item.status = item.rejected_qty > 0 ? 'rejected' : 'accepted';
            }
        } else if (field === 'rejected_qty') {
            const qty = parseFloat(value) || 0;
            const poItem = po!.items[index];
            if (qty <= poItem.quantity) {
                item.rejected_qty = qty;
                item.accepted_qty = poItem.quantity - qty;
                item.status = qty > 0 ? 'rejected' : 'accepted';
            }
        } else {
            (item as any)[field] = value;
        }

        setItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inspectorName) {
            alert('Please enter inspector name');
            return;
        }

        setSubmitting(true);
        try {
            await apiClient.createQCReport({
                purchase_order_id: poId,
                inspector_name: inspectorName,
                remarks: remarks,
                items: items
            });
            router.push('/qc-reports');
        } catch (error) {
            console.error('Error creating QC report:', error);
            alert('Failed to create QC report');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!po) return <div className="p-8 text-center">Purchase Order not found</div>;

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    QC Inspection
                </h1>
                <p className="text-gray-600">Inspect items for PO: {po.po_number}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header Details */}
                <div className="card">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">Inspector Name *</label>
                            <input
                                type="text"
                                required
                                className="input"
                                value={inspectorName}
                                onChange={(e) => setInspectorName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">General Remarks</label>
                            <input
                                type="text"
                                className="input"
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Items Inspection */}
                <div className="card">
                    <h2 className="text-xl font-semibold mb-4">Items Inspection</h2>
                    <div className="space-y-6">
                        {po.items.map((poItem, index) => (
                            <div key={poItem.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                                <div className="flex justify-between mb-4">
                                    <h3 className="font-bold text-lg">{poItem.product?.name}</h3>
                                    <div className="text-sm text-gray-600">
                                        Ordered Qty: <span className="font-bold">{poItem.quantity}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Accepted Qty</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max={poItem.quantity}
                                            className="input"
                                            value={items[index].accepted_qty}
                                            onChange={(e) => handleItemChange(index, 'accepted_qty', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Rejected Qty</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max={poItem.quantity}
                                            className="input"
                                            value={items[index].rejected_qty}
                                            onChange={(e) => handleItemChange(index, 'rejected_qty', e.target.value)}
                                        />
                                    </div>

                                    {items[index].rejected_qty > 0 && (
                                        <div className="col-span-2 space-y-4 animate-fade-in">
                                            <div>
                                                <label className="block text-sm font-medium mb-1 text-red-600">Rejection Reason *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="input border-red-300 focus:border-red-500"
                                                    value={items[index].rejection_reason}
                                                    onChange={(e) => handleItemChange(index, 'rejection_reason', e.target.value)}
                                                    placeholder="Why was this rejected?"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium mb-1">Item Remarks</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={items[index].remarks}
                                            onChange={(e) => handleItemChange(index, 'remarks', e.target.value)}
                                            placeholder="Optional remarks"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="btn bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="btn btn-success"
                    >
                        {submitting ? 'Submitting...' : 'Submit QC Report'}
                    </button>
                </div>
            </form>
        </div>
    );
}
