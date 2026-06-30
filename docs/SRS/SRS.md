# FPT UNIVERSITY
### Faculty of Software Engineering
### SOFTWARE REQUIREMENTS SPECIFICATION
## SciLab – Scientific Journal Publication Trend Tracking System

| Project Code | Course | Group | Instructor | Version | Date | Status |
|---|---|---|---|---|---|---|
| SU26SWP06 | SWD391 – Software Development Project | Group 2 | PhuongLHK | **2.0 – Updated** | June 2026 | Draft |

### Ghi chú phiên bản (Changelog)

So với phiên bản 1.0, tài liệu phiên bản 2.0 cập nhật một thay đổi kiến trúc trọng yếu: hệ thống chuyển từ mô hình lưu trữ đơn nhất 100% RDBMS sang kiến trúc **Đa cơ sở dữ liệu (Polyglot Persistence)**, kết hợp **PostgreSQL** (lưu dữ liệu người dùng và nghiệp vụ) và **Neo4j** (lưu mạng lưới dữ liệu học thuật dạng đồ thị). Các nội dung chịu ảnh hưởng trực tiếp bao gồm: Mục II (Mô hình dữ liệu), Mục III (Logic truy xuất Bookmark/Follow, bổ sung nhóm tính năng khai thác đồ thị), và Mục IV (bổ sung yêu cầu phi chức năng về tính nhất quán dữ liệu).

---

## I. Overview

### 1. Introduction

SciLab – Journal Finder (Project Code: SU26SWP06) là nền tảng web học thuật, giải quyết bài toán thực tiễn: giảng viên, sinh viên và nhà nghiên cứu gặp khó khăn trong việc theo dõi xu hướng công bố khoa học do số lượng tạp chí và bài báo học thuật ngày càng gia tăng. SciLab thu thập metadata và metric học thuật từ **OpenAlex API** làm nguồn dữ liệu học thuật duy nhất để cung cấp:

- Công cụ tìm kiếm và lọc tạp chí học thuật theo nhiều tiêu chí.
- Phân tích xu hướng công bố theo thời gian dựa trên từ khóa và chủ đề.
- Dashboard trực quan với biểu đồ tương tác.
- Hệ thống bookmark, theo dõi và thông báo cá nhân hóa.
- Báo cáo phân tích xuất ra PDF/CSV cho nhà nghiên cứu.
- **(Mới)** Trực quan hóa mạng lưới tri thức học thuật (Knowledge Graph) và gợi ý bài báo liên quan dựa trên thuật toán đồ thị.

Hệ thống không lưu trữ toàn văn bài báo (do giới hạn bản quyền), không hỗ trợ nộp bài, và không xử lý thanh toán. Dữ liệu được đồng bộ định kỳ, không yêu cầu thời gian thực.

Về mặt lưu trữ, SciLab áp dụng kiến trúc **Polyglot Persistence**: dữ liệu mang bản chất mạng lưới quan hệ phức tạp (bài báo – tác giả – từ khóa – tạp chí – chủ đề) được lưu trong cơ sở dữ liệu đồ thị **Neo4j**, trong khi dữ liệu nghiệp vụ mang bản chất giao dịch (người dùng, cấu hình, log, bookmark) tiếp tục được lưu trong **PostgreSQL**.

#### 1.1 Key Assumptions & Constraints

- Chỉ thu thập metadata (tiêu đề, abstract, keywords, năm, tác giả, journal).
- Giới hạn lĩnh vực ban đầu: Computer Science và Artificial Intelligence.
- API học thuật bên thứ ba được giả định luôn khả dụng và trả về cấu trúc nhất quán.
- Đồng bộ dữ liệu theo chu kỳ (hàng ngày hoặc hàng tuần), không realtime.
- OpenAlex API là nguồn dữ liệu học thuật duy nhất trong phạm vi phiên bản này; hệ thống không đồng bộ dữ liệu từ Semantic Scholar, Crossref hoặc SCImago.
- Hỗ trợ trình duyệt: Chrome, Firefox, Edge, Safari (2 phiên bản mới nhất).
- **(Mới)** Hệ thống chấp nhận mô hình **eventual consistency** giữa PostgreSQL và Neo4j: do hai hệ quản trị dữ liệu độc lập, không tồn tại transaction phân tán (distributed transaction) đảm bảo ACID xuyên cơ sở dữ liệu; tính nhất quán được đảm bảo thông qua cơ chế đối soát (reconciliation) định kỳ ở tầng ứng dụng.
- **(Mới)** PostgreSQL không lưu bản sao (duplicate) metadata học thuật; mọi tham chiếu đến Article/Author/Journal/Keyword/Topic từ PostgreSQL chỉ là Reference ID (UUID) trỏ sang Node tương ứng trong Neo4j.

#### 1.2 Dependencies

- **OpenAlex API** – nguồn dữ liệu học thuật duy nhất; cung cấp metadata bài báo, tạp chí/nguồn xuất bản, tác giả, keyword/topic, quan hệ trích dẫn, metric theo năm và các external IDs khi có.
- **SMTP/Email Service** – gửi thông báo cho người dùng (SendGrid hoặc tương đương).
- **JWT/OAuth2** – xác thực và phân quyền người dùng.
- **(Mới) Neo4j Graph Database** – lưu trữ và truy vấn mạng lưới học thuật (Article, Author, Keyword, Journal, Topic) bằng ngôn ngữ Cypher; là nguồn dữ liệu chính (source of truth) cho mọi nghiệp vụ liên quan đến nội dung học thuật.
- **(Mới) PostgreSQL** – lưu trữ dữ liệu người dùng, cấu hình hệ thống, log vận hành, và các bảng tham chiếu (Reference ID).

#### 1.3 Context Diagram

SciLab đóng vai trò trung tâm kết nối 3 nhóm người dùng (Nhà nghiên cứu, Giảng viên/Sinh viên, Quản trị viên) với 1 nguồn dữ liệu học thuật ngoại vi (OpenAlex API), 1 dịch vụ thông báo (SMTP Email), và nội bộ vận hành song song hai hệ quản trị cơ sở dữ liệu (PostgreSQL, Neo4j) đóng vai trò lưu trữ chuyên biệt theo bản chất dữ liệu.

**External Entities and Interactions:**

- **Researcher**: Truy cập phân tích xu hướng chuyên sâu, xuất báo cáo, theo dõi keyword, khai thác công cụ đồ thị (Knowledge Graph, Graph Search).
- **Student**: Tìm bài tham khảo, khám phá chủ đề phổ biến, bookmark.
- **System Admin**: Quản lý tài khoản, cấu hình API, kích hoạt đồng bộ dữ liệu, theo dõi sức khỏe của cả hai cơ sở dữ liệu.
- **OpenAlex**: Cung cấp metadata bài báo, tạp chí/nguồn xuất bản, tác giả, keyword/topic, quan hệ trích dẫn, metric học thuật và external IDs qua REST API; ETL ghi metadata học thuật vào Neo4j và ghi metric theo năm vào PostgreSQL khi cần.
- **Email Service**: Gửi thông báo alert cho người dùng đăng ký theo dõi.

### 2. Business Main Flows

**2.1 Register / Log In** — Người dùng mới đăng ký bằng email + mật khẩu hoặc qua OAuth2 (Google). Sau khi đăng ký, vai trò mặc định là Student. Admin có thể nâng cấp vai trò lên Researcher hoặc Admin. Đăng nhập trả về JWT access token (1h) và refresh token (7 ngày).

**2.2 Search Journal & Article** — Người dùng (kể cả chưa đăng nhập) truy cập tính năng tìm kiếm tạp chí hoặc bài báo. Hệ thống trả về danh sách phân trang (20 items/page) với bộ lọc (lĩnh vực, OA status, xếp hạng, năm, quốc gia). Chọn một journal/article → trang chi tiết đầy đủ. *(Toàn bộ dữ liệu Journal/Article cho luồng này được truy vấn trực tiếp từ Neo4j.)*

**2.3 Publication Trend Analysis** — Người dùng đã đăng nhập truy cập module Phân tích Xu hướng, nhập từ khóa/chủ đề, chọn khoảng thời gian và bộ lọc. Hệ thống truy vấn dữ liệu tổng hợp từ Neo4j và vẽ biểu đồ đường/cột số lượng công bố theo năm. Hỗ trợ xuất CSV/PNG.

