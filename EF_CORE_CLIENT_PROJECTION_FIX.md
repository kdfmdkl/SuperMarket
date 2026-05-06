# 🔧 EF Core Client Projection Error - Hướng dẫn sửa lỗi

## 📌 Lỗi gặp phải

```
System.InvalidOperationException: 
The client projection contains a reference to a constant expression of 'QrLogsController' 
through the instance method 'MaskAccountNumber'. 
This could potentially cause a memory leak; consider making the method static.
```

## 1. 🔍 Nguyên nhân lỗi

### 1.1 Vấn đề cốt lõi

Khi bạn viết LINQ query với EF Core như sau:

```csharp
var logs = await query
    .Select(l => new QrLogDto
    {
        Id = l.Id,
        AccountNumber = MaskAccountNumber(l.AccountNumber), // ❌ LỖI Ở ĐÂY
        // ...
    })
    .ToListAsync();
```

**Vấn đề:**
- `MaskAccountNumber` là một **instance method** (phương thức thực thể) của `QrLogsController`
- EF Core cố gắng translate câu query này thành SQL
- Nhưng SQL Server không hiểu được `MaskAccountNumber` là gì vì đó là code C#
- EF Core phải giữ reference đến instance của controller để thực thi method này
- Điều này tạo ra **memory leak potential** vì EF Core cache query plan và giữ reference

### 1.2 Tại sao EF Core báo lỗi?

