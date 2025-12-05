import { useState, useEffect } from 'react';
import type { PhoneModel } from '../types';
import phoneModelsData from '../data/phoneModels.json';

export function usePhoneModels() {
  const [phoneModels, setPhoneModels] = useState<PhoneModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setPhoneModels(phoneModelsData as PhoneModel[]);
      setLoading(false);
    } catch (err) {
      setError('Failed to load phone models');
      setLoading(false);
    }
  }, []);

  const getModelById = (id: string): PhoneModel | undefined => {
    return phoneModels.find(model => model.id === id);
  };

  return {
    phoneModels,
    loading,
    error,
    getModelById
  };
}
