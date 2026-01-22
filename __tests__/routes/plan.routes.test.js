const request = require('supertest');
const express = require('express');

const mockController = {
  getAllPlanes: jest.fn((req, res) => res.json({ success: true })),
  getPlanById: jest.fn((req, res) => res.json({ success: true })),
  createPlan: jest.fn((req, res) => res.status(201).json({ success: true })),
  updatePlan: jest.fn((req, res) => res.json({ success: true })),
  deletePlan: jest.fn((req, res) => res.json({ success: true }))
};

jest.mock('../../controllers/plan.controller', () => mockController);
jest.mock('../../middlewares/auth.middleware', () => jest.fn((req, res, next) => next()));
jest.mock('../../middlewares/permission.middleware', () => ({
  checkPermission: jest.fn(() => (req, res, next) => next())
}));
jest.mock('../../middlewares/auditoria.middleware', () => ({
  auditMiddleware: jest.fn(() => (req, res, next) => next())
}));

const planRouter = require('../../routes/plan.routes');

describe('Plan Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/planes', planRouter);
    jest.clearAllMocks();
  });

  test('GET /all - debe obtener todos los planes', async () => {
    const response = await request(app).get('/api/planes/all');
    expect(response.status).toBe(200);
  });

  test('GET /:id - debe obtener un plan por ID', async () => {
    const response = await request(app).get('/api/planes/1');
    expect(response.status).toBe(200);
  });

  test('POST /create - debe crear un plan', async () => {
    const response = await request(app)
      .post('/api/planes/create')
      .send({ nombre: 'Nuevo Plan', velocidad: '50MB' });
    expect(response.status).toBe(201);
  });

  test('PUT /update/:id - debe actualizar un plan', async () => {
    const response = await request(app)
      .put('/api/planes/update/1')
      .send({ nombre: 'Plan Actualizado', velocidad: '100MB' });
    expect(response.status).toBe(200);
  });

  test('DELETE /delete/:id - debe eliminar un plan', async () => {
    const response = await request(app).delete('/api/planes/delete/1');
    expect(response.status).toBe(200);
  });
});