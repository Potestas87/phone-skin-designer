import express from 'express';
import { generateDesignFile } from '../services/designGenerator.js';
import { saveDesignLog } from '../services/logger.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.post('/generate-design', async (req, res, next) => {
  try {
    const { phoneModelId, templateSvgUrl, artworkImageDataUrl, transform } = req.body;

    if (!phoneModelId || !templateSvgUrl || !artworkImageDataUrl || !transform) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: phoneModelId, templateSvgUrl, artworkImageDataUrl, transform'
      });
    }

    if (!artworkImageDataUrl.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image data URL'
      });
    }

    const designId = uuidv4();

    const fileUrl = await generateDesignFile({
      designId,
      phoneModelId,
      templateSvgUrl,
      artworkImageDataUrl,
      transform
    });

    await saveDesignLog({
      designId,
      phoneModelId,
      fileUrl,
      userIp: req.ip,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      fileUrl,
      designId
    });
  } catch (error) {
    console.error('Design generation error:', error);
    next(error);
  }
});

router.get('/design/:designId', async (req, res) => {
  try {
    const { designId } = req.params;
    res.json({
      message: 'Design retrieval endpoint - implement based on your storage solution',
      designId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
