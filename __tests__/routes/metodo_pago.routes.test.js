const request = require('supertest');
const express = require('express');

const mockController = {
  getAllMetodosPago: jest.fn((req, res) => res.json({ success: true })),
  getMetodoPagoById: jest.fn((req, res) => res.json({ success: true })),
  createMetodoPago: jest.fn((req, res) => res.status(201).json({ success: true })),
  updateMetodoPago: jest.fn((req, res) => res.json({ success: true })),
  deleteMetodoPago: jest.fn((req, res) => res.json({ success: true }))
};

jest.mock('../../controllers/metodo_pago.controller', () => mockController);
jest.mock('../../middlewares/auth.middleware', () => jest.fn((req, res, next) => next()));
jest.mock('../../middlewares/permission.middleware', () => ({
  checkPermission: jest.fn(() => (req, res, next) => next())
}));
jest.mock('../../middlewares/auditoria.middleware', () => ({
  auditMiddleware: jest.fn(() => (req, res, next) => next())
}));

const metodoPagoRouter = require('../../routes/metodo_pago.routes');

describe('Metodo Pago Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/metodos-pago', metodoPagoRouter);
    jest.clearAllMocks();
  });

  test('GET /all - debe obtener todos los métodos de pago', async () => {
    const response = await request(app).get('/api/metodos-pago/all');
    expect(response.status).toBe(200);
  });

  test('GET /:id - debe obtener un método de pago por ID', async () => {
    const response = await request(app).get('/api/metodos-pago/1');
    expect(response.status).toBe(200);
  });

  test('POST /create - debe crear un método de pago', async () => {
    const response = await request(app)
      .post('/api/metodos-pago/create')
      .send({ Metodo: 'PayPal' });
    expect(response.status).toBe(201);
  });

  test('PUT /update/:id - debe actualizar un método de pago', async () => {
    const response = await request(app)
      .put('/api/metodos-pago/update/1')
      .send({ Metodo: 'Efectivo Actualizado' });
    expect(response.status).toBe(200);
  });

  test('DELETE /delete/:id - debe eliminar un método de pago', async () => {
    const response = await request(app).delete('/api/metodos-pago/delete/1');
    expect(response.status).toBe(200);
  });
});