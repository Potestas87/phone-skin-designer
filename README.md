# Phone Skin Designer for Shopify

A complete custom design tool for Shopify stores that allows customers to create personalized phone skins by uploading and positioning their own images.

## Features

- **Phone Model Selection**: Support for multiple phone models (iPhone, Samsung, Google Pixel, etc.)
- **Visual Design Canvas**: Fabric.js-powered canvas with drag, scale, and rotate capabilities
- **Image Upload & Manipulation**: Upload images and position them within safe print areas
- **Real-time Validation**: Checks for resolution, file size, and design placement
- **Production-Ready Output**: Generates high-quality SVG and PNG files for printing
- **Shopify Integration**: Seamlessly adds custom designs to cart with line item properties
- **Mobile Responsive**: Works on desktop, tablet, and mobile devices
- **Admin Panel**: Manage phone models and view design logs

## Tech Stack

### Frontend
- React 18 with TypeScript
- Fabric.js for canvas manipulation
- Vite for fast development and building
- CSS3 for responsive styling

### Backend
- Node.js with Express
- Sharp for image processing
- AWS S3 support for file storage
- Local storage fallback option

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

1. **Clone and install dependencies**:
```bash
cd phone-skin-designer
npm install
```

2. **Configure environment variables**:
```bash
cp .env.example .env
```

Edit `.env` with your settings:
```env
PORT=3001
NODE_ENV=development
STORAGE_TYPE=local
CDN_BASE_URL=http://localhost:3001
```

For S3 storage, add:
```env
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

3. **Start the development servers**:
```bash
npm run dev
```

This starts:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Project Structure

```
phone-skin-designer/
├── src/                          # Frontend React application
│   ├── components/              # React components
│   │   ├── PhoneModelSelector.tsx
│   │   ├── DesignCanvas.tsx
│   │   ├── PreviewPanel.tsx
│   │   └── DesignSummaryBar.tsx
│   ├── hooks/                   # Custom React hooks
│   │   └── usePhoneModels.ts
│   ├── utils/                   # Utility functions
│   │   ├── api.ts              # API client
│   │   ├── validation.ts       # Image validation
│   │   └── shopify.ts          # Shopify integration
│   ├── types/                   # TypeScript definitions
│   │   └── index.ts
│   └── data/                    # Static data
│       └── phoneModels.json    # Phone model configurations
├── server/                      # Backend Node.js application
│   ├── routes/                 # API routes
│   │   └── design.js
│   ├── services/               # Business logic
│   │   ├── designGenerator.js  # SVG/image composition
│   │   └── logger.js           # Design logging
│   ├── utils/                  # Utility functions
│   │   └── storage.js          # File storage (local/S3)
│   └── middleware/             # Express middleware
│       └── errorHandler.js
├── admin/                       # Admin panel
│   └── index.html              # Static admin interface
├── public/                      # Static files
│   └── templates/              # SVG phone skin templates
└── uploads/                     # Local file storage (git-ignored)
```

## Usage

### For Customers

1. **Select Phone Model**: Choose your phone from the dropdown
2. **Upload Image**: Click "Upload Image" and select your design
3. **Position Design**: Drag, scale, and rotate your image to fit
4. **Review**: Check the preview panel for any warnings
5. **Add to Cart**: Click "Save Design & Add to Cart"

### For Store Owners

#### Adding New Phone Models

1. Create an SVG template in `public/templates/`:
   - Include elements with IDs: `CUT_PATH`, `SAFE_AREA`, `CAMERA_CUTOUT`
   - Use proper dimensions for print quality

2. Add model to `src/data/phoneModels.json`:
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

#### Accessing Design Files

When a customer completes an order, the custom design information is stored in the line item properties:
- `_custom_design_url`: Direct link to production file
- `_custom_design_id`: Unique design identifier
- `_phone_model`: Phone model name

You can access these in:
- Shopify Admin → Orders → Order Details
- Order fulfillment webhooks
- Custom order processing apps

## Shopify Integration

### Method 1: Theme Section (Recommended)

1. Build the frontend:
```bash
npm run build
```

2. Upload `dist/` contents to Shopify theme assets

3. Create a new theme section in `sections/phone-skin-designer.liquid`:
```liquid
<div id="root"></div>
<script src="{{ 'main.js' | asset_url }}"></script>
<link rel="stylesheet" href="{{ 'main.css' | asset_url }}">
```

4. Add section to your product template

### Method 2: Custom Shopify App

Deploy the entire application as a Shopify app:
1. Set up Shopify app credentials
2. Configure OAuth and API scopes
3. Deploy backend to your hosting service
4. Install app in your Shopify store

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
  "fileUrl": "https://yourcdn.com/custom-designs/abc123.svg",
  "designId": "abc123"
}
```

## Configuration

### Image Validation

Configure validation thresholds in `.env`:
```env
MAX_UPLOAD_SIZE=10485760
MIN_IMAGE_DPI=150
RECOMMENDED_IMAGE_DPI=300
```

### Storage Options

**Local Storage** (Development):
```env
STORAGE_TYPE=local
LOCAL_STORAGE_PATH=./uploads
```

**AWS S3** (Production):
```env
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your-bucket
AWS_REGION=us-east-1
```

## Mobile Support

The application is fully responsive with:
- Touch gestures for drag, pinch-to-zoom, and rotate
- Adaptive UI for small screens
- Mobile-optimized file upload
- Responsive canvas sizing

## Troubleshooting

### Canvas not loading
- Check that SVG template URLs are correct
- Verify CORS settings if loading from external CDN
- Check browser console for errors

### Images too small warning
- Recommended minimum: 2400×3600px for best quality
- Acceptable minimum: 900×1800px
- Adjust DPI settings in phoneModels.json

### S3 upload failing
- Verify AWS credentials
- Check bucket permissions (requires public-read ACL)
- Ensure bucket CORS policy allows your domain

### Shopify cart integration not working
- Verify you're running on a Shopify store
- Check that variant ID is being passed correctly
- Test with Shopify Ajax Cart API documentation

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## Deployment

### Frontend (Shopify Theme)
1. Build: `npm run build`
2. Upload `dist/` to Shopify assets
3. Reference in theme section

### Backend (Node.js)
Deploy to:
- AWS EC2 / ECS
- Heroku
- DigitalOcean
- Vercel (serverless functions)
- Railway
- Render

### Environment Variables
Set all production environment variables on your hosting platform.

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- Check documentation in `/docs`
- Review code comments
- Open an issue on GitHub

## Roadmap

- [ ] Multiple image layers support
- [ ] Text overlay tool
- [ ] Pre-made design templates
- [ ] Social media image import
- [ ] Bulk ordering for same design across models
- [ ] Design gallery / saved designs
- [ ] Print preview with actual phone mockup
- [ ] Video upload support
- [ ] Design sharing via URL
