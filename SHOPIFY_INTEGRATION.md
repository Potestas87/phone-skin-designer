# Shopify Integration Guide

This guide explains how to integrate the Phone Skin Designer into your Shopify store.

## Integration Options

### Option 1: Embedded in Product Page (Recommended for Theme Integration)

This method embeds the designer directly into a specific product page.

#### Step 1: Build the Application

```bash
npm run build
```

This creates a `dist/` folder with your compiled assets.

#### Step 2: Upload Assets to Shopify

1. Go to Shopify Admin → Online Store → Themes → Actions → Edit Code
2. In the Assets folder, upload all files from `dist/assets/`:
   - `main-[hash].js`
   - `main-[hash].css`
   - Any other generated assets

#### Step 3: Create a Custom Section

Create a new section file: `sections/phone-skin-designer.liquid`

```liquid
<div id="phone-skin-designer-root"></div>

{% schema %}
{
  "name": "Phone Skin Designer",
  "settings": [
    {
      "type": "text",
      "id": "variant_id",
      "label": "Product Variant ID",
      "info": "The Shopify variant ID for the custom phone skin product"
    }
  ],
  "presets": [
    {
      "name": "Phone Skin Designer"
    }
  ]
}
{% endschema %}

<script>
  window.PHONE_SKIN_VARIANT_ID = '{{ section.settings.variant_id }}';
</script>

<link rel="stylesheet" href="{{ 'main-[hash].css' | asset_url }}">
<script src="{{ 'main-[hash].js' | asset_url }}" defer></script>

<style>
  #phone-skin-designer-root {
    width: 100%;
    min-height: 600px;
  }
</style>
```

Replace `[hash]` with the actual hash from your build output.

#### Step 4: Add Section to Product Template

1. Go to the product template you want to add the designer to
2. Click "Add section"
3. Select "Phone Skin Designer"
4. Configure the variant ID in section settings

---

### Option 2: Standalone Product Page

Create a dedicated page for the designer.

#### Step 1: Create a Page Template

Create `templates/page.phone-designer.liquid`:

```liquid
<div id="phone-skin-designer-root"></div>

<link rel="stylesheet" href="{{ 'main-[hash].css' | asset_url }}">
<script src="{{ 'main-[hash].js' | asset_url }}" defer></script>
```

#### Step 2: Create a Page

1. Go to Shopify Admin → Pages → Add Page
2. Set template to "page.phone-designer"
3. Publish page

#### Step 3: Link to Page

Add navigation link to your menu pointing to `/pages/phone-designer`

---

### Option 3: Shopify App (Full Integration)

For complete integration as a Shopify App with backend functionality.

#### Prerequisites

- Shopify Partner account
- Public URL for your backend (use ngrok for development)

#### Step 1: Create Shopify App

1. Go to Shopify Partners → Apps → Create App
2. Choose "Public app" or "Custom app"
3. Set App URL to your backend URL
4. Set Redirect URLs for OAuth

#### Step 2: Configure App Scopes

Required scopes:
- `write_products` - To create/update products
- `write_orders` - To access order data
- `read_customers` - To associate designs with customers
- `write_script_tags` - To inject scripts (optional)

#### Step 3: Install OAuth

Update your backend with Shopify app credentials:

```javascript
// server/config/shopify.js
export const shopifyConfig = {
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecret: process.env.SHOPIFY_API_SECRET,
  scopes: ['write_products', 'write_orders', 'read_customers'],
  hostName: process.env.SHOPIFY_APP_URL
};
```

#### Step 4: Create App Embed Block

For Online Store 2.0 themes, create an app block:

```json
{
  "name": "Phone Skin Designer",
  "target": "section",
  "javascript": "phone-designer.js",
  "stylesheet": "phone-designer.css"
}
```

---

## Handling Orders

### Accessing Custom Design Data

When an order is placed, the design data is stored in line item properties:

```liquid
{% for item in order.line_items %}
  <h3>{{ item.title }}</h3>

  {% if item.properties._custom_design_url %}
    <p><strong>Custom Design:</strong></p>
    <ul>
      <li>Phone Model: {{ item.properties._phone_model }}</li>
      <li>Design ID: {{ item.properties._custom_design_id }}</li>
      <li>
        Design File:
        <a href="{{ item.properties._custom_design_url }}" target="_blank">
          Download
        </a>
      </li>
    </ul>
  {% endif %}
{% endfor %}
```

### Webhook Integration

Set up webhooks to process custom designs automatically:

#### 1. Create Webhook Endpoint

```javascript
// server/routes/webhooks.js
app.post('/webhooks/orders/create', async (req, res) => {
  const order = req.body;

  // Find line items with custom designs
  const customItems = order.line_items.filter(item =>
    item.properties && item.properties._custom_design_url
  );

  for (const item of customItems) {
    // Send design file to production system
    await sendToProduction({
      orderId: order.id,
      designUrl: item.properties._custom_design_url,
      phoneModel: item.properties._phone_model,
      quantity: item.quantity
    });
  }

  res.status(200).send('OK');
});
```

#### 2. Register Webhook in Shopify

```bash
curl -X POST \
  https://your-store.myshopify.com/admin/api/2024-01/webhooks.json \
  -H 'X-Shopify-Access-Token: YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "webhook": {
      "topic": "orders/create",
      "address": "https://your-backend.com/webhooks/orders/create",
      "format": "json"
    }
  }'
```

---

## Customizing the Cart Experience

### Display Design Preview in Cart

Edit `cart.liquid` or cart drawer to show design previews:

```liquid
{% for item in cart.items %}
  <div class="cart-item">
    <img src="{{ item.image | img_url: 'small' }}" alt="{{ item.title }}">

    {% if item.properties._custom_design_url %}
      <div class="custom-design-preview">
        <img src="{{ item.properties._custom_design_url }}"
             alt="Custom Design"
             style="max-width: 100px; border: 1px solid #ddd;">
        <p><small>{{ item.properties._phone_model }}</small></p>
      </div>
    {% endif %}
  </div>
{% endfor %}
```

### Prevent Cart Editing

Since designs are custom, you may want to prevent quantity changes:

```javascript
// In your theme JavaScript
document.querySelectorAll('[data-custom-design]').forEach(item => {
  const qtyInput = item.querySelector('.qty-input');
  if (qtyInput) {
    qtyInput.disabled = true;
    qtyInput.title = 'Custom designs cannot be edited';
  }
});
```

---

## Product Configuration

### Setting Up the Product

1. **Create Product**: "Custom Phone Skin"
2. **Add Variants**: One for each phone model OR use a single variant and differentiate by line item properties
3. **Set Price**: Your pricing per skin
4. **Inventory**: Set to "Continue selling when out of stock" (since these are made-to-order)

### Variant Strategy

**Option A: Single Variant**
- One product with one variant
- Phone model stored in line item properties
- Simpler management, but less flexibility for different pricing

**Option B: Multiple Variants**
- One variant per phone model
- Can have different prices per model
- Better for inventory tracking
- Requires more setup

### Recommended Product Settings

```json
{
  "title": "Custom Phone Skin",
  "body_html": "<p>Design your own custom phone skin</p>",
  "vendor": "Your Store",
  "product_type": "Phone Accessories",
  "tags": ["custom", "phone-skin", "personalized"],
  "variants": [
    {
      "title": "Custom Design",
      "price": "29.99",
      "sku": "CUSTOM-SKIN-001",
      "inventory_management": null,
      "inventory_policy": "continue"
    }
  ]
}
```

---

## Testing

### Test Checklist

- [ ] Designer loads on product page
- [ ] Phone models dropdown populates
- [ ] Image upload works
- [ ] Canvas manipulation (drag, scale, rotate) works
- [ ] Validation warnings appear correctly
- [ ] Design saves and generates files
- [ ] Product adds to cart with properties
- [ ] Cart displays custom design info
- [ ] Checkout preserves line item properties
- [ ] Order shows design URL in admin
- [ ] Design file is accessible and correct

