from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

# Enums
class SupplierTypeEnum(str, Enum):
    LOCAL = "local"
    IMPORT = "import"

class PurchaseOrderStatusEnum(str, Enum):
    PENDING = "pending"
    QC_INSPECTION = "qc_inspection"
    COMPLETED = "completed"
    PARTIALLY_REJECTED = "partially_rejected"

class QCStatusEnum(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class PaymentTypeEnum(str, Enum):
    DA = "DA"
    F_PAYMENT = "F_Payment"

class ReceiptTypeEnum(str, Enum):
    ACCEPTED = "accepted"
    REJECTED = "rejected"

# Supplier Schemas
class SupplierBase(BaseModel):
    name: str
    supplier_type: SupplierTypeEnum
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class SupplierResponse(SupplierBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Product Schemas
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    manufacturer: Optional[str] = None
    hs_code: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    manufacturer: Optional[str] = None
    hs_code: Optional[str] = None

class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Purchase Order Item Schemas
class PurchaseOrderItemBase(BaseModel):
    product_id: int
    sn: int
    quantity: float
    rate: float

class PurchaseOrderItemCreate(PurchaseOrderItemBase):
    pass

class PurchaseOrderItemResponse(PurchaseOrderItemBase):
    id: int
    total: float
    created_at: datetime
    product: ProductResponse
    
    class Config:
        from_attributes = True

# Purchase Order Schemas - Local
class LocalPurchaseOrderCreate(BaseModel):
    supplier_id: int
    payment_terms: Optional[str] = None
    station: Optional[str] = None
    tax: Optional[float] = None
    items: List[PurchaseOrderItemCreate]

# Purchase Order Schemas - Import
class ImportPurchaseOrderCreate(BaseModel):
    supplier_id: int
    payment_terms: Optional[str] = None
    origin: Optional[str] = None
    payment_type: Optional[PaymentTypeEnum] = None
    dispatched_from: Optional[str] = None
    dispatched_in: Optional[str] = None
    validity_indent: Optional[str] = None
    items: List[PurchaseOrderItemCreate]

class PurchaseOrderResponse(BaseModel):
    id: int
    po_number: str
    supplier_id: int
    supplier_type: SupplierTypeEnum
    status: PurchaseOrderStatusEnum
    payment_terms: Optional[str] = None
    
    # Import fields
    origin: Optional[str] = None
    payment_type: Optional[PaymentTypeEnum] = None
    dispatched_from: Optional[str] = None
    dispatched_in: Optional[str] = None
    validity_indent: Optional[str] = None
    
    # Local fields
    station: Optional[str] = None
    tax: Optional[float] = None
    
    total_amount: float
    created_at: datetime
    updated_at: datetime
    
    supplier: SupplierResponse
    items: List[PurchaseOrderItemResponse]
    
    class Config:
        from_attributes = True

# QC Report Item Schemas
class QCReportItemCreate(BaseModel):
    po_item_id: int
    status: QCStatusEnum
    accepted_qty: float = 0.0
    rejected_qty: float = 0.0
    rejection_reason: Optional[str] = None
    remarks: Optional[str] = None

class QCReportItemResponse(BaseModel):
    id: int
    po_item_id: int
    status: QCStatusEnum
    accepted_qty: float
    rejected_qty: float
    accepted_value: float
    rejected_value: float
    rejection_reason: Optional[str] = None
    remarks: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# QC Report Schemas
class QCReportCreate(BaseModel):
    purchase_order_id: int
    inspector_name: Optional[str] = None
    remarks: Optional[str] = None
    items: List[QCReportItemCreate]

class QCReportUpdate(BaseModel):
    inspector_name: Optional[str] = None
    remarks: Optional[str] = None
    items: Optional[List[QCReportItemCreate]] = None

class QCReportResponse(BaseModel):
    id: int
    purchase_order_id: int
    qc_report_number: str
    inspector_name: Optional[str] = None
    inspection_date: datetime
    remarks: Optional[str] = None
    total_accepted_qty: float
    total_rejected_qty: float
    total_accepted_value: float
    total_rejected_value: float
    created_at: datetime
    updated_at: datetime
    items: List[QCReportItemResponse]
    
    class Config:
        from_attributes = True

# Receipt Schemas
class ReceiptCreate(BaseModel):
    purchase_order_id: int
    receipt_type: ReceiptTypeEnum
    generated_by: Optional[str] = None
    remarks: Optional[str] = None

class ReceiptResponse(BaseModel):
    id: int
    receipt_number: str
    purchase_order_id: int
    receipt_type: ReceiptTypeEnum
    total_quantity: float
    total_value: float
    generated_by: Optional[str] = None
    generated_date: datetime
    remarks: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
