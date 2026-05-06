# 🔧 Fix Lỗi JSON Property Name Collision trong ASP.NET Core

## 📌 Lỗi gặp phải

```
System.InvalidOperationException:
The JSON property name for 'SuperMarketMini.Controllers.AuditLogDetailDto.username' 
collides with another property.
```

## 🔍 Nguyên nhân

### 1.1 Vấn đề cốt lõi

Trong `AuditLogDetailDto` có **2 properties với tên gần giống nhau**:

```csharp
public class AuditLogDetailDto
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public string? UserName { get; set; }    // ← PascalCase: User + Name
    public string? Username { get; set; }    // ← lowercase: Username
    // ...
}
```

### 1.2 Tại sao gây lỗi?

| Khía cạnh | Giải thích |
|-----------|------------|
| **System.Text.Json** | Mặc định chuyển property thành **camelCase** |
| **Case-Insensitive** | `UserName` → `userName`, `Username` → `username` |
| **Collision** | Cả 2 đều thành `username` khi serialize → **TRÙNG TÊN** |
| **Exception** | JSON serializer không biết map vào property nào |

### 1.3 Các trường hợp gây trùng property

```csharp
// ❌ Case khác nhau nhưng giống nhau khi lowercase
public string? UserName { get; set; }
public string? Username { get; set; }
public string? userName { get; set; }
public string? USERNAME { get; set; }
// Tất cả đều thành "username" khi serialize

// ❌ Dùng JsonPropertyName trùng nhau
[JsonPropertyName("user")]
public string? UserName { get; set; }

[JsonPropertyName("user")]  // ← TRÙNG!
public string? Username { get; set; }

// ❌ Inheritance ghi đè property trùng tên
public class BaseDto
{
    public string? Name { get; set; }
}

public class DetailDto : BaseDto
{
    public new string? Name { get; set; }  // ← Collision với base
}

// ❌ AutoMapper map từ nhiều nguồn
CreateMap<Entity, Dto>()
    .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.FullName))
    .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.Username)); // ← Ghi đè!
```

---

## ⚡ CÁCH FIX

### Cách 1: Đổi tên property (✅ KHUYẾN NGHỊ)

```csharp
// ✅ SỬA: Đặt tên rõ ràng, không trùng
public class AuditLogDetailDto
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    
    // Thay vì UserName + Username
    public string? UserFullName { get; set; }    // ← Full name của user
    public string? UserUsername { get; set; }    // ← Username đăng nhập
    
    public string Action { get; set; } = string.Empty;
    public string? TableName { get; set; }
    public int? RecordId { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string? IpAddress { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

**JSON Output:**
```json
{
  "id": 1,
  "userId": 1,
  "userFullName": "System Administrator",
  "userUsername": "admin",
  "action": "LOGIN"
}
```

---

### Cách 2: Dùng JsonPropertyName để đặt tên JSON khác

```csharp
public class AuditLogDetailDto
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    
    [JsonPropertyName("fullName")]      // ← Tên JSON riêng biệt
    public string? UserName { get; set; }
    
    [JsonPropertyName("username")]      // ← Tên JSON riêng biệt
    public string? Username { get; set; }
    
    public string Action { get; set; } = string.Empty;
}
```

**JSON Output:**
```json
{
  "id": 1,
  "userId": 1,
  "fullName": "System Administrator",
  "username": "admin"
}
```

---

### Cách 3: Xóa property không cần thiết

```csharp
public class AuditLogDetailDto
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    
    // Chỉ giữ 1 property
    public string? UserDisplayName { get; set; }
    // public string? Username { get; set; }  // ← XÓA
    
    public string Action { get; set; } = string.Empty;
}
```

---

### Cách 4: Dùng JsonIgnore để bỏ qua property

```csharp
public class AuditLogDetailDto
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    
    public string? UserName { get; set; }
    
    [JsonIgnore]  // ← Không serialize property này
    public string? Username { get; set; }
    
    public string Action { get; set; } = string.Empty;
}
```

---

## 🎯 CODE TRƯỚC VÀ SAU KHI FIX

### ❌ TRƯỚC (LỖI)

```csharp
// AuditLogsController.cs
public class AuditLogDetailDto
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public string? UserName { get; set; }    // ← "userName" khi serialize
    public string? Username { get; set; }    // ← "username" khi serialize
    // Collision: userName vs username (case-insensitive = trùng!)
    public string Action { get; set; } = string.Empty;
}

