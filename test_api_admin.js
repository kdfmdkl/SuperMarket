/**
 * Script kiểm tra toàn bộ API với quyền Admin
 * SuperMarketMini API Test Suite
 */

const http = require('http');

// Cấu hình
const BASE_URL = 'localhost';
const PORT = 5000;
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'Admin@123'
};

// Màu sắc cho terminal
const Colors = {
    GREEN: '\x1b[92m',
    RED: '\x1b[91m',
    YELLOW: '\x1b[93m',
    BLUE: '\x1b[94m',
    CYAN: '\x1b[96m',
    BOLD: '\x1b[1m',
    END: '\x1b[0m'
};

// Kết quả test
const results = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
};

function printHeader(text) {
    console.log(`\n${Colors.CYAN}${Colors.BOLD}${'='.repeat(60)}${Colors.END}`);
    console.log(`${Colors.CYAN}${Colors.BOLD} ${text}${Colors.END}`);
    console.log(`${Colors.CYAN}${Colors.BOLD}${'='.repeat(60)}${Colors.END}\n`);
}

function printTest(name, status, code = null, message = '') {
    results.total++;
    const icon = status === 'PASS' ? `${Colors.GREEN}✓${Colors.END}` : `${Colors.RED}✗${Colors.END}`;
    const statusColor = status === 'PASS' ? `${Colors.GREEN}PASS${Colors.END}` : `${Colors.RED}FAIL${Colors.END}`;
    
    if (status === 'PASS') {
        results.passed++;
    } else {
        results.failed++;
    }
    
    const codeStr = code ? ` [${code}]` : '';
    const msgStr = message ? ` - ${message}` : '';
    console.log(`${icon} ${name}${codeStr} -> ${statusColor}${msgStr}`);
    
    results.details.push({
        name,
        status,
        code,
        message
    });
}

function makeRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: BASE_URL,
            port: PORT,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    body: data
                });
            });
        });
        
        req.on('error', (err) => {
            reject(err);
        });
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

async function testAPI(name, method, endpoint, token = null, data = null, expectedStatus = null) {
    try {
        const response = await makeRequest(method, endpoint, data, token);
        
        if (expectedStatus && response.statusCode === expectedStatus) {
            printTest(name, 'PASS', response.statusCode);
        } else if (!expectedStatus && response.statusCode < 400) {
            printTest(name, 'PASS', response.statusCode);
        } else {
            const msg = response.body ? response.body.substring(0, 100) : '';
            printTest(name, 'FAIL', response.statusCode, msg);
        }
        
        return response;
    } catch (err) {
        printTest(name, 'FAIL', null, err.message);
        return null;
    }
}

