# Getting Started with Phone Skin Designer

This guide will help you get the Phone Skin Designer up and running quickly.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install all required dependencies for both frontend and backend.

### 2. Set Up Environment

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration. For local development, the defaults work fine:

```env
PORT=3001
NODE_ENV=development
STORAGE_TYPE=local
LOCAL_STORAGE_PATH=./uploads
CDN_BASE_URL=http://localhost:3001
MAX_UPLOAD_SIZE=10485760
MIN_IMAGE_DPI=150
RECOMMENDED_IMAGE_DPI=300
```

### 3. Start Development Server

```bash
npm run dev
```

This starts:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

### 4. Test the Application

1. Open http://localhost:3000 in your browser
2. Select a phone model from the dropdown
3. Upload an image
4. Position, scale, and rotate your design
5. Click "Save Design & Add to Cart" (will simulate Shopify cart integration)

## Project Structure Overview

```
phone-skin-designer/
├── src/                    # Frontend React app
│   ├── components/        # UI components
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Helper functions
│   ├── types/             # TypeScript definitions
│   └── data/              # Static data (phone models)
├── server/                # Backend Node.js API
│   ├── routes/            # API endpoints
│   ├── services/          # Business logic
│   ├── utils/             # Helper utilities
│   └── middleware/        # Express middleware
├── public/                # Static assets
│   └── templates/         # SVG phone skin templates
├── admin/                 # Admin panel (optional)
└── uploads/               # Generated design files
```

## Key Features

### Frontend Components

1. **PhoneModelSelector**: Dropdown to select phone model
2. **DesignCanvas**: Fabric.js canvas for image manipulation
3. **PreviewPanel**: Shows validation warnings and design preview
4. **DesignSummaryBar**: Sticky bar with save/reset actions

### Backend API

- `POST /api/generate-design`: Generate production-ready design files
- `GET /health`: Health check endpoint

## Development Workflow

### Adding a New Phone Model

1. **Create SVG Template**:
   - Create file in `public/templates/your-phone.svg`
   - Include required element IDs: `CUT_PATH`, `SAFE_AREA`, `CAMERA_CUTOUT`

   Example structure:
   ```xml
   <svg width="1800" height="3600" xmlns="http://www.w3.org/2000/svg">
     <path id="CUT_PATH" d="..." />
     <rect id="SAFE_AREA" x="150" y="300" width="1500" height="3100" />
     <rect id="CAMERA_CUTOUT" x="200" y="250" width="400" height="150" />
   </svg>
   ```

2. **Add to Phone Models Config**:
   Edit `src/data/phoneModels.json`:
   ```json
   {
     "id": "your-phone-id",
     "label": "Your Phone Name",
     "svgTemplateUrl": "/templates/your-phone.svg",
     "previewMaskPathId": "SAFE_AREA",
     "safeAreaId": "SAFE_AREA",
     "cutPathId": "CUT_PATH",
     "cameraHoleIds": ["CAMERA_CUTOUT"],
     "printDpi": 300,
     "outputWidthPx": 1800,
     "outputHeightPx": 3600
   }
   ```

3. **Restart the dev server** - changes will be reflected immediately

### Testing Image Upload

For best results, test with:
- **High-res images**: 2400x3600px or larger
- **Various formats**: JPG, PNG, WebP
- **Different aspect ratios**: Portrait, landscape, square
- **Edge cases**: Very large files (near 10MB limit), low resolution

### Customizing Validation Rules

Edit `src/utils/validation.ts`:

```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_DPI = 150;
const RECOMMENDED_DPI = 300;
```

## Deploying to Production

### Option 1: Deploy as Separate Services

**Frontend (Vite Build)**:
```bash
npm run build
```
Upload `dist/` folder to:
- Shopify theme assets
- Vercel / Netlify
- Static hosting (S3 + CloudFront)

**Backend (Node.js)**:
Deploy to:
- Heroku
- Railway
- DigitalOcean
- AWS EC2/ECS

### Option 2: Deploy as Single Application

Use a Node.js server to serve both:

```javascript
// server/index.js - add this after routes
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}
```

Then deploy entire app to one service.

## Environment Variables for Production

```env
NODE_ENV=production
PORT=3001

# S3 Storage (recommended for production)
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1

# CDN
CDN_BASE_URL=https://your-cdn-domain.com

# Limits
MAX_UPLOAD_SIZE=10485760
MIN_IMAGE_DPI=150
RECOMMENDED_IMAGE_DPI=300
```

## Integrating with Shopify

See [SHOPIFY_INTEGRATION.md](./SHOPIFY_INTEGRATION.md) for detailed instructions on:
- Embedding in product pages
- Creating standalone designer pages
- Building as a Shopify app
- Handling orders with custom designs
- Webhook integration

## Troubleshooting

### Port Already in Use

If port 3000 or 3001 is already in use:

```bash
# Change ports in .env
PORT=3002  # Backend

# Or in vite.config.js for frontend
server: {
  port: 3001
}
```

### Dependencies Not Installing

Try:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Canvas Not Loading

1. Check browser console for errors
2. Verify SVG template paths are correct
3. Ensure browser supports HTML5 Canvas and ES6

### Images Not Uploading

1. Check file size (must be under 10MB)
2. Verify file format (JPG, PNG, WebP, SVG)
3. Check browser console for upload errors
4. Verify backend is running on port 3001

### TypeScript Errors in IDE

The TypeScript errors you see are normal until dependencies are installed. Run:
```bash
npm install
```

This will install `@types/react` and other type definitions.

## Next Steps

1. **Customize Styling**: Edit CSS files in `src/components/`
2. **Add More Phone Models**: Follow the guide above
3. **Configure Storage**: Set up S3 for production
4. **Integrate with Shopify**: See SHOPIFY_INTEGRATION.md
5. **Test Thoroughly**: Test with various devices and images

## Support

For issues or questions:
- Check the main [README.md](./README.md)
- Review [SHOPIFY_INTEGRATION.md](./SHOPIFY_INTEGRATION.md)
- Check inline code comments
- Open an issue on GitHub

## Resources

- [Fabric.js Documentation](http://fabricjs.com/docs/)
- [Shopify Ajax Cart API](https://shopify.dev/api/ajax/reference/cart)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/)
- [Vite Documentation](https://vitejs.dev/)

Happy designing!
