const request = require('supertest');
const express = require('express');

const mockController = {
  getAllEstados: jest.fn((req, res) => res.json({ success: true })),
  getEstadoById: jest.fn((req, res) => res.json({ success: true })),
  createEstado: jest.fn((req, res) => res.status(201).json({ success: true })),
  updateEstado: jest.fn((req, res) => res.json({ success: true })),
  deleteEstado: jest.fn((req, res) => res.json({ success: true }))
};

jest.mock('../../controllers/estado.controller', () => mockController);
jest.mock('../../middlewares/auth.middleware', () => jest.fn((req, res, next) => next()));
jest.mock('../../middlewares/permission.middleware', () => ({
  checkPermission: jest.fn(() => (req, res, next) => next())
}));
jest.mock('../../middlewares/auditoria.middleware', () => ({
  auditMiddleware: jest.fn(() => (req, res, next) => next())
}));

const estadoRouter = require('../../routes/estado.routes');

describe('Estado Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/estados', estadoRouter);
    jest.clearAllMocks();
  });

  test('GET /all - debe obtener todos los estados', async () => {
    const response = await request(app).get('/api/estados/all');
    expect(response.status).toBe(200);
  });

  test('GET /:id - debe obtener un estado por ID', async () => {
    const response = await request(app).get('/api/estados/1');
    expect(response.status).toBe(200);
  });

  test('POST /create - debe crear un estado', async () => {
    const response = await request(app)
      .post('/api/estados/create')
      .send({ Estado: 'Nuevo', Color: '#000000' });
    expect(response.status).toBe(201);
  });

  test('PUT /update/:id - debe actualizar un estado', async () => {
    const response = await request(app)
      .put('/api/estados/update/1')
      .send({ Estado: 'Actualizado' });
    expect(response.status).toBe(200);
  });

  test('DELETE /delete/:id - debe eliminar un estado', async () => {
    const response = await request(app).delete('/api/estados/delete/1');
    expect(response.status).toBe(200);
  });
});