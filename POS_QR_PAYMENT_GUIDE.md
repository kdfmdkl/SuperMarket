# 🛒 Hướng Dẫn Sử Dụng POS QR Payment

## 📋 Tổng Quan

Hệ thống đã được nâng cấp với tính năng **Quét mã vạch sản phẩm** và **Thanh toán QR Code**, giúp quy trình bán hàng nhanh chóng và tiện lợi hơn.

---

## ✨ Tính Năng Mới

### 1️⃣ Quét Mã Vạch Sản Phẩm
- Nhân viên dùng máy quét mã vạch để quét sản phẩm
- Hệ thống tự động lấy thông tin: Tên, Giá, Tồn kho
- Kiểm tra tồn kho real-time

### 2️⃣ Tạo Mã QR Thanh Toán
- Hỗ trợ **VietQR** (chuẩn chuyển khoản nhanh 24/7)
- Hỗ trợ QR đơn giản (text format)
- QR hết hạn sau 10 phút

### 3️⃣ Xác Nhận Thanh Toán
- Nhân viên xác nhận đã nhận tiền
- Ghi log giao dịch

---

## 🔧 API Endpoints

### 1. Quét Mã Vạch
```http
POST /api/pos/scan-barcode
Authorization: Bearer {token}
Content-Type: application/json

{
  "barcode": "123456789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Quét mã vạch thành công",
  "product": {
    "id": 1,
    "name": "Coca Cola 330ml",
    "sellPrice": 12000,
    "stockQuantity": 50,
    "unit": "lon"
  }
}
```

---

### 2. Tạo Mã QR Thanh Toán (VietQR)
```http
POST /api/pos/qr-payment
Authorization: Bearer {token}
Content-Type: application/json

{
  "accountNumber": "1234567890",
  "accountName": "NGUYEN VAN A",
  "bankName": "Vietcombank",
  "bankBin": "970436",
  "amount": 156000,
  "description": "HD156"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tạo mã QR thanh toán thành công",
  "data": {
    "qrImageBase64": "data:image/png;base64,iVBORw0KGgo...",
    "qrContent": "VietQR - 970436 - 1234567890 - 156,000 VNĐ",
    "amount": 156000,
    "description": "HD156",
    "expiresAt": "2024-01-20T10:35:00"
  }
}
```

---

### 3. Tạo Mã QR Thanh Toán (Đơn giản)
```http
POST /api/pos/qr-payment
Authorization: Bearer {token}
Content-Type: application/json

{
  "accountNumber": "1234567890",
  "accountName": "CUA HANG MINI",
  "bankName": "Vietcombank",
  "amount": 250000,
  "description": "Thanh toan hoa don"
}
```

---

### 4. Lấy Danh Sách Ngân Hàng
```http
GET /api/pos/banks
```

---

### 5. Xác Nhận Thanh Toán
```http
POST /api/pos/confirm-qr-payment
Authorization: Bearer {token}
Content-Type: application/json

{
  "invoiceId": 1,
  "referenceCode": "MB20240120103045",
  "note": "Đã nhận tiền qua chuyển khoản"
}
```

---

## 🏦 Mã BIN Các Ngân Hàng (VietQR)

| Ngân Hàng | Mã BIN |
|-----------|--------|
| Vietcombank | 970436 |
| Techcombank | 970407 |
| BIDV | 970418 |
| VietinBank | 970415 |
| MB Bank | 970422 |
| ACB | 970416 |
| Sacombank | 970403 |
| VPBank | 970432 |
| TPBank | 970423 |
| VIB | 970438 |
| HD Bank | 970437 |
| OCB | 970448 |
| MSB | 970426 |
| SHB | 970443 |
| Eximbank | 970431 |
| SCB | 970429 |

---

## 🔄 Quy Trình Bán Hàng

```
┌─────────────────────────────────────────────────────────────────┐
│                    QUY TRÌNH BÁN HÀNG VỚI QR                    │
└─────────────────────────────────────────────────────────────────┘

  BƯỚC 1: QUÉT SẢN PHẨM
  ┌─────────────┐      ┌─────────────┐
  │ Máy quét mã │─────>│ API: scan   │
  │   vạch      │      │  -barcode   │
  └─────────────┘      └─────────────┘
                              │
                              ▼
                       Thông tin SP:
                       - Tên, Giá
                       - Tồn kho

  BƯỚC 2: TẠO HÓA ĐƠN
  ┌─────────────┐      ┌─────────────┐
  │  Giỏ hàng   │─────>│ API: create │
  │  (nhiều SP) │      │  -invoice   │
  └─────────────┘      └─────────────┘
                              │
                              ▼
                       Hóa đơn: HD156
                       Tổng: 156,000đ

  BƯỚC 3: TẠO MÃ QR
  ┌─────────────┐      ┌─────────────┐
  │  Chọn thanh │─────>│ API: qr     │
  │  toán QR    │      │  -payment   │
  └─────────────┘      └─────────────┘
                              │
                              ▼
                       ┌─────────────┐
                       │  [QR CODE]  │
                       │             │
                       │  Quét để    │
                       │  thanh toán │
                       └─────────────┘

  BƯỚC 4: KHÁCH THANH TOÁN
  ┌─────────────┐      ┌─────────────┐
  │ App ngân    │<─────│   Quét mã   │
  │ hàng (MB,   │      │    QR       │
  │ TP, VCB...) │      │             │
  └─────────────┘      └─────────────┘
         │
         ▼
  Chuyển khoản thành công

  BƯỚC 5: XÁC NHẬN
  ┌─────────────┐      ┌─────────────┐
  │ Nhân viên   │─────>│ API: confirm│
  │ xác nhận    │      │  -qr-payment│
  │ đã nhận tiền│      │             │
  └─────────────┘      └─────────────┘
                              │
                              ▼
                       Hoàn tất hóa đơn!
                       In hóa đơn cho khách
```

