'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, Supplier, Product } from '@/lib/api';

interface POItem {
    product_id: number;
    sn: number;
    quantity: number;
    rate: number;
}

export default function CreateImportPOPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    const [formData, setFormData] = useState({
        supplier_id: '',
        payment_terms: '',
        origin: '',
        payment_type: 'DA',
        dispatched_from: '',
        dispatched_in: '',
        validity_indent: '',
    });

    const [items, setItems] = useState<POItem[]>([
        { product_id: 0, sn: 1, quantity: 0, rate: 0 }
    ]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [suppliersData, productsData] = await Promise.all([
                    apiClient.getSuppliers('import'),
                    apiClient.getProducts()
                ]);
                setSuppliers(suppliersData);
                setProducts(productsData);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, []);

    const handleItemChange = (index: number, field: keyof POItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, {
            product_id: 0,
            sn: items.length + 1,
            quantity: 0,
            rate: 0
        }]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            const newItems = items.filter((_, i) => i !== index).map((item, i) => ({
                ...item,
                sn: i + 1
            }));
            setItems(newItems);
        }
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!formData.supplier_id) {
                alert('Please select a supplier');
                return;
            }

            const validItems = items.filter(item => item.product_id && item.quantity > 0);
            if (validItems.length === 0) {
                alert('Please add at least one valid item');
                return;
            }

            await apiClient.createImportPurchaseOrder({
                ...formData,
                supplier_id: parseInt(formData.supplier_id),
                items: validItems
            });

            router.push('/purchase-orders');
        } catch (error) {
            console.error('Error creating PO:', error);
            alert('Failed to create purchase order');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Create Import Purchase Order
                </h1>
                <p className="text-gray-600">Create a new purchase order for import suppliers</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header Details */}
                <div className="card">
                    <h2 className="text-xl font-semibold mb-4">Order Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">Supplier *</label>
                            <select
                                required
                                className="input"
                                value={formData.supplier_id}
                                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                            >
                                <option value="">Select Supplier</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Origin</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.origin}
                                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Payment Terms</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.payment_terms}
                                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Payment Type</label>
                            <select
                                className="input"
                                value={formData.payment_type}
                                onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
                            >
                                <option value="DA">DA</option>
                                <option value="F_Payment">F Payment</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Dispatched From</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.dispatched_from}
                                onChange={(e) => setFormData({ ...formData, dispatched_from: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Dispatched In</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.dispatched_in}
                                onChange={(e) => setFormData({ ...formData, dispatched_in: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Validity Indent</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.validity_indent}
                                onChange={(e) => setFormData({ ...formData, validity_indent: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Items */}
                <div className="card">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Order Items</h2>
                        <button type="button" onClick={addItem} className="btn btn-primary text-sm">
                            + Add Item
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-gray-200">
                                    <th className="pb-2 w-16">SN#</th>
                                    <th className="pb-2">Product</th>
                                    <th className="pb-2 w-32">Qty</th>
                                    <th className="pb-2 w-32">Rate</th>
                                    <th className="pb-2 w-32">Total</th>
                                    <th className="pb-2 w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.map((item, index) => (
                                    <tr key={index}>
                                        <td className="py-2">{item.sn}</td>
                                        <td className="py-2">
                                            <select
                                                required
                                                className="input py-1"
                                                value={item.product_id}
                                                onChange={(e) => handleItemChange(index, 'product_id', parseInt(e.target.value))}
                                            >
                                                <option value={0}>Select Product</option>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="py-2">
                                            <input
                                                type="number"
                                                min="1"
                                                required
                                                className="input py-1"
                                                value={item.quantity || ''}
                                                onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                            />
                                        </td>
                                        <td className="py-2">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                required
                                                className="input py-1"
                                                value={item.rate || ''}
                                                onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                                            />
                                        </td>
                                        <td className="py-2 font-medium">
                                            {(item.quantity * item.rate).toFixed(2)}
                                        </td>
                                        <td className="py-2 text-right">
                                            {items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t border-gray-200">
                                    <td colSpan={4} className="py-4 text-right font-bold">Total Amount:</td>
                                    <td className="py-4 font-bold text-lg text-blue-600">
                                        {calculateTotal().toFixed(2)}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
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
                        disabled={loading}
                        className="btn btn-primary"
                    >
                        {loading ? 'Creating...' : 'Create Purchase Order'}
                    </button>
                </div>
            </form>
        </div>
    );
}
