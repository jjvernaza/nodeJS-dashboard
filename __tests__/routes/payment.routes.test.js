const request = require('supertest');
const express = require('express');

const mockController = {
  getAllPagos: jest.fn((req, res) => res.json({ success: true })),
  getPagosCliente: jest.fn((req, res) => res.json({ success: true })),
  getMetodosPago: jest.fn((req, res) => res.json({ success: true })),
  getMonthlyIncome: jest.fn((req, res) => res.json({ success: true })),
  generarReporteClientesPagos: jest.fn((req, res) => res.send(Buffer.from('test'))),
  addPayment: jest.fn((req, res) => res.status(201).json({ success: true })),
  updatePayment: jest.fn((req, res) => res.json({ success: true })),
  deletePayment: jest.fn((req, res) => res.json({ success: true }))
};

jest.mock('../../controllers/payment.controller', () => mockController);
jest.mock('../../middlewares/auth.middleware', () => jest.fn((req, res, next) => next()));
jest.mock('../../middlewares/permission.middleware', () => ({
  checkPermission: jest.fn(() => (req, res, next) => next())
}));
jest.mock('../../middlewares/auditoria.middleware', () => ({
  auditMiddleware: jest.fn(() => (req, res, next) => next())
}));

const paymentRouter = require('../../routes/payment.routes');

describe('Payment Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/pagos', paymentRouter);
    jest.clearAllMocks();
  });

  test('GET /all - debe obtener todos los pagos', async () => {
    const response = await request(app).get('/api/pagos/all');
    expect(response.status).toBe(200);
  });

  test('GET /cliente/:clienteID - debe obtener pagos de un cliente', async () => {
    const response = await request(app).get('/api/pagos/cliente/1');
    expect(response.status).toBe(200);
  });

  test('GET /metodos-pago - debe obtener métodos de pago', async () => {
    const response = await request(app).get('/api/pagos/metodos-pago');
    expect(response.status).toBe(200);
  });

  test('GET /ingresos-mensuales - debe obtener ingresos mensuales', async () => {
    const response = await request(app).get('/api/pagos/ingresos-mensuales');
    expect(response.status).toBe(200);
  });

  test('GET /reporte-clientes-pagos - debe generar reporte', async () => {
    const response = await request(app).get('/api/pagos/reporte-clientes-pagos');
    expect(response.status).toBe(200);
  });

  test('POST /add - debe crear un pago', async () => {
    const response = await request(app)
      .post('/api/pagos/add')
      .send({ ClienteID: 1, Monto: 50000 });
    expect(response.status).toBe(201);
  });

  test('PUT /update/:id - debe actualizar un pago', async () => {
    const response = await request(app)
      .put('/api/pagos/update/1')
      .send({ Monto: 55000 });
    expect(response.status).toBe(200);
  });

  test('DELETE /delete/:id - debe eliminar un pago', async () => {
    const response = await request(app).delete('/api/pagos/delete/1');
    expect(response.status).toBe(200);
  });
});