### Test Orders

Create test orders with:
1. Different phone models
2. Various image sizes and formats
3. Rotated and scaled designs
4. Multiple custom skins in one order

---

## Troubleshooting

### Designer Not Loading

**Problem**: Blank space where designer should be

**Solutions**:
- Check browser console for JavaScript errors
- Verify script and CSS URLs are correct
- Ensure `#root` div exists
- Check Content Security Policy settings

### Cart Not Accepting Properties

**Problem**: Line item properties not saving

**Solutions**:
- Properties starting with `_` are hidden in cart (by design)
- Verify AJAX cart API is being used correctly
- Check cart.liquid is displaying properties
- Test with Shopify's Cart API directly

### CORS Errors

**Problem**: Can't load SVG templates or save designs

**Solutions**:
- Add CORS headers to your backend
- Ensure Shopify assets allow cross-origin requests
- Use Shopify CDN for templates when possible

```javascript
// Backend CORS configuration
app.use(cors({
  origin: [
    'https://your-store.myshopify.com',
    'https://your-custom-domain.com'
  ]
}));
```

### Design Files Not Accessible

**Problem**: 404 errors on design URLs

**Solutions**:
- Check S3 bucket permissions
- Verify file was uploaded successfully
- Ensure CDN_BASE_URL is correct
- Check storage type configuration

---

## Production Deployment

### 1. Deploy Backend

Choose a hosting provider:
- **Heroku**: Easy deployment, built-in SSL
- **AWS**: EC2 or ECS for full control
- **DigitalOcean**: Simple droplets
- **Vercel**: Serverless functions (requires modifications)

### 2. Configure Environment

Set production environment variables:
```env
NODE_ENV=production
STORAGE_TYPE=s3
AWS_S3_BUCKET=your-production-bucket
CDN_BASE_URL=https://your-cdn.com
```

### 3. Set Up CDN

Use CloudFront or similar CDN for:
- SVG templates
- Generated design files
- Static assets

### 4. Configure SSL

Ensure your backend has SSL certificate for secure communication.

### 5. Update Shopify Settings

Update all URLs in Shopify to point to production backend.

---

## Security Considerations

### File Upload Security

- Validate file types on backend
- Scan uploaded files for malware
- Limit file sizes (configured in server)
- Use signed URLs for S3 access

### API Security

- Implement rate limiting
- Use API keys for backend requests
- Validate all inputs
- Sanitize SVG content

### GDPR Compliance

- Allow customers to request design deletion
- Store minimal customer data
- Include designs in data export requests
- Implement data retention policies

---

## Support & Maintenance

### Monitoring

Set up monitoring for:
- API endpoint uptime
- File storage usage
- Error rates
- Customer usage patterns

### Backups

Regular backups of:
- Design logs
- Phone model configurations
- Generated design files (if not using S3)

### Updates

Keep dependencies updated:
```bash
npm audit
npm update
```

---

## Advanced Features

### Custom Pricing Based on Image

Charge more for higher-resolution or premium designs:

```javascript
function calculatePrice(imageMetadata) {
  const basePrice = 29.99;
  if (imageMetadata.width > 3000) {
    return basePrice + 5.00; // Premium quality
  }
  return basePrice;
}
```

### Design Templates

Offer pre-made templates customers can customize:

```javascript
const templates = [
  { id: 'geometric', url: '/templates/geometric.png', price: 2.99 },
  { id: 'nature', url: '/templates/nature.png', price: 2.99 }
];
```

### Multi-Image Layers

Allow multiple images in one design (requires canvas modification).

### Social Media Import

Let customers import from Instagram, Pinterest, etc. (requires OAuth integration).

---

For additional help, refer to:
- Main README.md
- Shopify API documentation
- Fabric.js documentation
- Project source code comments
