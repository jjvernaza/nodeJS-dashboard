// Mockear TODO antes de importar
jest.mock('../../config/db.config', () => ({
  define: jest.fn(() => ({
    belongsTo: jest.fn(),
    hasMany: jest.fn()
  }))
}));

jest.mock('../../models/estado.model', () => ({
  findAll: jest.fn(),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  count: jest.fn()
}));

jest.mock('../../models/client.model', () => ({
  count: jest.fn()
}));

const estadoController = require('../../controllers/estado.controller');
const EstadoModel = require('../../models/estado.model');
const Cliente = require('../../models/client.model');
const { Op } = require('sequelize');

describe('Estado Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { query: {}, params: {}, body: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getAllEstados', () => {
    test('debe obtener todos los estados', async () => {
      const mockEstados = [
        { ID: 1, Estado: 'Activo', Color: '#22c55e' },
        { ID: 2, Estado: 'Inactivo', Color: '#ef4444' }
      ];

      EstadoModel.findAll.mockResolvedValue(mockEstados);

      await estadoController.getAllEstados(req, res);

      expect(EstadoModel.findAll).toHaveBeenCalledWith({
        attributes: ['ID', 'Estado', 'Color'],
        order: [['ID', 'ASC']]
      });
      expect(res.json).toHaveBeenCalledWith(mockEstados);
    });

    test('debe retornar array vacío si no hay estados', async () => {
      EstadoModel.findAll.mockResolvedValue([]);

      await estadoController.getAllEstados(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    test('debe manejar errores', async () => {
      EstadoModel.findAll.mockRejectedValue(new Error('Error DB'));

      await estadoController.getAllEstados(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error al obtener estados',
        error: 'Error DB'
      });
    });
  });

  describe('getEstadoById', () => {
    test('debe obtener un estado por ID', async () => {
      req.params = { id: '1' };
      const mockEstado = { ID: 1, Estado: 'Activo', Color: '#22c55e' };

      EstadoModel.findByPk.mockResolvedValue(mockEstado);

      await estadoController.getEstadoById(req, res);

      expect(EstadoModel.findByPk).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith(mockEstado);
    });

    test('debe retornar 404 si no existe', async () => {
      req.params = { id: '999' };
      EstadoModel.findByPk.mockResolvedValue(null);

      await estadoController.getEstadoById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Estado no encontrado'
      });
    });

    test('debe manejar errores', async () => {
      req.params = { id: '1' };
      EstadoModel.findByPk.mockRejectedValue(new Error('Error'));

      await estadoController.getEstadoById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createEstado', () => {
    test('debe crear un estado válido', async () => {
      req.body = { Estado: 'Suspendido', Color: '#f59e0b' };

      EstadoModel.findOne.mockResolvedValue(null);
      EstadoModel.create.mockResolvedValue({
        ID: 3,
        Estado: 'Suspendido',
        Color: '#f59e0b',
        toJSON: jest.fn().mockReturnValue({
          ID: 3,
          Estado: 'Suspendido',
          Color: '#f59e0b'
        })
      });

      await estadoController.createEstado(req, res);

      expect(EstadoModel.create).toHaveBeenCalledWith({
        Estado: 'Suspendido',
        Color: '#f59e0b'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Estado creado correctamente',
          id: 3
        })
      );
    });

    test('debe usar color por defecto si no se proporciona', async () => {
      req.body = { Estado: 'Nuevo' };

      EstadoModel.findOne.mockResolvedValue(null);
      EstadoModel.create.mockResolvedValue({
        ID: 4,
        Estado: 'Nuevo',
        Color: '#22c55e',
        toJSON: jest.fn().mockReturnValue({ ID: 4 })
      });

      await estadoController.createEstado(req, res);

      expect(EstadoModel.create).toHaveBeenCalledWith({
        Estado: 'Nuevo',
        Color: '#22c55e'
      });
    });

    test('debe rechazar si falta el nombre del estado', async () => {
      req.body = { Color: '#000000' };

      await estadoController.createEstado(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'El campo Estado es obligatorio'
      });
    });

    test('debe rechazar si el estado está vacío', async () => {
      req.body = { Estado: '   ' };

      await estadoController.createEstado(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('debe rechazar si el estado ya existe', async () => {
      req.body = { Estado: 'Activo' };

      EstadoModel.findOne.mockResolvedValue({ ID: 1, Estado: 'Activo' });

      await estadoController.createEstado(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Ya existe un estado con ese nombre'
      });
    });

    test('debe hacer trim al nombre del estado', async () => {
      req.body = { Estado: '  Trimmed  ', Color: '#000000' };

      EstadoModel.findOne.mockResolvedValue(null);
      EstadoModel.create.mockResolvedValue({
        ID: 5,
        toJSON: jest.fn().mockReturnValue({ ID: 5 })
      });

      await estadoController.createEstado(req, res);

      expect(EstadoModel.create).toHaveBeenCalledWith({
        Estado: 'Trimmed',
        Color: '#000000'
      });
    });

    test('debe manejar errores', async () => {
      req.body = { Estado: 'Test' };
      EstadoModel.findOne.mockRejectedValue(new Error('Error'));

      await estadoController.createEstado(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateEstado', () => {
    test('debe actualizar un estado existente', async () => {
      req.params = { id: '1' };
      req.body = { Estado: 'Activo Modificado', Color: '#10b981' };

      const mockEstado = {
        ID: 1,
        Estado: 'Activo',
        Color: '#22c55e',
        update: jest.fn().mockResolvedValue(true)
      };

      EstadoModel.findByPk.mockResolvedValue(mockEstado);
      EstadoModel.findOne.mockResolvedValue(null);

      await estadoController.updateEstado(req, res);

      expect(mockEstado.update).toHaveBeenCalledWith({
        Estado: 'Activo Modificado',
        Color: '#10b981'
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'Estado actualizado correctamente',
        estado: mockEstado
      });
    });

    test('debe retornar 404 si no existe', async () => {
      req.params = { id: '999' };
      req.body = { Estado: 'Test' };

      EstadoModel.findByPk.mockResolvedValue(null);

      await estadoController.updateEstado(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('debe rechazar si falta el nombre', async () => {
      req.params = { id: '1' };
      req.body = { Color: '#000000' };

      EstadoModel.findByPk.mockResolvedValue({ ID: 1 });

      await estadoController.updateEstado(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('debe rechazar duplicados', async () => {
      req.params = { id: '1' };
      req.body = { Estado: 'Inactivo' };

      EstadoModel.findByPk.mockResolvedValue({ ID: 1, Estado: 'Activo' });
      EstadoModel.findOne.mockResolvedValue({ ID: 2, Estado: 'Inactivo' });

      await estadoController.updateEstado(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Ya existe otro estado con ese nombre'
      });
    });

    test('debe mantener color existente si no se proporciona', async () => {
      req.params = { id: '1' };
      req.body = { Estado: 'Actualizado' };

      const mockEstado = {
        ID: 1,
        Estado: 'Activo',
        Color: '#22c55e',
        update: jest.fn()
      };

      EstadoModel.findByPk.mockResolvedValue(mockEstado);
      EstadoModel.findOne.mockResolvedValue(null);

      await estadoController.updateEstado(req, res);

      expect(mockEstado.update).toHaveBeenCalledWith({
        Estado: 'Actualizado',
        Color: '#22c55e'
      });
    });

    test('debe manejar errores', async () => {
      req.params = { id: '1' };
      req.body = { Estado: 'Test' };

      EstadoModel.findByPk.mockRejectedValue(new Error('Error'));

      await estadoController.updateEstado(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteEstado', () => {
    test('debe eliminar un estado sin clientes asociados', async () => {
      req.params = { id: '1' };

      const mockEstado = {
        ID: 1,
        destroy: jest.fn().mockResolvedValue(true)
      };

      EstadoModel.findByPk.mockResolvedValue(mockEstado);
      Cliente.count.mockResolvedValue(0);

      await estadoController.deleteEstado(req, res);

      expect(mockEstado.destroy).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Estado eliminado correctamente'
      });
    });

    test('debe retornar 404 si no existe', async () => {
      req.params = { id: '999' };
      EstadoModel.findByPk.mockResolvedValue(null);

      await estadoController.deleteEstado(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('debe rechazar si hay clientes asociados', async () => {
      req.params = { id: '1' };

      EstadoModel.findByPk.mockResolvedValue({ ID: 1 });
      Cliente.count.mockResolvedValue(5);

      await estadoController.deleteEstado(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No se puede eliminar el estado porque hay 5 cliente(s) que lo están usando'
      });
    });

    test('debe continuar si falla verificación de clientes', async () => {
      req.params = { id: '1' };

      const mockEstado = {
        ID: 1,
        destroy: jest.fn().mockResolvedValue(true)
      };

      EstadoModel.findByPk.mockResolvedValue(mockEstado);
      Cliente.count.mockRejectedValue(new Error('Error verificación'));

      await estadoController.deleteEstado(req, res);

      expect(mockEstado.destroy).toHaveBeenCalled();
    });

    test('debe manejar errores', async () => {
      req.params = { id: '1' };
      EstadoModel.findByPk.mockRejectedValue(new Error('Error'));

      await estadoController.deleteEstado(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});