| Khía cạnh | Giải thích |
|-----------|------------|
| **Query Translation** | EF Core cố dịch LINQ → SQL, nhưng không thể dịch instance method |
| **Memory Leak** | EF Core cache query plan + giữ reference đến controller instance |
| **Client Evaluation** | EF Core buộc phải evaluate ở client (C#), không phải SQL Server |
| **Constant Expression** | Instance method tạo ra constant expression chứa tham chiếu đến `this` |

## 2. ⚡ Các cách sửa lỗi - So sánh chi tiết

### Cách 1: Dùng `ToList()` trước rồi `Select` (❌ KHÔNG NÊN)

```csharp
// ❌ Load TẤT CẢ dữ liệu về memory trước
var logs = (await query.ToListAsync()) // Load hết columns
    .Select(l => new QrLogDto
    {
        Id = l.Id,
        AccountNumber = MaskAccountNumber(l.AccountNumber),
        // ...
    })
    .ToList();
```

| Ưu điểm | Nhược điểm |
|---------|------------|
| Đơn giản | Load TẤT CẢ columns từ database |
| Hoạt động được | Không thể phân trang ở SQL |
| | Memory usage cao |
| | Hiệu năng KÉM với dữ liệu lớn |

**Khi nào dùng:** Chỉ khi query trả về ít dữ liệu (< 100 records)

---

### Cách 2: Dùng `AsEnumerable()` (❌ CŨNG KHÔNG NÊN)

```csharp
// ❌ Tương tự ToList(), nhưng deferred execution
var logs = await query
    .AsEnumerable() // Switch to LINQ-to-Objects
    .Select(l => new QrLogDto
    {
        Id = l.Id,
        AccountNumber = MaskAccountNumber(l.AccountNumber),
        // ...
    })
    .ToList();
```

| Ưu điểm | Nhược điểm |
|---------|------------|
| Deferred execution | Vẫn load tất cả columns |
| | Không thể dùng `Skip/Take` sau khi AsEnumerable |
| | Phân trang phải xử lý ở memory |

**Kết luận:** Tương tự Cách 1, không cải thiện được gì

---

### Cách 3: Chuyển method sang `static` (✅ TỐT)

```csharp
public class QrLogsController : ControllerBase
{
    // ...
    
    // ✅ Static method - không cần instance
    private static string MaskAccountNumber(string accountNumber)
    {
        if (string.IsNullOrEmpty(accountNumber) || accountNumber.Length <= 4)
            return accountNumber;
        return "****" + accountNumber[^4..];
    }
}
```

| Ưu điểm | Nhược điểm |
|---------|------------|
| EF Core có thể dùng được | Logic che dữ liệu nằm trong Controller |
| Không memory leak | Không tái sử dụng ở nơi khác |
| Query vẫn optimize được | Vi phạm Single Responsibility Principle |

**Kết luận:** Hoạt động tốt, nhưng không phải best practice

---

### Cách 4: Tách riêng Service/Helper class (✅✅ TỐT NHẤT)

```csharp
// ==================== DataMaskingService.cs ====================
public static class DataMaskingService
{
    /// <summary>
    /// Che số tài khoản ngân hàng (chỉ hiện 4 số cuối)
    /// </summary>
    public static string MaskAccountNumber(string? accountNumber)
    {
        if (string.IsNullOrEmpty(accountNumber) || accountNumber.Length <= 4)
            return accountNumber ?? string.Empty;
        
        return "****" + accountNumber[^4..];
    }
    
    /// <summary>
    /// Che số thẻ tín dụng (format: ****-****-****-1234)
    /// </summary>
    public static string MaskCardNumber(string? cardNumber)
    {
        if (string.IsNullOrEmpty(cardNumber) || cardNumber.Length <= 4)
            return cardNumber ?? string.Empty;
        
        return "****-****-****-" + cardNumber[^4..];
    }
    
    /// <summary>
    /// Che email (v****@gmail.com)
    /// </summary>
    public static string MaskEmail(string? email)
    {
        if (string.IsNullOrEmpty(email) || !email.Contains('@'))
            return email ?? string.Empty;
            
        var parts = email.Split('@');
        var name = parts[0];
        var domain = parts[1];
        
        if (name.Length <= 1)
            return email;
            
        return name[0] + new string('*', name.Length - 1) + "@" + domain;
    }
    
    /// <summary>
    /// Che số điện thoại (****123456)
    /// </summary>
    public static string MaskPhone(string? phone)
    {
        if (string.IsNullOrEmpty(phone) || phone.Length <= 6)
            return phone ?? string.Empty;
            
        return new string('*', phone.Length - 6) + phone[^6..];
    }
}
```

| Ưu điểm | Nhược điểm |
|---------|------------|
| Tái sử dụng ở mọi nơi | Cần tạo thêm file |
| Dễ unit test | |
| Single Responsibility | |
| Có thể dùng trong LINQ | |
| Clean Architecture | |

---

## 3. 🎯 Giải pháp Production-Ready (Best Practice)

### 3.1 Cấu trúc project

```
SuperMarketMini/
├── Services/
│   └── DataMaskingService.cs      # Static helper
├── Models/
│   └── DTOs/
│       ├── QrLogDto.cs            # Response DTO
│       └── QrLogDetailDto.cs      # Detail DTO
├── Controllers/
│   └── QrLogsController.cs        # Clean controller
```

### 3.2 Code implementation

#### File: `Services/DataMaskingService.cs`

```csharp
namespace SuperMarketMini.Services;

/// <summary>
/// Service che/giấu thông tin nhạy cảm (PII - Personally Identifiable Information)
/// </summary>
public static class DataMaskingService
{
    /// <summary>
    /// Che số tài khoản ngân hàng (chỉ hiện 4 số cuối)
    /// Ví dụ: "1234567890" → "****7890"
    /// </summary>
    public static string MaskAccountNumber(string? accountNumber)
    {
        if (string.IsNullOrWhiteSpace(accountNumber))
            return string.Empty;
        
        if (accountNumber.Length <= 4)
            return accountNumber;
        
        return "****" + accountNumber[^4..];
    }
    
    /// <summary>
    /// Che số thẻ tín dụng/thẻ ngân hàng
    /// Ví dụ: "4111111111111111" → "****-****-****-1111"
    /// </summary>
    public static string MaskCardNumber(string? cardNumber)
    {
        if (string.IsNullOrWhiteSpace(cardNumber))
            return string.Empty;
        
        // Loại bỏ khoảng trắng và dấu gạch ngang
        var clean = cardNumber.Replace(" ", "").Replace("-", "");
        
        if (clean.Length <= 4)
            return clean;
        
        var last4 = clean[^4..];
        return $"****-****-****-{last4}";
    }
    
    /// <summary>
    /// Che địa chỉ email
    /// Ví dụ: "nguyenvan.a@gmail.com" → "n*********@gmail.com"
    /// </summary>
    public static string MaskEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
            return email ?? string.Empty;
        
        var parts = email.Split('@');
        var localPart = parts[0];
        var domain = parts[1];
        
        if (localPart.Length <= 2)
            return email;
        
        var firstChar = localPart[0];
        var masked = new string('*', localPart.Length - 1);
        
        return $"{firstChar}{masked}@{domain}";
    }
    
    /// <summary>
    /// Che số điện thoại
    /// Ví dụ: "0987654321" → "****54321"
    /// </summary>
    public static string MaskPhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return string.Empty;
        
        // Loại bỏ khoảng trắng
        var clean = phone.Replace(" ", "").Replace("-", "").Replace(".", "");
        
        if (clean.Length <= 4)
            return clean;
        
        var visibleLength = Math.Min(5, clean.Length / 2);
        var maskedLength = clean.Length - visibleLength;
        
        return new string('*', maskedLength) + clean[^visibleLength..];
    }
}
```

#### File: `Models/DTOs/QrLogDtos.cs`

```csharp
namespace SuperMarketMini.Models.DTOs;

/// <summary>
/// DTO cho danh sách QR Log (đã che thông tin nhạy cảm)
/// </summary>
public class QrLogDto
{
    public int Id { get; set; }
    public int CreatedByUserId { get; set; }
    public string CreatedByUserName { get; set; } = string.Empty;
    public int? PaymentAccountId { get; set; }
    public string? AccountName { get; set; }
    public string AccountNumber { get; set; } = string.Empty; // Đã che
    public string AccountHolderName { get; set; } = string.Empty;
    public string BankName { get; set; } = string.Empty;
    public string? BankBin { get; set; }
    public decimal Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public string QrType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsConfirmed { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public string? ReferenceCode { get; set; }
}

/// <summary>
/// DTO cho chi tiết QR Log (có thông tin đầy đủ - chỉ Admin/Manager)
/// </summary>
public class QrLogDetailDto
{
    public int Id { get; set; }
    public int? InvoiceId { get; set; }
    public int CreatedByUserId { get; set; }
    public string CreatedByUserName { get; set; } = string.Empty;
    public int? PaymentAccountId { get; set; }
    public string? AccountName { get; set; }
    public string AccountNumber { get; set; } = string.Empty; // Full
    public string AccountHolderName { get; set; } = string.Empty;
    public string BankName { get; set; } = string.Empty;
    public string? BankBin { get; set; }
    public decimal Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public string QrType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsConfirmed { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public int? ConfirmedByUserId { get; set; }
    public string? ConfirmedByUserName { get; set; }
    public string? ReferenceCode { get; set; }
    public string? Note { get; set; }
}
```

#### File: `Controllers/QrLogsController.cs` (Đã sửa)

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SuperMarketMini.Attributes;
using SuperMarketMini.Data;
using SuperMarketMini.Models.DTOs;
using SuperMarketMini.Services;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace SuperMarketMini.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class QrLogsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<QrLogsController> _logger;

    public QrLogsController(
        ApplicationDbContext context,
        ILogger<QrLogsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách log QR (đã che số tài khoản)
    /// </summary>
    [HttpGet]
    [PermissionAuthorize("invoices.view")]
    public async Task<IActionResult> GetQrLogs(
        [FromQuery] int? userId,
        [FromQuery] int? accountId,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] bool? isConfirmed,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var currentUserId = GetCurrentUserId();
        var currentUserRole = GetCurrentUserRole();

        var query = _context.QRPaymentLogs
            .AsNoTracking()
            .Include(l => l.CreatedByUser)
            .Include(l => l.PaymentAccount)
            .AsQueryable();

        // Cashier chỉ xem log của mình
        if (currentUserRole == "Cashier")
        {
            query = query.Where(l => l.CreatedByUserId == currentUserId);
        }

        // Filter
        if (userId.HasValue)
            query = query.Where(l => l.CreatedByUserId == userId.Value);
        
        if (accountId.HasValue)
            query = query.Where(l => l.PaymentAccountId == accountId.Value);
        
        if (fromDate.HasValue)
            query = query.Where(l => l.CreatedAt >= fromDate.Value);
        
        if (toDate.HasValue)
            query = query.Where(l => l.CreatedAt <= toDate.Value.AddDays(1));
        
        if (isConfirmed.HasValue)
            query = query.Where(l => l.IsConfirmed == isConfirmed.Value);

        query = query.OrderByDescending(l => l.CreatedAt);

        var totalCount = await query.CountAsync();

        // ✅ SỬA: Dùng static method từ Service
        var logs = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new QrLogDto
            {
                Id = l.Id,
                CreatedByUserId = l.CreatedByUserId,
                CreatedByUserName = l.CreatedByUser != null ? l.CreatedByUser.FullName : "Unknown",
                PaymentAccountId = l.PaymentAccountId,
                AccountName = l.PaymentAccount != null ? l.PaymentAccount.AccountName : null,
                // ✅ Dùng static method - không còn lỗi EF Core
                AccountNumber = DataMaskingService.MaskAccountNumber(l.AccountNumber),
                AccountHolderName = l.AccountHolderName,
                BankName = l.BankName,
                BankBin = l.BankBin,
                Amount = l.Amount,
                Description = l.Description,
                QrType = l.QrType,
                CreatedAt = l.CreatedAt,
                ExpiresAt = l.ExpiresAt,
                IsConfirmed = l.IsConfirmed,
                ConfirmedAt = l.ConfirmedAt,
                ReferenceCode = l.ReferenceCode
            })
            .ToListAsync();

        return Ok(new
        {
            Success = true,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
            Data = logs
        });
    }

    /// <summary>
    /// Lấy chi tiết - có thể che/mask tùy role
    /// </summary>
    [HttpGet("{id}")]
    [PermissionAuthorize("invoices.view")]
    public async Task<IActionResult> GetQrLogById(int id)
    {
        var currentUserId = GetCurrentUserId();
        var currentUserRole = GetCurrentUserRole();

        // ✅ Cách 2: Projection ở client (nếu cần logic phức tạp)
        var log = await _context.QRPaymentLogs
            .AsNoTracking()
            .Include(l => l.CreatedByUser)
            .Include(l => l.PaymentAccount)
            .Include(l => l.ConfirmedByUser)
            .Where(l => l.Id == id)
            .FirstOrDefaultAsync();

        if (log == null)
            return NotFound(new { Success = false, Message = "Không tìm thấy log QR" });

        // Cashier chỉ xem log của mình
        if (currentUserRole == "Cashier" && log.CreatedByUserId != currentUserId)
            return Forbid();

        // ✅ Mapping ở client side - kiểm soát được logic
        var dto = new QrLogDetailDto
        {
            Id = log.Id,
            InvoiceId = log.InvoiceId,
            CreatedByUserId = log.CreatedByUserId,
            CreatedByUserName = log.CreatedByUser?.FullName ?? "Unknown",
            PaymentAccountId = log.PaymentAccountId,
            AccountName = log.PaymentAccount?.AccountName,
            // Admin/Manager xem full, Cashier xem masked
            AccountNumber = currentUserRole == "Cashier" 
                ? DataMaskingService.MaskAccountNumber(log.AccountNumber)
                : log.AccountNumber ?? string.Empty,
            AccountHolderName = log.AccountHolderName,
            BankName = log.BankName,
            BankBin = log.BankBin,
            Amount = log.Amount,
            Description = log.Description,
            QrType = log.QrType,
            CreatedAt = log.CreatedAt,
            ExpiresAt = log.ExpiresAt,
            IsConfirmed = log.IsConfirmed,
            ConfirmedAt = log.ConfirmedAt,
            ConfirmedByUserId = log.ConfirmedByUserId,
            ConfirmedByUserName = log.ConfirmedByUser?.FullName,
            ReferenceCode = log.ReferenceCode,
            Note = log.Note
        };

        return Ok(new { Success = true, Data = dto });
    }

    // ... các methods khác

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("UserId")?.Value;
        return int.TryParse(userIdClaim, out int userId) ? userId : 0;
    }

    private string GetCurrentUserRole()
    {
        return User.FindFirst(ClaimTypes.Role)?.Value ?? "Cashier";
    }
}

