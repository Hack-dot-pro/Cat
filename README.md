# 🐱 CAT AI — Holographic Neural Operating System

Hệ điều hành trí tuệ nhân tạo Hologram thế hệ mới với giao diện tương lai, tích hợp chuẩn **OpenAI Chat Completions** (mặc định Gateway **Xkiro AI** với mô hình **Gwen 3.8 max**), giao thức **MCP (Model Context Protocol)**, trung tâm **Hệ thống hóa Tài liệu AI**, và hiệu ứng âm thanh tổng hợp **Web Audio**.

---

## 🌟 Tính năng Nổi bật

1. **Chuẩn kết nối OpenAI Chat Completions**:
   - Hỗ trợ đa nhà cung cấp: **Xkiro AI** (Mặc định: `https://api.xkiro.com/v1`, Model: `Gwen 3.8 max`), **OpenAI**, **OpenRouter**, **DeepSeek**, **Groq**, **Ollama** (Local), và **Custom API Gateway**.
   - Hỗ trợ truyền dữ liệu theo luồng thời gian thực (SSE Streaming).
   - Tùy chỉnh **Context Window (Max Tokens)**, **Tốc độ suy luận (Inference Speed)**, **Độ sáng tạo (Temperature)**, **Top-P**.

2. **Giao thức MCP (Model Context Protocol)**:
   - Cắm và chạy (Plug & Play) các công cụ ngoại vi và máy chủ MCP nội bộ / bên ngoài qua chuẩn JSON-RPC 2.0 / HTTP / SSE.
   - Tích hợp sẵn 6 công cụ: Máy tính khoa học (`cat_calculator`), Trích xuất & Hệ thống hóa tài liệu (`cat_document_systemizer`), Giám sát tài nguyên (`cat_system_stats`), Mã hóa SHA-256 (`cat_crypto_hasher`), Thời gian thực (`cat_datetime`), Đọc nội dung Web (`cat_web_fetch`).

3. **Trung tâm Hệ thống hóa Tài liệu (Document Systemizer)**:
   - Hỗ trợ tải file PDF, DOCX, TXT, JSON, CSV, Markdown, Code.
   - Bóc tách cấu trúc đề mục, phân tích dữ liệu chuyên sâu, trích xuất bảng biểu và đưa trực tiếp vào lượt chat.

4. **Hiệu ứng Âm thanh Sci-Fi**:
   - Bộ tổng hợp âm thanh đa tần số Web Audio API không phụ thuộc file tĩnh, độ trễ 0ms (âm khởi động, quét nơ-ron, click, truyền tin, cảnh báo).

5. **Phông chữ Aptos Narrow**:
   - Toàn bộ giao diện được chuẩn hóa theo typography hiện đại **Aptos Narrow**.

---

## 🚀 Cấu hình Biến Môi trường (.env)

Tạo file `.env` tại thư mục gốc của dự án:

```env
VITE_AI_PROVIDER=xkiro
VITE_AI_BASE_URL=https://api.xkiro.com/v1
VITE_AI_API_KEY=your_api_key_here
VITE_AI_MODEL=Gwen 3.8 max
VITE_APP_TITLE=CAT AI
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

### Lệnh build sản phẩm:
```bash
npm run build
```