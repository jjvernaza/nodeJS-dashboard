// Mockear TODO antes de importar
jest.mock('../../config/db.config', () => ({
  define: jest.fn(() => ({
    belongsTo: jest.fn(),
    hasMany: jest.fn()
  }))
}));

jest.mock('../../models/usuario_permiso.model', () => ({
  findAll: jest.fn(),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn()
}));

jest.mock('../../models/user.model', () => ({
  findByPk: jest.fn()
}));

jest.mock('../../models/permisos.model', () => ({
  findByPk: jest.fn()
}));

const usuarioPermisoController = require('../../controllers/usuario_permiso.controller');
const UsuarioPermiso = require('../../models/usuario_permiso.model');
const Usuario = require('../../models/user.model');
const Permiso = require('../../models/permisos.model');

describe('UsuarioPermiso Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { query: {}, params: {}, body: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getAllUsuarioPermisos', () => {
    test('debe obtener todas las asignaciones de permisos', async () => {
      const mockAsignaciones = [
        {
          id: 1,
          usuario: { ID: 1, Nombre: 'Juan', User: 'jperez' },
          permiso: { id: 1, nombre: 'usuarios.leer' }
        },
        {
          id: 2,
          usuario: { ID: 2, Nombre: 'María', User: 'mgarcia' },
          permiso: { id: 2, nombre: 'clientes.crear' }
        }
      ];

      UsuarioPermiso.findAll.mockResolvedValue(mockAsignaciones);

      await usuarioPermisoController.getAllUsuarioPermisos(req, res);

      expect(UsuarioPermiso.findAll).toHaveBeenCalledWith({
        include: expect.arrayContaining([
          expect.objectContaining({ model: Usuario, as: 'usuario' }),
          expect.objectContaining({ model: Permiso, as: 'permiso' })
        ])
      });
      expect(res.json).toHaveBeenCalledWith(mockAsignaciones);
    });

    test('debe retornar array vacío si no hay asignaciones', async () => {
      UsuarioPermiso.findAll.mockResolvedValue([]);

      await usuarioPermisoController.getAllUsuarioPermisos(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    test('debe manejar errores', async () => {
      UsuarioPermiso.findAll.mockRejectedValue(new Error('Error DB'));

      await usuarioPermisoController.getAllUsuarioPermisos(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error al obtener permisos de usuario',
        error: 'Error DB'
      });
    });
  });

  describe('getPermisosByUsuario', () => {
    test('debe obtener permisos de un usuario', async () => {
      req.params = { usuarioId: '1' };

      Usuario.findByPk.mockResolvedValue({ ID: 1, Nombre: 'Juan' });
      
      const mockPermisos = [
        { id: 1, permiso: { id: 1, nombre: 'usuarios.leer' } },
        { id: 2, permiso: { id: 2, nombre: 'clientes.crear' } }
      ];

      UsuarioPermiso.findAll.mockResolvedValue(mockPermisos);

      await usuarioPermisoController.getPermisosByUsuario(req, res);

      expect(Usuario.findByPk).toHaveBeenCalledWith('1');
      expect(UsuarioPermiso.findAll).toHaveBeenCalledWith({
        where: { usuario_id: '1' },
        include: expect.any(Array)
      });
      expect(res.json).toHaveBeenCalledWith(mockPermisos);
    });

    test('debe retornar 404 si usuario no existe', async () => {
      req.params = { usuarioId: '999' };

      Usuario.findByPk.mockResolvedValue(null);

      await usuarioPermisoController.getPermisosByUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Usuario no encontrado'
      });
    });

    test('debe manejar errores', async () => {
      req.params = { usuarioId: '1' };

      Usuario.findByPk.mockRejectedValue(new Error('Error'));

      await usuarioPermisoController.getPermisosByUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getUsuariosByPermiso', () => {
    test('debe obtener usuarios con un permiso específico', async () => {
      req.params = { permisoId: '1' };

      Permiso.findByPk.mockResolvedValue({ id: 1, nombre: 'usuarios.leer' });
      
      const mockUsuarios = [
        { id: 1, usuario: { ID: 1, Nombre: 'Juan' } },
        { id: 2, usuario: { ID: 2, Nombre: 'María' } }
      ];

      UsuarioPermiso.findAll.mockResolvedValue(mockUsuarios);

      await usuarioPermisoController.getUsuariosByPermiso(req, res);

      expect(Permiso.findByPk).toHaveBeenCalledWith('1');
      expect(UsuarioPermiso.findAll).toHaveBeenCalledWith({
        where: { permiso_id: '1' },
        include: expect.any(Array)
      });
      expect(res.json).toHaveBeenCalledWith(mockUsuarios);
    });

    test('debe retornar 404 si permiso no existe', async () => {
      req.params = { permisoId: '999' };

      Permiso.findByPk.mockResolvedValue(null);

      await usuarioPermisoController.getUsuariosByPermiso(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Permiso no encontrado'
      });
    });

    test('debe manejar errores', async () => {
      req.params = { permisoId: '1' };

      Permiso.findByPk.mockRejectedValue(new Error('Error'));

      await usuarioPermisoController.getUsuariosByPermiso(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('assignPermiso', () => {
    test('debe asignar un permiso a un usuario', async () => {
      req.body = {
        usuario_id: 1,
        permiso_id: 2
      };

      Usuario.findByPk.mockResolvedValue({ ID: 1, Nombre: 'Juan' });
      Permiso.findByPk.mockResolvedValue({ id: 2, nombre: 'clientes.crear' });
      UsuarioPermiso.findOne.mockResolvedValue(null);
      UsuarioPermiso.create.mockResolvedValue({
        id: 1,
        usuario_id: 1,
        permiso_id: 2
      });

      await usuarioPermisoController.assignPermiso(req, res);

      expect(UsuarioPermiso.create).toHaveBeenCalledWith({
        usuario_id: 1,
        permiso_id: 2,
        fecha_asignacion: expect.any(Date)
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Permiso asignado correctamente',
        asignacion: expect.any(Object)
      });
    });

    test('debe rechazar si faltan campos requeridos', async () => {
      req.body = { usuario_id: 1 };

      await usuarioPermisoController.assignPermiso(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'usuario_id y permiso_id son obligatorios'
      });
    });

    test('debe rechazar si usuario no existe', async () => {
      req.body = {
        usuario_id: 999,
        permiso_id: 1
      };

      Usuario.findByPk.mockResolvedValue(null);

      await usuarioPermisoController.assignPermiso(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Usuario no encontrado'
      });
    });

    test('debe rechazar si permiso no existe', async () => {
      req.body = {
        usuario_id: 1,
        permiso_id: 999
      };

      Usuario.findByPk.mockResolvedValue({ ID: 1 });
      Permiso.findByPk.mockResolvedValue(null);

      await usuarioPermisoController.assignPermiso(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Permiso no encontrado'
      });
    });

    test('debe rechazar si el permiso ya está asignado', async () => {
      req.body = {
        usuario_id: 1,
        permiso_id: 2
      };

      Usuario.findByPk.mockResolvedValue({ ID: 1 });
      Permiso.findByPk.mockResolvedValue({ id: 2 });
      UsuarioPermiso.findOne.mockResolvedValue({
        id: 1,
        usuario_id: 1,
        permiso_id: 2
      });

      await usuarioPermisoController.assignPermiso(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'El permiso ya está asignado a este usuario'
      });
    });

    test('debe convertir IDs a números', async () => {
      req.body = {
        usuario_id: '1',
        permiso_id: '2'
      };

      Usuario.findByPk.mockResolvedValue({ ID: 1 });
      Permiso.findByPk.mockResolvedValue({ id: 2 });
      UsuarioPermiso.findOne.mockResolvedValue(null);
      UsuarioPermiso.create.mockResolvedValue({ id: 1 });

      await usuarioPermisoController.assignPermiso(req, res);

      expect(Usuario.findByPk).toHaveBeenCalledWith(1);
      expect(Permiso.findByPk).toHaveBeenCalledWith(2);
    });

    test('debe manejar errores', async () => {
      req.body = {
        usuario_id: 1,
        permiso_id: 2
      };

      Usuario.findByPk.mockRejectedValue(new Error('Error'));

      await usuarioPermisoController.assignPermiso(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('revokePermiso', () => {
    test('debe revocar un permiso por ID de asignación', async () => {
      req.params = { id: '1' };

      const mockAsignacion = {
        id: 1,
        destroy: jest.fn()
      };

      UsuarioPermiso.findByPk.mockResolvedValue(mockAsignacion);

      await usuarioPermisoController.revokePermiso(req, res);

      expect(mockAsignacion.destroy).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Permiso revocado correctamente'
      });
    });

    test('debe retornar 404 si asignación no existe', async () => {
      req.params = { id: '999' };

      UsuarioPermiso.findByPk.mockResolvedValue(null);

      await usuarioPermisoController.revokePermiso(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Asignación de permiso no encontrada'
      });
    });

    test('debe manejar errores', async () => {
      req.params = { id: '1' };

      UsuarioPermiso.findByPk.mockRejectedValue(new Error('Error'));

      await usuarioPermisoController.revokePermiso(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('revokePermisoUsuario', () => {
    test('debe revocar un permiso específico de un usuario', async () => {
      req.params = {
        usuario_id: '1',
        permiso_id: '2'
      };

      const mockAsignacion = {
        id: 1,
        destroy: jest.fn()
      };

      UsuarioPermiso.findOne.mockResolvedValue(mockAsignacion);

      await usuarioPermisoController.revokePermisoUsuario(req, res);

      expect(UsuarioPermiso.findOne).toHaveBeenCalledWith({
        where: {
          usuario_id: 1,
          permiso_id: 2
        }
      });
      expect(mockAsignacion.destroy).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Permiso revocado correctamente del usuario'
      });
    });

    test('debe retornar 404 si asignación no existe', async () => {
      req.params = {
        usuario_id: '1',
        permiso_id: '999'
      };

      UsuarioPermiso.findOne.mockResolvedValue(null);

      await usuarioPermisoController.revokePermisoUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Asignación de permiso no encontrada'
      });
    });

    test('debe convertir IDs a números', async () => {
      req.params = {
        usuario_id: '1',
        permiso_id: '2'
      };

      UsuarioPermiso.findOne.mockResolvedValue({ destroy: jest.fn() });

      await usuarioPermisoController.revokePermisoUsuario(req, res);

      expect(UsuarioPermiso.findOne).toHaveBeenCalledWith({
        where: {
          usuario_id: 1,
          permiso_id: 2
        }
      });
    });

    test('debe manejar errores', async () => {
      req.params = {
        usuario_id: '1',
        permiso_id: '2'
      };

      UsuarioPermiso.findOne.mockRejectedValue(new Error('Error'));

      await usuarioPermisoController.revokePermisoUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});