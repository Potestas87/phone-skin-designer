import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { saveToStorage } from '../utils/storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadSVGTemplate(templateSvgUrl) {
  try {
    let templateContent;

    if (templateSvgUrl.startsWith('http')) {
      const response = await fetch(templateSvgUrl);
      templateContent = await response.text();
    } else {
      const templatePath = path.join(__dirname, '../../public', templateSvgUrl);
      templateContent = await fs.readFile(templatePath, 'utf-8');
    }

    return templateContent;
  } catch (error) {
    console.error('Error loading SVG template:', error);
    throw error;
  }
}

async function extractCutoutBounds(svgContent, phoneModel) {
  try {
    // Extract bounds from SAFE_AREA (blue border) in SVG
    // SAFE_AREA is a rect element with x, y, width, height attributes
    const safeAreaMatch = svgContent.match(/id="SAFE_AREA"[^>]*x="([^"]*)"[^>]*y="([^"]*)"[^>]*width="([^"]*)"[^>]*height="([^"]*)"/);

    if (safeAreaMatch) {
      return {
        x: parseFloat(safeAreaMatch[1]),
        y: parseFloat(safeAreaMatch[2]),
        width: parseFloat(safeAreaMatch[3]),
        height: parseFloat(safeAreaMatch[4])
      };
    }

    // Alternative regex pattern if attributes are in different order
    const altMatch = svgContent.match(/id="SAFE_AREA"[^>]*/);
    if (altMatch) {
      const safeAreaTag = altMatch[0];
      const xMatch = safeAreaTag.match(/x="([^"]*)"/);
      const yMatch = safeAreaTag.match(/y="([^"]*)"/);
      const widthMatch = safeAreaTag.match(/width="([^"]*)"/);
      const heightMatch = safeAreaTag.match(/height="([^"]*)"/);

      if (xMatch && yMatch && widthMatch && heightMatch) {
        return {
          x: parseFloat(xMatch[1]),
          y: parseFloat(yMatch[1]),
          width: parseFloat(widthMatch[1]),
          height: parseFloat(heightMatch[1])
        };
      }
    }

    // Fallback: use phone model dimensions
    return {
      x: 0,
      y: 0,
      width: phoneModel.outputWidthPx,
      height: phoneModel.outputHeightPx
    };
  } catch (error) {
    console.error('Error extracting cutout bounds:', error);
    return {
      x: 0,
      y: 0,
      width: phoneModel.outputWidthPx,
      height: phoneModel.outputHeightPx
    };
  }
}