async function main() {
    printHeader('🔐 SUPERMARKETMINI API TEST - QUYỀN ADMIN');
    
    // 1. Test Auth API
    printHeader('1. TEST API XÁC THỰC (AUTH)');
    
    // Login
    let token = null;
    try {
        const loginRes = await makeRequest('POST', '/api/auth/login', ADMIN_CREDENTIALS);
        if (loginRes.statusCode === 200) {
            const loginData = JSON.parse(loginRes.body);
            if (loginData.success) {
                token = loginData.token;
                printTest('Đăng nhập Admin', 'PASS', 200);
                console.log(`  ${Colors.YELLOW}→ Token nhận được: ${token.substring(0, 50)}...${Colors.END}`);
            } else {
                printTest('Đăng nhập Admin', 'FAIL', 200, 'Không có token');
                return;
            }
        } else {
            printTest('Đăng nhập Admin', 'FAIL', loginRes.statusCode);
            return;
        }
    } catch (err) {
        printTest('Đăng nhập Admin', 'FAIL', null, err.message);
        return;
    }
    
    // Get Me
    await testAPI('Lấy thông tin user hiện tại', 'GET', '/api/auth/me', token);
    
    // 2. Test Categories API
    printHeader('2. TEST API DANH MỤC (CATEGORIES)');
    await testAPI('Lấy tất cả danh mục', 'GET', '/api/categories', token);
    await testAPI('Lấy danh mục gốc', 'GET', '/api/categories/roots', token);
    await testAPI('Lấy chi tiết danh mục ID=1', 'GET', '/api/categories/1', token);
    
    // Create category
    const catData = {
        name: `Test Category ${Date.now()}`,
        sortOrder: 1,
        isActive: true
    };
    await testAPI('Tạo danh mục mới', 'POST', '/api/categories', token, catData);
    
    // 3. Test Products API
    printHeader('3. TEST API SẢN PHẨM (PRODUCTS)');
    await testAPI('Lấy tất cả sản phẩm', 'GET', '/api/products', token);
    await testAPI('Lấy sản phẩm ID=1', 'GET', '/api/products/1', token);
    await testAPI('Tìm kiếm sản phẩm', 'GET', '/api/products/search?keyword=Coca', token);
    await testAPI('Lấy sản phẩm sắp hết hàng', 'GET', '/api/products/low-stock?threshold=20', token);
    
    // Create product
    const prodData = {
        name: `Test Product ${Date.now()}`,
        description: 'Product created by API test',
        sellPrice: 25000,
        costPrice: 18000,
        unit: 'hộp',
        barcode: `TEST${Date.now()}`,
        minQuantity: 10,
        maxQuantity: 200
    };
    await testAPI('Tạo sản phẩm mới', 'POST', '/api/products', token, prodData);
    
    // 4. Test Customers API
    printHeader('4. TEST API KHÁCH HÀNG (CUSTOMERS)');
    await testAPI('Lấy tất cả khách hàng', 'GET', '/api/customers', token);
    await testAPI('Lấy khách hàng ID=1', 'GET', '/api/customers/1', token);
    
    // Create customer
    const custData = {
        fullName: `Test Customer ${Date.now()}`,
        phone: `0909${Date.now().toString().slice(-6)}`,
        email: `test${Date.now()}@test.com`
    };
    await testAPI('Tạo khách hàng mới', 'POST', '/api/customers', token, custData);
    await testAPI('Tìm kiếm khách hàng nhanh', 'GET', '/api/customers/search/quick?keyword=Test', token);
    
    // 5. Test Suppliers API
    printHeader('5. TEST API NHÀ CUNG CẤP (SUPPLIERS)');
    await testAPI('Lấy tất cả nhà cung cấp', 'GET', '/api/suppliers', token);
    await testAPI('Lấy nhà cung cấp ID=1', 'GET', '/api/suppliers/1', token);
    
    // Create supplier
    const supData = {
        name: `Test Supplier ${Date.now()}`,
        phone: `028${Date.now().toString().slice(-6)}`,
        email: `supplier${Date.now()}@test.com`,
        address: '123 Test Street'
    };
    await testAPI('Tạo nhà cung cấp mới', 'POST', '/api/suppliers', token, supData);
    
    // 6. Test Inventory API
    printHeader('6. TEST API KHO HÀNG (INVENTORY)');
    await testAPI('Lấy danh sách tồn kho', 'GET', '/api/inventory?page=1&pageSize=20', token);
    await testAPI('Lấy chi tiết tồn kho ID=1', 'GET', '/api/inventory/1', token);
    await testAPI('Lấy tồn kho theo Product ID=1', 'GET', '/api/inventory/product/1', token);
    await testAPI('Lấy sản phẩm sắp hết hàng (Low Stock)', 'GET', '/api/inventory/low-stock', token);
    await testAPI('Lấy sản phẩm hết hàng (Out of Stock)', 'GET', '/api/inventory/out-of-stock', token);
    await testAPI('Lấy thống kê tồn kho', 'GET', '/api/inventory/summary', token);
    await testAPI('Lấy logs tồn kho', 'GET', '/api/inventory/logs?page=1&pageSize=20', token);
    
    // Inventory adjust
    const adjustData = {
        productId: 1,
        changeType: 'IN',
        quantity: 50,
        note: 'Nhập hàng test'
    };
    await testAPI('Điều chỉnh tồn kho (Nhập)', 'POST', '/api/inventory/adjust', token, adjustData);
    
    // 7. Test Invoices API
    printHeader('7. TEST API HÓA ĐƠN (INVOICES)');
    await testAPI('Lấy tất cả hóa đơn', 'GET', '/api/invoices?page=1&pageSize=10', token);
    await testAPI('Lấy hóa đơn ID=1', 'GET', '/api/invoices/1', token);
    await testAPI('Tìm kiếm hóa đơn', 'GET', '/api/invoices/search?keyword=INV', token);
    await testAPI('Báo cáo doanh thu hôm nay', 'GET', '/api/invoices/reports/daily', token);
    
    // Create invoice
    const invoiceData = {
        items: [
            { productId: 1, quantity: 1, unitPrice: 0 }
        ],
        paidAmount: 50000,
        paymentMethod: 'CASH',
        note: 'Test invoice'
    };
    await testAPI('Tạo hóa đơn mới', 'POST', '/api/invoices', token, invoiceData);
    
    // 8. Test Reports API
    printHeader('8. TEST API BÁO CÁO (REPORTS)');
    await testAPI('Báo cáo doanh thu theo ngày', 'GET', '/api/reports/sales/daily', token);
    await testAPI('Báo cáo doanh thu theo tháng', 'GET', '/api/reports/sales/monthly', token);
    await testAPI('Top sản phẩm bán chạy', 'GET', '/api/reports/products/top-selling', token);
    await testAPI('Doanh thu theo danh mục', 'GET', '/api/reports/sales/by-category', token);
    await testAPI('Top khách hàng', 'GET', '/api/reports/customers/top', token);
    await testAPI('Dashboard Overview', 'GET', '/api/reports/dashboard', token);
    await testAPI('Thống kê tồn kho', 'GET', '/api/reports/inventory/summary', token);
    
    // 9. Test Shifts API
    printHeader('9. TEST API CA LÀM VIỆC (SHIFTS)');
    await testAPI('Lấy tất cả ca làm việc', 'GET', '/api/shifts', token);
    await testAPI('Lấy ca làm việc ID=1', 'GET', '/api/shifts/1', token);
    await testAPI('Lấy ca hiện tại', 'GET', '/api/shifts/current', token);
    await testAPI('Lấy báo cáo ca ID=1', 'GET', '/api/shifts/1/report', token);
    
    // 10. Test Audit Logs API
    printHeader('10. TEST API AUDIT LOGS');
    await testAPI('Lấy tất cả audit logs', 'GET', '/api/auditlogs', token);
    await testAPI('Lấy audit log ID=1', 'GET', '/api/auditlogs/1', token);
    await testAPI('Lấy logs theo user', 'GET', '/api/auditlogs/user/1', token);
    await testAPI('Lấy logs theo table', 'GET', '/api/auditlogs/table/Products', token);
    await testAPI('Lấy danh sách action types', 'GET', '/api/auditlogs/actions', token);
    await testAPI('Lấy danh sách table names', 'GET', '/api/auditlogs/tables', token);
    await testAPI('Thống kê audit logs', 'GET', '/api/auditlogs/statistics', token);
    
    // 11. Test POS API
    printHeader('11. TEST API POS');
    await testAPI('Lấy danh sách ngân hàng', 'GET', '/api/pos/banks', token);
    
    const scanData = { barcode: '123456789' };
    await testAPI('Quét mã vạch', 'POST', '/api/pos/scan-barcode', token, scanData);
    
    const qrData = {
        accountNumber: '1234567890',
        accountName: 'NGUYEN VAN A',
        bankName: 'Vietcombank',
        bankBin: '970436',
        amount: 156000,
        description: 'HD156'
    };
    await testAPI('Tạo QR thanh toán', 'POST', '/api/pos/qr-payment', token, qrData);
    
    // 12. Test Users API
    printHeader('12. TEST API USERS');
    await testAPI('Lấy tất cả users', 'GET', '/api/users', token);
    await testAPI('Lấy user ID=1', 'GET', '/api/users/1', token);
    
    // Print summary
    printHeader('📊 TỔNG KẾT KẾT QUẢ TEST');
    console.log(`${Colors.GREEN}✓ Thành công: ${results.passed}${Colors.END}`);
    console.log(`${Colors.RED}✗ Thất bại: ${results.failed}${Colors.END}`);
    console.log(`${Colors.BLUE}📊 Tổng số: ${results.total}${Colors.END}`);
    console.log(`${Colors.CYAN}📈 Tỷ lệ thành công: ${(results.passed/results.total*100).toFixed(1)}%${Colors.END}`);
    
    if (results.failed > 0) {
        console.log(`\n${Colors.RED}${Colors.BOLD}Các test thất bại:${Colors.END}`);
        results.details.forEach(detail => {
            if (detail.status === 'FAIL') {
                console.log(`  - ${detail.name}: ${detail.message}`);
            }
        });
    }
    
    return results.failed === 0;
}

main().then(success => {
    process.exit(success ? 0 : 1);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
