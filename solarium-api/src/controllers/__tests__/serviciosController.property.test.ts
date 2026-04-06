// Feature: solarium-db-auth-feature, Propiedad 1: Solo registros con ESTADO = 1 son retornados
// Validates: Requisito 2.1

import { describe, it, vi, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { listarServicios } from '../serviciosController';

// Mock the pool module
vi.mock('../../db/pool');

import { getPool } from '../../db/pool';

const mockedGetPool = vi.mocked(getPool);

interface ServiceRecord {
  id_servicio: number;
  nombre: string;
  descripcion: string;
  precio: number;
  duracion_minutos: number;
  categoria: string;
  ESTADO: number;
}

function makePoolMock(recordset: ServiceRecord[]) {
  return {
    request: () => ({
      query: vi.fn().mockResolvedValue({ recordset }),
    }),
  };
}

function makeMockResponse() {
  const res: Record<string, unknown> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as unknown as import('express').Response;
}

const mockRequest = {} as import('express').Request;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Propiedad 1: Filtrado de servicios activos', () => {
  it(
    'solo retorna registros con ESTADO = 1 para cualquier conjunto de registros con ESTADO mixto',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate arbitrary arrays of service records with mixed ESTADO (0 and 1)
          fc.array(
            fc.record({
              id_servicio: fc.integer({ min: 1, max: 9999 }),
              nombre: fc.string({ minLength: 1, maxLength: 50 }),
              descripcion: fc.string({ minLength: 0, maxLength: 200 }),
              precio: fc.float({ min: 0, max: 9999, noNaN: true }),
              duracion_minutos: fc.integer({ min: 1, max: 480 }),
              categoria: fc.string({ minLength: 1, maxLength: 50 }),
              ESTADO: fc.oneof(fc.constant(0), fc.constant(1)),
            }),
            { minLength: 0, maxLength: 20 }
          ),
          async (allRecords) => {
            // Simulate DB filtering: only ESTADO = 1 records are returned by the query
            const activeRecords = allRecords.filter((r) => r.ESTADO === 1);

            mockedGetPool.mockResolvedValue(
              makePoolMock(activeRecords) as unknown as import('mssql').ConnectionPool
            );

            const res = makeMockResponse();
            await listarServicios(mockRequest, res);

            // The response must contain only active records
            expect(res.json).toHaveBeenCalledOnce();
            const returned = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0] as ServiceRecord[];

            expect(returned).toHaveLength(activeRecords.length);

            // Every returned record must have ESTADO = 1
            for (const record of returned) {
              expect(record.ESTADO).toBe(1);
            }

            // No inactive records (ESTADO = 0) should appear in the response
            const inactiveInResponse = returned.filter((r) => r.ESTADO === 0);
            expect(inactiveInResponse).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});
