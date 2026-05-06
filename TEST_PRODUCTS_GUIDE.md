# 🛍️ Hướng Dẫn Test API Products - SuperMarketMini

## 📋 Mục Lục
1. [Tổng quan API](#1-tổng-quan-api)
2. [Bảng Phân Quyền](#2-bảng-phân-quyền)
3. [Test CRUD Cơ Bản](#3-test-crud-cơ-bản)
4. [Test Validation](#4-test-validation)
5. [Test Phân Quyền](#5-test-phân-quyền)
6. [Test Search & Filter](#6-test-search--filter)
7. [Swagger UI Guide](#7-swagger-ui-guide)

---

## 1. Tổng quan API

### Các Endpoint

| Method | Endpoint | Permission | Mô tả |
|--------|----------|------------|-------|
| **GET** | `/api/products` | `products.view` | Lấy danh sách tất cả products |
| **GET** | `/api/products/{id}` | `products.view` | Lấy chi tiết product theo ID |
| **POST** | `/api/products` | `products.create` | Tạo product mới |
| **PUT** | `/api/products/{id}` | `products.edit` | Cập nhật product |
| **DELETE** | `/api/products/{id}` | `products.delete` | Xóa product |
| **GET** | `/api/products/search?keyword=xxx` | `products.view` | Tìm kiếm product |
| **GET** | `/api/products/low-stock?threshold=10` | `products.view` hoặc `inventory.view` | Lấy products sắp hết hàng |

---

## 2. Bảng Phân Quyền

| Role | View (Xem) | Create (Tạo) | Edit (Sửa) | Delete (Xóa) |
|------|:----------:|:------------:|:----------:|:------------:|
| **Admin** | ✅ | ✅ | ✅ | ✅ |
| **Manager** | ✅ | ✅ | ✅ | ✅ |
| **Warehouse** | ✅ | ✅ | ✅ | ❌ |
| **Cashier** | ✅ | ❌ | ❌ | ❌ |

---

## 3. Test CRUD Cơ Bản

### 3.1 Login để lấy Token

**Request:**
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "Admin@123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "fullName": "System Administrator",
    "username": "admin",
    "role": "Admin"
  }
}
```

---

### 3.2 Get All Products (Lấy danh sách)

**Request:**
```http
GET http://localhost:5000/api/products
Authorization: Bearer {your_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": 1,
      "name": "Coca Cola 330ml",
      "description": "Nước ngọt có ga",
      "sellPrice": 12000,
      "costPrice": 8000,
      "stockQuantity": 100,
      "unit": "lon",
      "barcode": "123456789",
      "isActive": true,
      "category": {
        "id": 1,
        "name": "Đồ uống"
      }
    }
  ]
}
```

---

### 3.3 Get Product By ID (Lấy chi tiết)

**Request:**
```http
GET http://localhost:5000/api/products/1
Authorization: Bearer {your_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Coca Cola 330ml",
    "description": "Nước ngọt có ga",
    "sellPrice": 12000,
    "costPrice": 8000,
    "stockQuantity": 100,
    "unit": "lon",
    "barcode": "123456789",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00",
    "updatedAt": "2024-01-15T10:30:00",
    "category": {
      "id": 1,
      "name": "Đồ uống"
    }
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Product not found"
}
```

---

### 3.4 Create Product (Tạo mới)

**Request:**
```http
POST http://localhost:5000/api/products
Content-Type: application/json
Authorization: Bearer {admin_token}

{
  "name": "Pepsi 330ml",
  "description": "Nước ngọt có ga vị cola",
  "sellPrice": 11000,
  "costPrice": 7500,
  "unit": "lon",
  "barcode": "PEPSI330001",
  "categoryId": 1,
  "minQuantity": 10,
  "maxQuantity": 500
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": 2,
    "name": "Pepsi 330ml",
    "description": "Nước ngọt có ga vị cola",
    "sellPrice": 11000,
    "costPrice": 7500,
    "unit": "lon",
    "barcode": "PEPSI330001",
    "isActive": true,
    "categoryId": 1,
    "stockQuantity": 0,
    "inventory": {
      "quantity": 0,
      "minQuantity": 10,
      "maxQuantity": 500
    },
    "createdAt": "2024-01-20T14:30:00"
  }
}
```

⚠️ **Lưu ý:**
- `stockQuantity` mặc định = 0 (sẽ được cập nhật qua Inventory)
- `categoryId` phải tồn tại trong bảng Categories
- `barcode` phải là duy nhất

---

### 3.5 Update Product (Cập nhật)

**Request:**
```http
PUT http://localhost:5000/api/products/2
Content-Type: application/json
Authorization: Bearer {admin_token}

{
  "name": "Pepsi 330ml - New",
  "sellPrice": 12000,
  "isActive": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "id": 2,
    "name": "Pepsi 330ml - New",
    "description": "Nước ngọt có ga vị cola",
    "sellPrice": 12000,
    "costPrice": 7500,
    "unit": "lon",
    "barcode": "PEPSI330001",
    "isActive": true,
    "categoryId": 1
  }
}
```

---

### 3.6 Delete Product (Xóa)

**Request:**
```http
DELETE http://localhost:5000/api/products/2
Authorization: Bearer {admin_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

## 4. Test Validation

### 4.1 Missing Required Fields

**Request:**
```http
POST http://localhost:5000/api/products
Content-Type: application/json
Authorization: Bearer {admin_token}

{
  "description": "Test product"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "Name": ["Product name is required"],
    "SellPrice": ["Sell price is required"],
    "CostPrice": ["Cost price is required"]
  }
}
```

---

### 4.2 Sell Price < Cost Price

**Request:**
```http
POST http://localhost:5000/api/products
Content-Type: application/json
Authorization: Bearer {admin_token}

{
  "name": "Test Product",
  "sellPrice": 5000,
  "costPrice": 8000,
  "unit": "pcs"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "SellPrice": ["Sell price cannot be less than cost price"]
  }
}
```

---

### 4.3 Duplicate Barcode

**Request:**
```http
POST http://localhost:5000/api/products
Content-Type: application/json
Authorization: Bearer {admin_token}

{
  "name": "Another Product",
  "sellPrice": 15000,
  "costPrice": 10000,
  "unit": "pcs",
  "barcode": "123456789"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "Barcode": ["Barcode '123456789' already exists"]
  }
}
```

---

### 4.4 Invalid Category ID

**Request:**
```http
POST http://localhost:5000/api/products
Content-Type: application/json
Authorization: Bearer {admin_token}

{
  "name": "Test Product",
  "sellPrice": 10000,
  "costPrice": 5000,
  "unit": "pcs",
  "categoryId": 9999
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "CategoryId": ["Category with Id 9999 does not exist"]
  }
}
```

---

## 5. Test Phân Quyền

### 5.1 Chuẩn bị - Tạo các tài khoản test

#### Tạo Cashier:
```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "fullName": "Test Cashier",
  "username": "testcashier",
  "password": "Test@123",
  "confirmPassword": "Test@123",
  "role": "Cashier"
}
```

#### Tạo Manager:
```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "fullName": "Test Manager",
  "username": "testmanager",
  "password": "Test@123",
  "confirmPassword": "Test@123",
  "role": "Manager"
}
```

#### Tạo Warehouse:
```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "fullName": "Test Warehouse",
  "username": "testwarehouse",
  "password": "Test@123",
  "confirmPassword": "Test@123",
  "role": "Warehouse"
}
```

---

### 5.2 Cashier - Chỉ được XEM

#### ✅ Cashier xem Products (Được phép)
```http
GET http://localhost:5000/api/products
Authorization: Bearer {cashier_token}
```
**Expected:** `200 OK`

#### ❌ Cashier tạo Product (KHÔNG được phép)
```http
POST http://localhost:5000/api/products
Content-Type: application/json
Authorization: Bearer {cashier_token}

{
  "name": "Test Product",
  "sellPrice": 10000,
  "costPrice": 5000,
  "unit": "pcs"
}
```
**Expected:** `403 Forbidden`

#### ❌ Cashier xóa Product (KHÔNG được phép)
```http
DELETE http://localhost:5000/api/products/1
Authorization: Bearer {cashier_token}
```
**Expected:** `403 Forbidden`

---

### 5.3 Manager - Được XEM/TẠO/SỬA/XÓA

#### ✅ Manager xem Products
```http
GET http://localhost:5000/api/products
Authorization: Bearer {manager_token}
```
**Expected:** `200 OK`

#### ✅ Manager tạo Product
```http
POST http://localhost:5000/api/products
Content-Type: application/json
Authorization: Bearer {manager_token}

{
  "name": "Manager Product",
  "sellPrice": 20000,
  "costPrice": 15000,
  "unit": "pcs"
}
```
**Expected:** `200 OK`

#### ✅ Manager xóa Product
```http
DELETE http://localhost:5000/api/products/3
Authorization: Bearer {manager_token}
```
**Expected:** `200 OK`

---

### 5.4 Warehouse - Được XEM/TẠO/SỬA, KHÔNG được XÓA

#### ✅ Warehouse xem Products
```http
GET http://localhost:5000/api/products
Authorization: Bearer {warehouse_token}
```
**Expected:** `200 OK`

#### ✅ Warehouse tạo Product
```http
POST http://localhost:5000/api/products
Content-Type: application/json
Authorization: Bearer {warehouse_token}

{
  "name": "Warehouse Product",
  "sellPrice": 25000,
  "costPrice": 18000,
  "unit": "box"
}
```
**Expected:** `200 OK`

#### ❌ Warehouse xóa Product (KHÔNG được phép)
```http
DELETE http://localhost:5000/api/products/1
Authorization: Bearer {warehouse_token}
```
**Expected:** `403 Forbidden`

---

### 5.5 Không Token - Tất cả đều bị từ chối

```http
GET http://localhost:5000/api/products
POST http://localhost:5000/api/products
DELETE http://localhost:5000/api/products/1
```
**Expected:** `401 Unauthorized`

---

## 6. Test Search & Filter

### 6.1 Search Products by Keyword

**Request:**
```http
GET http://localhost:5000/api/products/search?keyword=Coca
Authorization: Bearer {your_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "name": "Coca Cola 330ml",
      "sellPrice": 12000,
      "stockQuantity": 100,
      "barcode": "123456789"
    },
    {
      "id": 5,
      "name": "Coca Cola 1.5L",
      "sellPrice": 25000,
      "stockQuantity": 50,
      "barcode": "123456790"
    }
  ]
}
```

---

### 6.2 Get Low Stock Products

**Request:**
```http
GET http://localhost:5000/api/products/low-stock?threshold=20
Authorization: Bearer {your_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "threshold": 20,
  "count": 3,
  "data": [
    {
      "id": 3,
      "name": "Snack khoai tây",
      "stockQuantity": 15,
      "unit": "gói",
      "sellPrice": 8000
    },
    {
      "id": 7,
      "name": "Bánh quy",
      "stockQuantity": 8,
      "unit": "hộp",
      "sellPrice": 15000
    },
    {
      "id": 10,
      "name": "Nước suối 500ml",
      "stockQuantity": 5,
      "unit": "chai",
      "sellPrice": 5000
    }
  ]
}
```

---

## 7. Swagger UI Guide

### Bước 1: Khởi động ứng dụng

```bash
cd D:\SuperMakretMini\SuperMarketMini
dotnet run
```

Mở trình duyệt: **http://localhost:5000/swagger**

---

### Bước 2: Login và lấy Token

1. Tìm mục **Auth** → Click vào `POST /api/auth/login`
2. Click **Try it out**
3. Nhập JSON:
```json
{
  "username": "admin",
  "password": "Admin@123"
}
```
4. Click **Execute**
5. Copy giá trị `token` từ response

---

### Bước 3: Authorize Swagger

1. Click nút **Authorize** 🔓 (góc trên bên phải)
2. Nhập: `Bearer eyJhbGciOiJIUzI1NiIs...`
3. Click **Authorize** → **Close**

---

### Bước 4: Test Products API

#### Get All Products
1. Tìm **Products** → `GET /api/products`
2. Click **Try it out** → **Execute**
3. **Expected:** `200 OK` + danh sách products

#### Create Product
1. **Products** → `POST /api/products`
2. Click **Try it out**
3. Nhập JSON:
```json
{
  "name": "Test Product Swagger",
  "description": "Created from Swagger UI",
  "sellPrice": 15000,
  "costPrice": 10000,
  "unit": "pcs",
  "barcode": "SWAGGER001"
}
```
4. Click **Execute**
5. **Expected:** `200 OK`

#### Search Products
1. **Products** → `GET /api/products/search`
2. Nhập `keyword`: `Test`
3. Click **Execute**
4. **Expected:** `200 OK` + kết quả tìm kiếm

---

## 📋 Checklist Test

### CRUD Tests
- [ ] Get All Products → 200 OK
- [ ] Get Product by ID (tồn tại) → 200 OK
- [ ] Get Product by ID (không tồn tại) → 404 Not Found
- [ ] Create Product (hợp lệ) → 200 OK
- [ ] Update Product (hợp lệ) → 200 OK
- [ ] Delete Product → 200 OK

### Validation Tests
- [ ] Missing Name → 400 Bad Request
- [ ] Missing Price → 400 Bad Request
- [ ] SellPrice < CostPrice → 400 Bad Request
- [ ] Duplicate Barcode → 400 Bad Request
- [ ] Invalid CategoryId → 400 Bad Request

### Phân Quyền Tests
- [ ] Admin → Create Product → 200 OK
- [ ] Manager → Create Product → 200 OK
- [ ] Warehouse → Create Product → 200 OK
- [ ] Cashier → Create Product → 403 Forbidden
- [ ] Admin → Delete Product → 200 OK
- [ ] Manager → Delete Product → 200 OK
- [ ] Warehouse → Delete Product → 403 Forbidden
- [ ] Cashier → Delete Product → 403 Forbidden
- [ ] No Token → Any API → 401 Unauthorized

### Search & Filter Tests
- [ ] Search by keyword → 200 OK
- [ ] Get Low Stock → 200 OK

---

## 🔧 Sử dụng File HTTP Test

File `test-products.http` đã được tạo sẵn với đầy đủ các request test.

### Cách sử dụng:

1. **Cài đặt VS Code extension "REST Client"**
2. **Mở file `test-products.http`**
3. **Chạy từng request theo thứ tự:**
   - Click "Send Request" bên trên mừ request
   - Copy token từ response và cập nhật vào biến `@adminToken`, `@cashierToken`, v.v.

### Tài khoản test mặc định:

| Username | Password | Role |
|----------|----------|------|
| `admin` | `Admin@123` | Admin |
| `cashier` | `Cashier@123` | Cashier |

---

## 📝 Lưu ý Quan Trọng

1. **Stock Quantity**: Khi tạo product mới, `stockQuantity` mặc định = 0. Muốn nhập kho, sử dụng Inventory API.

2. **Barcode**: Phải là duy nhất, có thể để null nếu sản phẩm chưa có mã vạch.

3. **Category**: `categoryId` là optional, nhưng nếu cung cấp thì phải tồn tại.

4. **Giá**: `sellPrice` phải >= `costPrice` (không cho phép bán lỗ).

5. **Transaction**: Create Product sử dụng database transaction - nếu lỗi sẽ rollback hoàn toàn.
