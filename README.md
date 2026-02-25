# Mini Dating App - Clique8

> Bài test kỹ thuật cho vị trí Web Developer Intern – Clique83.com

## Demo

- **Frontend (Vercel):** [Link deploy]
- **Backend (AWS):** [Link API]

---

## Mục lục

- [Tổng quan](#tổng-quan)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cách tổ chức hệ thống](#cách-tổ-chức-hệ-thống)
- [Cách lưu trữ dữ liệu](#cách-lưu-trữ-dữ-liệu)
- [Logic Match](#logic-match)
- [Logic tìm slot trùng](#logic-tìm-slot-trùng)
- [Cài đặt & Chạy local](#cài-đặt--chạy-local)
- [Cải thiện nếu có thêm thời gian](#cải-thiện-nếu-có-thêm-thời-gian)
- [Tính năng đề xuất thêm](#tính-năng-đề-xuất-thêm)

---

## Tổng quan

Mini Dating App Prototype với 3 chức năng chính:

| Phần | Tính năng | Trạng thái |
|------|-----------|-----------|
| A | Tạo Profile (tên, tuổi, giới tính, bio, email) | Done |
| B | Hiển thị profiles & Like, Match detection | Done |
| C | Đề xuất lịch hẹn (chọn availability 3 tuần, tìm slot trùng) | Done |

---

## Công nghệ sử dụng

### Frontend
- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS** + Custom CSS (Glassmorphism, animations)
- **Deploy:** Vercel

### Backend
- **NestJS** (TypeScript, REST API)
- **TypeORM** (ORM)
- **PostgreSQL** via **Neon** (Serverless Postgres)
- **Deploy:** AWS

### Kiến trúc
```
mini-dating-app/
├── frontend/                    # Next.js 15 App
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                # Landing page
│   │   │   ├── create-profile/         # Tạo profile
│   │   │   ├── login/                  # Đăng nhập (email)
│   │   │   ├── profiles/               # Khám phá & Like
│   │   │   ├── matches/                # Danh sách matches
│   │   │   └── schedule/[matchId]/     # Hẹn lịch
│   │   ├── components/
│   │   │   └── Navbar.tsx
│   │   └── lib/
│   │       └── api.ts                  # API client
│   └── .env.local
│
├── backend/                     # NestJS API
│   ├── src/
│   │   ├── users/                      # Users module
│   │   │   ├── entities/
│   │   │   │   └── user.entity.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   └── index.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── users.module.ts
│   │   ├── likes/                      # Likes module (+ match detection)
│   │   │   ├── entities/
│   │   │   │   └── like.entity.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-like.dto.ts
│   │   │   │   └── index.ts
│   │   │   ├── likes.controller.ts
│   │   │   ├── likes.service.ts
│   │   │   └── likes.module.ts
│   │   ├── matches/                    # Matches module
│   │   │   ├── entities/
│   │   │   │   └── match.entity.ts
│   │   │   ├── matches.controller.ts
│   │   │   ├── matches.service.ts
│   │   │   └── matches.module.ts
│   │   ├── availability/               # Availability module (+ slot matching)
│   │   │   ├── entities/
│   │   │   │   └── availability.entity.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-availability.dto.ts
│   │   │   │   └── index.ts
│   │   │   ├── availability.controller.ts
│   │   │   ├── availability.service.ts
│   │   │   └── availability.module.ts
│   │   ├── app.module.ts               # Root module (autoLoadEntities)
│   │   └── main.ts                     # Entry point
│   └── .env
│
└── README.md
```

> **Best practice:** Mỗi module tự chứa `entities/`, `dto/`, controller, service, module.
> Entity được auto-load bởi TypeORM thông qua `autoLoadEntities: true` trong AppModule.


---

## Cách lưu trữ dữ liệu

### Database: PostgreSQL (Neon Serverless)

Dữ liệu được lưu trong **PostgreSQL** hosted trên **Neon** (serverless database).

**4 bảng chính:**

| Bảng | Mô tả |
|------|--------|
| `users` | Profile người dùng (id, name, age, gender, bio, email) |
| `likes` | Ghi nhận like (fromUserId → toUserId, unique constraint) |
| `matches` | Match khi 2 users like lẫn nhau (userAId, userBId + scheduled date) |
| `availabilities` | Thời gian rảnh của user per match (date, startTime, endTime) |

**TypeORM** được dùng làm ORM với `synchronize: true` (tự sync schema).

### Session: LocalStorage

Phiên đăng nhập đơn giản lưu `currentUserId`, `currentUserName` vào localStorage (không cần auth phức tạp).

---

## Logic Match

### Cách hoạt động

```
User A Like User B -> Tạo record trong bảng `likes`
                    -> Kiểm tra: User B đã like User A chưa?
                       ├── Chưa -> Chỉ lưu like, return { isMatch: false }
                       └── Rồi -> IT'S A MATCH!
                                -> Tạo record trong bảng `matches`
                                -> return { isMatch: true, match: {...} }
```

### Chi tiết:

1. Khi User A like User B, backend ghi nhận like vào DB
2. Backend kiểm tra ngay lập tức: có tồn tại like từ B → A không?
3. Nếu **CÓ**: Tạo Match record (userAId luôn là ID nhỏ hơn để tránh duplicate)
4. Frontend hiển thị popup "It's a Match!" với animation trái tim
5. Match được **lưu vĩnh viễn** trong database → không mất khi reload

### Edge cases đã xử lý:
- Không thể like chính mình
- Không thể like 2 lần cùng 1 người (unique constraint)
- Không tạo match duplicate (check trước khi tạo)

---

## Logic tìm slot trùng

### Quy trình:

```
Match thành công
    ↓
User A chọn availability (ngày + giờ bắt đầu + giờ kết thúc) trong 3 tuần tới
User B chọn availability (tương tự)
    ↓
Khi cả hai đã chọn → Button "Tìm thời gian trùng" xuất hiện
    ↓
Hệ thống tìm slot trùng đầu tiên (first common slot)
```

### Thuật toán tìm slot trùng:

```typescript
// Duyệt qua tất cả slots của A và B
for (slotA of slotsA) {
  for (slotB of slotsB) {
    if (slotA.date === slotB.date) {
      // Tìm phần giao nhau về giờ
      overlapStart = max(slotA.startTime, slotB.startTime)
      overlapEnd = min(slotA.endTime, slotB.endTime)
      
      if (overlapStart < overlapEnd) {
        // Tìm được! Đây là slot trùng đầu tiên
        return { found: true, date, startTime: overlapStart, endTime: overlapEnd }
      }
    }
  }
}
// Không có slot trùng
return { found: false, message: "Chưa tìm được thời gian trùng" }
```

### Ví dụ:
- User A rảnh: 10/03 từ **09:00 - 14:00**
- User B rảnh: 10/03 từ **11:00 - 16:00**
- -> Overlap: 10/03 từ **11:00 - 14:00**

### Kết quả:
- **Có trùng**: `"Hai bạn có date hẹn vào: Thứ Hai, 10 tháng 3, 2026 từ 11:00 đến 14:00"`
- **Không trùng**: `"Chưa tìm được thời gian trùng. Vui lòng chọn lại."`

---

## Cài đặt & Chạy local

### Yêu cầu
- Node.js >= 18
- PostgreSQL database (hoặc Neon account)

### 1. Clone repo
```bash
git clone <repo-url>
cd mini-dating-app
```

### 2. Setup Backend
```bash
cd backend
npm install

# Tạo file .env
cp .env.example .env
# Sửa DATABASE_URL với connection string của bạn
```

Nội dung `.env`:
```
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
PORT=3001
FRONTEND_URL=http://localhost:3000
```

```bash
npm run start:dev
# Backend chạy tại http://localhost:3001
```

### 3. Setup Frontend
```bash
cd frontend
npm install

# Tạo file .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local

npm run dev
# Frontend chạy tại http://localhost:3000
```

---

## Cải thiện nếu có thêm thời gian

1. **Real-time notifications**: Dùng WebSocket/Socket.io để thông báo match và availability realtime
2. **Upload avatar**: Tích hợp upload ảnh (S3/Cloudinary) thay vì dùng avatar chữ cái
3. **Search & Filter**: Lọc profiles theo giới tính, tuổi, khoảng cách
4. **Pagination**: Phân trang cho danh sách profiles khi có nhiều users
5. **Unit tests**: Viết test cho match logic và slot matching algorithm
6. **Rate limiting**: Giới hạn số lần like/request để tránh spam
7. **Email notifications**: Gửi email khi match thành công hoặc date được xác nhận

---

## Tính năng đề xuất thêm

### 1. Chat sau khi Match
**Lý do:** Sau khi match, users cần giao tiếp trước khi gặp mặt. Chat realtime (Socket.io) giúp tăng engagement và tạo kết nối trước cuộc hẹn.

### 2. Đề xuất địa điểm hẹn
**Lý do:** Sau khi tìm được slot trùng, hệ thống có thể đề xuất quán café/nhà hàng gần khu vực cả hai (dùng Google Maps API). Giảm ma sát trong việc tìm nơi hẹn.

### 3. Đánh giá sau cuộc hẹn
**Lý do:** Sau mỗi date, cả hai có thể đánh giá (rating + nhận xét). Giúp hệ thống cải thiện matching algorithm và tạo trust trong cộng đồng. Có thể phát triển thành recommendation engine dựa trên feedback.

---

## Ghi chú

- Project được xây dựng trong khuôn khổ bài test kỹ thuật
- Không sử dụng authentication phức tạp (chỉ email-based identification)
- UI được thiết kế với dark mode, glassmorphism, và micro-animations
- Code được tổ chức theo module pattern (NestJS) và file-based routing (Next.js)
- Database schema tự động sync (chỉ dùng cho dev, production cần migration)

---

**Made by [Tên bạn]**
