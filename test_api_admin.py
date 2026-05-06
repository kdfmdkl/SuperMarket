#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script kiểm tra toàn bộ API với quyền Admin
SuperMarketMini API Test Suite
"""

import requests
import json
import sys
from datetime import datetime

# Cấu hình
BASE_URL = "http://localhost:5000"
ADMIN_CREDENTIALS = {
    "username": "admin",
    "password": "Admin@123"
}

# Màu sắc cho terminal
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    END = '\033[0m'

# Kết quả test
results = {
    "passed": 0,
    "failed": 0,
    "total": 0,
    "details": []
}

def print_header(text):
    print(f"\n{Colors.CYAN}{Colors.BOLD}{'='*60}{Colors.END}")
    print(f"{Colors.CYAN}{Colors.BOLD} {text}{Colors.END}")
    print(f"{Colors.CYAN}{Colors.BOLD}{'='*60}{Colors.END}\n")

def print_test(name, status, code=None, message=""):
    results["total"] += 1
    if status == "PASS":
        results["passed"] += 1
        icon = f"{Colors.GREEN}✓{Colors.END}"
        status_color = f"{Colors.GREEN}PASS{Colors.END}"
    else:
        results["failed"] += 1
        icon = f"{Colors.RED}✗{Colors.END}"
        status_color = f"{Colors.RED}FAIL{Colors.END}"
    
    code_str = f" [{code}]" if code else ""
    msg_str = f" - {message}" if message else ""
    print(f"{icon} {name}{code_str} -> {status_color}{msg_str}")
    
    results["details"].append({
        "name": name,
        "status": status,
        "code": code,
        "message": message
    })

def test_api(name, method, endpoint, token=None, data=None, expected_status=None):
    """Test một API endpoint"""
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data, timeout=10)
        elif method == "PUT":
            response = requests.put(url, headers=headers, json=data, timeout=10)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, timeout=10)
        else:
            print_test(name, "FAIL", None, f"Method {method} không hỗ trợ")
            return None
        
        if expected_status and response.status_code == expected_status:
            print_test(name, "PASS", response.status_code)
        elif not expected_status and response.status_code < 400:
            print_test(name, "PASS", response.status_code)
        else:
            msg = response.text[:100] if response.text else ""
            print_test(name, "FAIL", response.status_code, msg)
        
        return response
    except Exception as e:
        print_test(name, "FAIL", None, str(e))
        return None

def main():
    print_header("🔐 SUPERMARKETMINI API TEST - QUYỀN ADMIN")
    
    # 1. Test Auth API
    print_header("1. TEST API XÁC THỰC (AUTH)")
    
    # Login
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json=ADMIN_CREDENTIALS,
        headers={"Content-Type": "application/json"},
        timeout=10
    )
    if response.status_code == 200:
        data = response.json()
        if data.get("success"):
            token = data.get("token")
            print_test("Đăng nhập Admin", "PASS", 200)
            print(f"  {Colors.YELLOW}→ Token nhận được: {token[:50]}...{Colors.END}")
        else:
            print_test("Đăng nhập Admin", "FAIL", 200, "Không có token")
            return
    else:
        print_test("Đăng nhập Admin", "FAIL", response.status_code)
        return
    
    # Get Me
    test_api("Lấy thông tin user hiện tại", "GET", "/api/auth/me", token)
    
    # 2. Test Categories API
    print_header("2. TEST API DANH MỤC (CATEGORIES)")
    test_api("Lấy tất cả danh mục", "GET", "/api/categories", token)
    test_api("Lấy danh mục gốc", "GET", "/api/categories/roots", token)
    test_api("Lấy chi tiết danh mục ID=1", "GET", "/api/categories/1", token)
    
    # Create category
    cat_data = {
        "name": f"Test Category {datetime.now().strftime('%H%M%S')}",
        "sortOrder": 1,
        "isActive": True
    }
    resp = test_api("Tạo danh mục mới", "POST", "/api/categories", token, cat_data)
    
    # 3. Test Products API
    print_header("3. TEST API SẢN PHẨM (PRODUCTS)")
    test_api("Lấy tất cả sản phẩm", "GET", "/api/products", token)
    test_api("Lấy sản phẩm ID=1", "GET", "/api/products/1", token)
    test_api("Tìm kiếm sản phẩm", "GET", "/api/products/search?keyword=Coca", token)
    test_api("Lấy sản phẩm sắp hết hàng", "GET", "/api/products/low-stock?threshold=20", token)
    
    # Create product
    prod_data = {
        "name": f"Test Product {datetime.now().strftime('%H%M%S')}",
        "description": "Product created by API test",
        "sellPrice": 25000,
        "costPrice": 18000,
        "unit": "hộp",
        "barcode": f"TEST{datetime.now().strftime('%H%M%S')}",
        "minQuantity": 10,
        "maxQuantity": 200
    }
    test_api("Tạo sản phẩm mới", "POST", "/api/products", token, prod_data)
    
    # 4. Test Customers API
    print_header("4. TEST API KHÁCH HÀNG (CUSTOMERS)")
    test_api("Lấy tất cả khách hàng", "GET", "/api/customers", token)
    test_api("Lấy khách hàng ID=1", "GET", "/api/customers/1", token)
    
    # Create customer
    cust_data = {
        "fullName": f"Test Customer {datetime.now().strftime('%H%M%S')}",
        "phone": f"0909{datetime.now().strftime('%H%M%S')}",
        "email": f"test{datetime.now().strftime('%H%M%S')}@test.com"
    }
    test_api("Tạo khách hàng mới", "POST", "/api/customers", token, cust_data)
    test_api("Tìm kiếm khách hàng nhanh", "GET", "/api/customers/search/quick?keyword=Test", token)
    
    # 5. Test Suppliers API
    print_header("5. TEST API NHÀ CUNG CẤP (SUPPLIERS)")
    test_api("Lấy tất cả nhà cung cấp", "GET", "/api/suppliers", token)
    test_api("Lấy nhà cung cấp ID=1", "GET", "/api/suppliers/1", token)
    
    # Create supplier
    sup_data = {
        "name": f"Test Supplier {datetime.now().strftime('%H%M%S')}",
        "phone": f"028{datetime.now().strftime('%H%M%S')}",
        "email": f"supplier{datetime.now().strftime('%H%M%S')}@test.com",
        "address": "123 Test Street"
    }
    test_api("Tạo nhà cung cấp mới", "POST", "/api/suppliers", token, sup_data)
    
    # 6. Test Inventory API
    print_header("6. TEST API KHO HÀNG (INVENTORY)")
    test_api("Lấy danh sách tồn kho", "GET", "/api/inventory?page=1&pageSize=20", token)
    test_api("Lấy chi tiết tồn kho ID=1", "GET", "/api/inventory/1", token)
    test_api("Lấy tồn kho theo Product ID=1", "GET", "/api/inventory/product/1", token)
    test_api("Lấy sản phẩm sắp hết hàng (Low Stock)", "GET", "/api/inventory/low-stock", token)
    test_api("Lấy sản phẩm hết hàng (Out of Stock)", "GET", "/api/inventory/out-of-stock", token)
    test_api("Lấy thống kê tồn kho", "GET", "/api/inventory/summary", token)
    test_api("Lấy logs tồn kho", "GET", "/api/inventory/logs?page=1&pageSize=20", token)
    
    # Inventory adjust
    adjust_data = {
        "productId": 1,
        "changeType": "IN",
        "quantity": 50,
        "note": "Nhập hàng test"
    }
    test_api("Điều chỉnh tồn kho (Nhập)", "POST", "/api/inventory/adjust", token, adjust_data)
    
    # 7. Test Invoices API
    print_header("7. TEST API HÓA ĐƠN (INVOICES)")
    test_api("Lấy tất cả hóa đơn", "GET", "/api/invoices?page=1&pageSize=10", token)
    test_api("Lấy hóa đơn ID=1", "GET", "/api/invoices/1", token)
    test_api("Tìm kiếm hóa đơn", "GET", "/api/invoices/search?keyword=INV", token)
    test_api("Báo cáo doanh thu hôm nay", "GET", "/api/invoices/reports/daily", token)
    
    # Create invoice
    invoice_data = {
        "items": [
            {"productId": 1, "quantity": 1, "unitPrice": 0}
        ],
        "paidAmount": 50000,
        "paymentMethod": "CASH",
        "note": "Test invoice"
    }
    test_api("Tạo hóa đơn mới", "POST", "/api/invoices", token, invoice_data)
    
    # 8. Test Reports API
    print_header("8. TEST API BÁO CÁO (REPORTS)")
    test_api("Báo cáo doanh thu theo ngày", "GET", "/api/reports/sales/daily", token)
    test_api("Báo cáo doanh thu theo tháng", "GET", "/api/reports/sales/monthly", token)
    test_api("Top sản phẩm bán chạy", "GET", "/api/reports/products/top-selling", token)
    test_api("Doanh thu theo danh mục", "GET", "/api/reports/sales/by-category", token)
    test_api("Top khách hàng", "GET", "/api/reports/customers/top", token)
    test_api("Dashboard Overview", "GET", "/api/reports/dashboard", token)
    test_api("Thống kê tồn kho", "GET", "/api/reports/inventory/summary", token)
    
    # 9. Test Shifts API
    print_header("9. TEST API CA LÀM VIỆC (SHIFTS)")
    test_api("Lấy tất cả ca làm việc", "GET", "/api/shifts", token)
    test_api("Lấy ca làm việc ID=1", "GET", "/api/shifts/1", token)
    test_api("Lấy ca hiện tại", "GET", "/api/shifts/current", token)
    test_api("Lấy báo cáo ca ID=1", "GET", "/api/shifts/1/report", token)
    
    # 10. Test Audit Logs API
    print_header("10. TEST API AUDIT LOGS")
    test_api("Lấy tất cả audit logs", "GET", "/api/auditlogs", token)
    test_api("Lấy audit log ID=1", "GET", "/api/auditlogs/1", token)
    test_api("Lấy logs theo user", "GET", "/api/auditlogs/user/1", token)
    test_api("Lấy logs theo table", "GET", "/api/auditlogs/table/Products", token)
    test_api("Lấy danh sách action types", "GET", "/api/auditlogs/actions", token)
    test_api("Lấy danh sách table names", "GET", "/api/auditlogs/tables", token)
    test_api("Thống kê audit logs", "GET", "/api/auditlogs/statistics", token)
    
    # 11. Test POS API
    print_header("11. TEST API POS")
    test_api("Lấy danh sách ngân hàng", "GET", "/api/pos/banks", token)
    
    scan_data = {"barcode": "123456789"}
    test_api("Quét mã vạch", "POST", "/api/pos/scan-barcode", token, scan_data)
    
    qr_data = {
        "accountNumber": "1234567890",
        "accountName": "NGUYEN VAN A",
        "bankName": "Vietcombank",
        "bankBin": "970436",
        "amount": 156000,
        "description": "HD156"
    }
    test_api("Tạo QR thanh toán", "POST", "/api/pos/qr-payment", token, qr_data)
    
    # 12. Test Users API
    print_header("12. TEST API USERS")
    test_api("Lấy tất cả users", "GET", "/api/users", token)
    test_api("Lấy user ID=1", "GET", "/api/users/1", token)
    
    # Print summary
    print_header("📊 TỔNG KẾT KẾT QUẢ TEST")
    print(f"{Colors.GREEN}✓ Thành công: {results['passed']}{Colors.END}")
    print(f"{Colors.RED}✗ Thất bại: {results['failed']}{Colors.END}")
    print(f"{Colors.BLUE}📊 Tổng số: {results['total']}{Colors.END}")
    print(f"{Colors.CYAN}📈 Tỷ lệ thành công: {(results['passed']/results['total']*100):.1f}%{Colors.END}")
    
    if results['failed'] > 0:
        print(f"\n{Colors.RED}{Colors.BOLD}Các test thất bại:{Colors.END}")
        for detail in results['details']:
            if detail['status'] == 'FAIL':
                print(f"  - {detail['name']}: {detail['message']}")
    
    return results['failed'] == 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
