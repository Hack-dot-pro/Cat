# CAT AI - Holographic Assistant UI

Giao diện Holographic AI Assistant thế hệ mới được xây dựng bằng React, TypeScript, Tailwind CSS v4, Motion (Framer Motion) và Recharts. Hệ thống tích hợp toàn diện chuẩn **OpenAI Completions API** hỗ trợ Xkiro AI, OpenRouter, Groq, DeepSeek, Ollama và bất kỳ custom proxy nào.

---

## ⚙️ Cấu hình Biến Môi trường (.env)

Tạo tệp `.env` từ [.env.example](.env.example):

```env
# AI Provider: xkiro | openai | openrouter | groq | deepseek | ollama | custom
VITE_AI_PROVIDER=xkiro

# OpenAI-compatible Base URL
VITE_AI_BASE_URL=https://api.xkiro.com/v1

# AI Model Name
VITE_AI_MODEL=Gwen 3.8 max

# API Key / Auth Token
VITE_AI_API_KEY=your_api_key_here

# Hyperparameters
VITE_AI_TEMPERATURE=0.7
VITE_AI_MAX_TOKENS=2048
VITE_AI_STREAMING=true
```

---

## 🚀 Khởi chạy trên Local

```bash
# 1. Cài đặt dependencies
npm install

# 2. Khởi chạy development server
npm run dev

# 3. Build sản phẩm (output ra thư mục dist/)
npm run build
```

---

## ☁️ Triển khai lên Cloudflare Pages

### Cách 1: Triển khai trực tiếp qua Cloudflare Dashboard (Khuyên dùng)
1. Truy cập [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
2. Chọn kho lưu trữ **`Hack-dot-pro/Cat`**.
3. Cấu hình build:
   - **Framework preset**: `Vite` (hoặc `None`)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node.js version**: `20` (hoặc cao hơn)
4. **Cấu hình Environment Variables trên Cloudflare**:
   Vào **Settings** > **Environment variables** (trong dự án Pages trên Cloudflare) và thêm:
   - `VITE_AI_PROVIDER` = `xkiro`
   - `VITE_AI_BASE_URL` = `https://api.xkiro.com/v1`
   - `VITE_AI_MODEL` = `Gwen 3.8 max`
   - `VITE_AI_API_KEY` = `[API Key của bạn]`
5. Nhấn **Save and Deploy**.

### Cách 2: Triển khai qua Cloudflare Wrangler CLI
```bash
# Cài đặt và đăng nhập Cloudflare
npx wrangler login

# Build và deploy thư mục dist
npm run build
npm run deploy
```

### Cách 3: Tự động triển khai bằng GitHub Actions
Workflow đã được cấu hình sẵn tại [`.github/workflows/deploy-cloudflare.yml`](.github/workflows/deploy-cloudflare.yml).
Chỉ cần thêm Secret vào GitHub Repo Settings (`Settings > Secrets and variables > Actions`):
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Mỗi khi push lên nhánh `main`, hệ thống sẽ tự động build và deploy lên Cloudflare Pages.