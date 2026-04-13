# Bluebook Main

Nền tảng luyện SAT/Bluebook xây bằng `Next.js 16`, `React 19`, `MongoDB`, `NextAuth`, `Redis`, `Gemini` và một số dịch vụ ngoài như Gmail SMTP, Google OAuth, Cloudinary.

README này được viết để người mới clone repo về có thể:

- cài dependency đúng cách
- cấu hình môi trường local
- chạy app ở mức tối thiểu
- bật đủ các tính năng nâng cao nếu cần
- seed dữ liệu mẫu để thử nhanh

## 1. Dự án này có gì

Các nhóm tính năng chính hiện có trong repo:

- đăng ký, đăng nhập bằng email/password
- đăng nhập bằng Google
- quên mật khẩu qua email
- vai trò `STUDENT`, `PARENT`, `ADMIN`
- làm bài test SAT, xem kết quả, dashboard
- AI chat giải thích câu hỏi bằng Gemini
- parent verification qua email
- leaderboard / hall of fame
- cache dữ liệu bằng Redis

Entry flow mặc định:

- nếu chưa đăng nhập, app chuyển về `/auth`
- sau khi đăng nhập, app chuyển tiếp qua `/auth/redirect`

## 2. Tech stack

- `Next.js 16`
- `React 19`
- `TypeScript`
- `MongoDB + Mongoose`
- `NextAuth`
- `Redis + ioredis`
- `Google Gemini API`
- `Nodemailer (Gmail SMTP)`
- `Cloudinary`
- `Ant Design`

## 3. Yêu cầu trước khi chạy

Khuyến nghị môi trường local:

- `Node.js 20 LTS` trở lên
- `npm` (repo hiện dùng `package-lock.json`)
- một MongoDB instance
- một Redis instance

Nếu muốn dùng đầy đủ tính năng, bạn cũng nên chuẩn bị:

- 1 Gmail account + App Password để gửi mail
- 1 Google OAuth app
- 1 Gemini API key
- 1 Cloudinary account

## 4. Clone và cài dependency

```bash
git clone <repo-url>
cd bluebook-main
npm install
```

Nếu đang dùng PowerShell và muốn tạo file env từ mẫu:

```powershell
Copy-Item .env.example .env.local
```

Hoặc tạo file `.env.local` thủ công rồi copy nội dung từ `.env.example`.

## 5. Setup nhanh nhất để app chạy local

Nếu mục tiêu của bạn chỉ là boot app lên để xem UI và bắt đầu phát triển, tối thiểu hãy cấu hình:

```env
MONGODB_URI=<mongodb connection string>
NEXTAUTH_SECRET=<random secret dài>
REDIS_URL=redis://localhost:6379
```

Sau đó chạy:

```bash
npm run dev
```

Mở:

```txt
http://localhost:3000
```

Lưu ý quan trọng:

- MongoDB là bắt buộc, nếu thiếu app sẽ fail ngay khi import `lib/mongodb.ts`
- `NEXTAUTH_SECRET` là bắt buộc để auth hoạt động ổn định
- Redis nên được bật ngay từ đầu vì nhiều service đang đọc/ghi cache trực tiếp

## 6. File môi trường đầy đủ

Repo đang có mẫu:

```txt
.env.example
```

Các biến hiện được code sử dụng thật:

| Biến | Bắt buộc | Dùng cho gì |
| --- | --- | --- |
| `MONGODB_URI` | Có | Kết nối MongoDB |
| `NEXTAUTH_SECRET` | Có | Ký session/token cho NextAuth |
| `REDIS_URL` | Nên có | Cache test/question/user/leaderboard |
| `GEMINI_API_KEY` | Khi dùng AI chat | Route `/api/chat` |
| `EMAIL_USER` | Khi dùng email | Quên mật khẩu, parent verification |
| `EMAIL_PASS` | Khi dùng email | Gmail App Password cho SMTP |
| `EMAIL_FROM_NAME` | Không | Tên người gửi email, có sẵn default |
| `GOOGLE_CLIENT_ID` | Khi dùng Google login | NextAuth Google provider |
| `GOOGLE_CLIENT_SECRET` | Khi dùng Google login | NextAuth Google provider |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Khi dùng upload/ảnh Cloudinary | Client-side Cloudinary config |
| `NEXT_PUBLIC_DESMOS_URL` | Khi dùng tính năng liên quan Desmos | URL public cho frontend |

