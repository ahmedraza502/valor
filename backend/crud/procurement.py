from sqlalchemy.orm import Session
from models.procurement import (
    Supplier, Product, PurchaseOrder, PurchaseOrderItem,
    QCReport, QCReportItem, Receipt, SupplierType, PurchaseOrderStatus
)
from schemas.procurement import (
    SupplierCreate, SupplierUpdate, ProductCreate, ProductUpdate,
    LocalPurchaseOrderCreate, ImportPurchaseOrderCreate,
    QCReportCreate, QCReportUpdate, ReceiptCreate
)
from typing import List, Optional
from datetime import datetime

# ==================== SUPPLIER CRUD ====================
def create_supplier(db: Session, supplier: SupplierCreate):
    db_supplier = Supplier(**supplier.model_dump())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

def get_supplier(db: Session, supplier_id: int):
    return db.query(Supplier).filter(Supplier.id == supplier_id).first()

def get_suppliers(db: Session, skip: int = 0, limit: int = 100, supplier_type: Optional[str] = None):
    query = db.query(Supplier)
    if supplier_type:
        query = query.filter(Supplier.supplier_type == supplier_type)
    return query.offset(skip).limit(limit).all()

def update_supplier(db: Session, supplier_id: int, supplier: SupplierUpdate):
    db_supplier = get_supplier(db, supplier_id)
    if db_supplier:
        update_data = supplier.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_supplier, key, value)
        db_supplier.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_supplier)
    return db_supplier

def delete_supplier(db: Session, supplier_id: int):
    db_supplier = get_supplier(db, supplier_id)
    if db_supplier:
        db.delete(db_supplier)
        db.commit()
        return True
    return False

# ==================== PRODUCT CRUD ====================
def create_product(db: Session, product: ProductCreate):
    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def get_product(db: Session, product_id: int):
    return db.query(Product).filter(Product.id == product_id).first()

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Product).offset(skip).limit(limit).all()

def update_product(db: Session, product_id: int, product: ProductUpdate):
    db_product = get_product(db, product_id)
    if db_product:
        update_data = product.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_product, key, value)
        db_product.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    db_product = get_product(db, product_id)
    if db_product:
        db.delete(db_product)
        db.commit()
        return True
    return False

# ==================== PURCHASE ORDER CRUD ====================
def generate_po_number(db: Session) -> str:
    """Generate unique PO number"""
    count = db.query(PurchaseOrder).count()
    return f"PO-{datetime.utcnow().strftime('%Y%m%d')}-{count + 1:04d}"

def create_local_purchase_order(db: Session, po: LocalPurchaseOrderCreate):
    # Get supplier to verify type
    supplier = get_supplier(db, po.supplier_id)
    if not supplier:
        raise ValueError("Supplier not found")
    
    # Create PO
    po_number = generate_po_number(db)
    db_po = PurchaseOrder(
        po_number=po_number,
        supplier_id=po.supplier_id,
        supplier_type=SupplierType.LOCAL,
        payment_terms=po.payment_terms,
        station=po.station,
        tax=po.tax
    )
    
    # Calculate total and add items
    total_amount = 0.0
    for item in po.items:
        item_total = item.quantity * item.rate
        total_amount += item_total
        
        db_item = PurchaseOrderItem(
            product_id=item.product_id,
            sn=item.sn,
            quantity=item.quantity,
            rate=item.rate,
            total=item_total
        )
        db_po.items.append(db_item)
    
    # Add tax if applicable
    if po.tax:
        total_amount += (total_amount * po.tax / 100)
    
    db_po.total_amount = total_amount
    
    db.add(db_po)
    db.commit()
    db.refresh(db_po)
    return db_po

def create_import_purchase_order(db: Session, po: ImportPurchaseOrderCreate):
    # Get supplier to verify type
    supplier = get_supplier(db, po.supplier_id)
    if not supplier:
        raise ValueError("Supplier not found")
    
    # Create PO
    po_number = generate_po_number(db)
    db_po = PurchaseOrder(
        po_number=po_number,
        supplier_id=po.supplier_id,
        supplier_type=SupplierType.IMPORT,
        payment_terms=po.payment_terms,
        origin=po.origin,
        payment_type=po.payment_type,
        dispatched_from=po.dispatched_from,
        dispatched_in=po.dispatched_in,
        validity_indent=po.validity_indent
    )
    
    # Calculate total and add items
    total_amount = 0.0
    for item in po.items:
        item_total = item.quantity * item.rate
        total_amount += item_total
        
        db_item = PurchaseOrderItem(
            product_id=item.product_id,
            sn=item.sn,
            quantity=item.quantity,
            rate=item.rate,
            total=item_total
        )
        db_po.items.append(db_item)
    
    db_po.total_amount = total_amount
    
    db.add(db_po)
    db.commit()
    db.refresh(db_po)
    return db_po

def get_purchase_order(db: Session, po_id: int):
    return db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()

def get_purchase_orders(db: Session, skip: int = 0, limit: int = 100, 
                       supplier_type: Optional[str] = None,
                       status: Optional[str] = None):
    query = db.query(PurchaseOrder)
    if supplier_type:
        query = query.filter(PurchaseOrder.supplier_type == supplier_type)
    if status:
        query = query.filter(PurchaseOrder.status == status)
    return query.offset(skip).limit(limit).all()