**2.4 Bookmark, Follow & Notification** — Người dùng đã đăng nhập có thể bookmark bài báo, theo dõi tạp chí và keyword. Các hành động này được ghi nhận tại PostgreSQL dưới dạng Reference ID, sau đó được "ghép" (join) với metadata gốc tại Neo4j khi hiển thị (xem chi tiết Mục III.6). Khi có bài báo mới khớp với đối tượng đang theo dõi, hệ thống gửi thông báo in-app hoặc email (theo cấu hình của người dùng: hàng ngày/hàng tuần/tắt).

**2.5 Dashboard & Report** — Dashboard cá nhân hóa hiển thị thống kê tổng hợp và xu hướng dựa trên chủ đề đang theo dõi. Nhà nghiên cứu có thêm dashboard mở rộng (so sánh nhiều keyword, heatmap) và **(mới)** công cụ trực quan hóa mạng lưới tri thức (Knowledge Graph). Hỗ trợ xuất báo cáo PDF/CSV theo khoảng thời gian và tập chủ đề.

**2.6 Data Synchronization (Background Job)** — Hệ thống có scheduler chạy nền, định kỳ gọi **OpenAlex API** để đồng bộ metadata bài báo và thông tin tạp chí mới, ghi (upsert) Node/Edge vào Neo4j, đồng thời ghi metric theo năm từ OpenAlex vào PostgreSQL nếu cần báo cáo/xếp hạng. Mỗi job ghi log vào bảng Sync_Log (PostgreSQL). Admin có thể kích hoạt đồng bộ thủ công từ bảng quản trị. Hệ thống dùng `openalex_id` làm khóa chống trùng chính, `doi_normalized` là khóa phụ khi có.

**2.7 Admin Management** — Admin quản lý toàn bộ tài khoản người dùng (xem, kích hoạt/vô hiệu hóa, đổi vai trò), cấu hình nguồn API, lên lịch đồng bộ, quản lý phân loại chủ đề và theo dõi sức khỏe của cả PostgreSQL và Neo4j.

### 3. Business Rules

| BR ID | Business Rule Description |
|---|---|
| BR-01 | Mọi người dùng phải đăng ký tài khoản trước khi sử dụng các tính năng cần xác thực (bookmark, theo dõi, dashboard, xuất báo cáo). |
| BR-02 | Email phải là duy nhất trong hệ thống và đúng định dạng. Mật khẩu tối thiểu 8 ký tự, bao gồm chữ và số. |
| BR-03 | Sau đăng ký thành công, hệ thống gán vai trò `STUDENT` làm mặc định. |
| BR-04 | Hỗ trợ đăng ký và đăng nhập qua OAuth2 (Google). Email đã tồn tại → đăng nhập; email mới → tạo tài khoản. |
| BR-05 | JWT access token có thời hạn 1 giờ; refresh token có thời hạn 7 ngày. |
| BR-06 | Các endpoint và trang dành cho Admin trả về HTTP 403 với người dùng không có quyền. |
| BR-07 | Thay đổi email hoặc vai trò người dùng yêu cầu duyệt của Admin. |
| BR-08 | Kết quả tìm kiếm tạp chí và bài báo được phân trang, mặc định 20 mục mỗi trang. |
| BR-09 | Bộ lọc tìm kiếm tạp chí hỗ trợ: open access, OA diamond, lĩnh vực, chủ đề, quốc gia, khu vực, loại chỉ số và khoảng giá trị chỉ số. |
| BR-10 | Trang chi tiết tạp chí bao gồm biểu đồ xu hướng số lượng bài báo công bố theo năm. |
| BR-11 | Phân tích xu hướng yêu cầu ít nhất một từ khóa hoặc chủ đề. Dữ liệu được tính từ publication_year của Node Article liên kết. |
| BR-12 | Biểu đồ xu hướng hỗ trợ zoom, chọn khoảng thời gian và xuất CSV/PNG. |
| BR-13 | Khi không tìm thấy dữ liệu cho từ khóa/khoảng thời gian, hệ thống hiển thị trạng thái trống kèm gợi ý mở rộng tìm kiếm. |
| BR-14 | Nếu dữ liệu cũ hơn 7 ngày kể từ lần đồng bộ cuối, hệ thống hiển thị banner cảnh báo. |
| BR-15 | Dashboard hỗ trợ widget có thể sắp xếp lại hoặc ẩn theo tùy chọn người dùng. |
| BR-16 | Nhà nghiên cứu có dashboard mở rộng: so sánh nhiều keyword, heatmap tần suất công bố, tiến trình xếp hạng tạp chí. |
| BR-17 | Thông báo email có thể cấu hình: chỉ in-app, hàng ngày, hàng tuần, hoặc tắt. |
| BR-18 | Hệ thống dùng `openalex_id` làm khóa chống trùng chính trên Node Article tại Neo4j; `doi_normalized` là khóa phụ khi có; dự phòng cuối cùng là tiêu đề + năm + journal. |
| BR-19 | Mỗi job đồng bộ ghi log: thời gian bắt đầu, kết thúc, số bản ghi cập nhật, lỗi phát sinh. |
| BR-20 | Admin có thể kích hoạt đồng bộ thủ công bất kỳ lúc nào từ bảng quản trị. |
| BR-21 | Toàn bộ giao tiếp client-server qua HTTPS (TLS 1.2+). JWT, mật khẩu bcrypt (work factor ≥ 12). |
| BR-22 | API key bên thứ ba lưu trong hệ thống phải được mã hóa at rest. |
| BR-23 | Cấu hình theo môi trường (API key, DB credentials) quản lý qua biến môi trường, không hardcode. |
| **BR-24** | **(Mới)** PostgreSQL tuyệt đối không lưu bản sao metadata học thuật (title, abstract, author name, keyword...); mọi bảng nghiệp vụ liên quan đến bài báo/tạp chí/từ khóa/chủ đề chỉ lưu Reference ID (UUID) trỏ sang Node tương ứng tại Neo4j. |
| **BR-25** | **(Mới)** Mọi truy vấn cần hiển thị đồng thời dữ liệu nghiệp vụ (Postgres) và metadata học thuật (Neo4j) phải gộp danh sách Reference ID thành **một** lệnh truy vấn duy nhất (batch query, dùng toán tử `IN`) tới Neo4j; nghiêm cấm truy vấn lặp (N+1 query) theo từng ID đơn lẻ. |
| **BR-26** | **(Mới)** Hệ thống phải có cơ chế chạy nền định kỳ để phát hiện và xử lý "Reference ID mồ côi" (orphan reference) — tức ID còn tồn tại tại PostgreSQL nhưng Node tương ứng đã bị xóa khỏi Neo4j trong quá trình đồng bộ. |

### 4. Use Cases

#### 4.1 Use Case Diagram

Hệ thống SciLab có 4 actor chính và **19 ca sử dụng** (16 ca sử dụng gốc + 3 ca sử dụng mới khai thác đồ thị tri thức), phân thành 4 nhóm theo quyền truy cập:

- Công khai (không cần đăng nhập): UC-01 đến UC-06, **UC-18**.
- Yêu cầu đăng nhập: UC-07 đến UC-11.
- Nhà nghiên cứu (mở rộng): UC-12, UC-13, **UC-17, UC-19**.
- Quản trị viên: UC-14 đến UC-16.

*[Xem Use Case Diagram đính kèm – vẽ bằng PlantUML/Mermaid]*

#### 4.2 Use Case Descriptions

