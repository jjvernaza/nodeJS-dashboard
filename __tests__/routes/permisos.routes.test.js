const request = require('supertest');
const express = require('express');

const mockController = {
  getAllPermisos: jest.fn((req, res) => res.json({ success: true })),
  getPermisoById: jest.fn((req, res) => res.json({ success: true })),
  createPermiso: jest.fn((req, res) => res.status(201).json({ success: true })),
  updatePermiso: jest.fn((req, res) => res.json({ success: true })),
  deletePermiso: jest.fn((req, res) => res.json({ success: true }))
};

jest.mock('../../controllers/permisos.controller', () => mockController);
jest.mock('../../middlewares/auth.middleware', () => jest.fn((req, res, next) => next()));
jest.mock('../../middlewares/permission.middleware', () => ({
  checkPermission: jest.fn(() => (req, res, next) => next())
}));
jest.mock('../../middlewares/auditoria.middleware', () => ({
  auditMiddleware: jest.fn(() => (req, res, next) => next())
}));

const permisosRouter = require('../../routes/permisos.routes');

describe('Permisos Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/permisos', permisosRouter);
    jest.clearAllMocks();
  });

  test('GET /all - debe obtener todos los permisos', async () => {
    const response = await request(app).get('/api/permisos/all');
    expect(response.status).toBe(200);
  });

  test('GET /:id - debe obtener un permiso por ID', async () => {
    const response = await request(app).get('/api/permisos/1');
    expect(response.status).toBe(200);
  });

  test('POST /create - debe crear un permiso', async () => {
    const response = await request(app)
      .post('/api/permisos/create')
      .send({ nombre: 'test.permiso', descripcion: 'Test' });
    expect(response.status).toBe(201);
  });

  test('PUT /update/:id - debe actualizar un permiso', async () => {
    const response = await request(app)
      .put('/api/permisos/update/1')
      .send({ nombre: 'test.actualizado' });
    expect(response.status).toBe(200);
  });

  test('DELETE /delete/:id - debe eliminar un permiso', async () => {
    const response = await request(app).delete('/api/permisos/delete/1');
    expect(response.status).toBe(200);
  });
});