// Usage
return Ok(new
{
    Data = new AuditLogDetailDto
    {
        UserName = auditLog.User?.FullName,   // "System Administrator"
        Username = auditLog.User?.Username    // "admin"
    }
});
```

**Lỗi:**
```
System.InvalidOperationException: 
The JSON property name for '...AuditLogDetailDto.username' collides with another property.
```

---

### ✅ SAU (ĐÃ FIX)

```csharp
// AuditLogsController.cs
public class AuditLogDetailDto
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public string? UserFullName { get; set; }    // ← "userFullName"
    public string? UserUsername { get; set; }    // ← "userUsername"
    // Không còn collision!
    public string Action { get; set; } = string.Empty;
}

// Usage
return Ok(new
{
    Data = new AuditLogDetailDto
    {
        UserFullName = auditLog.User?.FullName,   // "System Administrator"
        UserUsername = auditLog.User?.Username    // "admin"
    }
});
```

**JSON Output:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 1,
    "userFullName": "System Administrator",
    "userUsername": "admin",
    "action": "LOGIN"
  }
}
```

---

## 🛡️ BEST PRACTICES - Tránh lỗi trong tương lai

### 1. Đặt tên property rõ ràng

```csharp
// ✅ Tốt
public string? UserFullName { get; set; }
public string? UserLoginName { get; set; }
public string? UserEmail { get; set; }

// ❌ Tránh
public string? UserName { get; set; }
public string? Username { get; set; }
public string? userName { get; set; }
```

### 2. Dùng prefix/suffix phân biệt

```csharp
// ✅ Tốt - prefix
public string? CustomerName { get; set; }
public string? ProductName { get; set; }
public string? CategoryName { get; set; }

// ✅ Tốt - suffix
public string? NameText { get; set; }
public string? NameDisplay { get; set; }
```

### 3. Thống nhất naming convention

```csharp
// Chọn 1 style và dùng xuyên suốt
public class NamingConvention
{
    // PascalCase cho tất cả
    public string? UserName { get; set; }
    public string? FullName { get; set; }
    public string? DisplayName { get; set; }
}
```

### 4. Dùng analyzer để phát hiện sớm

```csharp
// Thêm vào .editorconfig
dotnet_diagnostic.CA1720.severity = warning  // Identifier contains type name
dotnet_diagnostic.CA1707.severity = warning  // Identifiers should not contain underscores
```

### 5. Viết unit test cho DTO

```csharp
[Fact]
public void AuditLogDetailDto_ShouldSerializeWithoutCollision()
{
    // Arrange
    var dto = new AuditLogDetailDto
    {
        UserFullName = "Test User",
        UserUsername = "testuser"
    };
    
    // Act
    var json = JsonSerializer.Serialize(dto);
    
    // Assert
    Assert.Contains("userFullName", json);
    Assert.Contains("userUsername", json);
}
```

---

## 🎓 Tóm tắt

| Vấn đề | Cách fix |
|--------|----------|
| `UserName` vs `Username` | Đổi thành `UserFullName` vs `UserUsername` |
| Property trùng khi lowercase | Dùng tên phân biệt rõ ràng |
| Cần giữ cả 2 property | Dùng `[JsonPropertyName]` để đặt tên JSON khác |
| Không cần property | Dùng `[JsonIgnore]` |

**Nguyên tắc vàng:** Mỗi property trong DTO phải có tên JSON duy nhất sau khi chuyển đổi case.