| ID | Feature | Use Case | Description |
|---|---|---|---|
| UC-01 | Authentication | Register Account | Người dùng mới tạo tài khoản bằng email/mật khẩu hoặc OAuth2 (Google). |
| UC-02 | Authentication | Login / Logout | Truy cập có xác thực và kết thúc phiên làm việc. |
| UC-03 | Journal Search | Search Journal | Tìm tạp chí theo tên, ISSN, chủ đề, xếp hạng, trạng thái OA, quốc gia. |
| UC-04 | Journal Search | View Journal Detail | Xem hồ sơ đầy đủ, lịch sử xếp hạng, biểu đồ xu hướng, bài báo gần đây. |
| UC-05 | Article Search | Search Article | Tìm bài báo theo từ khóa, tác giả, tạp chí, DOI, khoảng năm. |
| UC-06 | Article Search | View Article Detail | Xem đầy đủ metadata bài báo (tiêu đề, abstract, keyword, DOI, tác giả). |
| UC-07 | Trend Analysis | Analyze Publication Trend | Xem biểu đồ xu hướng công bố theo từ khóa/chủ đề và khoảng thời gian. |
| UC-08 | Dashboard | View Dashboard | Xem phân tích cá nhân hóa và thống kê toàn hệ thống. |
| UC-09 | Bookmarks | Bookmark Article | Lưu Reference ID bài báo vào danh sách bookmark cá nhân (Postgres), hiển thị bằng truy vấn chéo sang Neo4j. |
| UC-10 | Follow & Notify | Follow Journal/Topic | Đăng ký nhận cập nhật cho tạp chí hoặc từ khóa/chủ đề bằng Reference ID (Postgres), đối chiếu với Neo4j. |
| UC-11 | Follow & Notify | Receive Notification | Nhận cảnh báo in-app hoặc email về các thực thể đang theo dõi. |
| UC-12 | Report | Export Report | Tải về báo cáo phân tích dưới dạng PDF hoặc CSV (Researcher only). |
| UC-13 | Dashboard | Advanced Dashboard | Dashboard mở rộng: so sánh keyword, heatmap, tiến trình xếp hạng (Researcher). |
| UC-14 | Admin | Manage Users | Xem, kích hoạt/vô hiệu hóa, đổi vai trò tài khoản người dùng. |
| UC-15 | Admin | Configure Data Source | Thêm/sửa/xóa cấu hình API bên ngoài, tần suất đồng bộ. |
| UC-16 | Admin | Trigger Data Sync | Khởi chạy thủ công hoặc lên lịch công việc đồng bộ dữ liệu (Postgres + Neo4j). |
| **UC-17** | **Knowledge Graph** | **Knowledge Graph Visualization** | **(Mới)** Researcher xem biểu đồ mạng lưới đồ thị trực quan: Node trung tâm là bài báo, tỏa ra tác giả, từ khóa, bài trích dẫn liên quan. |
| **UC-18** | **Recommendation** | **Graph-based Recommendation Engine** | **(Mới)** Gợi ý "Các bài báo tương tự" trên trang View Article Detail, dựa trên thuật toán đồ thị (đồng tác giả, chung từ khóa). |
| **UC-19** | **Advanced Search** | **Graph-based Advanced Search** | **(Mới)** Researcher tìm kiếm mối liên hệ phức tạp trong mạng lưới học thuật (ví dụ: nhóm tác giả thường xuất bản cùng nhau trong một chủ đề cụ thể). |

### 5. System Functions

#### 5.1 Screen Flow

Hệ thống SciLab có 7 luồng màn hình chính: (1) Authentication Flow, (2) Journal Search & Detail Flow, (3) Article Search & Detail Flow, (4) Trend Analysis Flow, (5) Dashboard & Report Flow, (6) Admin Management Flow, **(7) Knowledge Graph & Advanced Graph Search Flow (mới)**.

*[Xem Screen Flow Diagram đính kèm – vẽ bằng Figma/Lucidchart]*

#### 5.2 Screen Details

| # | Feature | Screen | Description |
|---|---|---|---|
| 1 | Authentication | Register / Login | Form đăng ký/đăng nhập, hỗ trợ OAuth2 Google. |
| 2 | Authentication | Profile Management | Cập nhật thông tin cá nhân, avatar, ngày sinh, giới tính. |
| 3 | Journal Search | Journal List | Danh sách tạp chí với bộ lọc, sắp xếp, phân trang. |
| 4 | Journal Search | Journal Detail | Hồ sơ đầy đủ tạp chí, lịch sử xếp hạng, biểu đồ xu hướng. |
| 5 | Article Search | Article List | Danh sách bài báo với bộ lọc, sắp xếp, phân trang. |
| 6 | Article Search | Article Detail | Metadata đầy đủ bài báo, nút bookmark, **widget "Bài báo tương tự" (mới)**. |
| 7 | Trend Analysis | Trend Analysis | Form nhập keyword/chủ đề, biểu đồ đường/cột, xuất CSV/PNG. |
| 8 | Dashboard | User Dashboard | Widget thống kê cá nhân hóa, top keyword, top lĩnh vực. |
| 9 | Dashboard | Advanced Dashboard | So sánh nhiều keyword, heatmap, tiến trình xếp hạng (Researcher). |
| 10 | Bookmarks | Bookmark List | Danh sách bài báo đã bookmark (ghép Postgres + Neo4j), quản lý theo dõi. |
| 11 | Notifications | Notification Center | Danh sách thông báo in-app, cấu hình tùy chọn email. |
| 12 | Admin | User Management | Bảng danh sách tài khoản, actions: activate/deactivate/change role. |
| 13 | Admin | API Config | Quản lý cấu hình nguồn API, test kết nối, lên lịch đồng bộ. |
| 14 | Admin | System Health | Chỉ số: số bản ghi PostgreSQL, số Node/Edge Neo4j, lần đồng bộ gần nhất, nhật ký lỗi, orphan reference. |
| **15** | **Knowledge Graph** | **Knowledge Graph View** | **(Mới)** Trực quan hóa mạng lưới đồ thị quanh một bài báo (Researcher). |
| **16** | **Advanced Search** | **Graph Advanced Search** | **(Mới)** Form truy vấn mối liên hệ đồ thị phức tạp (Researcher). |

#### 5.3 User Authorization

| Screen / Function | Student | Researcher | System Admin | Guest |
|---|---|---|---|---|
| Register (Sign Up) | X | X | X | |
| Login / Logout | X | X | X | X |
| Profile Management | X | X | X | |
| Search Journal / Article | X | X | X | X |
| View Journal / Article Detail | X | X | X | X |
| **Graph-based Recommendation (Similar Articles)** | **X** | **X** | **X** | **X** |
| Bookmark Article | X | X | | |
| Follow Journal / Topic / Keyword | X | X | | |
| Receive Notifications | X | X | | |
| View User Dashboard | X | X | | |
| Trend Analysis (Basic) | X | X | | |
| Advanced Dashboard | | X | | |
| Export Report (PDF/CSV) | | X | | |
| **Knowledge Graph Visualization** | | **X** | | |
| **Graph-based Advanced Search** | | **X** | | |
| Manage Users | | | X | |
| Configure API Sources | | | X | |
| Trigger Data Sync | | | X | |
| Manage Subject Classification | | | X | |
| View System Health | | | X | |

**Roles:**

- **Guest**: Truy cập các tính năng công khai (tìm kiếm, xem chi tiết, gợi ý bài báo tương tự), không cần đăng nhập.
- **Student**: Đăng ký/đăng nhập, bookmark, theo dõi, nhận thông báo, dashboard cơ bản.
- **Researcher**: Tất cả quyền của Student + dashboard mở rộng, xuất báo cáo, Knowledge Graph Visualization, Graph-based Advanced Search.
- **System Admin**: Quản lý người dùng, cấu hình API, đồng bộ dữ liệu, theo dõi hệ thống (cả PostgreSQL và Neo4j).

#### 5.4 Non-Screen Functions

| # | Feature | System Function | Description |
|---|---|---|---|
| 1 | Data Sync | Scheduled Sync Job | Cron job định kỳ gọi OpenAlex API; upsert Node/Edge vào Neo4j; ghi metric theo năm từ OpenAlex vào PostgreSQL khi cần. Ghi log mỗi lần chạy vào Sync_Log. |
| 2 | Data Sync | Deduplication Service | Kiểm tra `openalex_id` (fallback: `doi_normalized`, sau đó title+year+journal) trên Node Article tại Neo4j trước khi tạo/cập nhật, tránh bản ghi trùng lặp. |
| 3 | Notification | Alert Dispatch Service | Background service truy vấn Neo4j tìm bài báo mới khớp đối tượng theo dõi (lấy danh sách object_id đang follow từ Postgres), gửi thông báo in-app và email theo lịch đã cấu hình. |
| 4 | Analytics | Trend Aggregation Job | Tổng hợp và cache dữ liệu xu hướng công bố theo năm (Cypher aggregation trên Neo4j) để tối ưu hiệu năng truy vấn dashboard. |
| 5 | Auth | Token Refresh Service | Xử lý refresh JWT access token khi hết hạn, vô hiệu hóa refresh token sau khi đăng xuất. |
| 6 | Report | Report Generation Service | Tạo file PDF/CSV từ dữ liệu phân tích (Neo4j) theo yêu cầu của Researcher. |
| **7** | **Data Consistency** | **Orphan Reference Cleanup Job** | **(Mới)** Cron job chạy nền định kỳ, quét toàn bộ Reference ID tại User_Bookmark/User_Follow, đối soát với Neo4j, xử lý ID mồ côi. |

