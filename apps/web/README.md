# ScholarTrend Web

Frontend Next.js của ScholarTrend, được tổ chức theo kiến trúc feature-based.

## Tài liệu kiến trúc

- [Kiến trúc Feature-based và luồng Authentication](docs/feature-based-architecture-and-auth.md)

Tài liệu trên giải thích cấu trúc folder, hướng phụ thuộc, Next.js BFF proxy,
login, register, refresh session, logout, route guard, xử lý lỗi và cách thêm
feature mới.

## Chạy local

Tạo `apps/web/.env.local` từ `apps/web/.env.example`, sau đó chạy từ root của
monorepo:

```bash
pnpm install
pnpm --filter web dev
```

Mở [http://localhost:3000](http://localhost:3000). Auth request từ browser đi
qua `/api/backend/*`, sau đó Next.js server chuyển tiếp tới
`SCILAB_API_BASE_URL`.

## Kiểm tra

```bash
pnpm --filter web lint
pnpm --filter web check-types
pnpm --filter web test
pnpm --filter web test:e2e
```
