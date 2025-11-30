# Pharma Factory Management System - Backend

FastAPI backend for the Pharma Factory Management System with procurement module.

## Features

### Procurement Module
- **Supplier Management**: Support for both local and import suppliers
- **Product Management**: Track products with manufacturer and HS code information
- **Purchase Orders**: 
  - Local purchase orders with tax and station information
  - Import purchase orders with origin, payment type, dispatch details
- **QC Reports**: Quality control inspection with accept/reject functionality
- **Receipts**: Generate receipts for accepted and rejected items

## Project Structure

```
backend/
├── models/
│   ├── __init__.py
│   └── procurement.py          # Database models
├── schemas/
│   ├── __init__.py
│   └── procurement.py          # Pydantic schemas
├── crud/
│   ├── __init__.py
│   └── procurement.py          # CRUD operations
├── routes/
│   ├── __init__.py
│   └── procurement.py          # API endpoints
├── database.py                 # Database configuration
├── main.py                     # FastAPI application
├── requirements.txt            # Python dependencies
└── .env                        # Environment variables
```

## Installation

1. Create a virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Application

```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- API: http://localhost:8000
- Interactive API docs: http://localhost:8000/docs
- Alternative API docs: http://localhost:8000/redoc

## API Endpoints

### Suppliers
- `POST /api/procurement/suppliers` - Create supplier
- `GET /api/procurement/suppliers` - List suppliers
- `GET /api/procurement/suppliers/{id}` - Get supplier
- `PUT /api/procurement/suppliers/{id}` - Update supplier
- `DELETE /api/procurement/suppliers/{id}` - Delete supplier

### Products
- `POST /api/procurement/products` - Create product
- `GET /api/procurement/products` - List products
- `GET /api/procurement/products/{id}` - Get product
- `PUT /api/procurement/products/{id}` - Update product
- `DELETE /api/procurement/products/{id}` - Delete product

### Purchase Orders
- `POST /api/procurement/purchase-orders/local` - Create local PO
- `POST /api/procurement/purchase-orders/import` - Create import PO
- `GET /api/procurement/purchase-orders` - List purchase orders
- `GET /api/procurement/purchase-orders/{id}` - Get purchase order

### QC Reports
- `POST /api/procurement/qc-reports` - Create QC report
- `GET /api/procurement/qc-reports` - List QC reports
- `GET /api/procurement/qc-reports/{id}` - Get QC report
- `GET /api/procurement/qc-reports/by-po/{po_id}` - Get QC report by PO

### Receipts
- `POST /api/procurement/receipts` - Create receipt
- `GET /api/procurement/receipts` - List receipts
- `GET /api/procurement/receipts/{id}` - Get receipt

## Database

The application uses SQLite by default. The database file will be created automatically as `pharma_factory.db`.

## Environment Variables

Configure in `.env` file:
- `DATABASE_URL`: Database connection string (default: sqlite:///./pharma_factory.db)
- `SECRET_KEY`: Secret key for security
- `DEBUG`: Debug mode (True/False)