---

## II. System High Level Design

### 1. Tổng quan kiến trúc dữ liệu (Polyglot Persistence Overview)

SciLab áp dụng kiến trúc **Polyglot Persistence**, lựa chọn công cụ lưu trữ phù hợp với bản chất từng loại dữ liệu:

- **PostgreSQL (Relational)**: lưu dữ liệu nghiệp vụ và vận hành có cấu trúc bảng rõ ràng, ít thay đổi quan hệ — tài khoản người dùng, cấu hình hệ thống, metric tạp chí theo năm từ OpenAlex, log đồng bộ, và các bảng "liên kết" (bookmark, follow) chỉ chứa **Reference ID**.
- **Neo4j (Graph)**: lưu mạng lưới học thuật — bài báo, tác giả, từ khóa, tạp chí, chủ đề — nơi mối quan hệ nhiều-nhiều (N-N) giữa các thực thể là trọng tâm truy vấn (ai viết bài nào, bài nào trích dẫn bài nào, tác giả nào hay xuất bản chung). Đây là dạng dữ liệu mà JOIN nhiều bảng trung gian trong RDBMS trở nên tốn kém khi độ sâu truy vấn tăng (ví dụ: "tác giả của tác giả cùng từ khóa"), trong khi Neo4j duyệt theo cạnh (edge traversal) với độ phức tạp gần như không đổi theo độ sâu.

**Nguyên tắc cốt lõi**: Neo4j là **nguồn dữ liệu duy nhất (single source of truth)** cho mọi metadata học thuật. PostgreSQL không lưu bản sao của bất kỳ thuộc tính học thuật nào (title, abstract, author name, keyword, journal name...); PostgreSQL chỉ lưu **Reference ID (UUID)** khi cần liên kết một hành vi nghiệp vụ (bookmark, follow) tới một Node trong Neo4j.

*[Xem Sơ đồ kiến trúc tổng thể đính kèm – vẽ bằng draw.io, thể hiện 2 cụm dữ liệu PostgreSQL và Neo4j cùng hướng truy vấn giữa Backend (NestJS) và từng cụm]*

### 2. Conceptual Data Model

#### 2.1 Phần quan hệ (PostgreSQL)

- **User** – tương tác với hệ thống qua bookmark, follow, nhận thông báo.
- **Auth_Session** – phiên đăng nhập, lưu hash token và thời hạn access/refresh token.
- **System_Config** – cấu hình nguồn dữ liệu OpenAlex.
- **Journal_Ranking** – metric/chỉ số tạp chí theo năm lấy từ OpenAlex (tham chiếu Journal qua Reference ID).
- **User_Bookmark / User_Follow** – hành vi người dùng, chỉ lưu Reference ID trỏ sang Neo4j.
- **Sync_Log** – nhật ký vận hành của tiến trình đồng bộ.

#### 2.2 Phần đồ thị (Neo4j)

- **Article ↔ Author** (ai viết bài nào), **Article ↔ Keyword** (bài nào gắn từ khóa nào), **Article → Topic** (bài nào thuộc chủ đề nào), **Topic → Topic** (phân cấp chủ đề nếu có), **Article → Journal** (bài được công bố ở tạp chí nào), **Article → Article** (trích dẫn).

*[Xem Conceptual Data Model đính kèm – phần PostgreSQL vẽ bằng dbdiagram.io, phần Graph Model vẽ bằng Neo4j Arrows.app]*

### 3. Relational Database Schema (PostgreSQL) — Business & Operational Data

**Nguyên tắc thiết kế**: Mọi bảng tại đây phục vụ nghiệp vụ giao dịch (transactional), không lưu metadata học thuật. Database sử dụng PostgreSQL, khóa chính dùng UUID, enum được định nghĩa để ràng buộc giá trị hợp lệ.

| No | Table | Description |
|---|---|---|
| 01 | **User** | Người dùng đã đăng ký. Lưu thông tin xác thực, hồ sơ và vai trò. — PK: `user_id` (uuid) — Fields: `email` (NN), `password`, `type` (auth_provider E), `status` (status_account E), `role` (role_account E: STUDENT/RESEARCHER/ADMIN), `last_name`, `first_name`, `url_image`, `date_of_birth`, `gender`. |
| 02 | **Auth_Session** *(mới)* | Phiên đăng nhập của người dùng. Lưu hash token để refresh/thu hồi phiên an toàn. — PK: `auth_session_id` (uuid) — FK: `user_id` (FK → User, NN) — Fields: `access_token_id_hash` (UK, NN), `refresh_token_hash` (UK, NN), `issued_at`, `access_token_expires_at`, `refresh_token_expires_at`, `revoked_at`, `created_at`, `last_used_at`, `rotated_at`. |
| 03 | **System_Config** *(mới)* | Cấu hình nguồn dữ liệu OpenAlex phục vụ UC-15. — PK: `config_id` (uuid) — Fields: `api_name` (giá trị mặc định: OpenAlex), `api_endpoint`, `api_key` (mã hóa at rest, nullable nếu dùng public access), `sync_frequency` (enum: daily/weekly), `is_active` (bool), `last_tested_at`, `created_at`, `updated_at`. |
| 04 | **Journal_Ranking** | Chỉ số/metric hàng năm của tạp chí lấy từ OpenAlex. — PK: `journal_ranking_id` (uuid) — FK: `journal_id` *(Reference ID → Node Journal tại Neo4j, không còn là khóa ngoại nội bộ)*, `subject_category_id` (FK → Subject_Category), `metric_id` (FK → Ranking_Metric, NN) — Fields: `source` (ranking_source E, NN, chỉ `openalex`), `year` (int, NN), `value_txt`, `value_int`, `value_float`, `created_at`. |
| 05 | **Ranking_Metric** | Danh mục các loại chỉ số lấy từ OpenAlex (VD: works_count, cited_by_count, h_index, i10_index, 2yr_mean_citedness). — PK: `metric_id` (uuid) — Fields: `code`, `display_name`, `metric_type` (ranking_metric_type E), `description`. |
| 06 | **Subject_Area** | Lĩnh vực chuyên môn rộng (VD: Computer Science). Là danh mục tra cứu; danh sách subject_categories trên Node Journal (Neo4j) tham chiếu tên hiển thị từ đây. — PK: `subject_area_id` (uuid) — Fields: `display_name`, `description`. |
| 07 | **Subject_Category** | Danh mục chi tiết trong một lĩnh vực. — PK: `subject_category_id` (uuid) — FK: `subject_area_id` — Fields: `display_name`, `description`. |
| 08 | **User_Bookmark** *(mới)* | Bookmark bài báo của người dùng — chỉ lưu Reference ID, **không** lưu metadata bài báo. — PK: `user_bookmark_id` (uuid) — FK: `user_id` (NN) — Fields: `article_id` (uuid, **Reference ID → Node Article tại Neo4j**), `created_at`. Unique: (`user_id`, `article_id`). |
| 09 | **User_Follow** *(mới)* | Theo dõi Journal/Keyword/Topic của người dùng — chỉ lưu Reference ID. — PK: `user_follow_id` (uuid) — FK: `user_id` (NN) — Fields: `object_type` (enum: JOURNAL/KEYWORD/TOPIC, NN), `object_id` (uuid, **Reference ID → Node tương ứng tại Neo4j**), `notify_mode` (enum: in_app/daily/weekly/off), `created_at`. Unique: (`user_id`, `object_type`, `object_id`). |
| 10 | **Notification** | Thông báo in-app/email cho người dùng. — PK: `notification_id` (uuid) — FK: `user_id` — Fields: `title`, `message`, `related_object_type`, `related_object_id` (Reference ID), `is_read` (bool), `created_at`. |
| 11 | **Sync_Log** *(mới)* | Nhật ký mỗi lần chạy job đồng bộ. — PK: `sync_log_id` (uuid) — Fields: `source` (enum: openalex/orphan_cleanup), `started_at`, `finished_at`, `total_fetched` (int), `total_inserted` (int), `total_updated` (int), `total_errors` (int), `status` (enum: success/failed/partial), `error_detail` (text), `created_at`. |

