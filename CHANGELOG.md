# Changelog

## [Unreleased] - 2025-12-05

### Added
- **Smart Image Cropping**: Backend now automatically crops uploaded images to match the SVG cutout shape
  - Extracts cutout bounds from CUT_PATH in SVG template
  - Applies user transforms (position, scale, rotation) to full canvas
  - Crops final image to exact cutout dimensions
  - Generates production-ready PNG that's only the skin portion (not full canvas)
  - SVG output includes cropped image positioned within cutout bounds

### Fixed
- **Image Resolution Preservation**: Fixed issue where uploaded images were being downscaled
  - Now preserves original image data for export to backend
  - Canvas only scales images for display purposes
  - Original full-resolution image (e.g., 6000x6000px) sent to production

- **Non-Shopify Environment**: Fixed confusing error when testing outside Shopify
  - Now detects non-Shopify environments and shows helpful success message
  - Displays design file URL and ID instead of cart error
  - Links to integration documentation

### Changed
- **Validation Rules**: Updated image validation to be more flexible
  - Absolute minimum: 500x500px (hard requirement)
  - Below recommended DPI: Warning (not blocking)
  - Below minimum DPI: Warning (not blocking)  
  - Only blocks images smaller than 500x500px

- **Canvas Display**: Increased initial image display size from 70% to 80% of canvas

### Technical Details
- Completely rewrote `generateDesignFile()` function:
  - Parses SVG template CUT_PATH to extract exact cutout bounds
  - Creates full-size canvas at phone model dimensions (1800x3600px)
  - Composites scaled/rotated image at transformed position
  - Crops to cutout region (e.g., x:50 y:200 w:1700 h:3250)
  - Final PNG is only the skin portion, not full canvas
- Added `_originalImageDataUrl` to Fabric.js objects for resolution preservation
- Modified `exportDesign()` to export original image data
- Added Shopify environment detection in `addToCartWithDesign()`
