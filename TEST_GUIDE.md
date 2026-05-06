# 🧪 Hướng Dẫn Test Logout & Phân Quyền

## 📋 Mục Lục
1. [Test Logout](#1-test-logout)
2. [Test Phân Quyền](#2-test-phân-quyền)
3. [Swagger UI Guide](#3-swagger-ui-guide)

---

## 1. Test Logout

### 1.1 Chuẩn bị - Login để lấy Token

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
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2g=...",
  "expiresAt": "2024-01-20T10:30:00",
  "user": {
    "id": 1,
    "fullName": "System Administrator",
    "username": "admin",
    "role": "Admin"
  }
}
```

---

### 1.2 Test Logout thành công

**Request:**
```http
POST http://localhost:5000/api/auth/logout
Authorization: Bearer {your_token_here}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 1.3 Verify - Thử Refresh Token sau Logout

**Request:**
```http
POST http://localhost:5000/api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "{refresh_token_from_login}"
}
```

**Expected Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid or expired refresh token"
}
```

✅ **Logout thành công!** Refresh token đã bị thu hồi.

---

### 1.4 Test Logout không có Token

**Request:**
```http
POST http://localhost:5000/api/auth/logout
```

**Expected:** `401 Unauthorized`

---

### 1.5 Test Logout với Token sai/expired

**Request:**
```http
POST http://localhost:5000/api/auth/logout
Authorization: Bearer invalid_token_here
```

**Expected:** `401 Unauthorized`

---

## 2. Test Phân Quyền

### Bảng Phân Quyền

| Role | Users | Products | Invoices | Inventory | Reports | Settings |
|------|-------|----------|----------|-----------|---------|----------|
| **Admin** | ✅✅✅✅ | ✅✅✅✅ | ✅✅✅✅ | ✅✅✅ | ✅✅ | ✅✅ |
| **Manager** | ❌ | ✅✅✅✅ | ✅✅✅✅ | ✅✅✅ | ✅✅ | ❌ |
| **Cashier** | ❌ | ✅ | ✅✅ | ❌ | ❌ | ❌ |
| **Warehouse** | ❌ | ✅✅✅ | ❌ | ✅✅✅ | ❌ | ❌ |

✅ = Có quyền | ❌ = Không có quyền

---

### 2.1 Test Admin có quyền Users API

```http
### Login Admin
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "Admin@123"
}

### Get Users (Admin có quyền)
GET http://localhost:5000/api/users
Authorization: Bearer {admin_token}
```

✅ **Expected:** `200 OK` + danh sách users

---

### 2.2 Test Cashier KHÔNG có quyền Users API

```http
### Register Cashier
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "fullName": "Test Cashier",
  "username": "testcashier",
  "password": "Test@123",
  "confirmPassword": "Test@123",
  "role": "Cashier"
}

### Login Cashier
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "username": "testcashier",
  "password": "Test@123"
}

### Get Users (Cashier KHÔNG có quyền)
GET http://localhost:5000/api/users
Authorization: Bearer {cashier_token}
```

❌ **Expected:** `403 Forbidden`

---

### 2.3 Test Cashier CÓ quyền xem Products

```http
GET http://localhost:5000/api/products
Authorization: Bearer {cashier_token}
```

✅ **Expected:** `200 OK` (có permission `products.view`)

---

### 2.4 Test Cashier KHÔNG được xóa Product

```http
DELETE http://localhost:5000/api/products/1
Authorization: Bearer {cashier_token}
```

❌ **Expected:** `403 Forbidden`

---

### 2.5 Test Manager

```http
### Register Manager
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "fullName": "Test Manager",
  "username": "testmanager",
  "password": "Test@123",
  "confirmPassword": "Test@123",
  "role": "Manager"
}

