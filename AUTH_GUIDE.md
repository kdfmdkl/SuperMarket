# Hướng Dẫn Sử Dụng Hệ Thống Authentication

## 📋 Tổng Quan

Hệ thống Authentication đã được triển khai đầy đủ 4 chức năng:

| Chức năng | Mô tả | Endpoint |
|-----------|-------|----------|
| **1. Register** | Đăng ký tài khoản mới | `POST /api/auth/register` |
| **2. Login** | Đăng nhập, nhận JWT Token | `POST /api/auth/login` |
| **3. JWT Token** | Sử dụng token để gọi API | Header: `Authorization: Bearer {token}` |
| **4. Authorization** | Phân quyền theo Role/Permission | `[RoleAuthorize]`, `[PermissionAuthorize]` |

---

## 🔐 1. Register (Đăng Ký)

### Endpoint
```http
POST /api/auth/register
```

### Request Body
```json
{
  "fullName": "Nguyen Van A",
  "username": "nguyenvana",
  "password": "Password123!",
  "confirmPassword": "Password123!",
  "phone": "0123456789",
  "role": "Cashier"
}
```

### Response Success (200)
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 3,
    "fullName": "Nguyen Van A",
    "username": "nguyenvana",
    "role": "Cashier",
    "permissions": []
  }
}
```

### Lưu ý
- Role mặc định là `Cashier` nếu không chỉ định
- Các role hợp lệ: `Admin`, `Manager`, `Cashier`, `Warehouse`

---

## 🔑 2. Login (Đăng Nhập)

### Endpoint
```http
POST /api/auth/login
```

### Request Body
```json
{
  "username": "admin",
  "password": "Admin@123"
}
```

### Response Success (200)
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4=...",
  "expiresAt": "2024-01-20T10:30:00",
  "user": {
    "id": 1,
    "fullName": "System Administrator",
    "username": "admin",
    "role": "Admin",
    "permissions": [
      "users.view",
      "users.create",
      "users.edit",
      "users.delete",
      "products.view",
      ...
    ]
  }
}
```

### Test Users (Đã tạo sẵn)
| Username | Password | Role |
|----------|----------|------|
| `admin` | `Admin@123` | Admin |
| `cashier` | `Cashier@123` | Cashier |

---

## 🎫 3. JWT Token

### Cấu trúc Token
Token chứa các claims:
- `UserId` - ID của user
- `unique_name` - Username
- `name` - FullName
- `role` - Role của user
- `Permission` - Danh sách permissions

### Sử dụng Token
Thêm vào Header của mọi request:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Refresh Token
```http
POST /api/auth/refresh-token
```
```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4=..."
}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer {token}
```

---

## 🛡️ 4. Authorization (Phân Quyền)

### 4.1 Role-Based Authorization

Sử dụng attribute `[RoleAuthorize]`:

```csharp
// Chỉ Admin mới được truy cập
[RoleAuthorize("Admin")]
[HttpGet("admin/dashboard")]
public IActionResult GetAdminDashboard() { }

// Admin hoặc Manager đều được truy cập
[RoleAuthorize("Admin", "Manager")]
[HttpPost]
public async Task<IActionResult> CreateUser() { }
```

### 4.2 Permission-Based Authorization

Sử dụng attribute `[PermissionAuthorize]`:

```csharp
// Cần có permission "users.view"
[PermissionAuthorize("users.view")]
[HttpGet]
public async Task<IActionResult> GetAllUsers() { }

// Cần có permission "users.create" HOẶC "users.edit"
[PermissionAuthorize("users.create", "users.edit")]
[HttpPost]
public async Task<IActionResult> CreateUser() { }
```

### 4.3 Kết hợp cả Role và Permission

```csharp
[RoleAuthorize("Admin", "Manager")]
[PermissionAuthorize("users.create")]
[HttpPost]
public async Task<IActionResult> CreateUser() { }
```

### 4.4 Các Permission có sẵn

| Module | Permissions |
|--------|-------------|
| **Users** | `users.view`, `users.create`, `users.edit`, `users.delete` |
| **Products** | `products.view`, `products.create`, `products.edit`, `products.delete` |
| **Invoices** | `invoices.view`, `invoices.create`, `invoices.edit`, `invoices.delete` |
| **Inventory** | `inventory.view`, `inventory.create`, `inventory.edit` |
| **Reports** | `reports.view`, `reports.export` |
| **Settings** | `settings.view`, `settings.edit` |

