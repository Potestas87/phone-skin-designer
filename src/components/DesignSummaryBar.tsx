import React, { useState } from 'react';
import type { PhoneModel } from '../types';
import { canProceed } from '../utils/validation';
import type { ValidationWarning } from '../types';
import './DesignSummaryBar.css';

interface DesignSummaryBarProps {
  phoneModel: PhoneModel | null;
  hasDesign: boolean;
  warnings: ValidationWarning[];
  onSaveAndAddToCart: () => Promise<void>;
  onReset: () => void;
}

export function DesignSummaryBar({
  phoneModel,
  hasDesign,
  warnings,
  onSaveAndAddToCart,
  onReset
}: DesignSummaryBarProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const canSave = phoneModel && hasDesign && canProceed(warnings);

  const handleSaveClick = async () => {
    if (!canSave) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      await onSaveAndAddToCart();
    } catch (error) {
      console.error('Save error:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save design');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="design-summary-bar">
      <div className="summary-content">
        <div className="summary-info">
          {phoneModel && (
            <div className="model-badge">
              <span className="badge-label">Phone Model:</span>
              <span className="badge-value">{phoneModel.label}</span>
            </div>
          )}

          {hasDesign && (
            <div className="status-badge success">
              <svg className="status-icon" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Design Ready</span>
            </div>
          )}

          {!hasDesign && phoneModel && (
            <div className="status-badge pending">
              <span>Upload an image to continue</span>
            </div>
          )}

          {!phoneModel && (
            <div className="status-badge pending">
              <span>Select a phone model to start</span>
            </div>
          )}
        </div>

        <div className="summary-actions">
          {hasDesign && (
            <button
              type="button"
              className="action-button reset"
              onClick={onReset}
              disabled={isSaving}
            >
              Reset
            </button>
          )}

          <button
            type="button"
            className="action-button save"
            onClick={handleSaveClick}
            disabled={!canSave || isSaving}
          >
            {isSaving ? (
              <>
                <span className="button-spinner" />
                Saving...
              </>
            ) : (
              'Save Design & Add to Cart'
            )}
          </button>
        </div>
      </div>

      {saveError && (
        <div className="save-error">
          <svg className="error-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{saveError}</span>
        </div>
      )}

      {warnings.some(w => w.severity === 'error') && (
        <div className="validation-error">
          <svg className="error-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>Please fix errors before saving</span>
        </div>
      )}
    </div>
  );
}
