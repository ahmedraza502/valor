'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient, QCReport, PurchaseOrder } from '@/lib/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function CreateReceiptPage() {
    const router = useRouter();
    const params = useParams();
    const poId = parseInt(params.poId as string);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [qcReport, setQcReport] = useState<QCReport | null>(null);
    const [po, setPo] = useState<PurchaseOrder | null>(null);
    const [generatedBy, setGeneratedBy] = useState('Admin');
    const [remarks, setRemarks] = useState('');

    useEffect(() => {
        fetchData();
    }, [poId]);

    const fetchData = async () => {
        try {
            const [qcData, poData] = await Promise.all([
                apiClient.getQCReportByPO(poId),
                apiClient.getPurchaseOrder(poId)
            ]);
            setQcReport(qcData);
            setPo(poData);
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Failed to fetch data. Make sure QC report exists.');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateReceipt = async (type: 'accepted' | 'rejected') => {
        if (!generatedBy) {
            alert('Please enter generator name');
            return;
        }

        setSubmitting(true);
        try {
            await apiClient.createReceipt({
                purchase_order_id: poId,
                receipt_type: type,
                generated_by: generatedBy,
                remarks: remarks
            });
            router.push('/receipts');
        } catch (error) {
            console.error('Error creating receipt:', error);
            alert('Failed to create receipt');
        } finally {
            setSubmitting(false);
        }
    };

    const generateReceiptPDF = async (type: 'accepted' | 'rejected') => {
        if (!qcReport || !po) return;

        const pdf = new jsPDF();
        const pageWidth = pdf.internal.pageSize.getWidth();
        let yPosition = 20;

        // Header
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${type === 'accepted' ? 'Accepted' : 'Rejected'} Items Receipt`, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 15;

        // Receipt Info
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Receipt Number: RCP-${type === 'accepted' ? 'ACC' : 'REJ'}-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 10;
        pdf.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 15;

        // PO Info
        pdf.setFont('helvetica', 'bold');
        pdf.text('Purchase Order Information:', 20, yPosition);
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        pdf.text(`PO Number: ${po.po_number}`, 30, yPosition);
        yPosition += 6;
        pdf.text(`Supplier: ${po.supplier.name}`, 30, yPosition);
        yPosition += 6;
        pdf.text(`Supplier Type: ${po.supplier_type}`, 30, yPosition);
        yPosition += 15;

        // Items Table Header
        pdf.setFont('helvetica', 'bold');
        pdf.text('Items Details:', 20, yPosition);
        yPosition += 8;
        
        const tableHeaders = ['SN#', 'Product Name', 'Qty', 'Rate', 'Total'];
        const columnWidths = [20, 80, 30, 30, 30];
        let xPos = 20;
        
        tableHeaders.forEach((header, index) => {
            pdf.text(header, xPos, yPosition);
            xPos += columnWidths[index];
        });
        yPosition += 8;

        // Items Data
        pdf.setFont('helvetica', 'normal');
        const items = qcReport.items.filter(item => 
            type === 'accepted' ? item.accepted_qty > 0 : item.rejected_qty > 0
        );

        items.forEach((item, index) => {
            const poItem = po.items.find(poItem => poItem.id === item.po_item_id);
            const productName = poItem?.product?.name || 'Product';
            const quantity = type === 'accepted' ? item.accepted_qty : item.rejected_qty;
            const rate = poItem?.rate || 0;
            const total = type === 'accepted' ? item.accepted_value : item.rejected_value;

            xPos = 20;
            pdf.text((index + 1).toString(), xPos, yPosition);
            xPos += columnWidths[0];
            
            // Truncate long product names
            const truncatedName = productName.length > 12 ? productName.substring(0, 12) + '...' : productName;
            pdf.text(truncatedName, xPos, yPosition);
            xPos += columnWidths[1];
            
            pdf.text(quantity.toString(), xPos, yPosition);
            xPos += columnWidths[2];
            
            pdf.text(rate.toFixed(2), xPos, yPosition);
            xPos += columnWidths[3];
            
            pdf.text(total.toFixed(2), xPos, yPosition);
            yPosition += 6;

            // Add rejection reason for rejected items
            if (type === 'rejected' && item.rejection_reason) {
                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'italic');
                const reasonText = `Reason: ${item.rejection_reason}`;
                const reasonLines = pdf.splitTextToSize(reasonText, 170);
                reasonLines.forEach((line: string) => {
                    if (yPosition > 270) {
                        pdf.addPage();
                        yPosition = 20;
                    }
                    pdf.text(line, 30, yPosition);
                    yPosition += 5;
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

        // Totals
        yPosition += 10;
        pdf.setFont('helvetica', 'bold');
        const totalQty = type === 'accepted' ? qcReport.total_accepted_qty : qcReport.total_rejected_qty;
        const totalPrice = type === 'accepted' ? qcReport.total_accepted_value : qcReport.total_rejected_value;
        
        pdf.text('Summary:', 20, yPosition);
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Total Quantity: ${totalQty}`, 30, yPosition);
        yPosition += 6;
        pdf.text(`Total Price: ${totalPrice.toLocaleString()}`, 30, yPosition);
        yPosition += 15;

        // Footer
        pdf.setFont('helvetica', 'bold');
        pdf.text('Generated By:', 20, yPosition);
        yPosition += 6;
        pdf.setFont('helvetica', 'normal');
        pdf.text(generatedBy || 'Admin', 30, yPosition);
        yPosition += 10;

        if (remarks) {
            pdf.setFont('helvetica', 'bold');
            pdf.text('Remarks:', 20, yPosition);
            yPosition += 6;
            pdf.setFont('helvetica', 'normal');
            const remarksLines = pdf.splitTextToSize(remarks, 170);
            remarksLines.forEach((line: string) => {
                pdf.text(line, 30, yPosition);
                yPosition += 5;
            });
        }

        // Save PDF
        const fileName = `${type === 'accepted' ? 'Accepted' : 'Rejected'}_Receipt_${po.po_number}_${new Date().toISOString().slice(0,10)}.pdf`;
        pdf.save(fileName);
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!qcReport || !po) return <div className="p-8 text-center">Data not found</div>;

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    Generate Receipt
                </h1>
                <p className="text-gray-600">Generate receipt for PO: {po.po_number}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* QC Summary */}
                <div className="card">
                    <h2 className="text-xl font-semibold mb-4">QC Report Summary</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Report Number:</span>
                            <span className="font-medium">{qcReport.qc_report_number}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Inspector:</span>
                            <span className="font-medium">{qcReport.inspector_name}</span>
                        </div>
                        <div className="border-t pt-3 mt-3">
                            <div className="flex justify-between text-green-600">
                                <span>Accepted Qty:</span>
                                <span className="font-bold">{qcReport.total_accepted_qty}</span>
                            </div>
                            <div className="flex justify-between text-green-600">
                                <span>Accepted Price:</span>
                                <span className="font-bold">{qcReport.total_accepted_value.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="border-t pt-3 mt-3">
                            <div className="flex justify-between text-red-600">
                                <span>Rejected Qty:</span>
                                <span className="font-bold">{qcReport.total_rejected_qty}</span>
                            </div>
                            <div className="flex justify-between text-red-600">
                                <span>Rejected Price:</span>
                                <span className="font-bold">{qcReport.total_rejected_value.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Receipt Details */}
                <div className="card">
                    <h2 className="text-xl font-semibold mb-4">Receipt Details</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Generated By *</label>
                            <input
                                type="text"
                                required
                                className="input"
                                value={generatedBy}
                                onChange={(e) => setGeneratedBy(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Remarks</label>
                            <textarea
                                className="input h-24"
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Optional remarks for the receipt"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                    onClick={() => handleGenerateReceipt('accepted')}
                    disabled={submitting || qcReport.total_accepted_qty === 0}
                    className="card hover:shadow-lg transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 rounded-full bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                            ✅
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Generate Accepted Receipt</h3>
                            <p className="text-sm text-gray-600">Create receipt for {qcReport.total_accepted_qty} accepted items</p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => handleGenerateReceipt('rejected')}
                    disabled={submitting || qcReport.total_rejected_qty === 0}
                    className="card hover:shadow-lg transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 rounded-full bg-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                            ❌
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Generate Rejected Receipt</h3>
                            <p className="text-sm text-gray-600">Create receipt for {qcReport.total_rejected_qty} rejected items</p>
                        </div>
                    </div>
                </button>
            </div>

            {/* PDF Downloads */}
            <div className="card mt-6">
                <h3 className="text-lg font-semibold mb-4">Download Receipts as PDF</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => generateReceiptPDF('accepted')}
                        disabled={qcReport.total_accepted_qty === 0}
                        className="btn bg-blue-100 hover:bg-blue-200 text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        📄 Download Accepted Receipt PDF
                    </button>
                    <button
                        onClick={() => generateReceiptPDF('rejected')}
                        disabled={qcReport.total_rejected_qty === 0}
                        className="btn bg-red-100 hover:bg-red-200 text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        📄 Download Rejected Receipt PDF
                    </button>
                </div>
            </div>
        </div>
    );
}
