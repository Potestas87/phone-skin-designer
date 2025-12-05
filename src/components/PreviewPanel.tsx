import React from 'react';
import type { ValidationWarning } from '../types';
import './PreviewPanel.css';

interface PreviewPanelProps {
  warnings: ValidationWarning[];
  previewImageUrl?: string;
}

export function PreviewPanel({ warnings, previewImageUrl }: PreviewPanelProps) {
  const errorWarnings = warnings.filter(w => w.severity === 'error');
  const standardWarnings = warnings.filter(w => w.severity === 'warning');
  const infoMessages = warnings.filter(w => w.severity === 'info');

  return (
    <div className="preview-panel">
      <h3 className="preview-title">Design Preview & Validation</h3>

      {previewImageUrl && (
        <div className="preview-image-wrapper">
          <img
            src={previewImageUrl}
            alt="Design preview"
            className="preview-image"
          />
        </div>
      )}

      {warnings.length > 0 && (
        <div className="warnings-container">
          {errorWarnings.length > 0 && (
            <div className="warning-section errors">
              <div className="warning-header">
                <svg className="warning-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="warning-title">Errors - Please Fix</span>
              </div>
              <ul className="warning-list">
                {errorWarnings.map((warning, index) => (
                  <li key={index}>{warning.message}</li>
                ))}
              </ul>
            </div>
          )}

          {standardWarnings.length > 0 && (
            <div className="warning-section warnings">
              <div className="warning-header">
                <svg className="warning-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="warning-title">Warnings - Recommended to Fix</span>
              </div>
              <ul className="warning-list">
                {standardWarnings.map((warning, index) => (
                  <li key={index}>{warning.message}</li>
                ))}
              </ul>
            </div>
          )}

          {infoMessages.length > 0 && (
            <div className="warning-section info">
              <div className="warning-header">
                <svg className="warning-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="warning-title">Information</span>
              </div>
              <ul className="warning-list">
                {infoMessages.map((warning, index) => (
                  <li key={index}>{warning.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {warnings.length === 0 && previewImageUrl && (
        <div className="success-message">
          <svg className="success-icon" width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p>Your design looks great! Ready to add to cart.</p>
        </div>
      )}
    </div>
  );
}
