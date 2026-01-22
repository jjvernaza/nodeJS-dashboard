// Mockear TODO antes de importar
jest.mock('../../config/db.config', () => ({
  define: jest.fn(() => ({
    belongsTo: jest.fn(),
    hasMany: jest.fn()
  })),
  where: jest.fn(),
  fn: jest.fn(),
  col: jest.fn()
}));

jest.mock('../../models/user.model', () => ({
  findAll: jest.fn(),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn()
}));

jest.mock('../../models/estado.model', () => ({
  findOne: jest.fn()
}));

jest.mock('../../models/usuario_permiso.model', () => ({
  findAll: jest.fn()
}));

jest.mock('../../models/permisos.model', () => ({}));

jest.mock('../../utils/auditoria.helper', () => ({
  registrarAuditoria: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-token')
}));

jest.mock('crypto', () => ({
  createHash: jest.fn(() => ({
    update: jest.fn(() => ({
      digest: jest.fn(() => 'hashed-password')
    }))
  }))
}));

const userController = require('../../controllers/user.controller');
const User = require('../../models/user.model');
const Estado = require('../../models/estado.model');
const UsuarioPermiso = require('../../models/usuario_permiso.model');
const { registrarAuditoria } = require('../../utils/auditoria.helper');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

describe('User Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { query: {}, params: {}, body: {}, user: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    test('debe crear un usuario válido', async () => {
      req.body = {
        Cedula: '123456789',
        Telefono: '3001234567',
        Nombre: 'Juan',
        Apellidos: 'Pérez',
        Funcion: 'Administrador',
        User: 'jperez',
        Password: 'password123'
      };

      User.findOne.mockResolvedValue(null);
      Estado.findOne.mockResolvedValue({ ID: 1 });
      User.create.mockResolvedValue({
        ID: 1,
        Nombre: 'Juan',
        Apellidos: 'Pérez',
        Funcion: 'Administrador'
      });

      await userController.createUser(req, res);

      expect(User.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Usuario creado exitosamente',
        usuario: expect.objectContaining({
          id: 1,
          nombre: 'Juan'
        })
      });
    });

    test('debe rechazar si faltan campos requeridos', async () => {
      req.body = { Nombre: 'Juan' };

      await userController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Cédula, usuario y contraseña son requeridos'
      });
    });

    test('debe rechazar si el username ya existe', async () => {
      req.body = {
        Cedula: '123456789',
        User: 'jperez',
        Password: 'password123'
      };

      User.findOne.mockResolvedValue({
        ID: 1,
        User: 'jperez'
      });

      await userController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Ya existe un usuario con ese nombre de usuario'
      });
    });

    test('debe rechazar si la cédula ya existe', async () => {
      req.body = {
        Cedula: '123456789',
        User: 'nuevo',
        Password: 'password123'
      };

      User.findOne.mockResolvedValue({
        ID: 1,
        Cedula: '123456789'
      });

      await userController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Ya existe un usuario con esa cédula'
      });
    });

    test('debe hashear la contraseña', async () => {
      req.body = {
        Cedula: '123456789',
        User: 'jperez',
        Password: 'password123'
      };

      User.findOne.mockResolvedValue(null);
      Estado.findOne.mockResolvedValue({ ID: 1 });
      User.create.mockResolvedValue({ ID: 1 });

      await userController.createUser(req, res);

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          Password: 'hashed-password'
        })
      );
    });

    test('debe manejar errores', async () => {
      req.body = {
        Cedula: '123456789',
        User: 'jperez',
        Password: 'password123'
      };

      User.findOne.mockRejectedValue(new Error('Error DB'));

      await userController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('login', () => {
    test('debe hacer login exitosamente', async () => {
      req.body = { user: 'jperez', password: 'password123' };

      User.findOne.mockResolvedValue({
        ID: 1,
        User: 'jperez',
        Password: 'hashed-password',
        Nombre: 'Juan',
        Apellidos: 'Pérez',
        Funcion: 'Administrador',
        estado: { ID: 1, Estado: 'activo' }
      });

      UsuarioPermiso.findAll.mockResolvedValue([
        { permiso: { id: 1, nombre: 'usuarios.leer' } },
        { permiso: { id: 2, nombre: 'usuarios.crear' } }
      ]);

      await userController.login(req, res);

      expect(jwt.sign).toHaveBeenCalled();
      expect(registrarAuditoria).toHaveBeenCalledWith(
        1,
        'AUTENTICACION',
        'LOGIN',
        expect.any(String),
        req
      );
      expect(res.json).toHaveBeenCalledWith({
        message: 'Inicio de sesión exitoso',
        token: 'mock-token',
        user: expect.objectContaining({
          id: 1,
          nombre: 'Juan',
          permisos: expect.any(Array)
        })
      });
    });

    test('debe rechazar si faltan credenciales', async () => {
      req.body = { user: 'jperez' };

      await userController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Usuario y contraseña son requeridos'
      });
    });

    test('debe rechazar si usuario no existe', async () => {
      req.body = { user: 'noexiste', password: 'password123' };

      User.findOne.mockResolvedValue(null);

      await userController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(registrarAuditoria).toHaveBeenCalledWith(
        null,
        'AUTENTICACION',
        'LOGIN_FALLIDO',
        expect.stringContaining('Usuario no encontrado'),
        req
      );
    });

    test('debe rechazar si usuario está inactivo', async () => {
      req.body = { user: 'jperez', password: 'password123' };

      User.findOne.mockResolvedValue({
        ID: 1,
        User: 'jperez',
        Nombre: 'Juan',
        Apellidos: 'Pérez',
        estado: { ID: 2, Estado: 'inactivo' }
      });

      await userController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(registrarAuditoria).toHaveBeenCalledWith(
        1,
        'AUTENTICACION',
        'LOGIN_BLOQUEADO',
        expect.any(String),
        req
      );
    });

    test('debe rechazar si contraseña es incorrecta', async () => {
      req.body = { user: 'jperez', password: 'wrongpassword' };

      User.findOne.mockResolvedValue({
        ID: 1,
        User: 'jperez',
        Password: 'different-hash',
        Nombre: 'Juan',
        Apellidos: 'Pérez',
        estado: { ID: 1, Estado: 'activo' }
      });

      await userController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(registrarAuditoria).toHaveBeenCalledWith(
        1,
        'AUTENTICACION',
        'LOGIN_FALLIDO',
        expect.stringContaining('contraseña incorrecta'),
        req
      );
    });

    test('debe incluir permisos en el token', async () => {
      req.body = { user: 'jperez', password: 'password123' };

      User.findOne.mockResolvedValue({
        ID: 1,
        User: 'jperez',
        Password: 'hashed-password',
        Nombre: 'Juan',
        Funcion: 'Admin',
        estado: { Estado: 'activo' }
      });

      UsuarioPermiso.findAll.mockResolvedValue([
        { permiso: { nombre: 'usuarios.leer' } }
      ]);

      await userController.login(req, res);

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          permisos: ['usuarios.leer']
        }),
        expect.any(String),
        expect.any(Object)
      );
    });

    test('debe manejar errores', async () => {
      req.body = { user: 'jperez', password: 'password123' };

      User.findOne.mockRejectedValue(new Error('Error DB'));

      await userController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('logout', () => {
    test('debe hacer logout exitosamente', async () => {
      req.user = {
        id: 1,
        nombre: 'Juan',
        funcion: 'Administrador'
      };

      await userController.logout(req, res);

      expect(registrarAuditoria).toHaveBeenCalledWith(
        1,
        'AUTENTICACION',
        'LOGOUT',
        expect.stringContaining('Cierre de sesión'),
        req
      );
      expect(res.json).toHaveBeenCalledWith({
        message: 'Sesión cerrada exitosamente'
      });
    });

    test('debe manejar errores', async () => {
      req.user = { id: 1 };
      registrarAuditoria.mockRejectedValue(new Error('Error'));

      await userController.logout(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAllUsers', () => {
    test('debe obtener todos los usuarios', async () => {
      const mockUsers = [
        { ID: 1, Nombre: 'Juan', estado: { Estado: 'activo' } },
        { ID: 2, Nombre: 'María', estado: { Estado: 'activo' } }
      ];

      User.findAll.mockResolvedValue(mockUsers);

      await userController.getAllUsers(req, res);

      expect(User.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockUsers);
    });

    test('debe manejar errores', async () => {
      User.findAll.mockRejectedValue(new Error('Error'));

      await userController.getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getUserById', () => {
    test('debe obtener un usuario por ID con permisos', async () => {
      req.params = { id: '1' };

      User.findByPk.mockResolvedValue({
        ID: 1,
        Nombre: 'Juan',
        toJSON: () => ({ ID: 1, Nombre: 'Juan' })
      });

      UsuarioPermiso.findAll.mockResolvedValue([
        { permiso: { id: 1, nombre: 'usuarios.leer' } }
      ]);

      await userController.getUserById(req, res);

      expect(User.findByPk).toHaveBeenCalledWith('1', expect.any(Object));
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          permisos: expect.any(Array)
        })
      );
    });

    test('debe retornar 404 si no existe', async () => {
      req.params = { id: '999' };

      User.findByPk.mockResolvedValue(null);

      await userController.getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('debe manejar errores', async () => {
      req.params = { id: '1' };

      User.findByPk.mockRejectedValue(new Error('Error'));

      await userController.getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateUser', () => {
    test('debe actualizar un usuario', async () => {
      req.params = { id: '1' };
      req.body = {
        Nombre: 'Juan Carlos',
        Apellidos: 'Pérez García'
      };

      const mockUser = {
        ID: 1,
        User: 'jperez',
        Cedula: '123456789',
        Nombre: 'Juan',
        update: jest.fn()
      };

      User.findByPk.mockResolvedValue(mockUser);

      await userController.updateUser(req, res);

      expect(mockUser.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Usuario actualizado correctamente',
        usuario: expect.any(Object)
      });
    });

    test('debe retornar 404 si no existe', async () => {
      req.params = { id: '999' };
      req.body = { Nombre: 'Test' };

      User.findByPk.mockResolvedValue(null);

      await userController.updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('debe rechazar username duplicado', async () => {
      req.params = { id: '1' };
      req.body = { User: 'mgarcia' };

      User.findByPk.mockResolvedValue({
        ID: 1,
        User: 'jperez'
      });

      User.findOne.mockResolvedValue({
        ID: 2,
        User: 'mgarcia'
      });

      await userController.updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Ya existe un usuario con ese nombre de usuario'
      });
    });

    test('debe actualizar contraseña si se proporciona', async () => {
      req.params = { id: '1' };
      req.body = { Password: 'newpassword123' };

      const mockUser = {
        ID: 1,
        User: 'jperez',
        update: jest.fn()
      };

      User.findByPk.mockResolvedValue(mockUser);

      await userController.updateUser(req, res);

      expect(mockUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          Password: 'hashed-password'
        })
      );
    });

    test('debe manejar errores', async () => {
      req.params = { id: '1' };
      req.body = { Nombre: 'Test' };

      User.findByPk.mockRejectedValue(new Error('Error'));

      await userController.updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('changePassword', () => {
    test('debe cambiar contraseña exitosamente', async () => {
      req.params = { id: '1' };
      req.body = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword'
      };

      const mockUser = {
        ID: 1,
        Password: 'hashed-password',
        update: jest.fn()
      };

      User.findByPk.mockResolvedValue(mockUser);

      await userController.changePassword(req, res);

      expect(mockUser.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Contraseña actualizada correctamente'
      });
    });

    test('debe rechazar si faltan campos', async () => {
      req.params = { id: '1' };
      req.body = { currentPassword: 'old' };

      await userController.changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('debe rechazar si contraseña actual es incorrecta', async () => {
      req.params = { id: '1' };
      req.body = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword'
      };

      User.findByPk.mockResolvedValue({
        ID: 1,
        Password: 'different-hash'
      });

      await userController.changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Contraseña actual incorrecta'
      });
    });

    test('debe retornar 404 si usuario no existe', async () => {
      req.params = { id: '999' };
      req.body = {
        currentPassword: 'old',
        newPassword: 'new'
      };

      User.findByPk.mockResolvedValue(null);

      await userController.changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('debe manejar errores', async () => {
      req.params = { id: '1' };
      req.body = {
        currentPassword: 'old',
        newPassword: 'new'
      };

      User.findByPk.mockRejectedValue(new Error('Error'));

      await userController.changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteUser', () => {
    test('debe eliminar un usuario', async () => {
      req.params = { id: '1' };

      const mockUser = {
        ID: 1,
        destroy: jest.fn()
      };

      User.findByPk.mockResolvedValue(mockUser);

      await userController.deleteUser(req, res);

      expect(mockUser.destroy).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Usuario eliminado correctamente'
      });
    });

    test('debe retornar 404 si no existe', async () => {
      req.params = { id: '999' };

      User.findByPk.mockResolvedValue(null);

      await userController.deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('debe manejar errores', async () => {
      req.params = { id: '1' };

      User.findByPk.mockRejectedValue(new Error('Error'));

      await userController.deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('verifyToken', () => {
    test('debe verificar token válido', () => {
      req.user = { id: 1, nombre: 'Juan' };

      userController.verifyToken(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Token válido',
        user: req.user
      });
    });
  });
});