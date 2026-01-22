const request = require('supertest');
const express = require('express');

const mockController = {
  getDashboardStats: jest.fn((req, res) => res.json({ success: true })),
  getTiposServicio: jest.fn((req, res) => res.json({ success: true })),
  getTipoServicioById: jest.fn((req, res) => res.json({ success: true })),
  createTipoServicio: jest.fn((req, res) => res.status(201).json({ success: true })),
  updateTipoServicio: jest.fn((req, res) => res.json({ success: true })),
  deleteTipoServicio: jest.fn((req, res) => res.json({ success: true }))
};

jest.mock('../../controllers/service.controller', () => mockController);
jest.mock('../../middlewares/auth.middleware', () => jest.fn((req, res, next) => next()));
jest.mock('../../middlewares/permission.middleware', () => ({
  checkPermission: jest.fn(() => (req, res, next) => next())
}));
jest.mock('../../middlewares/auditoria.middleware', () => ({
  auditMiddleware: jest.fn(() => (req, res, next) => next())
}));

const serviceRouter = require('../../routes/service.routes');

describe('Service Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/servicios', serviceRouter);
    jest.clearAllMocks();
  });

  describe('Dashboard', () => {
    test('GET /dashboard - debe obtener estadísticas', async () => {
      const response = await request(app).get('/api/servicios/dashboard');
      
      expect(response.status).toBe(200);
      expect(mockController.getDashboardStats).toHaveBeenCalled();
    });
  });

  describe('Tipos de Servicio - Consultas', () => {
    test('GET /tipos - debe obtener todos los tipos', async () => {
      const response = await request(app).get('/api/servicios/tipos');
      
      expect(response.status).toBe(200);
      expect(mockController.getTiposServicio).toHaveBeenCalled();
    });

    test('GET /tipos/:id - debe obtener un tipo por ID', async () => {
      const response = await request(app).get('/api/servicios/tipos/1');
      
      expect(response.status).toBe(200);
      expect(mockController.getTipoServicioById).toHaveBeenCalled();
    });
  });

  describe('Tipos de Servicio - CRUD', () => {
    test('POST /tipos/create - debe crear un tipo', async () => {
      const response = await request(app)
        .post('/api/servicios/tipos/create')
        .send({ Tipo: 'Fibra Óptica' });
      
      expect(response.status).toBe(201);
      expect(mockController.createTipoServicio).toHaveBeenCalled();
    });

    test('PUT /tipos/update/:id - debe actualizar un tipo', async () => {
      const response = await request(app)
        .put('/api/servicios/tipos/update/1')
        .send({ Tipo: 'Cable Actualizado' });
      
      expect(response.status).toBe(200);
      expect(mockController.updateTipoServicio).toHaveBeenCalled();
    });

    test('DELETE /tipos/delete/:id - debe eliminar un tipo', async () => {
      const response = await request(app).delete('/api/servicios/tipos/delete/1');
      
      expect(response.status).toBe(200);
      expect(mockController.deleteTipoServicio).toHaveBeenCalled();
    });
  });
});