> **Lưu ý quan trọng**: `journal_id` trong bảng `Journal_Ranking`, `article_id` trong `User_Bookmark`, và `object_id` trong `User_Follow` **không** được khai báo ràng buộc khóa ngoại (Foreign Key constraint) ở cấp database engine, vì thực thể được tham chiếu không tồn tại trong PostgreSQL — chúng là **Reference ID**, được kiểm soát toàn vẹn ở tầng ứng dụng (application-level integrity) và bởi cơ chế đối soát mô tả tại Mục IV.7.

### 4. Graph Data Model (Neo4j) — Academic Network Data

**Nguyên tắc thiết kế**: Mọi thực thể mang bản chất mạng lưới học thuật (bài báo, tác giả, từ khóa, tạp chí, chủ đề) và mọi quan hệ N-N giữa chúng được mô hình hóa thành Node và Edge (Relationship), loại bỏ hoàn toàn các bảng trung gian (junction table) từng tồn tại trong thiết kế RDBMS gốc.

#### 4.1 Node Labels

| Node Label | Properties chính | Mô tả |
|---|---|---|
| **Article** | `id` (uuid – Reference ID dùng tại Postgres), `title`, `abstract`, `doi`, `doi_normalized`, `openalex_id`, `semantic_scholar_id`, `crossref_id`, `publication_year`, `version`, `volume_number`, `issue_number`, `created_at`, `updated_at` | Bài báo nghiên cứu. Các external source IDs giúp đối chiếu dữ liệu giữa nguồn học thuật và chống trùng lặp; `doi_normalized` phục vụ tìm kiếm/so khớp DOI ổn định. `volume_number`/`issue_number` được gộp trực tiếp làm thuộc tính, không còn là thực thể Volume/Issue riêng. |
| **Author** | `id` (uuid), `orcid`, `display_name`, `url_image` | Tác giả bài báo. |
| **Keyword** | `id` (uuid), `display_name` | Từ khóa học thuật. |
| **Journal** | `id` (uuid), `source_id`, `display_name`, `type`, `is_open_access` (bool), `is_oa_diamond` (bool), `coverage`, `country`, `region`, `issn_list` (array), `issn_normalized_list` (array), `publisher_name`, `publisher_image_url`, `subject_categories` (array, tên danh mục — chi tiết tra cứu tại bảng `Subject_Category` ở Postgres), `created_at`, `updated_at` | Tạp chí học thuật. `source_id` lưu ID nguồn chính; `issn_normalized_list` phục vụ tìm kiếm/so khớp ISSN. Thông tin Publisher và ISSN trước đây tách bảng riêng, nay gộp làm property. |
| **Topic** | `id` (uuid), `display_name`, `score` | Chủ đề nghiên cứu cấp cao; nếu dữ liệu có phân cấp, dùng relationship `PARENT_OF` giữa các Topic. |

#### 4.2 Relationships (Edges)

| Edge | Hướng | Properties | Mô tả |
|---|---|---|---|
| **WROTE** | `(Author) -> (Article)` | `author_position` (int, thứ tự tác giả) | Thay thế hoàn toàn bảng trung gian `Author_Article`. |
| **HAS_KEYWORD** | `(Article) -> (Keyword)` | `score` (double, độ liên quan) | Thay thế hoàn toàn bảng trung gian `Keyword_Article`; `score` được giữ lại như property của Edge. |
| **PUBLISHED_IN** | `(Article) -> (Journal)` | — | Xác định bài báo được công bố tại tạp chí nào. |
| **BELONGS_TO** | `(Article) -> (Topic)` | — | Thay thế quan hệ Article–Topic/Sub_Topic trước đây; chủ đề con (sub-topic) nếu cần được lưu như property bổ sung trên Edge hoặc property mở rộng của Node Topic. |
| **CITES** *(bổ sung mới)* | `(Article) -> (Article)` | — | Quan hệ trích dẫn giữa các bài báo, cần thiết để phục vụ tính năng Knowledge Graph Visualization (UC-17) và Graph-based Recommendation (UC-18). |
| **PARENT_OF** *(tùy chọn)* | `(Topic) -> (Topic)` | — | Quan hệ phân cấp chủ đề, dùng khi nguồn dữ liệu có topic hierarchy. Topic cha trỏ tới Topic con. |

> **Index & Constraint**: Tạo `UNIQUE CONSTRAINT` trên thuộc tính `id` của từng Node Label (Article, Author, Keyword, Journal, Topic) để đảm bảo tính duy nhất và tối ưu tốc độ tra cứu theo Reference ID khi Backend gửi truy vấn `IN [$ids]` từ PostgreSQL.

*[Xem Graph Data Model đính kèm – vẽ bằng Neo4j Arrows.app]*

### 5. Bảng đối chiếu thay đổi (Migration Mapping)

| Thực thể / Bảng (thiết kế cũ – 100% RDBMS) | Trạng thái mới | Ghi chú |
|---|---|---|
| Publisher | Loại bỏ bảng riêng — gộp vào property `publisher_name`, `publisher_image_url` của Node **Journal** (Neo4j) | |
| Journal | Chuyển thành Node **Journal** (Neo4j) | Riêng metric theo năm (`Journal_Ranking`) vẫn ở Postgres, tham chiếu qua Reference ID |
| Journal_ISSN | Loại bỏ bảng riêng — gộp vào property `issn_list[]` của Node Journal | |
| Volume | Loại bỏ bảng riêng — gộp vào property `volume_number` của Node **Article** | |
| Issue | Loại bỏ bảng riêng — gộp vào property `issue_number` của Node Article | |
| Article | Chuyển thành Node **Article** (Neo4j) | `id` dùng làm Reference ID tại Postgres (User_Bookmark...) |
| Author | Chuyển thành Node **Author** (Neo4j) | |
| **Author_Article** | **Loại bỏ hoàn toàn** — thay bằng Edge **WROTE** | Junction table |
| Keyword | Chuyển thành Node **Keyword** (Neo4j) | |
| **Keyword_Article** | **Loại bỏ hoàn toàn** — thay bằng Edge **HAS_KEYWORD** (`score` là property của Edge) | Junction table |
| Topic | Chuyển thành Node **Topic** (Neo4j) | |
| Sub_Topic | Loại bỏ bảng composite — gộp vào metadata Edge BELONGS_TO / property mở rộng của Node Topic | |
| **Journal_Subject_Category** | **Loại bỏ hoàn toàn** — thay bằng property `subject_categories[]` trên Node Journal (Neo4j); danh mục gốc vẫn tra cứu tại bảng `Subject_Category` (PostgreSQL) để phục vụ lọc nhanh ở tầng API | Junction table |
| Ranking_Metric, Subject_Area, Subject_Category | Giữ nguyên tại PostgreSQL | Dữ liệu danh mục/tĩnh, không thuộc mạng lưới học thuật |
| Journal_Ranking | Giữ nguyên tại PostgreSQL | `journal_id` chuyển từ FK nội bộ thành Reference ID trỏ Neo4j |
| *(mới)* User_Bookmark, User_Follow, Sync_Log, System_Config | Bảng mới tại PostgreSQL | Phục vụ lưu Reference ID và vận hành hệ thống |

### 6. Cơ chế tham chiếu chéo & nhất quán dữ liệu (Cross-Database Reference Strategy)

- **Reference ID Pattern**: Mọi bảng nghiệp vụ tại PostgreSQL cần liên kết tới một thực thể học thuật chỉ lưu UUID (trùng với thuộc tính `id` của Node tương ứng tại Neo4j) — không có bản sao metadata, không có ràng buộc khóa ngoại liên-cơ-sở-dữ-liệu.
- **Batch Lookup**: Khi Backend cần hiển thị dữ liệu kết hợp, luôn tập hợp danh sách Reference ID trước, sau đó gửi **một** Cypher query duy nhất (`MATCH (n) WHERE n.id IN $ids ...`) tới Neo4j, tránh truy vấn N+1 (xem chi tiết quy trình tại Mục III.6).
- **Đối soát định kỳ**: Cơ chế cron job quét và xử lý orphan reference được mô tả chi tiết tại Mục IV.7 (Data Consistency).

---

## III. Functional Requirements

### 1. Authentication & Authorization

#### a. Register Account (UC-01)

Function trigger: Người dùng nhấn 'Sign Up' từ trang Landing hoặc Login. Description: Cho phép người dùng mới tạo tài khoản bằng email/mật khẩu. Sau khi đăng ký thành công, hệ thống gán vai trò Student mặc định.

