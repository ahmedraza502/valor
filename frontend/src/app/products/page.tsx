'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient, Product } from '@/lib/api';

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getProducts();
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Products
                    </h1>
                    <p className="text-gray-600">Manage your product catalog</p>
                </div>
                <Link href="/products/create">
                    <button className="btn btn-primary">
                        <span className="text-lg">➕</span>
                        Add Product
                    </button>
                </Link>
            </div>

            {loading ? (
                <div className="card text-center py-12">
                    <div className="text-4xl mb-4">⏳</div>
                    <p className="text-gray-600">Loading products...</p>
                </div>
            ) : products.length === 0 ? (
                <div className="card text-center py-12">
                    <div className="text-6xl mb-4">📦</div>
                    <h3 className="text-xl font-semibold mb-2">No products found</h3>
                    <p className="text-gray-600 mb-6">Get started by adding your first product</p>
                    <Link href="/products/create">
                        <button className="btn btn-primary">
                            <span className="text-lg">➕</span>
                            Add Product
                        </button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                        <div key={product.id} className="card hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="text-3xl">📦</div>
                                    <div>
                                        <h3 className="font-bold text-lg">{product.name}</h3>
                                        <p className="text-sm text-gray-500">{product.manufacturer}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm mb-4">
                                {product.description && (
                                    <p className="text-gray-600 line-clamp-2">
                                        {product.description}
                                    </p>
                                )}
                                {product.hs_code && (
                                    <p className="text-gray-600">
                                        <span className="font-medium">HS Code:</span> {product.hs_code}
                                    </p>
                                )}
                            </div>

                            <div className="pt-4 border-t border-gray-100 text-xs text-gray-400">
                                Added: {new Date(product.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
