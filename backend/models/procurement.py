from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum

class SupplierType(str, enum.Enum):
    LOCAL = "local"
    IMPORT = "import"

class PurchaseOrderStatus(str, enum.Enum):
    PENDING = "pending"
    QC_INSPECTION = "qc_inspection"
    COMPLETED = "completed"
    PARTIALLY_REJECTED = "partially_rejected"

class QCStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class PaymentType(str, enum.Enum):
    DA = "DA"
    F_PAYMENT = "F_Payment"

class Supplier(Base):
    __tablename__ = "suppliers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    supplier_type = Column(Enum(SupplierType), nullable=False)
    contact_person = Column(String)
    email = Column(String)
    phone = Column(String)
    address = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text)
    manufacturer = Column(String)
    hs_code = Column(String)  # For import products
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    purchase_order_items = relationship("PurchaseOrderItem", back_populates="product")

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    po_number = Column(String, unique=True, index=True, nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    supplier_type = Column(Enum(SupplierType), nullable=False)
    status = Column(Enum(PurchaseOrderStatus), default=PurchaseOrderStatus.PENDING)
    
    # Common fields
    payment_terms = Column(String)
    
    # Import specific fields
    origin = Column(String, nullable=True)  # Country of origin
    payment_type = Column(Enum(PaymentType), nullable=True)  # DA/F Payment
    dispatched_from = Column(String, nullable=True)
    dispatched_in = Column(String, nullable=True)  # Transport method
    validity_indent = Column(String, nullable=True)
    
    # Local specific fields
    station = Column(String, nullable=True)
    tax = Column(Float, nullable=True)
    
    # Totals
    total_amount = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    supplier = relationship("Supplier", back_populates="purchase_orders")
    items = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan")
    qc_report = relationship("QCReport", back_populates="purchase_order", uselist=False, cascade="all, delete-orphan")
    receipts = relationship("Receipt", back_populates="purchase_order", cascade="all, delete-orphan")

class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    sn = Column(Integer)  # Serial number in the order
    quantity = Column(Float, nullable=False)
    rate = Column(Float, nullable=False)
    total = Column(Float, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    purchase_order = relationship("PurchaseOrder", back_populates="items")
    product = relationship("Product", back_populates="purchase_order_items")
    qc_items = relationship("QCReportItem", back_populates="po_item", cascade="all, delete-orphan")

class QCReport(Base):
    __tablename__ = "qc_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False, unique=True)
    qc_report_number = Column(String, unique=True, index=True, nullable=False)
    inspector_name = Column(String)
    inspection_date = Column(DateTime, default=datetime.utcnow)
    remarks = Column(Text)
    
    # Summary
    total_accepted_qty = Column(Float, default=0.0)
    total_rejected_qty = Column(Float, default=0.0)
    total_accepted_value = Column(Float, default=0.0)
    total_rejected_value = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    purchase_order = relationship("PurchaseOrder", back_populates="qc_report")
    items = relationship("QCReportItem", back_populates="qc_report", cascade="all, delete-orphan")

class QCReportItem(Base):
    __tablename__ = "qc_report_items"
    
    id = Column(Integer, primary_key=True, index=True)
    qc_report_id = Column(Integer, ForeignKey("qc_reports.id"), nullable=False)
    po_item_id = Column(Integer, ForeignKey("purchase_order_items.id"), nullable=False)
    
    status = Column(Enum(QCStatus), nullable=False)
    accepted_qty = Column(Float, default=0.0)
    rejected_qty = Column(Float, default=0.0)
    accepted_value = Column(Float, default=0.0)
    rejected_value = Column(Float, default=0.0)
    
    rejection_reason = Column(Text, nullable=True)
    remarks = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    qc_report = relationship("QCReport", back_populates="items")
    po_item = relationship("PurchaseOrderItem", back_populates="qc_items")

class ReceiptType(str, enum.Enum):
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class Receipt(Base):
    __tablename__ = "receipts"
    
    id = Column(Integer, primary_key=True, index=True)
    receipt_number = Column(String, unique=True, index=True, nullable=False)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    receipt_type = Column(Enum(ReceiptType), nullable=False)
    
    total_quantity = Column(Float, default=0.0)
    total_value = Column(Float, default=0.0)
    
    generated_by = Column(String)  # Admin name
    generated_date = Column(DateTime, default=datetime.utcnow)
    remarks = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    purchase_order = relationship("PurchaseOrder", back_populates="receipts")