---

## 💻 Cách Hiển Thị QR Code

### HTML/JavaScript
```html
<!-- QR Code Image -->
<img id="qrCode" src="" alt="QR Payment" />

<script>
// Gọi API tạo QR
fetch('/api/pos/qr-payment', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    accountNumber: '1234567890',
    accountName: 'CUA HANG MINI',
    bankName: 'Vietcombank',
    bankBin: '970436',
    amount: 156000,
    description: 'HD156'
  })
})
.then(res => res.json())
.then(data => {
  // Hiển thị QR code
  document.getElementById('qrCode').src = data.data.qrImageBase64;
  
  // Hiển thị thông tin
  console.log('Số tiền:', data.data.amount);
  console.log('Hết hạn:', data.data.expiresAt);
});
</script>
```

### React/Vue/Angular
```javascript
// QR Component
const QRPayment = ({ amount, invoiceNo }) => {
  const [qrImage, setQrImage] = useState('');
  
  useEffect(() => {
    generateQR({
      accountNumber: '1234567890',
      accountName: 'CUA HANG MINI',
      bankBin: '970436',
      amount: amount,
      description: invoiceNo
    }).then(data => setQrImage(data.qrImageBase64));
  }, []);
  
  return (
    <div className="qr-payment">
      <img src={qrImage} alt="QR Payment" />
      <p>Số tiền: {amount.toLocaleString()}đ</p>
      <p>Vui lòng quét mã để thanh toán</p>
    </div>
  );
};
```

---

## 📝 Ví Dụ Thực Tế

### Kịch bản: Khách mua Coca Cola + Snack

**Bước 1: Quét sản phẩm**
```bash
# Quét Coca Cola
curl -X POST http://localhost:5000/api/pos/scan-barcode \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"barcode": "8934588023089"}'
# Response: Coca Cola 330ml - 12,000đ

# Quét Snack
curl -X POST http://localhost:5000/api/pos/scan-barcode \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"barcode": "8935001234567"}'
# Response: Snack khoai tây - 15,000đ
```

**Bước 2: Tạo hóa đơn**
```bash
curl -X POST http://localhost:5000/api/invoices \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"productId": 1, "quantity": 2},
      {"productId": 5, "quantity": 1}
    ],
    "paidAmount": 39000,
    "paymentMethod": "QR_BANK"
  }'
# Tổng: 39,000đ
```

**Bước 3: Tạo mã QR**
```bash
curl -X POST http://localhost:5000/api/pos/qr-payment \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "1234567890",
    "accountName": "CUA HANG MINI",
    "bankName": "Vietcombank",
    "bankBin": "970436",
    "amount": 39000,
    "description": "HD00123"
  }'
# Response: QR code image (base64)
```

**Bước 4: Khách quét và thanh toán**
- Khách mở app Vietcombank/MB Bank/...
- Quét mã QR
- Xác nhận chuyển 39,000đ
- Chuyển khoản thành công

**Bước 5: Xác nhận**
```bash
curl -X POST http://localhost:5000/api/pos/confirm-qr-payment \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceId": 123,
    "referenceCode": "VCB20240120103045"
  }'
# Hoàn tất!
```

---

## ⚠️ Lưu Ý Quan Trọng

1. **Phân quyền**: API POS yêu cầu permission `invoices.create` (Cashier, Manager, Admin)

2. **QR Hết hạn**: Mã QR có hiệu lực 10 phút, sau đó cần tạo lại

3. **Xác nhận thủ công**: Hiện tại cần nhân viên xác nhận đã nhận tiền (không tự động)

4. **VietQR**: Chỉ hoạt động với ngân hàng hỗ trợ chuẩn VietQR

5. **QR Đơn giản**: Luôn hoạt động, nhưng khách phải nhập thông tin thủ công

---

## 🔮 Phát Triển Tương Lai

- [ ] Tích hợp Momo/ZaloPay QR động
- [ ] Auto-confirm qua webhook (không cần nhân viên)
- [ ] QR có thể custom logo
- [ ] Lưu lịch sử QR đã tạo
- [ ] Thống kê thanh toán QR

---

## 📞 Hỗ Trợ

Nếu có vấn đề, kiểm tra:
1. Token JWT có hợp lệ không?
2. Permission có đúng không?
3. BankBin có chính xác không?
4. Số tiền có đúng định dạng không?

File test: `test-pos.http`
