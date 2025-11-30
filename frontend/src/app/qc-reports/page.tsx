'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient, QCReport } from '@/lib/api';

export default function QCReportsPage() {
    const [reports, setReports] = useState<QCReport[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getQCReports();
            setReports(data);
        } catch (error) {
            console.error('Error fetching QC reports:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        QC Reports
                    </h1>
                    <p className="text-gray-600">Quality control inspection reports</p>
                </div>
            </div>

            {loading ? (
                <div className="card text-center py-12">
                    <div className="text-4xl mb-4">⏳</div>
                    <p className="text-gray-600">Loading QC reports...</p>
                </div>
            ) : reports.length === 0 ? (
                <div className="card text-center py-12">
                    <div className="text-6xl mb-4">✅</div>
                    <h3 className="text-xl font-semibold mb-2">No QC reports found</h3>
                    <p className="text-gray-600 mb-6">QC reports will appear here after inspecting purchase orders</p>
                    <Link href="/purchase-orders">
                        <button className="btn btn-primary">View Purchase Orders</button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6">
                    {reports.map((report) => (
                        <div key={report.id} className="card hover:shadow-md transition-shadow">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-bold">{report.qc_report_number}</h3>
                                        <span className="text-sm text-gray-500">
                                            {new Date(report.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 mb-1">
                                        <span className="font-medium">Inspector:</span> {report.inspector_name}
                                    </p>
                                    <div className="flex gap-4 mt-2">
                                        <div className="text-sm">
                                            <span className="text-green-600 font-medium">Accepted:</span> {report.total_accepted_qty}
                                        </div>
                                        <div className="text-sm">
                                            <span className="text-red-600 font-medium">Rejected:</span> {report.total_rejected_qty}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end justify-center gap-2">
                                    <Link href={`/receipts/create/${report.purchase_order_id}`}>
                                        <button className="btn btn-primary text-sm">
                                            🧾 Generate Receipt
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
