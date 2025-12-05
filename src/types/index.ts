export interface PhoneModel {
  id: string;
  label: string;
  svgTemplateUrl: string;
  previewMaskPathId: string;
  printDpi: number;
  outputWidthPx: number;
  outputHeightPx: number;
  safeAreaId?: string;
  cutPathId?: string;
  cameraHoleIds?: string[];
}

export interface ImageTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  canvasWidth?: number;
  canvasHeight?: number;
  safeAreaBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface DesignState {
  phoneModelId: string;
  templateSvgUrl: string;
  artworkImageDataUrl?: string;
  artworkImageFile?: File;
  transform: ImageTransform;
}

export interface DesignExport {
  phoneModelId: string;
  templateSvgUrl: string;
  artworkImageDataUrl: string;
  transform: ImageTransform;
}

export interface GenerateDesignRequest {
  phoneModelId: string;
  templateSvgUrl: string;
  artworkImageDataUrl: string;
  transform: ImageTransform;
}

export interface GenerateDesignResponse {
  success: boolean;
  fileUrl?: string;
  designId?: string;
  error?: string;
}

export interface ValidationWarning {
  type: 'low_resolution' | 'outside_safe_area' | 'file_too_large' | 'unsupported_format';
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface CartLineItem {
  id: string;
  quantity: number;
  properties: {
    _custom_design_url: string;
    _custom_design_id: string;
    _phone_model: string;
  };
}

export interface DesignLog {
  designId: string;
  timestamp: string;
  phoneModelId: string;
  userIp?: string;
  customerId?: string;
  fileUrl: string;
}