Mẫu `.env.local` đầy đủ:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/bluebook-main
NEXTAUTH_SECRET=replace-with-a-long-random-secret
REDIS_URL=redis://127.0.0.1:6379

GEMINI_API_KEY=

EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM_NAME=Bluebook Support

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_DESMOS_URL=
```

## 7. Setup từng dịch vụ

### 7.1 MongoDB

Bạn có thể dùng:

- MongoDB local
- MongoDB Atlas

Ví dụ local:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/bluebook-main
```

Ví dụ Atlas:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db-name>?retryWrites=true&w=majority
```

### 7.2 NEXTAUTH_SECRET

Đây là secret cho NextAuth. Hãy dùng một chuỗi ngẫu nhiên dài.

Ví dụ:

```env
NEXTAUTH_SECRET=this-should-be-a-long-random-secret-value
```

### 7.3 Redis

Repo có `lib/redis.ts` và nhiều service gọi Redis trực tiếp:

- `leaderboardService`
- `questionService`
- `testService`
- `userService`

Vì vậy để tránh lỗi kết nối, nên chạy Redis local:

```env
REDIS_URL=redis://127.0.0.1:6379
```

Nếu bạn chưa có Redis:

- dùng Docker
- cài Redis local
- hoặc trỏ sang Redis cloud

Ví dụ Docker:

```bash
docker run -d --name bluebook-redis -p 6379:6379 redis
```

### 7.4 Gmail SMTP cho email

Được dùng cho:

- quên mật khẩu
- gửi mã xác minh parent

Thiết lập:

1. đăng nhập Gmail
2. bật 2-Step Verification
3. tạo App Password
4. dùng App Password đó cho `EMAIL_PASS`

Ví dụ:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password
EMAIL_FROM_NAME=Bluebook Support
```

Nếu gặp lỗi kiểu `WebLoginRequired`, hãy mở Gmail trên trình duyệt, hoàn tất các bước xác minh bảo mật rồi tạo lại App Password.

### 7.5 Google OAuth

Được dùng cho nút đăng nhập Google ở trang `/auth`.

Bạn cần tạo OAuth credentials trong Google Cloud Console và thêm:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Khi chạy local, nhớ cấu hình redirect URI phù hợp cho NextAuth, thường là:

```txt
http://localhost:3000/api/auth/callback/google
```

### 7.6 Gemini API

Được dùng cho tính năng chat giải thích câu hỏi.

```env
GEMINI_API_KEY=
```

Nếu biến này trống, route chat sẽ báo lỗi `"Gemini API key not configured"`.

### 7.7 Cloudinary

Nếu bạn có tính năng upload/hiển thị ảnh Cloudinary trong luồng đang phát triển, cấu hình:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
```

Trong `.env.example` còn có `CLOUDINARY_URL`, nhưng hiện tại biến đang được code đọc trực tiếp là `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.

## 8. Chạy dự án

### Development

```bash
npm run dev
```

### Production build

```bash
npm run build
npm run start
```

### Lint

```bash
npm run lint
```

## 9. Seed dữ liệu mẫu

Repo có sẵn script seed:

```bash
npm run seed
```

Script này:

- đọc `MONGODB_URI` từ `.env.local`
- tạo 1 test mẫu
- thêm 1 số câu hỏi mẫu vào database

Ngoài ra repo còn có:

- `parse_and_seed.ts`
- `reading_sample.txt`
- `math_sample.txt`

Đây là script nhập dữ liệu lớn hơn từ text sample, nhưng hiện chưa có npm script riêng trong `package.json`. Nếu muốn chạy thủ công:

