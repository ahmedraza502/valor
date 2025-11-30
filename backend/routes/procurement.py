from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from schemas.procurement import (
    SupplierCreate, SupplierUpdate, SupplierResponse,
    ProductCreate, ProductUpdate, ProductResponse,
    LocalPurchaseOrderCreate, ImportPurchaseOrderCreate, PurchaseOrderResponse,
    QCReportCreate, QCReportUpdate, QCReportResponse,
    ReceiptCreate, ReceiptResponse
)
from crud import procurement as crud

router = APIRouter(prefix="/api/procurement", tags=["Procurement"])

# ==================== SUPPLIER ROUTES ====================
@router.post("/suppliers", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(supplier: SupplierCreate, db: Session = Depends(get_db)):
    """Create a new supplier (local or import)"""
    try:
        return crud.create_supplier(db, supplier)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/suppliers", response_model=List[SupplierResponse])
def get_suppliers(
    skip: int = 0, 
    limit: int = 100, 
    supplier_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all suppliers with optional filtering by type"""
    return crud.get_suppliers(db, skip=skip, limit=limit, supplier_type=supplier_type)

@router.get("/suppliers/{supplier_id}", response_model=SupplierResponse)
def get_supplier(supplier_id: int, db: Session = Depends(get_db)):
    """Get a specific supplier by ID"""
    supplier = crud.get_supplier(db, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier

@router.put("/suppliers/{supplier_id}", response_model=SupplierResponse)
def update_supplier(supplier_id: int, supplier: SupplierUpdate, db: Session = Depends(get_db)):
    """Update a supplier"""
    updated_supplier = crud.update_supplier(db, supplier_id, supplier)
    if not updated_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return updated_supplier

@router.delete("/suppliers/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    """Delete a supplier"""
    if not crud.delete_supplier(db, supplier_id):
        raise HTTPException(status_code=404, detail="Supplier not found")

# ==================== PRODUCT ROUTES ====================
@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    """Create a new product"""
    try:
        return crud.create_product(db, product)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/products", response_model=List[ProductResponse])
def get_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all products"""
    return crud.get_products(db, skip=skip, limit=limit)

@router.get("/products/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get a specific product by ID"""
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.put("/products/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product: ProductUpdate, db: Session = Depends(get_db)):
    """Update a product"""
    updated_product = crud.update_product(db, product_id, product)
    if not updated_product:
        raise HTTPException(status_code=404, detail="Product not found")
    return updated_product

@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """Delete a product"""
    if not crud.delete_product(db, product_id):
        raise HTTPException(status_code=404, detail="Product not found")

# ==================== PURCHASE ORDER ROUTES ====================
@router.post("/purchase-orders/local", response_model=PurchaseOrderResponse, status_code=status.HTTP_201_CREATED)
def create_local_purchase_order(po: LocalPurchaseOrderCreate, db: Session = Depends(get_db)):
    """Create a new local purchase order"""
    try:
        return crud.create_local_purchase_order(db, po)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/purchase-orders/import", response_model=PurchaseOrderResponse, status_code=status.HTTP_201_CREATED)
def create_import_purchase_order(po: ImportPurchaseOrderCreate, db: Session = Depends(get_db)):
    """Create a new import purchase order"""
    try:
        return crud.create_import_purchase_order(db, po)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/purchase-orders", response_model=List[PurchaseOrderResponse])
def get_purchase_orders(
    skip: int = 0, 
    limit: int = 100,
    supplier_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all purchase orders with optional filtering"""
    return crud.get_purchase_orders(db, skip=skip, limit=limit, supplier_type=supplier_type, status=status)

@router.get("/purchase-orders/{po_id}", response_model=PurchaseOrderResponse)
def get_purchase_order(po_id: int, db: Session = Depends(get_db)):
    """Get a specific purchase order by ID"""
    po = crud.get_purchase_order(db, po_id)
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
    return po

# ==================== QC REPORT ROUTES ====================
@router.post("/qc-reports", response_model=QCReportResponse, status_code=status.HTTP_201_CREATED)
def create_qc_report(qc_report: QCReportCreate, db: Session = Depends(get_db)):
    """Create a QC report for a purchase order"""
    try:
        return crud.create_qc_report(db, qc_report)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/qc-reports", response_model=List[QCReportResponse])
def get_qc_reports(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all QC reports"""
    return crud.get_qc_reports(db, skip=skip, limit=limit)

@router.get("/qc-reports/{qc_id}", response_model=QCReportResponse)
def get_qc_report(qc_id: int, db: Session = Depends(get_db)):
    """Get a specific QC report by ID"""
    qc_report = crud.get_qc_report(db, qc_id)
    if not qc_report:
        raise HTTPException(status_code=404, detail="QC Report not found")
    return qc_report

@router.get("/qc-reports/by-po/{po_id}", response_model=QCReportResponse)
def get_qc_report_by_po(po_id: int, db: Session = Depends(get_db)):
    """Get QC report for a specific purchase order"""
    qc_report = crud.get_qc_report_by_po(db, po_id)
    if not qc_report:
        raise HTTPException(status_code=404, detail="QC Report not found for this Purchase Order")
    return qc_report

# ==================== RECEIPT ROUTES ====================
@router.post("/receipts", response_model=ReceiptResponse, status_code=status.HTTP_201_CREATED)
def create_receipt(receipt: ReceiptCreate, db: Session = Depends(get_db)):
    """Create a receipt (accepted or rejected items)"""
    try:
        return crud.create_receipt(db, receipt)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/receipts", response_model=List[ReceiptResponse])
def get_receipts(
    skip: int = 0, 
    limit: int = 100,
    receipt_type: Optional[str] = None,
    po_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get all receipts with optional filtering"""
    return crud.get_receipts(db, skip=skip, limit=limit, receipt_type=receipt_type, po_id=po_id)

@router.get("/receipts/{receipt_id}", response_model=ReceiptResponse)
def get_receipt(receipt_id: int, db: Session = Depends(get_db)):
    """Get a specific receipt by ID"""
    receipt = crud.get_receipt(db, receipt_id)
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return receipt
