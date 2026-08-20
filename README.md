# 🌸 Thư Ký Kim — Holographic Neural Operating System

Hệ điều hành trợ lý ảo AI Hologram thế hệ mới với giao diện tương lai, tích hợp chuẩn **OpenAI Chat Completions** (mặc định Gateway **Xkiro AI** với mô hình **Gwen 3.8 max**), giao thức **MCP (Model Context Protocol)**, phân tích dữ liệu chuyên sâu **Python & Pandas/NumPy**, tự động xuất bảng tính **Excel (.xlsx)**, và hệ thống **4 Tầng Cache siêu tốc**.

---

## 🌟 Tính năng Nổi bật

1. **Chuẩn kết nối OpenAI Chat Completions & Đa API Dự phòng (Fallback Pool)**:
   - Hỗ trợ đa nhà cung cấp: **Xkiro AI** (Mặc định: `https://api.xkiro.com/v1`, Model: `Gwen 3.8 max`), **OpenAI**, **OpenRouter**, **DeepSeek**, **Groq**, **Ollama** (Local), và **Custom API Gateway**.
   - Tự động chuyển đổi sang cổng API dự phòng nếu cổng chính quá tải hoặc gặp sự cố mạng.
   - Hỗ trợ truyền dữ liệu theo luồng thời gian thực (SSE Streaming).

2. **Giao thức MCP (Model Context Protocol) & Công cụ Dòng lệnh**:
   - Tích hợp sẵn hơn 15 công cụ chuyên sâu: Máy tính khoa học (`kim_calculator`), Trích xuất & Hệ thống hóa tài liệu (`kim_document_systemizer`), Phân tích dữ liệu Python (`kim_python_data_analyzer`), Xuất file Excel (`kim_excel_generator`), Duyệt web đa nguồn (`kim_web_search`), Giám sát tài nguyên (`kim_system_stats`), Mã hóa (`kim_crypto_hasher`), v.v.

3. **Môi trường Dòng lệnh Thư Ký Kim OS (Terminal)**:
   - Môi trường `/workspace/Thư Ký Kim` với đầy đủ trình thông dịch Python 3.12 (Pandas, NumPy, OpenPyXL), Node.js v20, Rust 1.80, Golang 1.22.
   - Tự động đọc to kết quả thực thi lệnh bằng giọng nữ dễ thương (TTS Neural Voice).

4. **Hệ thống 4 Tầng Cache Siêu Tốc**:
   - **Tầng 1 (L1 RAM)**: Memory LRU Cache (< 1ms).
   - **Tầng 2 (L2 Storage)**: Lưu trữ bền vững LocalStorage / IndexedDB.
   - **Tầng 3 (L3 Web TTL)**: Bộ đệm tra cứu web và gói thư viện 30 phút.
   - **Tầng 4 (L4 Diagnostics)**: Thống kê token và độ trễ tiết kiệm được theo thời gian thực.

5. **Giọng đọc Nữ Ngọt Ngào & Nhận diện Giọng nói Tiếng Việt**:
   - Tích hợp giọng đọc nữ tiếng Việt tự nhiên, lễ phép, xưng "em" và gọi người dùng là "anh Vinh".
   - Kích hoạt giọng nói tức thì với từ khóa *"Kim"*, *"Thư Ký Kim"*, *"Kim ơi"* và tự động gửi lệnh sau 1 giây ngắt giọng.

---

## 🚀 Cấu hình Biến Môi trường (.env)

Tạo file `.env` tại thư mục gốc của dự án:

```env
VITE_AI_PROVIDER=xkiro
VITE_AI_BASE_URL=https://api.xkiro.com/v1
VITE_AI_API_KEY=your_api_key_here
VITE_AI_MODEL=Gwen 3.8 max
VITE_APP_TITLE=Thư Ký Kim
VITE_USER_FULL_NAME=Vinh
VITE_USER_NAME=Vinh_Admin
VITE_CONTEXT_WINDOW=8192
VITE_INFERENCE_SPEED=1.0
VITE_TEMPERATURE=0.7
VITE_TOP_P=0.95
```

---

## 🛠️ Triển khai lên Cloudflare Pages

Dự án đã được cấu hình sẵn các tệp phục vụ triển khai Cloudflare Pages:
- `wrangler.jsonc`: Cấu hình Cloudflare Pages static build (`dist`).
- `public/_redirects`: Cấu hình Single Page Application (SPA) routing 200 rewrite.
- `public/_headers`: Thiết lập các tiêu đề bảo mật và cache.
- `functions/api/proxy.ts`: Cloudflare Pages Edge Function xử lý CORS khi kết nối API bên thứ ba.
- `.github/workflows/deploy-cloudflare.yml`: Tự động build và deploy khi push code lên nhánh `main`.

### Lệnh chạy cục bộ:
```bash
npm install
npm run dev
```

### Lệnh đóng gói sản phẩm:
```bash
npm run build
```