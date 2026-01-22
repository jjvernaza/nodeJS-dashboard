// Mockear TODO antes de importar
jest.mock('../../config/db.config', () => ({
  define: jest.fn(() => ({
    belongsTo: jest.fn(),
    hasMany: jest.fn()
  }))
}));

jest.mock('../../models/permisos.model', () => ({
  findAll: jest.fn(),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn()
}));

jest.mock('../../models/usuario_permiso.model', () => ({
  count: jest.fn()
}));

const permisosController = require('../../controllers/permisos.controller');
const Permiso = require('../../models/permisos.model');
const UsuarioPermiso = require('../../models/usuario_permiso.model');
const { Op } = require('sequelize');

describe('Permisos Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { query: {}, params: {}, body: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getAllPermisos', () => {
    test('debe obtener todos los permisos ordenados por nombre', async () => {
      const mockPermisos = [
        { id: 1, nombre: 'clientes.crear', descripcion: 'Crear clientes' },
        { id: 2, nombre: 'clientes.leer', descripcion: 'Ver clientes' },
        { id: 3, nombre: 'pagos.crear', descripcion: 'Crear pagos' }
      ];

      Permiso.findAll.mockResolvedValue(mockPermisos);

      await permisosController.getAllPermisos(req, res);

      expect(Permiso.findAll).toHaveBeenCalledWith({
        order: [['nombre', 'ASC']]
      });
      expect(res.json).toHaveBeenCalledWith(mockPermisos);
    });

    test('debe retornar array vacío si no hay permisos', async () => {
      Permiso.findAll.mockResolvedValue([]);

      await permisosController.getAllPermisos(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    test('debe manejar errores', async () => {
      Permiso.findAll.mockRejectedValue(new Error('Error DB'));

      await permisosController.getAllPermisos(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error al obtener permisos',
        error: 'Error DB'
      });
    });
  });

  describe('getPermisoById', () => {
    test('debe obtener un permiso por ID', async () => {
      req.params = { id: '1' };
      const mockPermiso = {
        id: 1,
        nombre: 'clientes.crear',
        descripcion: 'Crear clientes'
      };

      Permiso.findByPk.mockResolvedValue(mockPermiso);

      await permisosController.getPermisoById(req, res);

      expect(Permiso.findByPk).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith(mockPermiso);
    });

    test('debe retornar 404 si no existe', async () => {
      req.params = { id: '999' };
      Permiso.findByPk.mockResolvedValue(null);

      await permisosController.getPermisoById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Permiso no encontrado'
      });
    });

    test('debe manejar errores', async () => {
      req.params = { id: '1' };
      Permiso.findByPk.mockRejectedValue(new Error('Error'));

      await permisosController.getPermisoById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createPermiso', () => {
    test('debe crear un permiso válido', async () => {
      req.body = {
        nombre: 'usuarios.eliminar',
        descripcion: 'Eliminar usuarios del sistema'
      };

      Permiso.findOne.mockResolvedValue(null);
      Permiso.create.mockResolvedValue({
        id: 4,
        nombre: 'usuarios.eliminar',
        descripcion: 'Eliminar usuarios del sistema'
      });

      await permisosController.createPermiso(req, res);

      expect(Permiso.create).toHaveBeenCalledWith({
        nombre: 'usuarios.eliminar',
        descripcion: 'Eliminar usuarios del sistema'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Permiso creado correctamente',
        permiso: expect.objectContaining({
          id: 4,
          nombre: 'usuarios.eliminar'
        })
      });
    });

    test('debe crear permiso sin descripción', async () => {
      req.body = { nombre: 'reportes.ver' };

      Permiso.findOne.mockResolvedValue(null);
      Permiso.create.mockResolvedValue({
        id: 5,
        nombre: 'reportes.ver'
      });

      await permisosController.createPermiso(req, res);

      expect(Permiso.create).toHaveBeenCalledWith({
        nombre: 'reportes.ver',
        descripcion: undefined
      });
    });

    test('debe rechazar si falta el nombre', async () => {
      req.body = { descripcion: 'Descripción sin nombre' };

      await permisosController.createPermiso(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'El nombre es obligatorio'
      });
    });

    test('debe rechazar si el permiso ya existe', async () => {
      req.body = { nombre: 'clientes.crear' };

      Permiso.findOne.mockResolvedValue({
        id: 1,
        nombre: 'clientes.crear'
      });

      await permisosController.createPermiso(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Ya existe un permiso con ese nombre'
      });
    });

    test('debe verificar existencia con Op.like', async () => {
      req.body = { nombre: 'test.permiso' };

      Permiso.findOne.mockResolvedValue(null);
      Permiso.create.mockResolvedValue({ id: 6 });

      await permisosController.createPermiso(req, res);

      expect(Permiso.findOne).toHaveBeenCalledWith({
        where: { nombre: { [Op.like]: 'test.permiso' } }
      });
    });

    test('debe manejar errores', async () => {
      req.body = { nombre: 'test' };
      Permiso.findOne.mockRejectedValue(new Error('Error'));

      await permisosController.createPermiso(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updatePermiso', () => {
    test('debe actualizar un permiso existente', async () => {
      req.params = { id: '1' };
      req.body = {
        nombre: 'clientes.actualizar',
        descripcion: 'Actualizar información de clientes'
      };

      const mockPermiso = {
        id: 1,
        nombre: 'clientes.crear',
        descripcion: 'Crear clientes',
        update: jest.fn().mockResolvedValue(true)
      };

      Permiso.findByPk.mockResolvedValue(mockPermiso);
      Permiso.findOne.mockResolvedValue(null);

      await permisosController.updatePermiso(req, res);

      expect(mockPermiso.update).toHaveBeenCalledWith({
        nombre: 'clientes.actualizar',
        descripcion: 'Actualizar información de clientes'
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'Permiso actualizado correctamente',
        permiso: mockPermiso
      });
    });

    test('debe retornar 404 si no existe', async () => {
      req.params = { id: '999' };
      req.body = { nombre: 'test' };

      Permiso.findByPk.mockResolvedValue(null);

      await permisosController.updatePermiso(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('debe rechazar si falta el nombre', async () => {
      req.params = { id: '1' };
      req.body = { descripcion: 'Solo descripción' };

      Permiso.findByPk.mockResolvedValue({ id: 1, nombre: 'original' });

      await permisosController.updatePermiso(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('debe rechazar duplicados al cambiar nombre', async () => {
      req.params = { id: '1' };
      req.body = { nombre: 'pagos.crear' };

      Permiso.findByPk.mockResolvedValue({
        id: 1,
        nombre: 'clientes.crear'
      });
      Permiso.findOne.mockResolvedValue({
        id: 2,
        nombre: 'pagos.crear'
      });

      await permisosController.updatePermiso(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Ya existe otro permiso con ese nombre'
      });
    });

    test('debe permitir actualizar sin cambiar nombre', async () => {
      req.params = { id: '1' };
      req.body = {
        nombre: 'clientes.crear',
        descripcion: 'Nueva descripción'
      };

      const mockPermiso = {
        id: 1,
        nombre: 'clientes.crear',
        descripcion: 'Descripción antigua',
        update: jest.fn()
      };

      Permiso.findByPk.mockResolvedValue(mockPermiso);

      await permisosController.updatePermiso(req, res);

      expect(Permiso.findOne).not.toHaveBeenCalled();
      expect(mockPermiso.update).toHaveBeenCalled();
    });

    test('debe mantener descripción si no se proporciona', async () => {
      req.params = { id: '1' };
      req.body = { nombre: 'test.nuevo' };

      const mockPermiso = {
        id: 1,
        nombre: 'test',
        descripcion: 'Descripción original',
        update: jest.fn()
      };

      Permiso.findByPk.mockResolvedValue(mockPermiso);
      Permiso.findOne.mockResolvedValue(null);

      await permisosController.updatePermiso(req, res);

      expect(mockPermiso.update).toHaveBeenCalledWith({
        nombre: 'test.nuevo',
        descripcion: 'Descripción original'
      });
    });

    test('debe manejar errores', async () => {
      req.params = { id: '1' };
      req.body = { nombre: 'test' };

      Permiso.findByPk.mockRejectedValue(new Error('Error'));

      await permisosController.updatePermiso(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deletePermiso', () => {
    test('debe eliminar un permiso sin usuarios asignados', async () => {
      req.params = { id: '1' };

      const mockPermiso = {
        id: 1,
        destroy: jest.fn().mockResolvedValue(true)
      };

      Permiso.findByPk.mockResolvedValue(mockPermiso);
      UsuarioPermiso.count.mockResolvedValue(0);

      await permisosController.deletePermiso(req, res);

      expect(mockPermiso.destroy).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Permiso eliminado correctamente'
      });
    });

    test('debe retornar 404 si no existe', async () => {
      req.params = { id: '999' };
      Permiso.findByPk.mockResolvedValue(null);

      await permisosController.deletePermiso(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('debe rechazar si hay usuarios con el permiso asignado', async () => {
      req.params = { id: '1' };

      Permiso.findByPk.mockResolvedValue({ id: 1 });
      UsuarioPermiso.count.mockResolvedValue(5);

      await permisosController.deletePermiso(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No se puede eliminar el permiso porque está asignado a 5 usuarios',
        usuariosAsociados: 5
      });
    });

    test('debe verificar asignaciones con permiso_id', async () => {
      req.params = { id: '3' };

      Permiso.findByPk.mockResolvedValue({ id: 3 });
      UsuarioPermiso.count.mockResolvedValue(0);

      await permisosController.deletePermiso(req, res);

      expect(UsuarioPermiso.count).toHaveBeenCalledWith({
        where: { permiso_id: '3' }
      });
    });

    test('debe manejar errores', async () => {
      req.params = { id: '1' };
      Permiso.findByPk.mockRejectedValue(new Error('Error'));

      await permisosController.deletePermiso(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});