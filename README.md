# Product Dashboard - Tuần 3

## Mô tả

Dashboard quản lý sản phẩm sử dụng API từ Platzi Fake Store API.

## Tính năng

1. **Hiển thị danh sách sản phẩm** với các cột:
   - ID
   - Title (Tên sản phẩm)
   - Price (Giá)
   - Category (Danh mục)
   - Images (Hình ảnh)

2. **Tooltip mô tả**: Di chuột vào dòng sản phẩm để xem mô tả

3. **Tìm kiếm**: Tìm kiếm theo tên sản phẩm với tính năng onChange (realtime)

4. **Phân trang**: Hiển thị 5, 10, hoặc 20 sản phẩm mỗi trang

5. **Sắp xếp**: Sắp xếp theo giá hoặc tên sản phẩm (tăng/giảm)

6. **Xuất CSV**: Export dữ liệu hiện tại ra file CSV

7. **Xem chi tiết & Chỉnh sửa**: 
   - Click vào sản phẩm để xem chi tiết trong Modal
   - Nút Edit để chỉnh sửa thông tin sản phẩm (PUT API)

8. **Tạo sản phẩm mới**: Modal tạo sản phẩm mới (POST API)

## API Sử dụng

- **Base URL**: `https://api.escuelajs.co/api/v1`
- **Products**: `/products`
- **Categories**: `/categories`

Tài liệu chi tiết: [https://fakeapi.platzi.com/en/rest/products/](https://fakeapi.platzi.com/en/rest/products/)

## Công nghệ sử dụng

- HTML5
- CSS3 (Bootstrap 5.3)
- JavaScript (ES6+)
- Bootstrap Icons
- Fetch API

## Cách chạy

### Cách 1: Sử dụng Live Server (Khuyến nghị)

```bash
# Cài đặt dependencies
npm install

# Chạy server
npm start
```

Truy cập: `http://localhost:3000`

### Cách 2: Mở trực tiếp file HTML

Mở file `index.html` bằng trình duyệt web.

### Cách 3: Sử dụng VS Code Live Server Extension

1. Cài đặt extension "Live Server" trong VS Code
2. Click chuột phải vào `index.html`
3. Chọn "Open with Live Server"

## Cấu trúc thư mục

```
Tuan3/
├── index.html      # Giao diện chính
├── app.js          # Logic JavaScript
├── package.json    # Cấu hình npm
└── README.md       # Tài liệu
```

## Hướng dẫn sử dụng

1. **Tìm kiếm**: Nhập từ khóa vào ô tìm kiếm, kết quả sẽ tự động cập nhật

2. **Sắp xếp**: Click vào icon mũi tên ở cột Title hoặc Price để sắp xếp

3. **Phân trang**: Chọn số lượng item/trang từ dropdown và điều hướng bằng pagination

4. **Xem chi tiết**: Click vào bất kỳ hàng nào trong bảng

5. **Chỉnh sửa**: Trong modal chi tiết, click "Chỉnh sửa" → Sửa thông tin → "Lưu thay đổi"

6. **Tạo mới**: Click "Thêm sản phẩm" → Điền form → "Tạo sản phẩm"

7. **Xuất CSV**: Click "Xuất CSV" để download file CSV của view hiện tại