Function Details:
- Input: email (required, unique, valid format), display name (required), password (min 8 chars, alphanumeric), confirm password.
- Validation: kiểm tra email unique, mật khẩu khớp, định dạng hợp lệ. Thông báo lỗi inline ngay bên cạnh trường không hợp lệ.
- Success: trả về JWT access token + refresh token, redirect đến Home.
- Error cases: email đã tồn tại (400), định dạng không hợp lệ (422), lỗi OAuth2 (503).

#### b. Login / Logout (UC-02)

Function trigger: Người dùng nhấn 'Login' hoặc hết phiên làm việc. Description: Xác thực email/mật khẩu, cấp JWT. Đăng xuất vô hiệu hóa refresh token hiện tại.

Function Details:
- Input: email + password.
- Success: JWT access token (1h) + refresh token (7 ngày), lưu HttpOnly cookie.
- Token refresh: tự động gia hạn session khi access token hết hạn.
- Logout: gọi `POST /auth/logout` → backend blacklist refresh token.

### 2. Journal Search & Discovery

> **Lưu ý kỹ thuật**: Toàn bộ dữ liệu Journal trong mục này được truy vấn trực tiếp từ Neo4j bằng Cypher, vì Journal là Node trong mô hình đồ thị — đây là nguồn dữ liệu chính (source of truth), không qua PostgreSQL.

#### a. Search Journal (UC-03)

Function trigger: Người dùng truy cập trang 'Journals' hoặc nhập từ khóa vào thanh tìm kiếm. Description: Tìm kiếm tạp chí theo nhiều tiêu chí, hỗ trợ bộ lọc và sắp xếp, kết quả phân trang.

Function Details:
- Search fields: tên tạp chí (partial match), ISSN, lĩnh vực chuyên môn, danh mục chủ đề, tên nhà xuất bản, quốc gia/khu vực.
- Filters: open access (bool), OA diamond (bool), subject area, subject category, country, region, OpenAlex metric type, metric value range.
- Sort: tên A-Z, metric value cao→thấp, năm xuất bản gần nhất.
- Pagination: 20 items/page, hiển thị tổng số kết quả.
- Result card: tên tạp chí, ISSN, nhà xuất bản, OA badge, top metric value, chủ đề chính.

#### b. View Journal Detail (UC-04)

Function trigger: Người dùng click vào một tạp chí từ trang danh sách. Description: Hiển thị toàn bộ thông tin tạp chí, lịch sử xếp hạng và xu hướng công bố.

Function Details:
- Thông tin: tên, tất cả ISSN, nhà xuất bản, khu vực, OA status, danh mục chủ đề — toàn bộ lấy từ Node Journal (Neo4j).
- Lịch sử metric: bảng theo năm với các chỉ số từ OpenAlex (VD: works_count, cited_by_count, h_index, i10_index, 2yr_mean_citedness) — lấy từ bảng `Journal_Ranking` (PostgreSQL), join bằng Reference ID.
- Biểu đồ xu hướng: số lượng bài báo công bố theo năm (line/bar chart) — aggregate từ Neo4j theo Edge `PUBLISHED_IN`.
- Danh sách bài báo gần đây (20 bài mới nhất) — Neo4j.
- Nút Follow (yêu cầu đăng nhập) để theo dõi tạp chí này — ghi Reference ID vào `User_Follow` (PostgreSQL).

### 3. Article Search

> **Lưu ý kỹ thuật**: Toàn bộ dữ liệu Article trong mục này được truy vấn trực tiếp từ Neo4j.

#### a. Search Article (UC-05)

Function trigger: Người dùng truy cập trang 'Articles' hoặc nhập từ khóa vào thanh tìm kiếm. Description: Tìm kiếm bài báo theo từ khóa, tác giả, tạp chí, DOI hoặc năm xuất bản.

Function Details:
- Search fields: keyword (khớp với title, abstract, Node Keyword qua Edge `HAS_KEYWORD`), tên tác giả (qua Edge `WROTE`), tên tạp chí (qua Edge `PUBLISHED_IN`), DOI, khoảng năm xuất bản.
- Result item: title, authors, journal, year, abstract (rút gọn 200 chars), keywords, DOI link, nút Bookmark.
- Pagination: 20 items/page.

#### b. View Article Detail (UC-06)

Function trigger: Người dùng click vào một bài báo từ kết quả tìm kiếm. Description: Hiển thị toàn bộ metadata bài báo (Neo4j).

Function Details:
- Hiển thị: title, full author list, journal, volume/issue, year, full abstract, keywords, topic, DOI link.
- Nút Bookmark (yêu cầu đăng nhập) — ghi Reference ID vào `User_Bookmark`.
- Link ngoài: DOI dẫn đến publisher site.
- **(Mới)** Widget "Các bài báo tương tự" — xem chi tiết tại Mục III.9.b.

### 4. Publication Trend Analysis

#### a. Analyze Publication Trend (UC-07)

Function trigger: Người dùng đã đăng nhập điều hướng đến trang 'Trend Analysis'. Description: Module phân tích xu hướng cho phép nhập từ khóa/chủ đề và xem biểu đồ số lượng công bố theo năm.

Function Details:
- Input: 1-5 từ khóa hoặc chủ đề, khoảng thời gian (default: 5 năm gần nhất), tùy chọn lọc theo lĩnh vực/tạp chí.
- Processing: Cypher aggregation trên Neo4j, đếm Article theo `publication_year` cho từng Keyword/Topic; cache kết quả 24h.
- Chart: line chart hoặc bar chart (người dùng chọn), mỗi keyword = 1 line/group, trục X = năm, trục Y = số bài báo.
- Interactions: zoom, select time range, toggle keyword lines.
- Export: PNG (biểu đồ) hoặc CSV (dữ liệu thô).
- Empty state: nếu không có dữ liệu → hiển thị thông báo và gợi ý mở rộng tìm kiếm.
- Stale data warning: nếu lần đồng bộ cuối > 7 ngày (theo `Sync_Log`) → hiển thị banner cảnh báo.
- Trending topics: danh sách keyword/chủ đề nổi bật xếp hạng theo tốc độ tăng trưởng (1/3/5 năm).

### 5. Dashboard & Analytics

#### a. User Dashboard (UC-08)

Function trigger: Người dùng đã đăng nhập điều hướng đến trang 'Dashboard'. Description: Dashboard cá nhân hóa hiển thị thống kê tổng hợp và xu hướng dựa trên chủ đề/tạp chí đang theo dõi.

Function Details – Standard Dashboard:
- Tổng số tạp chí, tổng số bài báo đã lập chỉ mục trong hệ thống (đếm Node tại Neo4j).
- Top 10 từ khóa nổi bật tháng này.
- Top 5 lĩnh vực theo số lượng công bố.
- Thống kê cá nhân: bài báo mới từ keyword/journal đang theo dõi (7 ngày gần nhất) — lấy `object_id` từ `User_Follow` (Postgres), batch query Neo4j.
- Widget có thể sắp xếp lại (drag & drop) hoặc ẩn theo tùy chọn người dùng.

Function Details – Advanced Dashboard (Researcher only – UC-13):
- So sánh xu hướng nhiều keyword trên cùng biểu đồ.
- Biểu đồ tiến trình xếp hạng tạp chí đang theo dõi theo năm.
- Heatmap tần suất công bố: trục X = tháng, trục Y = keyword/chủ đề.

#### b. Export Report (UC-12)

Function trigger: Researcher nhấn 'Export Report' trên Dashboard hoặc Trend Analysis. Description: Tạo và tải về báo cáo phân tích dưới dạng PDF hoặc CSV.

Function Details:
- Input: khoảng thời gian, tập chủ đề/tạp chí do người dùng chọn, định dạng xuất (PDF/CSV).
- PDF: bao gồm tiêu đề, thống kê tổng quan, biểu đồ xu hướng, bảng dữ liệu.
- CSV: dữ liệu thô (year, keyword, count) để dùng trong công cụ phân tích bên ngoài.

### 6. Bookmark, Follow & Notification *(Cập nhật logic truy xuất Đa cơ sở dữ liệu)*

#### a. Bookmark Article (UC-09)

Function trigger: Người dùng đã đăng nhập nhấn nút Bookmark trên kết quả tìm kiếm hoặc trang chi tiết bài báo.

