import { useState, useEffect } from 'react';
import type { Servicio } from '../types/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useServicios() {
  const [data, setData] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/servicios`)
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar los servicios');
        return res.json();
      })
      .then((json: Servicio[]) => setData(json))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
