import { useState, useEffect } from 'react';
import type { Empleado } from '../types/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useEmpleados() {
  const [data, setData] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/empleados`)
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar el equipo');
        return res.json();
      })
      .then((json: Empleado[]) => setData(json))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
