const request = require('supertest');
const express = require('express');

const mockController = {
  getAllClients: jest.fn((req, res) => res.json({ success: true })),
  searchClient: jest.fn((req, res) => res.json({ success: true })),
  obtenerMorosos: jest.fn((req, res) => res.json({ success: true })),
  addCliente: jest.fn((req, res) => res.status(201).json({ success: true })),
  updateClient: jest.fn((req, res) => res.json({ success: true })),
  deleteClient: jest.fn((req, res) => res.json({ success: true })),
  exportClientsToExcel: jest.fn((req, res) => res.send(Buffer.from('test'))),
  exportMorososToExcel: jest.fn((req, res) => res.send(Buffer.from('test')))
};

jest.mock('../../controllers/client.controller', () => mockController);
jest.mock('../../middlewares/auth.middleware', () => jest.fn((req, res, next) => next()));
jest.mock('../../middlewares/permission.middleware', () => ({
  checkPermission: jest.fn(() => (req, res, next) => next())
}));
jest.mock('../../middlewares/auditoria.middleware', () => ({
  auditMiddleware: jest.fn(() => (req, res, next) => next())
}));

const clientRouter = require('../../routes/client.routes');

describe('Client Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/clientes', clientRouter);
    jest.clearAllMocks();
  });

  test('GET /all - debe obtener todos los clientes', async () => {
    const response = await request(app).get('/api/clientes/all');
    expect(response.status).toBe(200);
  });

  test('GET /search - debe buscar clientes', async () => {
    const response = await request(app)
      .get('/api/clientes/search')
      .query({ nombre: 'Juan' });
    expect(response.status).toBe(200);
  });

  test('GET /morosos - debe obtener clientes morosos', async () => {
    const response = await request(app).get('/api/clientes/morosos');
    expect(response.status).toBe(200);
  });

  test('POST /create - debe crear un cliente', async () => {
    const response = await request(app)
      .post('/api/clientes/create')
      .send({ NombreCliente: 'Test' });
    expect(response.status).toBe(201);
  });

  test('PUT /update/:id - debe actualizar un cliente', async () => {
    const response = await request(app)
      .put('/api/clientes/update/1')
      .send({ Telefono: '123' });
    expect(response.status).toBe(200);
  });

  test('DELETE /delete/:id - debe eliminar un cliente', async () => {
    const response = await request(app).delete('/api/clientes/delete/1');
    expect(response.status).toBe(200);
  });

  test('GET /export/excel - debe exportar clientes', async () => {
    const response = await request(app).get('/api/clientes/export/excel');
    expect(response.status).toBe(200);
  });

  test('GET /morosos/excel - debe exportar morosos', async () => {
    const response = await request(app).get('/api/clientes/morosos/excel');
    expect(response.status).toBe(200);
  });
});