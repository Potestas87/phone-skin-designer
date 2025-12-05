import React, { useState, useRef, useEffect } from 'react';
import { PhoneModelSelector } from './components/PhoneModelSelector';
import { DesignCanvas, type DesignCanvasHandle } from './components/DesignCanvas';
import { PreviewPanel } from './components/PreviewPanel';
import { DesignSummaryBar } from './components/DesignSummaryBar';
import { usePhoneModels } from './hooks/usePhoneModels';
import { validateImageResolution } from './utils/validation';
import { generateDesign } from './utils/api';
import { addToCartWithDesign } from './utils/shopify';
import type { PhoneModel, ValidationWarning, ImageTransform, DesignExport } from './types';
import './App.css';

function App() {
  const { phoneModels, loading: modelsLoading, getModelById } = usePhoneModels();
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [hasDesign, setHasDesign] = useState(false);
  const [warnings, setWarnings] = useState<ValidationWarning[]>([]);
  const [currentTransform, setCurrentTransform] = useState<ImageTransform | null>(null);
  const canvasRef = useRef<DesignCanvasHandle>(null);

  const selectedModel = selectedModelId ? getModelById(selectedModelId) : null;

  useEffect(() => {
    if (selectedModelId) {
      setHasDesign(false);
      setWarnings([]);
    }
  }, [selectedModelId]);

  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId);
  };

  const handleDesignChange = (hasDesign: boolean) => {
    setHasDesign(hasDesign);
  };

  const handleTransformChange = async (transform: ImageTransform) => {
    setCurrentTransform(transform);
  };

  const handleReset = () => {
    setSelectedModelId(null);
    setHasDesign(false);
    setWarnings([]);
    setCurrentTransform(null);
  };

  const handleSaveAndAddToCart = async () => {
    if (!canvasRef.current || !selectedModel) {
      throw new Error('No design to save');
    }

    const designExport: DesignExport | null = canvasRef.current.exportDesign();

    if (!designExport) {
      throw new Error('Failed to export design');
    }

    const resolutionWarnings = await validateImageResolution(
      designExport.artworkImageDataUrl,
      selectedModel
    );

    setWarnings(resolutionWarnings);

    if (resolutionWarnings.some(w => w.severity === 'error')) {
      throw new Error('Please fix validation errors before saving');
    }

    const response = await generateDesign({
      phoneModelId: designExport.phoneModelId,
      templateSvgUrl: designExport.templateSvgUrl,
      artworkImageDataUrl: designExport.artworkImageDataUrl,
      transform: designExport.transform,
    });

    if (!response.success || !response.fileUrl || !response.designId) {
      throw new Error(response.error || 'Failed to generate design');
    }

    const variantId = getShopifyVariantId();

    await addToCartWithDesign(variantId, {
      designUrl: response.fileUrl,
      designId: response.designId,
      phoneModel: selectedModel.label,
    });
  };

  const getShopifyVariantId = (): string => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('variant') || 'default-variant-id';
  };

  if (modelsLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <p>Loading phone models...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Design Your Phone Skin</h1>
        <p className="app-subtitle">
          Create a custom phone skin with your own images and designs
        </p>
      </header>

      <main className="app-main">
        <div className="design-section">
          <PhoneModelSelector
            phoneModels={phoneModels}
            selectedModelId={selectedModelId}
            onChange={handleModelChange}
            disabled={false}
          />

          <DesignCanvas
            ref={canvasRef}
            phoneModel={selectedModel}
            onDesignChange={handleDesignChange}
            onTransformChange={handleTransformChange}
          />
        </div>

        <aside className="preview-section">
          <PreviewPanel warnings={warnings} />
        </aside>
      </main>

      <DesignSummaryBar
        phoneModel={selectedModel}
        hasDesign={hasDesign}
        warnings={warnings}
        onSaveAndAddToCart={handleSaveAndAddToCart}
        onReset={handleReset}
      />
    </div>
  );
}

export default App;
