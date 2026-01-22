const request = require('supertest');
const express = require('express');

const mockController = {
  login: jest.fn((req, res) => res.json({ success: true })),
  logout: jest.fn((req, res) => res.json({ success: true })),
  verifyToken: jest.fn((req, res) => res.json({ success: true })),
  getAllUsers: jest.fn((req, res) => res.json({ success: true })),
  getUserById: jest.fn((req, res) => res.json({ success: true })),
  createUser: jest.fn((req, res) => res.status(201).json({ success: true })),
  updateUser: jest.fn((req, res) => res.json({ success: true })),
  changePassword: jest.fn((req, res) => res.json({ success: true })),
  deleteUser: jest.fn((req, res) => res.json({ success: true }))
};

jest.mock('../../controllers/user.controller', () => mockController);
jest.mock('../../middlewares/auth.middleware', () => jest.fn((req, res, next) => next()));
jest.mock('../../middlewares/permission.middleware', () => ({
  checkPermission: jest.fn(() => (req, res, next) => next())
}));
jest.mock('../../middlewares/auditoria.middleware', () => ({
  auditMiddleware: jest.fn(() => (req, res, next) => next())
}));

const userRouter = require('../../routes/user.routes');

describe('User Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/users', userRouter);
    jest.clearAllMocks();
  });

  describe('Rutas públicas', () => {
    test('POST /login - debe permitir login sin autenticación', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({ user: 'jperez', password: 'password123' });
      
      expect(response.status).toBe(200);
      expect(mockController.login).toHaveBeenCalled();
    });
  });

  describe('Rutas protegidas - Autenticación', () => {
    test('GET /verify-token - debe verificar token', async () => {
      const response = await request(app).get('/api/users/verify-token');
      
      expect(response.status).toBe(200);
      expect(mockController.verifyToken).toHaveBeenCalled();
    });

    test('POST /logout - debe cerrar sesión', async () => {
      const response = await request(app).post('/api/users/logout');
      
      expect(response.status).toBe(200);
      expect(mockController.logout).toHaveBeenCalled();
    });
  });

  describe('CRUD de usuarios', () => {
    test('GET /all - debe obtener todos los usuarios', async () => {
      const response = await request(app).get('/api/users/all');
      
      expect(response.status).toBe(200);
      expect(mockController.getAllUsers).toHaveBeenCalled();
    });

    test('GET /:id - debe obtener un usuario por ID', async () => {
      const response = await request(app).get('/api/users/1');
      
      expect(response.status).toBe(200);
      expect(mockController.getUserById).toHaveBeenCalled();
    });

    test('POST /create - debe crear un usuario', async () => {
      const response = await request(app)
        .post('/api/users/create')
        .send({ Cedula: '123', User: 'test', Password: 'pass' });
      
      expect(response.status).toBe(201);
      expect(mockController.createUser).toHaveBeenCalled();
    });

    test('PUT /update/:id - debe actualizar un usuario', async () => {
      const response = await request(app)
        .put('/api/users/update/1')
        .send({ Nombre: 'Juan Carlos' });
      
      expect(response.status).toBe(200);
      expect(mockController.updateUser).toHaveBeenCalled();
    });

    test('PUT /change-password/:id - debe cambiar contraseña', async () => {
      const response = await request(app)
        .put('/api/users/change-password/1')
        .send({ currentPassword: 'old', newPassword: 'new' });
      
      expect(response.status).toBe(200);
      expect(mockController.changePassword).toHaveBeenCalled();
    });

    test('DELETE /delete/:id - debe eliminar un usuario', async () => {
      const response = await request(app).delete('/api/users/delete/1');
      
      expect(response.status).toBe(200);
      expect(mockController.deleteUser).toHaveBeenCalled();
    });
  });
});