# ==================== QC REPORT CRUD ====================
def generate_qc_report_number(db: Session) -> str:
    """Generate unique QC report number"""
    count = db.query(QCReport).count()
    return f"QC-{datetime.utcnow().strftime('%Y%m%d')}-{count + 1:04d}"

def create_qc_report(db: Session, qc_report: QCReportCreate):
    # Check if PO exists
    po = get_purchase_order(db, qc_report.purchase_order_id)
    if not po:
        raise ValueError("Purchase Order not found")
    
    # Check if QC report already exists for this PO
    existing_qc = db.query(QCReport).filter(
        QCReport.purchase_order_id == qc_report.purchase_order_id
    ).first()
    if existing_qc:
        raise ValueError("QC Report already exists for this Purchase Order")
    
    # Create QC Report
    qc_number = generate_qc_report_number(db)
    db_qc = QCReport(
        purchase_order_id=qc_report.purchase_order_id,
        qc_report_number=qc_number,
        inspector_name=qc_report.inspector_name,
        remarks=qc_report.remarks
    )
    
    # Process QC items and calculate totals
    total_accepted_qty = 0.0
    total_rejected_qty = 0.0
    total_accepted_value = 0.0
    total_rejected_value = 0.0
    
    for item in qc_report.items:
        # Get PO item to get rate
        po_item = db.query(PurchaseOrderItem).filter(
            PurchaseOrderItem.id == item.po_item_id
        ).first()
        
        if not po_item:
            raise ValueError(f"PO Item {item.po_item_id} not found")
        
        accepted_value = item.accepted_qty * po_item.rate
        rejected_value = item.rejected_qty * po_item.rate
        
        db_qc_item = QCReportItem(
            po_item_id=item.po_item_id,
            status=item.status,
            accepted_qty=item.accepted_qty,
            rejected_qty=item.rejected_qty,
            accepted_value=accepted_value,
            rejected_value=rejected_value,
            rejection_reason=item.rejection_reason,
            remarks=item.remarks
        )
        db_qc.items.append(db_qc_item)
        
        total_accepted_qty += item.accepted_qty
        total_rejected_qty += item.rejected_qty
        total_accepted_value += accepted_value
        total_rejected_value += rejected_value
    
    db_qc.total_accepted_qty = total_accepted_qty
    db_qc.total_rejected_qty = total_rejected_qty
    db_qc.total_accepted_value = total_accepted_value
    db_qc.total_rejected_value = total_rejected_value
    
    # Update PO status
    if total_rejected_qty > 0:
        po.status = PurchaseOrderStatus.PARTIALLY_REJECTED
    else:
        po.status = PurchaseOrderStatus.COMPLETED
    
    db.add(db_qc)
    db.commit()
    db.refresh(db_qc)
    return db_qc

def get_qc_report(db: Session, qc_id: int):
    return db.query(QCReport).filter(QCReport.id == qc_id).first()

def get_qc_report_by_po(db: Session, po_id: int):
    return db.query(QCReport).filter(QCReport.purchase_order_id == po_id).first()

def get_qc_reports(db: Session, skip: int = 0, limit: int = 100):
    return db.query(QCReport).offset(skip).limit(limit).all()

# ==================== RECEIPT CRUD ====================
def generate_receipt_number(db: Session, receipt_type: str) -> str:
    """Generate unique receipt number"""
    count = db.query(Receipt).filter(Receipt.receipt_type == receipt_type).count()
    prefix = "RCP-ACC" if receipt_type == "accepted" else "RCP-REJ"
    return f"{prefix}-{datetime.utcnow().strftime('%Y%m%d')}-{count + 1:04d}"

def create_receipt(db: Session, receipt: ReceiptCreate):
    # Get PO and QC report
    po = get_purchase_order(db, receipt.purchase_order_id)
    if not po:
        raise ValueError("Purchase Order not found")
    
    qc_report = get_qc_report_by_po(db, receipt.purchase_order_id)
    if not qc_report:
        raise ValueError("QC Report not found for this Purchase Order")
    
    # Generate receipt number
    receipt_number = generate_receipt_number(db, receipt.receipt_type.value)
    
    # Calculate totals based on receipt type
    if receipt.receipt_type.value == "accepted":
        total_quantity = qc_report.total_accepted_qty
        total_value = qc_report.total_accepted_value
    else:
        total_quantity = qc_report.total_rejected_qty
        total_value = qc_report.total_rejected_value
    
    db_receipt = Receipt(
        receipt_number=receipt_number,
        purchase_order_id=receipt.purchase_order_id,
        receipt_type=receipt.receipt_type,
        total_quantity=total_quantity,
        total_value=total_value,
        generated_by=receipt.generated_by,
        remarks=receipt.remarks
    )
    
    db.add(db_receipt)
    db.commit()
    db.refresh(db_receipt)
    return db_receipt

def get_receipt(db: Session, receipt_id: int):
    return db.query(Receipt).filter(Receipt.id == receipt_id).first()

def get_receipts(db: Session, skip: int = 0, limit: int = 100, 
                receipt_type: Optional[str] = None,
                po_id: Optional[int] = None):
    query = db.query(Receipt)
    if receipt_type:
        query = query.filter(Receipt.receipt_type == receipt_type)
    if po_id:
        query = query.filter(Receipt.purchase_order_id == po_id)
    return query.offset(skip).limit(limit).all()