**Luồng ghi nhận (Write Flow):**
1. Toggle: nhấn lần 1 → Backend ghi 1 record vào `User_Bookmark` (PostgreSQL) gồm `user_id`, `article_id` (Reference ID), `created_at`. Nhấn lần 2 → xóa record (bỏ bookmark).
2. Không giới hạn số lượng bookmark.

**Luồng hiển thị danh sách (Cross-Database Read Flow)** — khi người dùng mở trang Bookmark List trên Profile:

| Bước | Hành động | Cơ sở dữ liệu |
|---|---|---|
| 1 | `SELECT article_id FROM User_Bookmark WHERE user_id = ? ORDER BY created_at DESC LIMIT 20 OFFSET (page-1)*20` — lấy danh sách Reference ID đã phân trang theo thời điểm bookmark. | PostgreSQL |
| 2 | Dùng mảng `article_id` thu được ở Bước 1, gộp thành **một** Cypher query duy nhất: `MATCH (a:Article) WHERE a.id IN [$ids] OPTIONAL MATCH (a)<-[:WROTE]-(au:Author) OPTIONAL MATCH (a)-[:PUBLISHED_IN]->(j:Journal) RETURN a, collect(au), j` để lấy đầy đủ metadata (tránh truy vấn lặp N+1). | Neo4j |
| 3 | Backend **map** (ghép) kết quả Neo4j theo đúng thứ tự Reference ID đã lấy ở Bước 1 (giữ nguyên `ORDER BY created_at`), bổ sung thêm trường riêng của Postgres (ví dụ `bookmarked_at`), rồi trả JSON hoàn chỉnh cho Frontend. | Backend (NestJS) |

- Error handling: nếu một `article_id` không tìm thấy Node tương ứng tại Neo4j (đã bị xóa do quá trình đồng bộ/lọc trùng), Backend loại bản ghi đó khỏi kết quả trả về và đánh dấu là "orphan reference" để Orphan Reference Cleanup Job xử lý (xem Mục IV.7).

#### b. Follow Journal / Topic (UC-10)

Function trigger: Người dùng đã đăng nhập nhấn nút Follow trên trang chi tiết journal hoặc chọn keyword để theo dõi từ Trend Analysis.

**Luồng ghi nhận (Write Flow):**
- Backend ghi 1 record vào `User_Follow` (PostgreSQL): `user_id`, `object_type` (JOURNAL/KEYWORD/TOPIC), `object_id` (Reference ID trỏ Node tương ứng tại Neo4j), `notify_mode`, `created_at`.
- Quản lý: bỏ follow bất kỳ lúc nào từ trang Profile hoặc từ chính journal/keyword đó (xóa record tương ứng).

**Luồng hiển thị "Danh sách đang theo dõi" (Cross-Database Read Flow)** — áp dụng đúng mẫu 3 bước như UC-09 (lấy `object_id` phân trang từ Postgres → batch Cypher `IN [$ids]` tới Neo4j theo từng `object_type` → map kết quả).

**Luồng phát hiện & gửi thông báo (Reverse Cross-Database Flow)** — do Alert Dispatch Service thực hiện định kỳ:

| Bước | Hành động | Cơ sở dữ liệu |
|---|---|---|
| 1 | Lấy toàn bộ `object_id` đang được follow theo từng loại (JOURNAL/KEYWORD/TOPIC), loại bỏ trùng lặp. | PostgreSQL |
| 2 | Dùng danh sách `object_id` này trong **một** Cypher query để tìm các Node Article mới được đồng bộ trong khoảng thời gian gần nhất có Edge `PUBLISHED_IN`/`HAS_KEYWORD`/`BELONGS_TO` trỏ tới các đối tượng đó (`WHERE j.id IN [$ids]` …). | Neo4j |
| 3 | Với từng Article khớp, Backend truy vấn ngược lại `User_Follow` (Postgres) theo `object_id` tương ứng để lấy danh sách `user_id` cần gửi thông báo, sau đó kích hoạt gửi in-app/email theo `notify_mode` đã cấu hình. | PostgreSQL → Notification Service |

#### c. Notification (UC-11)

Function trigger: Background service kiểm tra hàng ngày/tuần theo lịch đã cấu hình.

Function Details:
- In-app notification: hiển thị badge đếm trên icon chuông, danh sách thông báo trong Notification Center.
- Email notification: gửi qua SMTP service (SendGrid) với digest hàng ngày hoặc hàng tuần.
- User settings: cấu hình chế độ (in-app only / email daily / email weekly / off) per notification type, lưu tại `notify_mode` trong `User_Follow`.

### 7. Data Synchronization

#### a. Scheduled Sync Job (FR-SYNC-01)

Function trigger: Cron job kích hoạt theo lịch đã cấu hình (hàng ngày hoặc hàng tuần).

Function Details:
- Gọi duy nhất **OpenAlex API** theo lịch cấu hình; không gọi Semantic Scholar, Crossref hoặc SCImago.
- Rate limiting: tuân thủ giới hạn tốc độ OpenAlex API, dùng queue/batch (BullMQ).
- Deduplication: kiểm tra `openalex_id` trên Node Article (Neo4j) trước khi tạo/cập nhật; fallback `doi_normalized`, sau đó title+year+journal.
- **Ghi dữ liệu**: Node/Edge học thuật (Article, Author, Keyword, Journal, Topic, WROTE, HAS_KEYWORD, PUBLISHED_IN, BELONGS_TO, CITES, PARENT_OF nếu có hierarchy) → **Neo4j**; metric theo năm từ OpenAlex → bảng `Journal_Ranking` (**PostgreSQL**, qua Reference ID `journal_id`).
- Logging: ghi log thời gian bắt đầu, kết thúc, số bản ghi cập nhật/thêm mới, lỗi phát sinh vào `Sync_Log` (PostgreSQL).
- Error handling: nếu API ngoài không khả dụng → skip, hiển thị dữ liệu cache, thông báo độ tươi.

#### b. Manual Sync Trigger (FR-SYNC-03)

Function trigger: Admin nhấn 'Sync Now' trên bảng quản trị.

Function Details:
- Khởi chạy sync job ngay lập tức (async, không block UI).
- Hiển thị progress và kết quả sync trên Admin Dashboard.

### 8. System Administration

#### a. User Management (UC-14)

Function trigger: Admin truy cập trang Admin > Users.

Function Details:
- Bảng danh sách: tất cả tài khoản với email, vai trò, ngày đăng ký, trạng thái.
- Actions: Activate / Deactivate / Delete tài khoản; Change Role (`STUDENT` ↔ `RESEARCHER`/`ADMIN`).
- Search & filter: theo email, vai trò, trạng thái.

#### b. API Source Configuration (UC-15)

Function trigger: Admin truy cập trang Admin > Data Sources.

Function Details:
- Cập nhật cấu hình OpenAlex: URL endpoint, API key nếu có (mã hóa at rest), tần suất đồng bộ.
- Test connection: ping OpenAlex API và hiển thị kết quả.
- Enable/Disable tiến trình đồng bộ OpenAlex.

#### c. System Health (FR-ADM-06)

Function trigger: Admin truy cập trang Admin > System Health.

Function Details:
- Số lượng bản ghi: tổng journals, articles, authors, keywords (đếm Node tại Neo4j).
- **(Mới)** Trạng thái kết nối và số lượng Node/Edge theo từng loại tại Neo4j cluster.
- Sync status: thời điểm đồng bộ gần nhất, trạng thái (success/failed), số bản ghi cập nhật (từ `Sync_Log`).
- **(Mới)** Số lượng Reference ID mồ côi (orphan reference) phát hiện ở lần quét gần nhất.
- Error logs: danh sách lỗi gần đây với timestamp và mô tả.

### 9. Graph-Powered Features *(Nhóm tính năng mới — khai thác Neo4j)*

#### a. Knowledge Graph Visualization (UC-17)

Function trigger: Researcher nhấn "Xem mạng lưới tri thức" trên trang View Article Detail.

Function Details:
- Node trung tâm là bài báo đang xem; tỏa ra các Node liên quan trực tiếp: tác giả (qua `WROTE`), từ khóa (qua `HAS_KEYWORD`), bài báo được trích dẫn/trích dẫn bài này (qua `CITES`), tạp chí công bố (qua `PUBLISHED_IN`).
- Truy vấn Cypher dạng: `MATCH (a:Article {id: $id})-[r]-(n) RETURN a, r, n LIMIT 50` (giới hạn độ sâu 1–2 cấp để tránh quá tải hiển thị).
- Tương tác: click vào một Node liên quan để "đào sâu" (expand), hiển thị thêm các Node lân cận của Node đó.
- Phân quyền: chỉ Researcher.