```bash
npx tsx parse_and_seed.ts
```

Lưu ý:

- `parse_and_seed.ts` có xóa dữ liệu cũ trong collection `Test` và `Question`
- chỉ chạy script này khi bạn chấp nhận reset lại dữ liệu test/question

## 10. Cách kiểm tra sau khi setup

Sau khi đã cấu hình xong và chạy `npm run dev`, bạn nên kiểm tra theo thứ tự:

1. mở `http://localhost:3000`
2. xác nhận app redirect về `/auth` khi chưa đăng nhập
3. thử đăng ký tài khoản mới bằng email/password
4. đăng nhập lại bằng tài khoản vừa tạo
5. nếu đã seed dữ liệu, kiểm tra danh sách test/question
6. nếu đã cấu hình email, thử flow quên mật khẩu
7. nếu đã cấu hình Gemini, thử AI chat trong review flow
8. nếu đã cấu hình Google OAuth, thử nút đăng nhập Google

## 11. Scripts hiện có

| Lệnh | Ý nghĩa |
| --- | --- |
| `npm run dev` | Chạy local development server |
| `npm run build` | Build production |
| `npm run start` | Chạy bản production đã build |
| `npm run lint` | Chạy ESLint |
| `npm run seed` | Seed dữ liệu mẫu vào MongoDB |
| `npm run changelog` | Sinh/cập nhật changelog |

## 12. Cấu trúc thư mục đáng chú ý

| Thư mục / file | Vai trò |
| --- | --- |
| `app/` | App Router pages và API routes |
| `app/api/` | Backend route handlers |
| `components/` | UI components |
| `lib/models/` | Mongoose models |
| `lib/services/` | Business logic |
| `lib/controllers/` | API controller layer |
| `lib/authOptions.ts` | Cấu hình NextAuth |
| `lib/mongodb.ts` | Kết nối MongoDB |
| `lib/redis.ts` | Kết nối Redis |
| `lib/email.ts` | Gửi email qua Gmail SMTP |
| `docs/RBAC_SYSTEM.md` | Tài liệu RBAC và role design |
| `seed.ts` | Seed dữ liệu mẫu cơ bản |
| `parse_and_seed.ts` | Parse text sample rồi import test/question |

## 13. Các lỗi thường gặp

### `Please define the MONGODB_URI environment variable inside .env.local`

Nguyên nhân:

- chưa tạo `.env.local`
- chưa điền `MONGODB_URI`

Cách xử lý:

- tạo `.env.local`
- kiểm tra lại connection string MongoDB

### Không đăng nhập được bằng Google

Kiểm tra:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- redirect URI trong Google Cloud Console

### Gửi email thất bại

Kiểm tra:

- `EMAIL_USER`
- `EMAIL_PASS`
- Gmail App Password
- Gmail account đã qua bước xác minh bảo mật chưa

### Chat AI báo lỗi cấu hình

Kiểm tra:

- `GEMINI_API_KEY`

### Một số route lỗi Redis connection

Kiểm tra:

- Redis có đang chạy không
- `REDIS_URL` có đúng không

## 14. Khuyến nghị cho người mới vào repo

Nếu bạn muốn onboard nhanh và ít bị block, hãy đi theo thứ tự này:

1. `npm install`
2. tạo `.env.local`
3. điền `MONGODB_URI`, `NEXTAUTH_SECRET`, `REDIS_URL`
4. chạy `npm run dev`
5. chạy `npm run seed`
6. xác nhận đăng ký/đăng nhập hoạt động
7. sau đó mới bật dần email, Google login, Gemini, Cloudinary

## 15. Ghi chú thêm

- Repo hiện có thư mục `.next/` và `node_modules/` trong workspace local; khi clone mới thì bạn vẫn nên chạy lại `npm install`
- Route `/api/export-pdf` hiện trả về `410` và thông báo dùng client-side print flow thay vì server-side PDF export
- Role trong hệ thống hiện là `STUDENT`, `PARENT`, `ADMIN`
