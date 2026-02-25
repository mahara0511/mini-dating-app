# Mini Dating App - Clique8

> Bài test kỹ thuật cho vị trí Web Developer Intern – Clique83.com

## Demo

- **Frontend (Vercel):** [https://mini-dating-2ysb3rzky-khanhzip14s-projects.vercel.app/]
- **Backend Swagger(AWS EC2 / ghcr.io):** [http://18.141.9.225:3001/api/docs#/]

---

## Mục lục

- [Tổng quan](#tổng-quan)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Mô tả cách tổ chức hệ thống](#mô-tả-cách-tổ-chức-hệ-thống)
- [Lưu trữ dữ liệu](#lưu-trữ-dữ-liệu)
- [Logic Match hoạt động như thế nào](#logic-match-hoạt-động-như-thế-nào)
- [Logic tìm slot trùng hoạt động thế nào](#logic-tìm-slot-trùng-hoạt-động-thế-nào)
- [Nếu có thêm thời gian sẽ cải thiện gì](#nếu-có-thêm-thời-gian-sẽ-cải-thiện-gì)
- [Các tính năng đề xuất thêm](#các-tính-năng-đề-xuất-thêm)
- [Triển khai CI/CD (GitHub Actions & Docker)](#triển-khai-cicd-github-actions--docker)
- [Cài đặt & Chạy local](#cài-đặt--chạy-local)

---

## Tổng quan

Mini Dating App Prototype với 3 chức năng chính được xây dựng theo kiến trúc Backend (NestJS) và Frontend (Next.js) tác biệt, với CI/CD pipeline tự động deploy:

| Phần | Tính năng | Trạng thái |
|------|-----------|-----------|
| A | Tạo Profile (tên, tuổi, giới tính, bio, email) | Done |
| B | Hiển thị profiles & Like, Match detection (2 chiều) | Done |
| C | Đề xuất lịch hẹn thông minh (Interactive Calendar, Overlap Validation) | Done |

---

## Công nghệ sử dụng

### Frontend
- **Framework:** Next.js 15 (App Router, TypeScript)
- **Styling:** Custom CSS (Glassmorphism, mượt mà, animations hiện đại, không dùng Tailwind để tối ưu custom)
- **Deployment:** Vercel

### Backend
- **Framework:** NestJS (TypeScript, REST API, Swagger)
- **Database ORM:** TypeORM (với hệ thống Migration file base)
- **Database:** PostgreSQL (Neon Serverless)
- **Deployment:** AWS EC2, Docker Compose, GitHub Container Registry (ghcr.io)
- **CI/CD:** GitHub Actions

### Mô tả cách tổ chức hệ thống

Dự án được ứng dụng các pattern chuẩn của framework (Module-based của NestJS, App-router của Next.js):

```
mini-dating-app/
├── frontend/                    # Next.js 15 App
│   ├── src/
│   │   ├── app/                # Page routing
│   │   │   ├── create-profile/
│   │   │   ├── login/
│   │   │   ├── profiles/       # Discover & Like
│   │   │   ├── matches/        # Danh sách matches
│   │   │   └── schedule/[matchId]/ # Hẹn lịch (Interactive Calendar)
│   │   └── lib/
│   │       ├── api.ts          # API Client functions
│   │       └── types.ts        # Shared TypeScript Interfaces/DTOs
│   └── .env.local
│
├── backend/                     # NestJS API
│   ├── src/
│   │   ├── users/, likes/, matches/, availability/ # Domain Modules (Controller, Service, Entity, DTO)
│   │   ├── migrations/         # TypeORM migration scripts (quản lý DB schema)
│   │   ├── app.module.ts       # Root module
│   │   └── main.ts             # Entry point
│   ├── Dockerfile              # Multi-stage Docker build
│   └── data-source.ts          # TypeORM CLI config
│
├── .github/workflows/           # CI/CD Pipeline
│   └── deploy-backend.yml      # Build image -> Push ghcr.io -> SSH EC2 -> Run
├── docker-compose.yml           # Chạy backend server trên môi trường production
└── README.md
```

Hệ thống cung cấp type-safety 100% từ Database Models -> Backend DTOs -> Frontend Interfaces.

---

## Lưu trữ dữ liệu

### Database: PostgreSQL

Dữ liệu được lưu trong **PostgreSQL** hosted trên **Neon** (serverless database). Database Schema được quản lý STRICTLY bằng **TypeORM Migrations** thay vì `synchronize: true`, bảo đảm an toàn dữ liệu trên Production.

**4 bảng chính:**

| Bảng | Mô tả |
|------|--------|
| `users` | Profile người dùng (id, name, age, gender, bio, email) |
| `likes` | Ghi nhận like (fromUserId → toUserId). Có Unique constraint chống spam like. |
| `matches` | Match khi 2 users like lẫn nhau. Ghi nhận thời gian slot chung (`scheduledDate`, `TimeStart`, `TimeEnd`) |
| `availabilities` | Thời gian rảnh của user theo match (date, startTime, endTime) |

### Session
Đăng nhập qua dạng nhận diện đơn giản bằng `email` và lưu `currentUserId` xuống LocalStorage của browser.

---

## Logic Match hoạt động như thế nào

Quy trình phát hiện Match 2 chiều chạy tự động khi một user thực hiện thao tác Like:

1. User A nhấn Like User B -> Record được tạo trong bảng `likes`.
2. Backend tức thì kiểm tra (transaction): User B đã Like User A trước đó chưa?
3. Nếu **CHƯA**: Chỉ lưu Like. Trả về cho frontend: `{ isMatch: false }`.
4. Nếu **RỒI**: 
   - Backend sinh ngay một `Match` record nối cả hai (userAId luôn nhỏ hơn userBId theo alphabet uuid để tránh trùng lặp 2 chiều).
   - Trả về frontend: `{ isMatch: true, match: {...} }`.
5. Frontend hứng kết quả, popup màn hình overlay chúc mừng "It's a Match!" có button dẫn tới trang Hẹn Lịch.

---

## Logic tìm slot trùng hoạt động thế nào

Đây là phần phức tạp nhất, đã được xử lý bằng cả thuật toán Backend và UI/UX Frontend tối ưu.

### 1. Chọn lịch thông minh (Frontend Calendar Picker)
- Thay vì dùng dropdown tù túng, User tương tác trên một **Lịch (Calendar Tracker) trực quan**.
- Lịch tự động vô hiệu hóa các ngày trong quá khứ hoặc cấu hình (ví dụ: chỉ cho chọn trong vòng **3 tuần tới**).
- User click vào ngày, add nhiều khung giờ rảnh lẻ dải rác (`09:00 - 10:00`, `14:00 - 16:00`).

### 2. Validation Slot Rảnh (Smart Overlap Detection 2 Lớp)
Hệ thống chống tình trạng 1 user bị "double-booked" (hẹn nhiều người cùng 1 giờ) bằng Validation 2 lớp cực kì chặt chẽ:

**Lớp Frontend (Real-time Feedback):**
- Ngay khi user nhập 1 slot, UI lập tức tính toán Overlap (chồng lấn) với:
  - (1) Các slot khác đang nhập *cùng ngày cho match này*.
  - (2) Toàn bộ các slot **của các match khác** trong quá khứ hệ thống gửi về (hiển thị `[X busy]`).
- Nếu bị trùng, slot đó sẽ **chuyển đỏ**, UI khóa nút "Save" để chặn user thao tác bậy.
- Các slot của Match khác được list ra ở dưới dạng Read-only "🔒 Busy from other matches" để user né.

**Lớp Backend (Data Integerity):**
- Reject nếu khoảng ngày (`date`) > 3 tuần tính từ `today`.
- Reject nếu `startTime` >= `endTime` (Vd: nhập 10:00 đến 09:00).
- Duyệt vòng lặp $O(N^2)$ nội bộ mảng gửi lên: check nếu `(startA < endB && startB < endA)` thì báo cấn giờ.
- Truy xuất Database đống rảnh rỗi của user ở các Match KHÁC, duyệt loop check chồng giờ.

### 3. Tìm thời điểm vàng (Find Common Slot)
Sau khi cả 2 User trong Match đã gửi cấu hình giờ của mình:
- Mở khoá nút bấm "Tìm thời gian trùng".
- Thuật toán **Two Pointers (Hai con trỏ)** với độ phức tạp $O(N + M)$ được áp dụng trên 2 mảng `slotsA` và `slotsB` đã được sort theo `date` và `startTime`.
- Cơ chế hoạt động của thuật toán:
  - Dùng con trỏ `i` duyệt `slotsA`, con trỏ `j` duyệt `slotsB`.
  - Nếu `date` của slot nào nhỏ hơn, tăng con trỏ của slot đó để "bắt kịp" ngày.
  - Nếu cùng `date`, tính vùng chồng lấp: `overlapStart = max(startA, startB)` và `overlapEnd = min(endA, endB)`.
  - Nếu `overlapStart < overlapEnd` -> **Tìm thấy khung giờ trùng hợp lệ đầu tiên!** (Chốt lịch ngay lập tức).
  - Nếu không overlap, tăng con trỏ của slot có `endTime` nhỏ hơn, vì slot kết thúc sớm hơn chắc chắn không thể đè lên bất kỳ slot nào tới muộn ở tương lai.

*Ví dụ:* UserA rảnh (10:00 - 15:00), UserB rảnh (13:00 - 16:00) => Hệ thống chốt hẹn: **13:00 - 15:00**.

---

## Triển khai CI/CD (GitHub Actions & Docker)

Quá trình deploy backend đã được tự động hóa 100% bằng script `.github/workflows/deploy-backend.yml`:

**Pipeline Flow:**
1. Developer PUSH code lên branch `main`.
2. Action kích hoạt Job 1: Dùng `backend/Dockerfile` tạo Multi-stage Docker Image (build Typescript, dọn dẹp src).
3. Đẩy Image lên **GitHub Container Registry (`ghcr.io/username/repo/backend:latest`)**.
4. Action chuyển sang Job 2: Dùng SSH (appleboy/ssh-action) nhảy thẳng vào **AWS EC2 server**.
5. Server chạy command: Pull latest image từ ghcr.io -> Tắt container cũ -> Run nhánh mới qua `docker run`.

**Lợi ích:** Server EC2 không nặng nề phải có Node.js hay thực hiện công việc compile. Container độc lập, clean.

> Secrets quản lý qua GitHub: `EC2_HOST`, `EC2_USERNAME`, `EC2_SSH_KEY`, `GHCR_TOKEN`, `DATABASE_URL` (cho Runtime Container).

---

## Cài đặt & Chạy local

### Yêu cầu
- Node.js >= 18
- PostgreSQL database (hoặc Neon account)

### 1. Clone repository
```bash
git clone <repo-url>
cd mini-dating-app
```

### 2. Setup Backend (NestJS)
```bash
cd backend
npm install
```

Tạo file `.env` với các Keys:
```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
PORT=3001
FRONTEND_URL=http://localhost:3000
```

Khởi chạy và chạy Database Migration:
```bash
# Chạy migration để build tables mới nhất cho DB
npm run migration:run

# Run dev mode
npm run start:dev
```
Backend chạy tại `http://localhost:3001` và Swagger UI tại `http://localhost:3001/api`.

### 3. Setup Frontend (Next.js)
```bash
cd frontend
npm install
```

Tạo file `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Khởi chạy Frontend:
```bash
npm run dev
```
Frontend chạy tại `http://localhost:3000`.

---

## Nếu có thêm thời gian sẽ cải thiện gì

1. **Bảo mật và Authentication thực thụ**: Khóa các tài nguyên API bằng JWT (Access Token & Refresh Token) thay vì chỉ lưu `currentUserId` trên client.
2. **Real-time Synchronization (WebSockets)**: Dùng Socket.io ở NestJS để đẩy events realtime cho user (nhận báo Match ngay khi mở app, thấy trạng thái availability của partner cập nhật tức thì) mà không cần HTTP Polling hay Reload.
3. **Mở rộng UX Calendar**: Hiển thị Calendar chi tiết bằng giao diện Grid Time block (như Google Calendar) để người dùng có thể "kéo thả" (drag-and-drop) việc chọn timeslot lặp lại hàng tuần dễ hơn, thay vì add input time manual lẻ tẻ.
4. **Luồng User Actions hoàn chỉnh**: Bổ sung các tính năng hủy lịch hẹn đã lưu (Cancel schedule), Bỏ lượt thích (Unlike), và Xóa Match (Unmatch) để cung cấp cho người dùng khả năng quản lý mối quan hệ linh hoạt hơn.
5. **Viết trọn vẹn E2E Tests và Unit tests**: Đảm bảo các hàm thuật toán cốt lõi xử lý logic datetime không bị fall edge-cases bởi time zones.
6. **Phân trang (Pagination) & Query Optimization**: Áp dụng load thông minh (Cursor-based Pagination hoặc Offset) ở trang quẹt thẻ để lấy 10-20 profiles/lần thay vì load toàn bộ users. Tối ưu index database cho bảng Likes và Users, giúp performance tìm kiếm app mượt hơn khi có hàng trăm ngàn users.

---

## Các tính năng đề xuất thêm

### 1. Nâng cấp Profile & Gợi ý Match bằng AI (AI-Powered Matchmaking)
**Lý do:** Hiện tại người dùng chỉ phân loại cơ bản qua (tên, tuổi, giới tính). Hệ thống cần mở rộng Data Model User với các trường: Sở thích, Địa điểm làm việc/sinh sống, Thói quen sinh hoạt, Nghề nghiệp, và "Mẫu người mong muốn". Dữ liệu này sẽ làm đầu vào cho mô hình AI Recommend System (Collaborative Filtering / Content-based AI) để đề xuất ra những người có độ tương thích cao, thay vì hiển thị danh sách vu vơ. Kết quả là tăng Matching Rate và xịn xò hơn hẳn.

### 2. In-app Chat sau khi Match
**Lý do:** Bản chất dating app giải quyết bài toán giao tiếp. Khi ra được Match, cần cung cấp hạ tầng để 2 bên trò chuyện tìm hiểu trước khi ra ngoài hẹn mặt. Giữ cho user online trong app thay vì văng ra app khác (Zalo, Mess) gây giảm DAU.

### 3. Gợi ý địa điểm tự động hóa (Location-Based Suggestions)
**Lý do:** Khi hệ thống bắt được điểm giao thời gian chung, nó có thể dùng vị trí/khu vực của 2 bên kết hợp Google Maps/Places API để Recommend ngay 3 điểm ăn uống/café lân cận điểm giữa (midpoint location). Điều này giảm "ma sát" rất lớn trong việc nghĩ xem "đi đâu ăn gì".

### 4. Ghi nhận Notification / Push Alerts cho Web Push
**Lý do:** Booking lịch là thao tác bất đồng bộ. User A có thể đánh giờ rảnh, sau đó out app mất. Cần notification service push thẳng qua Chrome notification hoặc Mail để gọi User A vào app khi User B vừa match trùng slot và Date hẹn được xác nhận, giúp completion-rate cao hơn.

---
**Mini Dating App**
