# CAT AI - Holographic Assistant UI

Giao diện Holographic AI Assistant thế hệ mới được xây dựng bằng React, TypeScript, Tailwind CSS v4, Motion (Framer Motion) và Recharts.

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
4. Nhấn **Save and Deploy**.

### Cách 2: Triển khai qua Cloudflare Wrangler CLI
```bash
# Cài đặt và đăng nhập Cloudflare
npx wrangler login

# Deploy thư mục dist lên Cloudflare Pages
npm run build
npm run deploy
```

### Cách 3: Tự động triển khai bằng GitHub Actions
Workflow đã được cấu hình sẵn tại [`.github/workflows/deploy-cloudflare.yml`](.github/workflows/deploy-cloudflare.yml).
Chỉ cần thêm 2 Secret vào GitHub Repo Settings (`Settings > Secrets and variables > Actions`):
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Mỗi khi push lên nhánh `main`, hệ thống sẽ tự động build và deploy lên Cloudflare Pages.