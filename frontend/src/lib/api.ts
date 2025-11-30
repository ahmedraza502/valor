const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Supplier {
    id: number;
    name: string;
    supplier_type: 'local' | 'import';
    contact_person?: string;
    email?: string;
    phone?: string;
    address?: string;
    created_at: string;
    updated_at: string;
}

export interface Product {
    id: number;
    name: string;
    description?: string;
    manufacturer?: string;
    hs_code?: string;
    created_at: string;
    updated_at: string;
}

export interface PurchaseOrderItem {
    id?: number;
    product_id: number;
    sn: number;
    quantity: number;
    rate: number;
    total?: number;
    product?: Product;
}

export interface PurchaseOrder {
    id: number;
    po_number: string;
    supplier_id: number;
    supplier_type: 'local' | 'import';
    status: 'pending' | 'qc_inspection' | 'completed' | 'partially_rejected';
    payment_terms?: string;

    // Import fields
    origin?: string;
    payment_type?: 'DA' | 'F_Payment';
    dispatched_from?: string;
    dispatched_in?: string;
    validity_indent?: string;

    // Local fields
    station?: string;
    tax?: number;

    total_amount: number;
    created_at: string;
    updated_at: string;
    supplier: Supplier;
    items: PurchaseOrderItem[];
}

export interface QCReportItem {
    id?: number;
    po_item_id: number;
    status: 'pending' | 'accepted' | 'rejected';
    accepted_qty: number;
    rejected_qty: number;
    accepted_value?: number;
    rejected_value?: number;
    rejection_reason?: string;
    remarks?: string;
}

export interface QCReport {
    id: number;
    purchase_order_id: number;
    qc_report_number: string;
    inspector_name?: string;
    inspection_date: string;
    remarks?: string;
    total_accepted_qty: number;
    total_rejected_qty: number;
    total_accepted_value: number;
    total_rejected_value: number;
    created_at: string;
    updated_at: string;
    items: QCReportItem[];
}

export interface Receipt {
    id: number;
    receipt_number: string;
    purchase_order_id: number;
    receipt_type: 'accepted' | 'rejected';
    total_quantity: number;
    total_value: number;
    generated_by?: string;
    generated_date: string;
    remarks?: string;
    created_at: string;
}

// API Client
class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private async request<T>(
        endpoint: string,
        options?: RequestInit
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
            throw new Error(error.detail || `HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    // Suppliers
    async getSuppliers(supplierType?: string): Promise<Supplier[]> {
        const params = supplierType ? `?supplier_type=${supplierType}` : '';
        return this.request<Supplier[]>(`/api/procurement/suppliers${params}`);
    }

    async getSupplier(id: number): Promise<Supplier> {
        return this.request<Supplier>(`/api/procurement/suppliers/${id}`);
    }

    async createSupplier(data: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<Supplier> {
        return this.request<Supplier>('/api/procurement/suppliers', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateSupplier(id: number, data: Partial<Supplier>): Promise<Supplier> {
        return this.request<Supplier>(`/api/procurement/suppliers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteSupplier(id: number): Promise<void> {
        return this.request<void>(`/api/procurement/suppliers/${id}`, {
            method: 'DELETE',
        });
    }

    // Products
    async getProducts(): Promise<Product[]> {
        return this.request<Product[]>('/api/procurement/products');
    }

    async getProduct(id: number): Promise<Product> {
        return this.request<Product>(`/api/procurement/products/${id}`);
    }

    async createProduct(data: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
        return this.request<Product>('/api/procurement/products', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateProduct(id: number, data: Partial<Product>): Promise<Product> {
        return this.request<Product>(`/api/procurement/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteProduct(id: number): Promise<void> {
        return this.request<void>(`/api/procurement/products/${id}`, {
            method: 'DELETE',
        });
    }

    // Purchase Orders
    async getPurchaseOrders(supplierType?: string, status?: string): Promise<PurchaseOrder[]> {
        const params = new URLSearchParams();
        if (supplierType) params.append('supplier_type', supplierType);
        if (status) params.append('status', status);
        const queryString = params.toString() ? `?${params.toString()}` : '';
        return this.request<PurchaseOrder[]>(`/api/procurement/purchase-orders${queryString}`);
    }

    async getPurchaseOrder(id: number): Promise<PurchaseOrder> {
        return this.request<PurchaseOrder>(`/api/procurement/purchase-orders/${id}`);
    }

    async createLocalPurchaseOrder(data: any): Promise<PurchaseOrder> {
        return this.request<PurchaseOrder>('/api/procurement/purchase-orders/local', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async createImportPurchaseOrder(data: any): Promise<PurchaseOrder> {
        return this.request<PurchaseOrder>('/api/procurement/purchase-orders/import', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // QC Reports
    async getQCReports(): Promise<QCReport[]> {
        return this.request<QCReport[]>('/api/procurement/qc-reports');
    }

    async getQCReport(id: number): Promise<QCReport> {
        return this.request<QCReport>(`/api/procurement/qc-reports/${id}`);
    }

    async getQCReportByPO(poId: number): Promise<QCReport> {
        return this.request<QCReport>(`/api/procurement/qc-reports/by-po/${poId}`);
    }

    async createQCReport(data: any): Promise<QCReport> {
        return this.request<QCReport>('/api/procurement/qc-reports', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Receipts
    async getReceipts(receiptType?: string, poId?: number): Promise<Receipt[]> {
        const params = new URLSearchParams();
        if (receiptType) params.append('receipt_type', receiptType);
        if (poId) params.append('po_id', poId.toString());
        const queryString = params.toString() ? `?${params.toString()}` : '';
        return this.request<Receipt[]>(`/api/procurement/receipts${queryString}`);
    }

    async getReceipt(id: number): Promise<Receipt> {
        return this.request<Receipt>(`/api/procurement/receipts/${id}`);
    }

    async createReceipt(data: any): Promise<Receipt> {
        return this.request<Receipt>('/api/procurement/receipts', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
}

export const apiClient = new ApiClient(API_BASE_URL);
