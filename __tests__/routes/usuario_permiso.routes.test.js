const request = require('supertest');
const express = require('express');

const mockController = {
  getAllUsuarioPermisos: jest.fn((req, res) => res.json({ success: true })),
  getPermisosByUsuario: jest.fn((req, res) => res.json({ success: true })),
  getUsuariosByPermiso: jest.fn((req, res) => res.json({ success: true })),
  assignPermiso: jest.fn((req, res) => res.status(201).json({ success: true })),
  revokePermiso: jest.fn((req, res) => res.json({ success: true })),
  revokePermisoUsuario: jest.fn((req, res) => res.json({ success: true }))
};

jest.mock('../../controllers/usuario_permiso.controller', () => mockController);
jest.mock('../../middlewares/auth.middleware', () => jest.fn((req, res, next) => next()));
jest.mock('../../middlewares/permission.middleware', () => ({
  checkPermission: jest.fn(() => (req, res, next) => next())
}));
jest.mock('../../middlewares/auditoria.middleware', () => ({
  auditMiddleware: jest.fn(() => (req, res, next) => next())
}));

const usuarioPermisoRouter = require('../../routes/usuario_permiso.routes');

describe('UsuarioPermiso Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/usuario-permisos', usuarioPermisoRouter);
    jest.clearAllMocks();
  });

  describe('Consultas de permisos', () => {
    test('GET /all - debe obtener todas las asignaciones', async () => {
      const response = await request(app).get('/api/usuario-permisos/all');
      
      expect(response.status).toBe(200);
      expect(mockController.getAllUsuarioPermisos).toHaveBeenCalled();
    });

    test('GET /usuario/:usuarioId - debe obtener permisos por usuario', async () => {
      const response = await request(app).get('/api/usuario-permisos/usuario/1');
      
      expect(response.status).toBe(200);
      expect(mockController.getPermisosByUsuario).toHaveBeenCalled();
    });

    test('GET /permiso/:permisoId - debe obtener usuarios por permiso', async () => {
      const response = await request(app).get('/api/usuario-permisos/permiso/1');
      
      expect(response.status).toBe(200);
      expect(mockController.getUsuariosByPermiso).toHaveBeenCalled();
    });
  });

  describe('Asignación y revocación', () => {
    test('POST /assign - debe asignar un permiso', async () => {
      const response = await request(app)
        .post('/api/usuario-permisos/assign')
        .send({ usuario_id: 1, permiso_id: 2 });
      
      expect(response.status).toBe(201);
      expect(mockController.assignPermiso).toHaveBeenCalled();
    });

    test('DELETE /revoke/:id - debe revocar por ID de asignación', async () => {
      const response = await request(app).delete('/api/usuario-permisos/revoke/1');
      
      expect(response.status).toBe(200);
      expect(mockController.revokePermiso).toHaveBeenCalled();
    });

    test('DELETE /revoke/usuario/:usuario_id/permiso/:permiso_id - debe revocar permiso específico', async () => {
      const response = await request(app)
        .delete('/api/usuario-permisos/revoke/usuario/1/permiso/2');
      
      expect(response.status).toBe(200);
      expect(mockController.revokePermisoUsuario).toHaveBeenCalled();
    });
  });
});