#### b. Graph-based Recommendation Engine (UC-18)

Function trigger: Tự động hiển thị widget "Các bài báo tương tự" trên trang View Article Detail (UC-06), không yêu cầu đăng nhập.

Function Details:
- Tiêu chí tương tự: (i) đồng tác giả — các Article khác có cùng Node Author qua Edge `WROTE`; (ii) chung nhiều từ khóa — các Article có số lượng Edge `HAS_KEYWORD` trùng Keyword cao nhất (xếp hạng theo số từ khóa chung, tương tự hệ số Jaccard); (iii) cùng chủ đề (`BELONGS_TO` cùng Topic).
- Truy vấn Cypher dạng: tìm các Article khác có chung Author hoặc Keyword với Article hiện tại, đếm số kết nối chung, sắp xếp giảm dần, giới hạn top 5–10 kết quả.
- Hiển thị: danh sách rút gọn (title, journal, year) kèm nhãn lý do gợi ý (VD: "Cùng 3 từ khóa", "Cùng tác giả").

#### c. Graph-based Advanced Search (UC-19)

Function trigger: Researcher truy cập trang "Graph Advanced Search".

Function Details:
- Use case mẫu: "Tìm các tác giả thường xuyên xuất bản cùng nhau trong một chủ đề cụ thể" — Input: chọn 1 Topic hoặc Keyword; Output: danh sách cặp/nhóm Author có số lần cùng xuất hiện trong Edge `WROTE` trên các Article thuộc Topic đó, sắp xếp theo số lần đồng xuất bản giảm dần.
- Truy vấn Cypher dạng: `MATCH (t:Topic {id:$id})<-[:BELONGS_TO]-(a:Article)<-[:WROTE]-(au:Author) WITH a, collect(au) AS authors UNWIND ... RETURN pairs, count(*) AS co_pub_count ORDER BY co_pub_count DESC`.
- Kết quả hiển thị dạng bảng hoặc mini-graph các cặp tác giả nổi bật.
- Phân quyền: chỉ Researcher.

---

## IV. Non-Functional Requirements

### 1. Performance

| ID | Requirement | Measurement Condition |
|---|---|---|
| NFR-P01 | Truy vấn tìm kiếm tạp chí và bài báo trả kết quả trong 2 giây. | ≤ 100 concurrent users |
| NFR-P02 | Tải trang dashboard ban đầu trong 3 giây. | Kết nối băng thông rộng |
| NFR-P03 | Vẽ biểu đồ xu hướng trong 3 giây. | Dữ liệu ≤ 10 năm, 5 keyword |
| NFR-P04 | Background sync xử lý ≥ 5.000 bản ghi/giờ. | Không giảm tốc độ phản hồi người dùng |
| **NFR-P05** *(mới)* | **Truy vấn gợi ý "Bài báo tương tự" (UC-18) trả kết quả trong ≤ 1,5 giây.** | **Article có ≤ 20 Edge HAS_KEYWORD/WROTE trực tiếp** |
| **NFR-P06** *(mới)* | **Knowledge Graph Visualization (UC-17) render đồ thị trong ≤ 3 giây.** | **Độ sâu truy vấn ≤ 2 cấp, ≤ 50 Node hiển thị** |
| **NFR-P07** *(mới)* | **Mọi truy vấn hiển thị dữ liệu kết hợp Postgres + Neo4j (Bookmark List, Follow List) phải hoàn tất trong ≤ 2 giây cho 20 bản ghi/trang, dùng đúng một batch query tới mỗi cơ sở dữ liệu (không N+1).** | **≤ 100 concurrent users** |

### 2. Scalability

- NFR-S01: Kiến trúc backend hỗ trợ horizontal scaling của tầng API.
- NFR-S02: Hỗ trợ ≥ 500 authenticated users đồng thời trong phiên bản đầu.
- **NFR-S03** *(mới)*: Neo4j và PostgreSQL được scale độc lập theo đặc tính tải riêng (Neo4j chịu tải đọc/truy vấn đồ thị; PostgreSQL chịu tải giao dịch người dùng).

### 3. Security

| ID | Requirement |
|---|---|
| NFR-SEC01 | Toàn bộ giao tiếp HTTP phải mã hóa bằng TLS 1.2+. |
| NFR-SEC02 | Mật khẩu lưu dưới dạng bcrypt hash, work factor ≥ 12. |
| NFR-SEC03 | API endpoints kiểm tra và lọc toàn bộ đầu vào (SQL injection, XSS, **và Cypher injection đối với truy vấn Neo4j**). |
| NFR-SEC04 | JWT access token: 1h; refresh token: 7 ngày. |
| NFR-SEC05 | API key bên thứ ba lưu phải được mã hóa at rest. |
| **NFR-SEC06** *(mới)* | **Toàn bộ tham số đầu vào dùng để xây dựng Cypher query (đặc biệt danh sách Reference ID trong toán tử `IN`) phải được tham số hóa (parameterized query), không nối chuỗi trực tiếp.** |

### 4. Reliability & Availability

- NFR-R01: Uptime ≥ 99.5% (không tính downtime bảo trì có lịch).
- NFR-R02: Khi API bên ngoài không khả dụng, hiển thị dữ liệu cache và thông báo độ tươi.
- NFR-R03: Backup DB hàng ngày, lưu giữ 30 ngày, **áp dụng cho cả PostgreSQL và Neo4j**.

### 5. Usability

- NFR-U01: Responsive design, hỗ trợ màn hình 768px đến 1920px.
- NFR-U02: Tuân thủ WCAG 2.1 Level AA.
- NFR-U03: Các quy trình chính (tìm kiếm, bookmark, xem xu hướng) hoàn thành trong ≤ 4 bước từ trang chủ.
- NFR-U04: Hỗ trợ nhãn tiếng Việt và tiếng Anh.

### 6. Maintainability

- NFR-M01: Unit test coverage ≥ 70% cho business logic layer.
- NFR-M02: API contract tài liệu hóa bằng OpenAPI 3.0.
- NFR-M03: Cấu hình môi trường (API key, DB credentials) quản lý qua biến môi trường.
- **NFR-M04** *(mới)*: Lớp truy cập dữ liệu (Data Access Layer) trong NestJS phải tách biệt rõ Repository cho PostgreSQL (TypeORM/Prisma) và Repository cho Neo4j (Cypher), không trộn logic truy vấn của hai cơ sở dữ liệu trong cùng một class/service.

### 7. Data Consistency *(Mục mới — Tính nhất quán dữ liệu Đa cơ sở dữ liệu)*

| ID | Requirement |
|---|---|
| **NFR-DC01** | Hệ thống phải có một cron job đối soát (reconciliation job) chạy định kỳ (đề xuất: mỗi đêm), quét toàn bộ Reference ID trong các bảng `User_Bookmark` và `User_Follow` tại PostgreSQL, kiểm tra sự tồn tại tương ứng tại Neo4j bằng một batch query duy nhất (`IN [$ids]`) cho mỗi loại Node. |
| **NFR-DC02** | Khi phát hiện Reference ID không còn tồn tại Node tương ứng tại Neo4j ("orphan reference") — ví dụ do quá trình đồng bộ lại (re-sync), gộp trùng (merge) dữ liệu, hoặc xóa do chất lượng dữ liệu — hệ thống phải đánh dấu hoặc xóa các bản ghi orphan đó khỏi `User_Bookmark`/`User_Follow`. |
| **NFR-DC03** | Mọi lượt quét đối soát phải được ghi log vào `Sync_Log` (số lượng orphan phát hiện, số lượng đã xử lý, thời gian thực hiện) để phục vụ giám sát tại màn hình System Health. |
| **NFR-DC04** | *(Khuyến nghị, không bắt buộc)* Khi orphan reference được xử lý, hệ thống có thể gửi thông báo cho người dùng liên quan (VD: "Một bài báo trong danh sách bookmark của bạn không còn khả dụng") để minh bạch về thay đổi dữ liệu. |
| **NFR-DC05** | Cơ chế đối soát không được gây ảnh hưởng đến hiệu năng phục vụ người dùng đang hoạt động (chạy ở khung giờ thấp điểm hoặc với mức ưu tiên tài nguyên thấp — low-priority background job). |

---

*Hết tài liệu.*
