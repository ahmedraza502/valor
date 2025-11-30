'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient, PurchaseOrder, QCReport } from '@/lib/api';
import jsPDF from 'jspdf';

export default function PurchaseOrderDetailPage() {
    const router = useRouter();
    const params = useParams();
    const poId = parseInt(params.id as string);

    const [loading, setLoading] = useState(true);
    const [po, setPo] = useState<PurchaseOrder | null>(null);
    const [qcReport, setQcReport] = useState<QCReport | null>(null);
    const [qcLoading, setQcLoading] = useState(false);

    useEffect(() => {
        fetchPO();
    }, [poId]);

    const fetchPO = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getPurchaseOrder(poId);
            setPo(data);
            
            // If PO is not pending, fetch QC report
            if (data.status !== 'pending') {
                await fetchQCReport();
            }
        } catch (error) {
            console.error('Error fetching PO:', error);
            alert('Failed to fetch purchase order details');
        } finally {
            setLoading(false);
        }
    };

    const fetchQCReport = async () => {
        try {
            setQcLoading(true);
            const data = await apiClient.getQCReportByPO(poId);
            setQcReport(data);
        } catch (error) {
            console.error('Error fetching QC report:', error);
            // QC report might not exist yet, which is fine
        } finally {
            setQcLoading(false);
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

    const downloadPurchaseOrderPDF = () => {
        if (!po) return;

        const pdf = new jsPDF();
        const pageWidth = pdf.internal.pageSize.getWidth();
        let yPosition = 20;

        // Header
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Purchase Order', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 15;

        // PO Info
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`PO Number: ${po.po_number}`, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 10;
        pdf.text(`Date: ${new Date(po.created_at).toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 15;

        // Order Information
        pdf.setFont('helvetica', 'bold');
        pdf.text('Order Information:', 20, yPosition);
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        pdf.text(`PO Number: ${po.po_number}`, 30, yPosition);
        yPosition += 6;
        pdf.text(`Status: ${po.status.replace('_', ' ')}`, 30, yPosition);
        yPosition += 6;
        pdf.text(`Supplier Type: ${po.supplier_type}`, 30, yPosition);
        yPosition += 6;
        pdf.text(`Created Date: ${new Date(po.created_at).toLocaleDateString()}`, 30, yPosition);
        yPosition += 15;

        // Supplier Information
        pdf.setFont('helvetica', 'bold');
        pdf.text('Supplier Information:', 20, yPosition);
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Supplier Name: ${po.supplier.name}`, 30, yPosition);
        yPosition += 6;
        pdf.text(`Contact Person: ${po.supplier.contact_person || 'N/A'}`, 30, yPosition);
        yPosition += 6;
        pdf.text(`Email: ${po.supplier.email || 'N/A'}`, 30, yPosition);
        yPosition += 6;
        pdf.text(`Phone: ${po.supplier.phone || 'N/A'}`, 30, yPosition);
        yPosition += 6;
        pdf.text(`Address: ${po.supplier.address || 'N/A'}`, 30, yPosition);
        yPosition += 15;

        // Order Details
        pdf.setFont('helvetica', 'bold');
        pdf.text('Order Details:', 20, yPosition);
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Payment Terms: ${po.payment_terms || 'N/A'}`, 30, yPosition);
        yPosition += 6;

        if (po.supplier_type === 'local') {
            pdf.text(`Station: ${po.station || 'N/A'}`, 30, yPosition);
            yPosition += 6;
            pdf.text(`Tax: ${po.tax || 0}%`, 30, yPosition);
        } else {
            pdf.text(`Origin: ${po.origin || 'N/A'}`, 30, yPosition);
            yPosition += 6;
            pdf.text(`Payment Type: ${po.payment_type || 'N/A'}`, 30, yPosition);
            yPosition += 6;
            pdf.text(`Dispatched From: ${po.dispatched_from || 'N/A'}`, 30, yPosition);
            yPosition += 6;
            pdf.text(`Dispatched In: ${po.dispatched_in || 'N/A'}`, 30, yPosition);
            yPosition += 6;
            pdf.text(`Validity Indent: ${po.validity_indent || 'N/A'}`, 30, yPosition);
        }
        yPosition += 15;

        // Items Table Header
        pdf.setFont('helvetica', 'bold');
        pdf.text('Order Items:', 20, yPosition);
        yPosition += 8;
        
        const tableHeaders = ['SN#', 'Product', 'Manufacturer', 'Qty', 'Rate', 'Total'];
        const columnWidths = [15, 60, 50, 25, 25, 25];
        let xPos = 20;
        
        tableHeaders.forEach((header, index) => {
            pdf.text(header, xPos, yPosition);
            xPos += columnWidths[index];
        });
        yPosition += 8;

        // Items Data
        pdf.setFont('helvetica', 'normal');
        po.items.forEach((item, index) => {
            xPos = 20;
            pdf.text(item.sn.toString(), xPos, yPosition);
            xPos += columnWidths[0];
            
            // Truncate long product names
            const productName = item.product?.name || 'Product';
            const truncatedName = productName.length > 10 ? productName.substring(0, 10) + '...' : productName;
            pdf.text(truncatedName, xPos, yPosition);
            xPos += columnWidths[1];
            
            const manufacturer = item.product?.manufacturer || 'N/A';
            const truncatedManufacturer = manufacturer.length > 8 ? manufacturer.substring(0, 8) + '...' : manufacturer;
            pdf.text(truncatedManufacturer, xPos, yPosition);
            xPos += columnWidths[2];
            
            pdf.text(item.quantity.toString(), xPos, yPosition);
            xPos += columnWidths[3];
            
            pdf.text(item.rate.toFixed(2), xPos, yPosition);
            xPos += columnWidths[4];
            
            const total = (item.quantity * item.rate).toFixed(2);
            pdf.text(total, xPos, yPosition);
            yPosition += 6;

            // Add product description if available (smaller font)
            if (item.product?.description) {
                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'italic');
                const description = item.product.description;
                const descLines = pdf.splitTextToSize(description, 165);
                descLines.slice(0, 2).forEach((line: string) => {
                    if (yPosition > 270) {
                        pdf.addPage();
                        yPosition = 20;
                    }
                    pdf.text(line, 30, yPosition);
                    yPosition += 4;
                });
                pdf.setFontSize(12);
                pdf.setFont('helvetica', 'normal');
                yPosition += 2;
            }

            // Add new page if needed
            if (yPosition > 270) {
                pdf.addPage();
                yPosition = 20;
            }
        });

        // Total
        yPosition += 10;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Total Amount:', pageWidth - 80, yPosition);
        pdf.text(po.total_amount.toFixed(2), pageWidth - 20, yPosition, { align: 'right' });

        // Save PDF
        const fileName = `Purchase_Order_${po.po_number}_${new Date(po.created_at).toISOString().slice(0,10)}.pdf`;
        pdf.save(fileName);
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!po) return <div className="p-8 text-center">Purchase Order not found</div>;

    return (
        <div className="max-w-6xl mx-auto animate-fade-in">
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="btn bg-gray-100 hover:bg-gray-200 text-gray-700"
                        >
                            ← Back
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                                Purchase Order Details
                            </h1>
                            <p className="text-gray-600">{po.po_number}</p>
                        </div>
                    </div>
                    <button
                        onClick={downloadPurchaseOrderPDF}
                        className="btn bg-blue-100 hover:bg-blue-200 text-blue-700"
                    >
                        📄 Download PO PDF
                    </button>
                </div>
            </div>

            {/* PO Header */}
            <div className="card mb-6">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex-1">
                        <h2 className="text-xl font-semibold mb-4">Order Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">PO Number</p>
                                <p className="font-medium">{po.po_number}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Status</p>
                                <span className={`badge ${getStatusBadge(po.status)}`}>
                                    {po.status.replace('_', ' ')}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Supplier Type</p>
                                <span className={`badge ${po.supplier_type === 'local' ? 'badge-info' : 'badge-warning'}`}>
                                    {po.supplier_type}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Created Date</p>
                                <p className="font-medium">{new Date(po.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1">
                        <h2 className="text-xl font-semibold mb-4">Supplier Information</h2>
                        <div className="space-y-2">
                            <div>
                                <p className="text-sm text-gray-500">Supplier Name</p>
                                <p className="font-medium">{po.supplier.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Contact Person</p>
                                <p className="font-medium">{po.supplier.contact_person || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="font-medium">{po.supplier.email || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Phone</p>
                                <p className="font-medium">{po.supplier.phone || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PO Specific Fields */}
            <div className="card mb-6">
                <h2 className="text-xl font-semibold mb-4">Order Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {po.supplier_type === 'local' ? (
                        <>
                            <div>
                                <p className="text-sm text-gray-500">Payment Terms</p>
                                <p className="font-medium">{po.payment_terms || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Station</p>
                                <p className="font-medium">{po.station || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Tax (%)</p>
                                <p className="font-medium">{po.tax || 0}%</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <p className="text-sm text-gray-500">Payment Terms</p>
                                <p className="font-medium">{po.payment_terms || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Origin</p>
                                <p className="font-medium">{po.origin || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Payment Type</p>
                                <p className="font-medium">{po.payment_type || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Dispatched From</p>
                                <p className="font-medium">{po.dispatched_from || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Dispatched In</p>
                                <p className="font-medium">{po.dispatched_in || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Validity Indent</p>
                                <p className="font-medium">{po.validity_indent || 'N/A'}</p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Order Items */}
            <div className="card mb-6">
                <h2 className="text-xl font-semibold mb-4">Order Items</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left border-b border-gray-200">
                                <th className="pb-2 w-16">SN#</th>
                                <th className="pb-2">Product</th>
                                <th className="pb-2">Manufacturer</th>
                                <th className="pb-2 w-32">Quantity</th>
                                <th className="pb-2 w-32">Rate</th>
                                <th className="pb-2 w-32">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {po.items.map((item, index) => (
                                <tr key={item.id || index}>
                                    <td className="py-3">{item.sn}</td>
                                    <td className="py-3">
                                        <div>
                                            <p className="font-medium">{item.product?.name || 'Product not found'}</p>
                                            {item.product?.description && (
                                                <p className="text-sm text-gray-500">{item.product.description}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-3">{item.product?.manufacturer || 'N/A'}</td>
                                    <td className="py-3">{item.quantity}</td>
                                    <td className="py-3">{item.rate.toFixed(2)}</td>
                                    <td className="py-3 font-medium">
                                        {(item.quantity * item.rate).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t border-gray-200">
                                <td colSpan={5} className="py-4 text-right font-bold">Total Amount:</td>
                                <td className="py-4 font-bold text-lg text-blue-600">
                                    {po.total_amount.toFixed(2)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* QC Inspection Results */}
            {po.status !== 'pending' && qcReport && (
                <div className="card mb-6">
                    <h2 className="text-xl font-semibold mb-4">QC Inspection Results</h2>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Accepted Items */}
                        <div>
                            <h3 className="text-lg font-semibold text-green-600 mb-3">✅ Accepted Items</h3>
                            <div className="bg-green-50 rounded-lg p-4">
                                <div className="mb-3">
                                    <p className="text-sm text-gray-600">Total Accepted Quantity</p>
                                    <p className="text-xl font-bold text-green-600">{qcReport.total_accepted_qty}</p>
                                </div>
                                <div className="mb-4">
                                    <p className="text-sm text-gray-600">Total Accepted Price</p>
                                    <p className="text-xl font-bold text-green-600">{qcReport.total_accepted_value.toLocaleString()}</p>
                                </div>
                                
                                {qcReport.items.filter(item => item.accepted_qty > 0).length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-gray-700">Accepted Items Details:</p>
                                        <div className="space-y-1">
                                            {qcReport.items
                                                .filter(item => item.accepted_qty > 0)
                                                .map((item, index) => {
                                                    const poItem = po.items.find(poItem => poItem.id === item.po_item_id);
                                                    return (
                                                        <div key={index} className="text-sm bg-white rounded p-2">
                                                            <div className="flex justify-between">
                                                                <span className="font-medium">{poItem?.product?.name || 'Product'}</span>
                                                                <span className="text-green-600">Qty: {item.accepted_qty}</span>
                                                            </div>
                                                            <div className="flex justify-between text-xs text-gray-500">
                                                                <span>Rate: {poItem?.rate.toFixed(2)}</span>
                                                                <span>Price: {item.accepted_value.toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Rejected Items */}
                        <div>
                            <h3 className="text-lg font-semibold text-red-600 mb-3">❌ Rejected Items</h3>
                            <div className="bg-red-50 rounded-lg p-4">
                                <div className="mb-3">
                                    <p className="text-sm text-gray-600">Total Rejected Quantity</p>
                                    <p className="text-xl font-bold text-red-600">{qcReport.total_rejected_qty}</p>
                                </div>
                                <div className="mb-4">
                                    <p className="text-sm text-gray-600">Total Rejected Price</p>
                                    <p className="text-xl font-bold text-red-600">{qcReport.total_rejected_value.toLocaleString()}</p>
                                </div>
                                
                                {qcReport.items.filter(item => item.rejected_qty > 0).length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-gray-700">Rejected Items Details:</p>
                                        <div className="space-y-1">
                                            {qcReport.items
                                                .filter(item => item.rejected_qty > 0)
                                                .map((item, index) => {
                                                    const poItem = po.items.find(poItem => poItem.id === item.po_item_id);
                                                    return (
                                                        <div key={index} className="text-sm bg-white rounded p-2">
                                                            <div className="flex justify-between">
                                                                <span className="font-medium">{poItem?.product?.name || 'Product'}</span>
                                                                <span className="text-red-600">Qty: {item.rejected_qty}</span>
                                                            </div>
                                                            <div className="flex justify-between text-xs text-gray-500">
                                                                <span>Rate: {poItem?.rate.toFixed(2)}</span>
                                                                <span>Price: {item.rejected_value.toFixed(2)}</span>
                                                            </div>
                                                            {item.rejection_reason && (
                                                                <div className="text-xs text-red-600 mt-1 italic">
                                                                    Reason: {item.rejection_reason}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-gray-500">QC Report Number</p>
                                <p className="font-medium">{qcReport.qc_report_number}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Inspector</p>
                                <p className="font-medium">{qcReport.inspector_name || 'N/A'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Inspection Date</p>
                                <p className="font-medium">{new Date(qcReport.inspection_date).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-4">
                {po.status === 'pending' && (
                    <Link href={`/qc-reports/create/${po.id}`}>
                        <button className="btn btn-success">
                            🔍 QC Inspect
                        </button>
                    </Link>
                )}
                {po.status !== 'pending' && (
                    <Link href={`/receipts/create/${po.id}`}>
                        <button className="btn btn-primary">
                            🧾 Generate Receipt
                        </button>
                    </Link>
                )}
            </div>
        </div>
    );
}
