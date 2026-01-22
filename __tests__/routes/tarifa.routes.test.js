const request = require('supertest');
const express = require('express');

const mockController = {
  getAllTarifas: jest.fn((req, res) => res.json({ success: true })),
  getTarifaById: jest.fn((req, res) => res.json({ success: true })),
  getTarifaCliente: jest.fn((req, res) => res.json({ success: true })),
  createTarifa: jest.fn((req, res) => res.status(201).json({ success: true })),
  updateTarifa: jest.fn((req, res) => res.json({ success: true })),
  deleteTarifa: jest.fn((req, res) => res.json({ success: true }))
};

jest.mock('../../controllers/tarifa.controller', () => mockController);
jest.mock('../../middlewares/auth.middleware', () => jest.fn((req, res, next) => next()));
jest.mock('../../middlewares/permission.middleware', () => ({
  checkPermission: jest.fn(() => (req, res, next) => next())
}));
jest.mock('../../middlewares/auditoria.middleware', () => ({
  auditMiddleware: jest.fn(() => (req, res, next) => next())
}));

const tarifaRouter = require('../../routes/tarifa.routes');

describe('Tarifa Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/tarifas', tarifaRouter);
    jest.clearAllMocks();
  });

  test('GET /all - debe obtener todas las tarifas', async () => {
    const response = await request(app).get('/api/tarifas/all');
    
    expect(response.status).toBe(200);
    expect(mockController.getAllTarifas).toHaveBeenCalled();
  });

  test('GET /:id - debe obtener una tarifa por ID', async () => {
    const response = await request(app).get('/api/tarifas/1');
    
    expect(response.status).toBe(200);
    expect(mockController.getTarifaById).toHaveBeenCalled();
  });

  test('GET /cliente/:clienteId - debe obtener tarifa de un cliente', async () => {
    const response = await request(app).get('/api/tarifas/cliente/1');
    
    expect(response.status).toBe(200);
    expect(mockController.getTarifaCliente).toHaveBeenCalled();
  });

  test('POST /create - debe crear una tarifa', async () => {
    const response = await request(app)
      .post('/api/tarifas/create')
      .send({ valor: 25000.00 });
    
    expect(response.status).toBe(201);
    expect(mockController.createTarifa).toHaveBeenCalled();
  });

  test('PUT /update/:id - debe actualizar una tarifa', async () => {
    const response = await request(app)
      .put('/api/tarifas/update/1')
      .send({ valor: 30000.00 });
    
    expect(response.status).toBe(200);
    expect(mockController.updateTarifa).toHaveBeenCalled();
  });

  test('DELETE /delete/:id - debe eliminar una tarifa', async () => {
    const response = await request(app).delete('/api/tarifas/delete/1');
    
    expect(response.status).toBe(200);
    expect(mockController.deleteTarifa).toHaveBeenCalled();
  });
});