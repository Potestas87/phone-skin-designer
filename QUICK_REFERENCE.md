# Quick Reference Guide

## Installation & Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Start development
npm run dev
```

Frontend: http://localhost:3000
Backend: http://localhost:3001

---

## Common Commands

```bash
# Development
npm run dev              # Start both frontend & backend
npm run dev:client       # Frontend only
npm run dev:server       # Backend only

# Production
npm run build           # Build frontend for production
npm run preview         # Preview production build

# Maintenance
npm audit               # Check for vulnerabilities
npm update              # Update dependencies
```

---

## File Locations

| What                    | Where                                  |
|-------------------------|----------------------------------------|
| Phone models config     | `src/data/phoneModels.json`           |
| SVG templates          | `public/templates/*.svg`              |
| Generated designs      | `uploads/` (local) or S3              |
| Design logs            | `logs/designs.log`                    |
| Environment config     | `.env`                                |
| Admin panel            | `admin/index.html`                    |

---

## API Endpoints

### POST /api/generate-design
Generate production-ready design file.

**Request**:
```json
{
  "phoneModelId": "iphone-16-pro-max",
  "templateSvgUrl": "/templates/iphone-16-pro-max.svg",
  "artworkImageDataUrl": "data:image/png;base64,...",
  "transform": {
    "x": 120,
    "y": 250,
    "scale": 1.3,
    "rotation": 12
  }
}
```

**Response**:
```json
{
  "success": true,
  "fileUrl": "https://cdn.com/designs/abc123.svg",
  "designId": "abc123"
}
```

### GET /health
Health check endpoint.

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-12-04T10:30:00.000Z"
}
```

---

## Phone Model Configuration

```json
{
  "id": "unique-phone-id",
  "label": "Display Name",
  "svgTemplateUrl": "/templates/phone.svg",
  "previewMaskPathId": "SAFE_AREA",
  "safeAreaId": "SAFE_AREA",
  "cutPathId": "CUT_PATH",
  "cameraHoleIds": ["CAMERA_CUTOUT"],
  "printDpi": 300,
  "outputWidthPx": 1800,
  "outputHeightPx": 3600
}
```

---

## SVG Template Requirements

Required element IDs:
- `CUT_PATH`: Outer boundary of phone skin
- `SAFE_AREA`: Printable area for user artwork
- `CAMERA_CUTOUT`: Camera hole(s) to avoid

**Template structure**:
```xml
<svg width="1800" height="3600" xmlns="http://www.w3.org/2000/svg">
  <path id="CUT_PATH" d="..." />
  <rect id="SAFE_AREA" x="150" y="300" width="1500" height="3100" />
  <rect id="CAMERA_CUTOUT" x="200" y="250" width="400" height="150" />
</svg>
```

---

## Shopify Integration Quick Start

### Method 1: Theme Embed

```bash
# 1. Build
npm run build

# 2. Upload dist/assets/* to Shopify theme assets

# 3. Create section: sections/phone-skin-designer.liquid
```

```liquid
<div id="root"></div>
<link rel="stylesheet" href="{{ 'main-HASH.css' | asset_url }}">
<script src="{{ 'main-HASH.js' | asset_url }}"></script>
```

### Method 2: Cart Integration

Add to cart with properties:
```javascript
fetch('/cart/add.js', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: variantId,
    quantity: 1,
    properties: {
      '_custom_design_url': designUrl,
      '_custom_design_id': designId,
      '_phone_model': 'iPhone 16 Pro Max'
    }
  })
});
```

---

## Environment Variables

### Development
```env
NODE_ENV=development
PORT=3001
STORAGE_TYPE=local
CDN_BASE_URL=http://localhost:3001
```

### Production
```env
NODE_ENV=production
PORT=3001
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=your-bucket
AWS_REGION=us-east-1
CDN_BASE_URL=https://your-cdn.com
```

---

## Validation Rules

| Rule                  | Default Value      | Config Location              |
|-----------------------|--------------------|------------------------------|
| Max file size         | 10 MB              | `.env` MAX_UPLOAD_SIZE       |
| Min image DPI         | 150                | `.env` MIN_IMAGE_DPI         |
| Recommended DPI       | 300                | `.env` RECOMMENDED_IMAGE_DPI |
| Accepted formats      | JPG, PNG, WebP, SVG| `src/utils/validation.ts`    |

---

## Storage Configuration

### Local Storage (Development)
```env
STORAGE_TYPE=local
LOCAL_STORAGE_PATH=./uploads
CDN_BASE_URL=http://localhost:3001
```

Files saved to: `./uploads/`

### AWS S3 (Production)
```env
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
```

Files saved to: S3 bucket with public-read ACL

---

## Component Props Reference

### PhoneModelSelector
```typescript
<PhoneModelSelector
  phoneModels={PhoneModel[]}
  selectedModelId={string | null}
  onChange={(id: string) => void}
  disabled={boolean}
/>
```

### DesignCanvas
```typescript
<DesignCanvas
  ref={DesignCanvasHandle}
  phoneModel={PhoneModel | null}
  onDesignChange={(hasDesign: boolean) => void}
  onTransformChange={(transform: ImageTransform) => void}
/>
```

### PreviewPanel
```typescript
<PreviewPanel
  warnings={ValidationWarning[]}
  previewImageUrl={string}
/>
```

### DesignSummaryBar
```typescript
<DesignSummaryBar
  phoneModel={PhoneModel | null}
  hasDesign={boolean}
  warnings={ValidationWarning[]}
  onSaveAndAddToCart={() => Promise<void>}
  onReset={() => void}
/>
```

---

## Troubleshooting Quick Fixes

| Problem                  | Solution                                        |
|--------------------------|-------------------------------------------------|
| Port in use              | Change PORT in `.env`                           |
| Canvas not rendering     | Check SVG template path and CORS                |
| Upload failing           | Verify file size < 10MB, check backend logs     |
| TypeScript errors        | Run `npm install` to get type definitions       |
| S3 upload failing        | Check AWS credentials and bucket permissions    |
| Design not in cart       | Verify Shopify Ajax Cart API is available       |

---

## Keyboard Shortcuts (In Canvas)

| Key         | Action                    |
|-------------|---------------------------|
| Delete      | Remove selected image     |
| Esc         | Deselect                  |
| Arrow keys  | Move image (if selected)  |

---

## Testing Checklist

- [ ] Install dependencies successfully
- [ ] Server starts without errors
- [ ] Phone models load in dropdown
- [ ] Can upload image (< 10MB)
- [ ] Can drag image on canvas
- [ ] Can scale image
- [ ] Can rotate image
- [ ] Validation warnings appear
- [ ] Can save design
- [ ] Design file is generated
- [ ] Design adds to cart (Shopify)
- [ ] Mobile view works correctly

---

## Performance Tips

1. **Optimize Images**: Compress before upload
2. **Use S3/CDN**: For production file storage
3. **Enable Caching**: Set cache headers on static assets
4. **Lazy Load**: Load templates on demand
5. **Compress Assets**: Use gzip/brotli compression

---

## Security Checklist

- [ ] Validate file types on backend
- [ ] Limit file upload size
- [ ] Sanitize SVG content
- [ ] Use signed S3 URLs (optional)
- [ ] Implement rate limiting
- [ ] Set proper CORS headers
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS in production

---

## Support Resources

- **Main Docs**: [README.md](./README.md)
- **Shopify Integration**: [SHOPIFY_INTEGRATION.md](./SHOPIFY_INTEGRATION.md)
- **Getting Started**: [GETTING_STARTED.md](./GETTING_STARTED.md)
- **Fabric.js Docs**: http://fabricjs.com/docs/
- **Shopify API**: https://shopify.dev/api

---

## Quick Deployment

### Heroku
```bash
git init
git add .
git commit -m "Initial commit"
heroku create your-app-name
heroku config:set NODE_ENV=production
heroku config:set STORAGE_TYPE=s3
# ... set other env vars
git push heroku main
```

### Vercel (Frontend only)
```bash
npm run build
vercel --prod
```

### DigitalOcean App Platform
1. Connect GitHub repository
2. Set environment variables
3. Set build command: `npm run build`
4. Set run command: `node server/index.js`
5. Deploy

---

That's it! For detailed explanations, see the full documentation files.
