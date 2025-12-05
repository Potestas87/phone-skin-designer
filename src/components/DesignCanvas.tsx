import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { fabric } from 'fabric';
import type { PhoneModel, DesignExport, ImageTransform } from '../types';
import './DesignCanvas.css';

interface DesignCanvasProps {
  phoneModel: PhoneModel | null;
  onDesignChange: (hasDesign: boolean) => void;
  onTransformChange?: (transform: ImageTransform) => void;
}

export interface DesignCanvasHandle {
  exportDesign: () => DesignExport | null;
}

export const DesignCanvas = forwardRef<DesignCanvasHandle, DesignCanvasProps>(
  ({ phoneModel, onDesignChange, onTransformChange }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const userImageRef = useRef<fabric.Image | null>(null);
  const safeAreaRef = useRef<fabric.Object | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const svgScaleRef = useRef<number>(1);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 800;

  useEffect(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: '#f9fafb',
      selection: true,
      preserveObjectStacking: true,
    });

    fabricCanvasRef.current = canvas;

    canvas.on('object:modified', () => {
      emitTransformChange();
    });

    canvas.on('object:moving', () => {
      constrainToSafeArea();
    });

    canvas.on('object:scaling', () => {
      constrainToSafeArea();
    });

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (phoneModel && fabricCanvasRef.current) {
      loadTemplate(phoneModel);
    }
  }, [phoneModel]);

  const loadTemplate = async (model: PhoneModel) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    setIsLoading(true);
    setError(null);

    try {
      canvas.clear();
      canvas.backgroundColor = '#f9fafb';
      userImageRef.current = null;
      safeAreaRef.current = null;
      onDesignChange(false);

      const svgUrl = model.svgTemplateUrl.startsWith('http')
        ? model.svgTemplateUrl
        : `${window.location.origin}${model.svgTemplateUrl}`;

      // Fetch the SVG to parse SAFE_AREA dimensions directly
      fetch(svgUrl)
        .then(response => response.text())
        .then(svgText => {
          // Parse SAFE_AREA from SVG
          const safeAreaMatch = svgText.match(/id="SAFE_AREA"[^>]*/);
          let safeAreaFromSVG = { x: 0, y: 0, width: 0, height: 0 };

          if (safeAreaMatch) {
            const tag = safeAreaMatch[0];
            const xMatch = tag.match(/x="([^"]*)"/);
            const yMatch = tag.match(/y="([^"]*)"/);
            const widthMatch = tag.match(/width="([^"]*)"/);
            const heightMatch = tag.match(/height="([^"]*)"/);

            if (xMatch && yMatch && widthMatch && heightMatch) {
              safeAreaFromSVG = {
                x: parseFloat(xMatch[1]),
                y: parseFloat(yMatch[1]),
                width: parseFloat(widthMatch[1]),
                height: parseFloat(heightMatch[1]),
              };
            }
          }

          console.log('Parsed SAFE_AREA from SVG:', safeAreaFromSVG);

          // Now load the SVG with Fabric
          fabric.loadSVGFromURL(svgUrl, (objects, options) => {
            const safeAreaId = model.safeAreaId || model.previewMaskPathId;
            const safeAreaObject = objects.find((obj: any) => obj.id === safeAreaId);

            const svgGroup = fabric.util.groupSVGElements(objects, options);

            const scaleX = CANVAS_WIDTH / svgGroup.width!;
            const scaleY = CANVAS_HEIGHT / svgGroup.height!;
            const scale = Math.min(scaleX, scaleY) * 0.9;

            svgScaleRef.current = scale;

            svgGroup.scale(scale);
            svgGroup.set({
              left: CANVAS_WIDTH / 2,
              top: CANVAS_HEIGHT / 2,
              originX: 'center',
              originY: 'center',
              selectable: false,
              evented: false,
            });

            canvas.add(svgGroup);
            canvas.sendToBack(svgGroup);

            if (safeAreaObject) {
              safeAreaObject.set({
                fill: 'rgba(59, 130, 246, 0.1)',
                stroke: '#3b82f6',
                strokeWidth: 2 / scale,
                selectable: false,
                evented: false,
              });

              // Store parsed bounds from SVG
              (safeAreaObject as any)._svgBounds = safeAreaFromSVG;
              (safeAreaObject as any)._canvasScale = scale;
              (safeAreaObject as any)._svgOriginalWidth = svgGroup.width! / scale;
              (safeAreaObject as any)._svgOriginalHeight = svgGroup.width! / scale;

              safeAreaRef.current = safeAreaObject;
            }

            canvas.renderAll();
            setIsLoading(false);
          }, undefined, {
            crossOrigin: 'anonymous'
          });
        })
        .catch(err => {
          console.error('Error fetching SVG:', err);
          setError('Failed to load template. Please try again.');
          setIsLoading(false);
        });
    } catch (err) {
      console.error('Error loading template:', err);
      setError('Failed to load template. Please try again.');
      setIsLoading(false);
    }
  };

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !fabricCanvasRef.current) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      addImageToCanvas(dataUrl);
    };

    reader.readAsDataURL(file);
  }, []);

  const addImageToCanvas = (imageDataUrl: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    fabric.Image.fromURL(imageDataUrl, (img) => {
      if (userImageRef.current) {
        canvas.remove(userImageRef.current);
      }

      const maxWidth = CANVAS_WIDTH * 0.8;
      const maxHeight = CANVAS_HEIGHT * 0.8;

      const scaleX = maxWidth / img.width!;
      const scaleY = maxHeight / img.height!;
      const scale = Math.min(scaleX, scaleY);

      img.scale(scale);
      img.set({
        left: CANVAS_WIDTH / 2,
        top: CANVAS_HEIGHT / 2,
        originX: 'center',
        originY: 'center',
        selectable: true,
        hasControls: true,
        hasBorders: true,
        lockScalingFlip: true,
      });

      (img as any)._originalImageDataUrl = imageDataUrl;

      canvas.add(img);
      canvas.setActiveObject(img);
      userImageRef.current = img;

      onDesignChange(true);
      emitTransformChange();
      canvas.renderAll();
    }, {
      crossOrigin: 'anonymous'
    });
  };

  const constrainToSafeArea = () => {
    const canvas = fabricCanvasRef.current;
    const userImage = userImageRef.current;
    const safeArea = safeAreaRef.current;

    if (!canvas || !userImage || !safeArea) return;

  };

  const emitTransformChange = () => {
    const userImage = userImageRef.current;
    if (!userImage || !onTransformChange) return;

    const transform: ImageTransform = {
      x: userImage.left || 0,
      y: userImage.top || 0,
      scale: userImage.scaleX || 1,
      rotation: userImage.angle || 0,
    };

    onTransformChange(transform);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !userImageRef.current) return;

    canvas.remove(userImageRef.current);
    userImageRef.current = null;
    onDesignChange(false);
    canvas.renderAll();
  };

  const handleResetPosition = () => {
    const userImage = userImageRef.current;
    const canvas = fabricCanvasRef.current;
    if (!userImage || !canvas) return;

    userImage.set({
      left: CANVAS_WIDTH / 2,
      top: CANVAS_HEIGHT / 2,
      angle: 0,
    });

    canvas.renderAll();
    emitTransformChange();
  };

  const exportDesign = useCallback((): DesignExport | null => {
    const canvas = fabricCanvasRef.current;
    const userImage = userImageRef.current;
    const safeArea = safeAreaRef.current;

    if (!canvas || !userImage || !phoneModel) return null;

    const originalImageDataUrl = (userImage as any)._originalImageDataUrl;

    if (!originalImageDataUrl) {
      console.error('Original image data not found');
      return null;
    }

    // Calculate SAFE_AREA bounds in canvas coordinates using parsed SVG bounds
    let safeAreaBounds;
    if (safeArea) {
      const svgBounds = (safeArea as any)._svgBounds;
      const canvasScale = (safeArea as any)._canvasScale;
      const svgOriginalWidth = (safeArea as any)._svgOriginalWidth;
      const svgOriginalHeight = (safeArea as any)._svgOriginalHeight;

      if (svgBounds && canvasScale) {
        // Calculate where SAFE_AREA appears on canvas
        // SVG is centered and scaled on canvas
        const svgCanvasWidth = svgOriginalWidth * canvasScale;
        const svgCanvasHeight = svgOriginalHeight * canvasScale;
        const svgCanvasLeft = (CANVAS_WIDTH - svgCanvasWidth) / 2;
        const svgCanvasTop = (CANVAS_HEIGHT - svgCanvasHeight) / 2;

        safeAreaBounds = {
          x: svgCanvasLeft + (svgBounds.x * canvasScale),
          y: svgCanvasTop + (svgBounds.y * canvasScale),
          width: svgBounds.width * canvasScale,
          height: svgBounds.height * canvasScale,
        };

        console.log('Calculated SAFE_AREA bounds on canvas:', safeAreaBounds);
      }
    }

    return {
      phoneModelId: phoneModel.id,
      templateSvgUrl: phoneModel.svgTemplateUrl,
      artworkImageDataUrl: originalImageDataUrl,
      transform: {
        x: userImage.left || 0,
        y: userImage.top || 0,
        scale: userImage.scaleX || 1,
        rotation: userImage.angle || 0,
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT,
        safeAreaBounds,
      },
    };
  }, [phoneModel]);

  useImperativeHandle(ref, () => ({
    exportDesign
  }));

  return (
    <div className="design-canvas-container">
      <div className="canvas-wrapper">
        <canvas ref={canvasRef} />

        {isLoading && (
          <div className="canvas-overlay">
            <div className="loading-spinner" />
            <p>Loading template...</p>
          </div>
        )}

        {error && (
          <div className="canvas-overlay error">
            <p>{error}</p>
          </div>
        )}

        {!phoneModel && !isLoading && (
          <div className="canvas-overlay">
            <p>Select a phone model to begin</p>
          </div>
        )}
      </div>

      <div className="canvas-controls">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        <button
          type="button"
          className="control-button primary"
          onClick={handleUploadClick}
          disabled={!phoneModel || isLoading}
        >
          {userImageRef.current ? 'Change Image' : 'Upload Image'}
        </button>

        {userImageRef.current && (
          <>
            <button
              type="button"
              className="control-button secondary"
              onClick={handleResetPosition}
            >
              Reset Position
            </button>

            <button
              type="button"
              className="control-button danger"
              onClick={handleRemoveImage}
            >
              Remove Image
            </button>
          </>
        )}
      </div>

      <div className="canvas-instructions">
        <p><strong>Instructions:</strong></p>
        <ul>
          <li>Drag to move your image</li>
          <li>Use corner handles to resize</li>
          <li>Use rotation handle to rotate</li>
          <li>Keep your design within the blue safe area</li>
        </ul>
      </div>
    </div>
  );
});

DesignCanvas.displayName = 'DesignCanvas';

export type { DesignExport };
