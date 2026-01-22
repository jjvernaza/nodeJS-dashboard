const request = require('supertest');
const express = require('express');

// Mock del controlador ANTES de importar las rutas
const mockController = {
  getAllBitacora: jest.fn((req, res) => res.json({ success: true })),
  getBitacoraByUsuario: jest.fn((req, res) => res.json({ success: true })),
  getEstadisticas: jest.fn((req, res) => res.json({ success: true })),
  exportarBitacora: jest.fn((req, res) => res.json({ success: true })),
  getModulos: jest.fn((req, res) => res.json({ success: true })),
  getAcciones: jest.fn((req, res) => res.json({ success: true })),
  limpiarRegistrosAntiguos: jest.fn((req, res) => res.json({ success: true }))
};

jest.mock('../../controllers/bitacora.controller', () => mockController);

// Mock de middlewares
jest.mock('../../middlewares/auth.middleware', () => 
  jest.fn((req, res, next) => next())
);

jest.mock('../../middlewares/permission.middleware', () => ({
  checkPermission: jest.fn(() => (req, res, next) => next())
}));

const bitacoraRouter = require('../../routes/bitacora.routes');

describe('Bitacora Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/bitacora', bitacoraRouter);
    jest.clearAllMocks();
  });

  test('GET /all - debe obtener todos los registros', async () => {
    const response = await request(app).get('/api/bitacora/all');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('GET /usuario/:usuario_id - debe obtener bitácora de un usuario', async () => {
    const response = await request(app).get('/api/bitacora/usuario/5');
    
    expect(response.status).toBe(200);
  });

  test('GET /estadisticas - debe obtener estadísticas', async () => {
    const response = await request(app).get('/api/bitacora/estadisticas');
    
    expect(response.status).toBe(200);
  });

  test('GET /exportar - debe exportar bitácora', async () => {
    const response = await request(app).get('/api/bitacora/exportar');
    
    expect(response.status).toBe(200);
  });

  test('GET /modulos - debe obtener módulos', async () => {
    const response = await request(app).get('/api/bitacora/modulos');
    
    expect(response.status).toBe(200);
  });

  test('GET /acciones - debe obtener acciones', async () => {
    const response = await request(app).get('/api/bitacora/acciones');
    
    expect(response.status).toBe(200);
  });

  test('DELETE /limpiar - debe limpiar registros', async () => {
    const response = await request(app).delete('/api/bitacora/limpiar');
    
    expect(response.status).toBe(200);
  });
});