### 4.5 Phân quyền theo Role mặc định

| Role | Permissions |
|------|-------------|
| **Admin** | Tất cả permissions |
| **Manager** | Tất cả trừ `users.*` và `settings.*` |
| **Cashier** | `invoices.view`, `invoices.create`, `products.view` |
| **Warehouse** | `inventory.*`, `products.view`, `products.create`, `products.edit` |

---

## 📁 Cấu Trúc Files

```
SuperMarketMini/
├── Controllers/
│   ├── AuthController.cs          # Login, Register, Logout, Refresh Token
│   └── UsersController.cs         # Ví dụ phân quyền
├── Services/
│   ├── IAuthService.cs            # Interface cho Auth
│   ├── AuthService.cs             # Xử lý Register
│   ├── IJwtService.cs             # Interface cho JWT
│   └── JwtService.cs              # Xử lý JWT, Login
├── DTOs/Auth/
│   ├── RegisterRequest.cs         # DTO cho Register
│   ├── RegisterResponse.cs        # DTO response Register
│   ├── LoginRequest.cs            # DTO cho Login
│   ├── LoginResponse.cs           # DTO response Login
│   ├── RefreshTokenRequest.cs     # DTO cho Refresh Token
│   └── ChangePasswordRequest.cs   # DTO cho đổi mật khẩu
├── Attributes/
│   ├── RoleAuthorizeAttribute.cs      # Attribute phân quyền theo Role
│   └── PermissionAuthorizeAttribute.cs # Attribute phân quyền theo Permission
├── Data/
│   └── DbInitializer.cs           # Seed data (Roles, Permissions, Admin user)
└── Program.cs                     # Cấu hình Authentication & Authorization
```

---

## 🚀 Cách Sử Dụng Trong Controller Mới

### Bước 1: Thêm `[Authorize]` cho controller
```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize] // Yêu cầu đăng nhập
public class ProductsController : ControllerBase
{
    // ...
}
```

### Bước 2: Phân quyền cho từng action
```csharp
// Ai cũng xem được
[AllowAnonymous]
[HttpGet]
public async Task<IActionResult> GetProducts() { }

// Cần đăng nhập
[HttpGet("{id}")]
public async Task<IActionResult> GetProduct(int id) { }

// Cần permission cụ thể
[PermissionAuthorize("products.create")]
[HttpPost]
public async Task<IActionResult> CreateProduct() { }

// Cần role cụ thể
[RoleAuthorize("Admin", "Manager")]
[HttpDelete("{id}")]
public async Task<IActionResult> DeleteProduct(int id) { }
```

---

## 📝 Ví Dụ Flow Hoàn Chỉnh

### 1. Đăng ký tài khoản mới
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "username": "testuser",
    "password": "Test@123",
    "confirmPassword": "Test@123",
    "role": "Cashier"
  }'
```

### 2. Đăng nhập
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test@123"
  }'
```

### 3. Gọi API với Token
```bash
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## ⚙️ Cấu Hình JWT

Trong `appsettings.json`:
```json
{
  "JwtSettings": {
    "SecretKey": "YourSuperSecretKeyForJWTTokenGeneration2024!@#SuperMarketMini",
    "Issuer": "SuperMarketMiniAPI",
    "Audience": "SuperMarketMiniClient",
    "ExpiryMinutes": "60"
  }
}
```

---

## 🔧 Testing với Swagger

1. Mở Swagger UI: `http://localhost:5000/swagger`
2. Click vào nút **Authorize** 🔓
3. Nhập: `Bearer your_jwt_token_here`
4. Click **Authorize**
5. Tất cả các request sẽ tự động gửi kèm token

---

## ✅ Checklist Triển Khai

- [x] Register - Đăng ký với role mặc định (Cashier)
- [x] Login - Xác thực và trả về JWT
- [x] JWT Token - Chứa UserId, Username, Role, Permissions
- [x] Authorization - Phân quyền theo Role và Permission
- [x] Refresh Token - Làm mới token
- [x] Logout - Thu hồi refresh token
- [x] Seed Data - Tạo sẵn Roles, Permissions, Admin user
- [x] Custom Attributes - `[RoleAuthorize]`, `[PermissionAuthorize]`