export async function generateDesignFile({
  designId,
  phoneModelId,
  templateSvgUrl,
  artworkImageDataUrl,
  transform
}) {
  try {
    // Load phone model configuration
    const phoneModelsPath = path.join(__dirname, '../../src/data/phoneModels.json');
    const phoneModelsData = await fs.readFile(phoneModelsPath, 'utf-8');
    const phoneModels = JSON.parse(phoneModelsData);
    const phoneModel = phoneModels.find(m => m.id === phoneModelId);

    if (!phoneModel) {
      throw new Error(`Phone model ${phoneModelId} not found`);
    }

    // Load SVG template and extract cutout bounds
    const svgData = await loadSVGTemplate(templateSvgUrl);
    const cutoutBounds = await extractCutoutBounds(svgData, phoneModel);

    console.log('=== DESIGN GENERATION DEBUG ===');
    console.log('SAFE_AREA bounds from SVG:', cutoutBounds);
    console.log('Phone model output:', phoneModel.outputWidthPx, 'x', phoneModel.outputHeightPx);

    // Decode the uploaded image
    const base64Data = artworkImageDataUrl.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    const metadata = await sharp(imageBuffer).metadata();

    console.log('Original uploaded image:', metadata.width, 'x', metadata.height);
    console.log('Canvas transform received:', transform);

    // Get canvas dimensions and safe area bounds from frontend
    const canvasWidth = transform.canvasWidth || 600;
    const canvasHeight = transform.canvasHeight || 800;
    const safeAreaCanvas = transform.safeAreaBounds;

    console.log('Frontend canvas size:', canvasWidth, 'x', canvasHeight);
    console.log('SAFE_AREA bounds on canvas:', safeAreaCanvas);

    // Calculate scale ratios from canvas to production
    const scaleX = phoneModel.outputWidthPx / canvasWidth;
    const scaleY = phoneModel.outputHeightPx / canvasHeight;

    console.log('Scale ratios - X:', scaleX, 'Y:', scaleY);

    // Scale safe area bounds to production size
    let safeAreaProduction;
    if (safeAreaCanvas) {
      safeAreaProduction = {
        x: Math.round(safeAreaCanvas.x * scaleX),
        y: Math.round(safeAreaCanvas.y * scaleY),
        width: Math.round(safeAreaCanvas.width * scaleX),
        height: Math.round(safeAreaCanvas.height * scaleY),
      };
    } else {
      // Fallback to SVG bounds
      safeAreaProduction = cutoutBounds;
    }

    console.log('SAFE_AREA scaled to production:', safeAreaProduction);

    // Calculate image bounds on canvas
    const imageCanvasBounds = {
      x: transform.x - (metadata.width * transform.scale) / 2,
      y: transform.y - (metadata.height * transform.scale) / 2,
      width: metadata.width * transform.scale,
      height: metadata.height * transform.scale,
    };

    console.log('Image bounds on canvas:', imageCanvasBounds);

    // Calculate intersection of image with safe area on canvas
    const intersectionCanvas = {
      x: Math.max(imageCanvasBounds.x, safeAreaCanvas?.x || 0),
      y: Math.max(imageCanvasBounds.y, safeAreaCanvas?.y || 0),
      x2: Math.min(imageCanvasBounds.x + imageCanvasBounds.width, (safeAreaCanvas?.x || 0) + (safeAreaCanvas?.width || canvasWidth)),
      y2: Math.min(imageCanvasBounds.y + imageCanvasBounds.height, (safeAreaCanvas?.y || 0) + (safeAreaCanvas?.height || canvasHeight)),
    };

    intersectionCanvas.width = intersectionCanvas.x2 - intersectionCanvas.x;
    intersectionCanvas.height = intersectionCanvas.y2 - intersectionCanvas.y;

    console.log('Intersection on canvas:', intersectionCanvas);

    // Calculate which portion of the original image this represents
    const cropFromOriginal = {
      left: Math.round(((intersectionCanvas.x - imageCanvasBounds.x) / imageCanvasBounds.width) * metadata.width),
      top: Math.round(((intersectionCanvas.y - imageCanvasBounds.y) / imageCanvasBounds.height) * metadata.height),
      width: Math.round((intersectionCanvas.width / imageCanvasBounds.width) * metadata.width),
      height: Math.round((intersectionCanvas.height / imageCanvasBounds.height) * metadata.height),
    };

    console.log('Crop region from original image:', cropFromOriginal);

    // Crop the original image to only the portion within safe area
    let croppedOriginal = sharp(imageBuffer);

    if (cropFromOriginal.width > 0 && cropFromOriginal.height > 0) {
      croppedOriginal = croppedOriginal.extract({
        left: Math.max(0, cropFromOriginal.left),
        top: Math.max(0, cropFromOriginal.top),
        width: Math.min(cropFromOriginal.width, metadata.width),
        height: Math.min(cropFromOriginal.height, metadata.height),
      });
    }

    // Apply rotation if needed
    if (transform.rotation && transform.rotation !== 0) {
      croppedOriginal = croppedOriginal.rotate(transform.rotation, {
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      });
    }

    // Scale to production size
    const finalWidth = Math.round(intersectionCanvas.width * scaleX);
    const finalHeight = Math.round(intersectionCanvas.height * scaleY);

    console.log('Final image dimensions:', finalWidth, 'x', finalHeight);

    const croppedImage = await croppedOriginal
      .resize(finalWidth, finalHeight, {
        fit: 'fill',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({ quality: 100, compressionLevel: 9 })
      .toBuffer();

    console.log('=== END DEBUG ===\n');

    // Save cropped PNG
    const fileName = `${designId}-${phoneModelId}.png`;
    const fileUrl = await saveToStorage(fileName, croppedImage);

    // Generate production SVG - place the cropped image at the SAFE_AREA position
    const imageDataUrl = `data:image/png;base64,${croppedImage.toString('base64')}`;

    // Calculate where to place the cropped image in the SVG
    const imagePositionInSvg = {
      x: safeAreaProduction.x + Math.round((intersectionCanvas.x - (safeAreaCanvas?.x || 0)) * scaleX),
      y: safeAreaProduction.y + Math.round((intersectionCanvas.y - (safeAreaCanvas?.y || 0)) * scaleY),
      width: finalWidth,
      height: finalHeight,
    };

    console.log('Image position in final SVG:', imagePositionInSvg);

    const svgContent = svgData.replace(
      '</svg>',
      `
  <image
    href="${imageDataUrl}"
    x="${imagePositionInSvg.x}"
    y="${imagePositionInSvg.y}"
    width="${imagePositionInSvg.width}"
    height="${imagePositionInSvg.height}"
    preserveAspectRatio="none"
  />
</svg>`
    );

    const svgFileName = `${designId}-${phoneModelId}.svg`;
    const svgBuffer = Buffer.from(svgContent, 'utf-8');
    const svgUrl = await saveToStorage(svgFileName, svgBuffer);

    console.log('Design generated successfully:', { fileUrl, svgUrl });

    return svgUrl;
  } catch (error) {
    console.error('Error generating design file:', error);
    throw new Error(`Failed to generate design: ${error.message}`);
  }
}
