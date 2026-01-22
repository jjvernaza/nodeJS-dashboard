// Mockear TODO antes de importar
jest.mock('../../config/db.config', () => ({
  define: jest.fn(() => ({
    belongsTo: jest.fn(),
    hasMany: jest.fn()
  }))
}));

jest.mock('../../models/plan_mb.model', () => ({
  findAll: jest.fn(),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn()
}));

jest.mock('../../models/client.model', () => ({
  count: jest.fn()
}));

const planController = require('../../controllers/plan.controller');
const Plan = require('../../models/plan_mb.model');
const Cliente = require('../../models/client.model');
const { Op } = require('sequelize');

describe('Plan Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { query: {}, params: {}, body: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getAllPlanes', () => {
    test('debe obtener todos los planes', async () => {
      const mockPlanes = [
        { id: 1, nombre: 'Básico', velocidad: '10MB' },
        { id: 2, nombre: 'Premium', velocidad: '50MB' },
        { id: 3, nombre: 'Ultra', velocidad: '100MB' }
      ];

      Plan.findAll.mockResolvedValue(mockPlanes);

      await planController.getAllPlanes(req, res);

      expect(Plan.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockPlanes);
    });

    test('debe retornar array vacío si no hay planes', async () => {
      Plan.findAll.mockResolvedValue([]);

      await planController.getAllPlanes(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    test('debe manejar errores', async () => {
      Plan.findAll.mockRejectedValue(new Error('Error DB'));

      await planController.getAllPlanes(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error al obtener planes',
        error: 'Error DB'
      });
    });
  });

  describe('getPlanById', () => {
    test('debe obtener un plan por ID', async () => {
      req.params = { id: '1' };
      const mockPlan = {
        id: 1,
        nombre: 'Básico',
        velocidad: '10MB'
      };

      Plan.findByPk.mockResolvedValue(mockPlan);

      await planController.getPlanById(req, res);

      expect(Plan.findByPk).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith(mockPlan);
    });

    test('debe retornar 404 si no existe', async () => {
      req.params = { id: '999' };
      Plan.findByPk.mockResolvedValue(null);

      await planController.getPlanById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Plan no encontrado'
      });
    });

    test('debe manejar errores', async () => {
      req.params = { id: '1' };
      Plan.findByPk.mockRejectedValue(new Error('Error'));

      await planController.getPlanById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createPlan', () => {
    test('debe crear un plan válido', async () => {
      req.body = {
        nombre: 'Enterprise',
        velocidad: '200MB'
      };

      Plan.findOne.mockResolvedValue(null);
      Plan.create.mockResolvedValue({
        id: 4,
        nombre: 'Enterprise',
        velocidad: '200MB'
      });

      await planController.createPlan(req, res);

      expect(Plan.create).toHaveBeenCalledWith({
        nombre: 'Enterprise',
        velocidad: '200MB'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Plan creado correctamente',
        plan: expect.objectContaining({
          id: 4,
          nombre: 'Enterprise'
        })
      });
    });

    test('debe rechazar si falta el nombre', async () => {
      req.body = { velocidad: '10MB' };

      await planController.createPlan(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Nombre y velocidad son obligatorios'
      });
    });

    test('debe rechazar si falta la velocidad', async () => {
      req.body = { nombre: 'Test' };

      await planController.createPlan(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('debe rechazar si el plan ya existe', async () => {
      req.body = {
        nombre: 'Básico',
        velocidad: '10MB'
      };

      Plan.findOne.mockResolvedValue({
        id: 1,
        nombre: 'Básico'
      });

      await planController.createPlan(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Ya existe un plan con ese nombre'
      });
    });

    test('debe verificar existencia con Op.like', async () => {
      req.body = {
        nombre: 'Nuevo Plan',
        velocidad: '30MB'
      };

      Plan.findOne.mockResolvedValue(null);
      Plan.create.mockResolvedValue({ id: 5 });

      await planController.createPlan(req, res);

      expect(Plan.findOne).toHaveBeenCalledWith({
        where: { nombre: { [Op.like]: 'Nuevo Plan' } }
      });
    });

    test('debe manejar errores', async () => {
      req.body = { nombre: 'Test', velocidad: '10MB' };
      Plan.findOne.mockRejectedValue(new Error('Error'));

      await planController.createPlan(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updatePlan', () => {
    test('debe actualizar un plan existente', async () => {
      req.params = { id: '1' };
      req.body = {
        nombre: 'Básico Plus',
        velocidad: '15MB'
      };

      const mockPlan = {
        id: 1,
        nombre: 'Básico',
        velocidad: '10MB',
        update: jest.fn().mockResolvedValue(true)
      };

      Plan.findByPk.mockResolvedValue(mockPlan);
      Plan.findOne.mockResolvedValue(null);

      await planController.updatePlan(req, res);

      expect(mockPlan.update).toHaveBeenCalledWith({
        nombre: 'Básico Plus',
        velocidad: '15MB'
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'Plan actualizado correctamente',
        plan: mockPlan
      });
    });

    test('debe retornar 404 si no existe', async () => {
      req.params = { id: '999' };
      req.body = { nombre: 'Test' };

      Plan.findByPk.mockResolvedValue(null);

      await planController.updatePlan(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('debe rechazar duplicados al cambiar nombre', async () => {
      req.params = { id: '1' };
      req.body = { nombre: 'Premium' };

      Plan.findByPk.mockResolvedValue({
        id: 1,
        nombre: 'Básico',
        velocidad: '10MB'
      });
      Plan.findOne.mockResolvedValue({
        id: 2,
        nombre: 'Premium'
      });

      await planController.updatePlan(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Ya existe otro plan con ese nombre'
      });
    });

    test('debe permitir actualizar sin cambiar nombre', async () => {
      req.params = { id: '1' };
      req.body = {
        nombre: 'Básico',
        velocidad: '12MB'
      };

      const mockPlan = {
        id: 1,
        nombre: 'Básico',
        velocidad: '10MB',
        update: jest.fn()
      };

      Plan.findByPk.mockResolvedValue(mockPlan);

      await planController.updatePlan(req, res);

      expect(Plan.findOne).not.toHaveBeenCalled();
      expect(mockPlan.update).toHaveBeenCalled();
    });

    test('debe mantener valores si no se proporcionan', async () => {
      req.params = { id: '1' };
      req.body = { nombre: 'Nuevo Nombre' };

      const mockPlan = {
        id: 1,
        nombre: 'Básico',
        velocidad: '10MB',
        update: jest.fn()
      };

      Plan.findByPk.mockResolvedValue(mockPlan);
      Plan.findOne.mockResolvedValue(null);

      await planController.updatePlan(req, res);

      expect(mockPlan.update).toHaveBeenCalledWith({
        nombre: 'Nuevo Nombre',
        velocidad: '10MB'
      });
    });

    test('debe manejar errores', async () => {
      req.params = { id: '1' };
      req.body = { nombre: 'Test' };

      Plan.findByPk.mockRejectedValue(new Error('Error'));

      await planController.updatePlan(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deletePlan', () => {
    test('debe eliminar un plan sin clientes asociados', async () => {
      req.params = { id: '1' };

      const mockPlan = {
        id: 1,
        destroy: jest.fn().mockResolvedValue(true)
      };

      Plan.findByPk.mockResolvedValue(mockPlan);
      Cliente.count.mockResolvedValue(0);

      await planController.deletePlan(req, res);

      expect(mockPlan.destroy).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Plan eliminado correctamente'
      });
    });

    test('debe retornar 404 si no existe', async () => {
      req.params = { id: '999' };
      Plan.findByPk.mockResolvedValue(null);

      await planController.deletePlan(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('debe rechazar si hay clientes usando el plan', async () => {
      req.params = { id: '1' };

      Plan.findByPk.mockResolvedValue({ id: 1 });
      Cliente.count.mockResolvedValue(15);

      await planController.deletePlan(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No se puede eliminar el plan porque está siendo utilizado por 15 clientes',
        clientesAsociados: 15
      });
    });

    test('debe verificar clientes con plan_mb_id', async () => {
      req.params = { id: '3' };

      Plan.findByPk.mockResolvedValue({ id: 3 });
      Cliente.count.mockResolvedValue(0);

      await planController.deletePlan(req, res);

      expect(Cliente.count).toHaveBeenCalledWith({
        where: { plan_mb_id: '3' }
      });
    });

    test('debe manejar errores', async () => {
      req.params = { id: '1' };
      Plan.findByPk.mockRejectedValue(new Error('Error'));

      await planController.deletePlan(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});