### Login Manager
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "username": "testmanager",
  "password": "Test@123"
}
```

| API | Expected |
|-----|----------|
| `GET /api/products` | ✅ 200 OK |
| `GET /api/users` | ❌ 403 Forbidden |

---

### 2.6 Test Không Token

```http
GET http://localhost:5000/api/users
GET http://localhost:5000/api/products
```

❌ **Expected:** `401 Unauthorized`

---

## 3. Swagger UI Guide

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

### Bước 4: Test API với Admin

#### ✅ Test Users API (Admin có quyền)
1. Tìm **Users** → `GET /api/users`
2. Click **Try it out** → **Execute**
3. **Expected:** `200 OK` + danh sách users

#### ✅ Test Logout
1. Tìm **Auth** → `POST /api/auth/logout`
2. Click **Try it out** → **Execute**
3. **Expected:** 
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Bước 5: Register & Test Cashier

#### 1. Register Cashier mới
- **Auth** → `POST /api/auth/register`
```json
{
  "fullName": "Test Cashier",
  "username": "testcashier",
  "password": "Test@123",
  "confirmPassword": "Test@123",
  "role": "Cashier"
}
```

#### 2. Login Cashier
- **Auth** → `POST /api/auth/login`
```json
{
  "username": "testcashier",
  "password": "Test@123"
}
```
- Copy token mới

#### 3. Update Authorization
- Click **Authorize** 🔓 → Xóa token cũ → Dán token Cashier → **Authorize**

#### 4. Test Users API (❌ Không được phép)
- **Users** → `GET /api/users` → **Execute**
- **Expected:** `403 Forbidden`

#### 5. Test Products API (✅ Được phép xem)
- **Products** → `GET /api/products` → **Execute**
- **Expected:** `200 OK`

---

## 📋 Checklist Test

### Logout Tests
- [ ] Login thành công, nhận được token
- [ ] Logout thành công với token hợp lệ
- [ ] Refresh token bị thu hồi sau logout
- [ ] Logout không có token → 401
- [ ] Logout với token sai → 401

### Phân Quyền Tests
- [ ] Admin → Users API → 200 OK
- [ ] Admin → Products API → 200 OK
- [ ] Cashier → Users API → 403 Forbidden
- [ ] Cashier → Products API → 200 OK
- [ ] Manager → Users API → 403 Forbidden
- [ ] Manager → Products API → 200 OK
- [ ] No Token → Any API → 401 Unauthorized

---

## 4. Test với ProductsController

ProductsController đã được tạo với đầy đủ các endpoint để test phân quyền:

| Endpoint | Method | Permission | Ai được phép |
|----------|--------|------------|--------------|
| `/api/products` | GET | products.view | Cashier, Manager, Admin, Warehouse |
| `/api/products/{id}` | GET | products.view | Cashier, Manager, Admin, Warehouse |
| `/api/products` | POST | products.create | Manager, Admin, Warehouse |
| `/api/products/{id}` | PUT | products.edit | Manager, Admin, Warehouse |
| `/api/products/{id}` | DELETE | products.delete | Manager, Admin |
| `/api/products/search` | GET | products.view | Cashier, Manager, Admin, Warehouse |
| `/api/products/low-stock` | GET | products.view hoặc inventory.view | Manager, Admin, Warehouse |

### 4.1 Tạo Product mới (Admin/Manager/Warehouse)

```http
POST http://localhost:5000/api/products
Content-Type: application/json
Authorization: Bearer {admin_token}

{
  "name": "Coca Cola 330ml",
  "description": "Nước ngọt có ga",
  "price": 12000,
  "costPrice": 8000,
  "stockQuantity": 100,
  "unit": "lon",
  "barcode": "123456789",
  "categoryId": 1
}
```

### 4.2 Test Cashier chỉ được xem Products

```http
### Cashier xem products ✅
GET http://localhost:5000/api/products
Authorization: Bearer {cashier_token}

### Cashier tạo product ❌ (403 Forbidden)
POST http://localhost:5000/api/products
Content-Type: application/json
Authorization: Bearer {cashier_token}

{
  "name": "Test Product",
  "price": 10000,
  "costPrice": 5000,
  "stockQuantity": 10,
  "unit": "pcs"
}
```

---

## 🔧 File HTTP Test

Sử dụng file `test-auth.http` với VS Code REST Client hoặc IntelliJ HTTP Client.

Tài khoản test sẵn:
| Username | Password | Role |
|----------|----------|------|
| `admin` | `Admin@123` | Admin |
| `cashier` | `Cashier@123` | Cashier |

### Cách chạy test:

1. **Khởi động API:**
```bash
cd D:\SuperMakretMini\SuperMarketMini
dotnet run
```

2. **Test với Swagger:**
   - Mở http://localhost:5000/swagger
   - Login → Authorize → Test các API

3. **Test với file .http:**
   - Cài extension "REST Client" trong VS Code
   - Mở file `test-auth.http`
   - Click "Send Request" trên từng request
