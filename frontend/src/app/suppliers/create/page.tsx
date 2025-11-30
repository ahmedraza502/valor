'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

export default function CreateSupplierPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        supplier_type: 'local',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiClient.createSupplier(formData as any);
            router.push('/suppliers');
        } catch (error) {
            console.error('Error creating supplier:', error);
            alert('Failed to create supplier');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Add New Supplier
                </h1>
                <p className="text-gray-600">Register a new local or import supplier</p>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-2">Supplier Name *</label>
                            <input
                                type="text"
                                required
                                className="input"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Supplier Type *</label>
                            <select
                                className="input"
                                value={formData.supplier_type}
                                onChange={(e) => setFormData({ ...formData, supplier_type: e.target.value })}
                            >
                                <option value="local">Local</option>
                                <option value="import">Import</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Contact Person</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.contact_person}
                                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Email</label>
                            <input
                                type="email"
                                className="input"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Phone</label>
                            <input
                                type="tel"
                                className="input"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-2">Address</label>
                            <textarea
                                className="input h-24"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
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
                            {loading ? 'Creating...' : 'Create Supplier'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