// ==================== REQUEST DTOs ====================

public class ConfirmQrLogRequest
{
    [StringLength(100)]
    public string? ReferenceCode { get; set; }

    [StringLength(500)]
    public string? Note { get; set; }
}
```

## 4. 📊 So sánh hiệu năng

| Phương pháp | Memory | SQL Query | Phân trang | Đánh giá |
|-------------|--------|-----------|------------|----------|
| `ToList()` trước `Select` | ❌ Cao | Load tất cả columns | ❌ Client | ⭐ |
| `AsEnumerable()` | ❌ Cao | Load tất cả columns | ❌ Client | ⭐ |
| Static method trong Controller | ✅ Thấp | Chỉ cần columns | ✅ SQL | ⭐⭐⭐ |
| Static Service class | ✅ Thấp | Chỉ cần columns | ✅ SQL | ⭐⭐⭐⭐⭐ |

## 5. 🎓 Tóm tắt Best Practices

### ✅ Nên làm:

1. **Tách riêng Service/Helper class** cho logic che dữ liệu
2. **Dùng static methods** để EF Core có thể translate query
3. **Dùng DTOs** để kiểm soát dữ liệu trả về
4. **Phân trang ở SQL** (dùng `Skip`/`Take` trước `ToListAsync`)
5. **Dùng `AsNoTracking()`** cho read-only queries

### ❌ Không nên:

1. **Gọi instance method** trong LINQ query
2. **Dùng `ToList()`/`ToArray()`** trước khi cần thiết
3. **Load tất cả columns** khi chỉ cần một vài cột
4. **Viết logic che dữ liệu** trực tiếp trong Controller

## 6. 🔧 Sửa nhanh cho code hiện tại

Nếu muốn sửa nhanh code hiện tại của bạn, chỉ cần thay đổi 1 dòng:

```csharp
// Dòng 103 trong QrLogsController.cs hiện tại:
AccountNumber = MaskAccountNumber(l.AccountNumber),

// Thay thành: (thêm 'static' vào method MaskAccountNumber ở dòng 342)
private static string MaskAccountNumber(string accountNumber)
{
    if (string.IsNullOrEmpty(accountNumber) || accountNumber.Length <= 4)
        return accountNumber;
    return "****" + accountNumber[^4..];
}
```

Hoặc tốt hơn: **Tách ra Service như hướng dẫn ở mục 3**.
