# Scilab Web

Frontend Next.js của Scilab, được tổ chức theo kiến trúc feature-based.

## Tài liệu kiến trúc

- [Kiến trúc Feature-based và luồng Authentication](docs/feature-based-architecture-and-auth.md)

Auth sử dụng Next.js BFF và cookie `HttpOnly`. Browser không nhận access token,
refresh token và không gọi trực tiếp backend auth.

## Chạy local

Tạo `apps/web/.env.local` từ `apps/web/.env.example`, sau đó chạy từ root:

```bash
pnpm install
pnpm --filter web dev
```

Mở [http://localhost:3000](http://localhost:3000). Browser gọi `/api/auth/*`;
Next.js server gọi upstream được cấu hình bởi `SCILAB_API_ORIGIN`.

## Kiểm tra

```bash
pnpm --filter web format:check
pnpm --filter web lint
pnpm --filter web check-types
pnpm --filter web test
pnpm --filter web test:e2e
pnpm --filter web build
```
