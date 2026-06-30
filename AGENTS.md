## Project Rules

- Khi thêm, sửa hoặc xóa một API endpoint trong backend, phải cập nhật tài liệu OpenAPI tương ứng trong `docs/openapi/openapi.yaml` và `docs/openapi/openapi.json` trong cùng thay đổi. Bao gồm path, method, request body, response envelope, status code, schema, security requirement và enum liên quan nếu có.
- Tuân thủ quy trình Test-Driven Development (TDD): Khi triển khai tính năng mới, thay đổi logic hoặc sửa lỗi (bug fix), luôn phải viết Unit Test (hoặc Integration Test) trước khi triển khai mã nguồn thực tế (implementation). Đảm bảo các test case bao phủ đầy đủ luồng hoạt động chuẩn (happy paths) và các trường hợp ngoại lệ (edge cases/error handling).

## Architecture & Folder Structure

- **HTTP DTO Placement:** Khi tạo hoặc sửa DTO dùng cho controller trong `interfaces/http/*.controller.ts`, phải đặt DTO trong thư mục `interfaces/http/dto/*.dto.ts`. Không định nghĩa DTO trực tiếp trong file controller.
- **Use Case Encapsulation (Folder-per-UseCase Pattern):** Khi tạo mới hoặc tái cấu trúc (refactor) một Use Case (Command hoặc Query), BẮT BUỘC phải tạo một thư mục riêng mang tên của Use Case đó (sử dụng định dạng `kebab-case`). Tuyệt đối không đặt các file Use Case nằm ngang hàng (flat co-location) trong thư mục `commands` hoặc `queries`.
- **Cấu trúc bắt buộc bên trong thư mục Use Case:** Mọi thành phần phụ thuộc của Use Case đó phải được đóng gói bên trong thư mục này, bao gồm:
  1. `[use-case-name].use-case.ts`: File chứa logic nghiệp vụ chính.
  2. `[use-case-name].dto.ts` (hoặc `.input.ts`): Định nghĩa Input/Output, Interfaces, hoặc Class Validator dành riêng cho Use Case này.
  3. `[use-case-name].spec.ts`: File Unit Test đi kèm (Tuân thủ TDD).
  4. `[use-case-name].errors.ts` (Tùy chọn): Chứa các Custom Exceptions/Errors đặc thù của Use Case này.

**Ví dụ cấu trúc thư mục chuẩn:**
```text
src/modules/auth/application/commands/register/
├── register.dto.ts
├── register.use-case.ts
└── register.spec.ts
```

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
specs/002-ci-pipeline/plan.md
<!-- SPECKIT END -->
