const request = require('supertest');
const express = require('express');

const mockController = {
  getAllSectores: jest.fn((req, res) => res.json({ success: true })),
  getSectorById: jest.fn((req, res) => res.json({ success: true })),
  createSector: jest.fn((req, res) => res.status(201).json({ success: true })),
  updateSector: jest.fn((req, res) => res.json({ success: true })),
  deleteSector: jest.fn((req, res) => res.json({ success: true }))
};

jest.mock('../../controllers/sector.controller', () => mockController);
jest.mock('../../middlewares/auth.middleware', () => jest.fn((req, res, next) => next()));
jest.mock('../../middlewares/permission.middleware', () => ({
  checkPermission: jest.fn(() => (req, res, next) => next())
}));
jest.mock('../../middlewares/auditoria.middleware', () => ({
  auditMiddleware: jest.fn(() => (req, res, next) => next())
}));

const sectorRouter = require('../../routes/sector.routes');

describe('Sector Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/sectores', sectorRouter);
    jest.clearAllMocks();
  });

  test('GET /all - debe obtener todos los sectores', async () => {
    const response = await request(app).get('/api/sectores/all');
    expect(response.status).toBe(200);
  });

  test('GET /:id - debe obtener un sector por ID', async () => {
    const response = await request(app).get('/api/sectores/1');
    expect(response.status).toBe(200);
  });

  test('POST /create - debe crear un sector', async () => {
    const response = await request(app)
      .post('/api/sectores/create')
      .send({ nombre: 'Nuevo Sector', descripcion: 'Descripción' });
    expect(response.status).toBe(201);
  });

  test('PUT /update/:id - debe actualizar un sector', async () => {
    const response = await request(app)
      .put('/api/sectores/update/1')
      .send({ nombre: 'Sector Actualizado' });
    expect(response.status).toBe(200);
  });

  test('DELETE /delete/:id - debe eliminar un sector', async () => {
    const response = await request(app).delete('/api/sectores/delete/1');
    expect(response.status).toBe(200);
  });
});