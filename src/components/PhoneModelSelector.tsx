import React, { useState } from 'react';
import type { PhoneModel } from '../types';
import './PhoneModelSelector.css';

interface PhoneModelSelectorProps {
  phoneModels: PhoneModel[];
  selectedModelId: string | null;
  onChange: (id: string) => void;
  disabled?: boolean;
}

export function PhoneModelSelector({
  phoneModels,
  selectedModelId,
  onChange,
  disabled = false
}: PhoneModelSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredModels = phoneModels.filter(model =>
    model.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedModel = phoneModels.find(m => m.id === selectedModelId);

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="phone-model-selector">
      <label htmlFor="phone-model-select" className="selector-label">
        Select Your Phone Model
      </label>

      <div className="selector-wrapper">
        <button
          type="button"
          className={`selector-button ${isOpen ? 'open' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="selected-text">
            {selectedModel ? selectedModel.label : 'Choose a phone model...'}
          </span>
          <svg
            className="chevron-icon"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </button>

        {isOpen && (
          <div className="dropdown-panel">
            <div className="search-wrapper">
              <input
                type="text"
                className="search-input"
                placeholder="Search phone models..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>

            <ul className="model-list" role="listbox">
              {filteredModels.length > 0 ? (
                filteredModels.map((model) => (
                  <li key={model.id} role="option" aria-selected={model.id === selectedModelId}>
                    <button
                      type="button"
                      className={`model-option ${model.id === selectedModelId ? 'selected' : ''}`}
                      onClick={() => handleSelect(model.id)}
                    >
                      <span className="model-label">{model.label}</span>
                      {model.id === selectedModelId && (
                        <svg
                          className="check-icon"
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </li>
                ))
              ) : (
                <li className="no-results">
                  No phone models found matching "{searchTerm}"
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {selectedModel && (
        <div className="model-info">
          <small>
            Output: {selectedModel.outputWidthPx} × {selectedModel.outputHeightPx}px at {selectedModel.printDpi} DPI
          </small>
        </div>
      )}
    </div>
  );
}
