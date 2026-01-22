// Mockear TODO antes de importar
jest.mock('../../config/db.config', () => ({
  define: jest.fn(() => ({
    belongsTo: jest.fn(),
    hasMany: jest.fn()
  }))
}));

jest.mock('../../models/tarifa.model', () => ({
  findAll: jest.fn(),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn()
}));

jest.mock('../../models/client.model', () => ({
  count: jest.fn(),
  findByPk: jest.fn()
}));

const tarifaController = require('../../controllers/tarifa.controller');
const Tarifa = require('../../models/tarifa.model');
const Cliente = require('../../models/client.model');
const { Op } = require('sequelize');

describe('Tarifa Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { query: {}, params: {}, body: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getAllTarifas', () => {
    test('debe obtener todas las tarifas ordenadas por valor', async () => {
      const mockTarifas = [
        { id: 1, valor: 15000.00 },
        { id: 2, valor: 25000.00 },
        { id: 3, valor: 35000.00 }
      ];

      Tarifa.findAll.mockResolvedValue(mockTarifas);

      await tarifaController.getAllTarifas(req, res);

      expect(Tarifa.findAll).toHaveBeenCalledWith({
        order: [['valor', 'ASC']]
      });
      expect(res.json).toHaveBeenCalledWith(mockTarifas);
    });

    test('debe retornar array vacío si no hay tarifas', async () => {
      Tarifa.findAll.mockResolvedValue([]);

      await tarifaController.getAllTarifas(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    test('debe manejar errores', async () => {
      Tarifa.findAll.mockRejectedValue(new Error('Error DB'));

      await tarifaController.getAllTarifas(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error al obtener tarifas',
        error: 'Error DB'
      });
    });
  });

  describe('getTarifaById', () => {
    test('debe obtener una tarifa por ID', async () => {
      req.params = { id: '1' };
      const mockTarifa = {
        id: 1,
        valor: 25000.00
      };

      Tarifa.findByPk.mockResolvedValue(mockTarifa);

      await tarifaController.getTarifaById(req, res);

      expect(Tarifa.findByPk).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith(mockTarifa);
    });

    test('debe retornar 404 si no existe', async () => {
      req.params = { id: '999' };
      Tarifa.findByPk.mockResolvedValue(null);

      await tarifaController.getTarifaById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Tarifa no encontrada'
      });
    });

    test('debe manejar errores', async () => {
      req.params = { id: '1' };
      Tarifa.findByPk.mockRejectedValue(new Error('Error'));

      await tarifaController.getTarifaById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createTarifa', () => {
    test('debe crear una tarifa válida', async () => {
      req.body = { valor: 30000.00 };

      Tarifa.findOne.mockResolvedValue(null);
      Tarifa.create.mockResolvedValue({
        id: 4,
        valor: 30000.00
      });

      await tarifaController.createTarifa(req, res);

      expect(Tarifa.create).toHaveBeenCalledWith({
        valor: 30000.00
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Tarifa creada correctamente',
        tarifa: expect.objectContaining({
          id: 4,
          valor: 30000.00
        })
      });
    });

    test('debe rechazar si falta el valor', async () => {
      req.body = {};

      await tarifaController.createTarifa(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'El valor es obligatorio'
      });
    });

    test('debe rechazar si el valor es null', async () => {
      req.body = { valor: null };

      await tarifaController.createTarifa(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'El valor es obligatorio'
      });
    });

    test('debe rechazar si la tarifa ya existe', async () => {
      req.body = { valor: 25000.00 };

      Tarifa.findOne.mockResolvedValue({
        id: 1,
        valor: 25000.00
      });

      await tarifaController.createTarifa(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Ya existe una tarifa con ese valor'
      });
    });

    test('debe verificar existencia por valor exacto', async () => {
      req.body = { valor: 45000.00 };

      Tarifa.findOne.mockResolvedValue(null);
      Tarifa.create.mockResolvedValue({ id: 5 });

      await tarifaController.createTarifa(req, res);

      expect(Tarifa.findOne).toHaveBeenCalledWith({
        where: { valor: 45000.00 }
      });
    });

    test('debe manejar errores', async () => {
      req.body = { valor: 20000 };
      Tarifa.findOne.mockRejectedValue(new Error('Error'));

      await tarifaController.createTarifa(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateTarifa', () => {
    test('debe actualizar una tarifa existente', async () => {
      req.params = { id: '1' };
      req.body = { valor: 28000.00 };

      const mockTarifa = {
        id: 1,
        valor: 25000.00,
        update: jest.fn().mockResolvedValue(true)
      };

      Tarifa.findByPk.mockResolvedValue(mockTarifa);
      Tarifa.findOne.mockResolvedValue(null);

      await tarifaController.updateTarifa(req, res);

      expect(mockTarifa.update).toHaveBeenCalledWith({
        valor: 28000.00
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'Tarifa actualizada correctamente',
        tarifa: mockTarifa
      });
    });

    test('debe retornar 404 si no existe', async () => {
      req.params = { id: '999' };
      req.body = { valor: 20000 };

      Tarifa.findByPk.mockResolvedValue(null);

      await tarifaController.updateTarifa(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('debe rechazar si falta el valor', async () => {
      req.params = { id: '1' };
      req.body = {};

      Tarifa.findByPk.mockResolvedValue({ id: 1, valor: 25000 });

      await tarifaController.updateTarifa(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'El valor es obligatorio'
      });
    });

    test('debe rechazar si valor es null', async () => {
      req.params = { id: '1' };
      req.body = { valor: null };

      Tarifa.findByPk.mockResolvedValue({ id: 1 });

      await tarifaController.updateTarifa(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('debe rechazar duplicados al cambiar valor', async () => {
      req.params = { id: '1' };
      req.body = { valor: 35000.00 };

      Tarifa.findByPk.mockResolvedValue({
        id: 1,
        valor: 25000.00
      });
      Tarifa.findOne.mockResolvedValue({
        id: 2,
        valor: 35000.00
      });

      await tarifaController.updateTarifa(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Ya existe otra tarifa con ese valor'
      });
    });

    test('debe verificar duplicados excluyendo ID actual', async () => {
      req.params = { id: '1' };
      req.body = { valor: 40000.00 };

      Tarifa.findByPk.mockResolvedValue({
        id: 1,
        valor: 25000,
        update: jest.fn()
      });
      Tarifa.findOne.mockResolvedValue(null);

      await tarifaController.updateTarifa(req, res);

      expect(Tarifa.findOne).toHaveBeenCalledWith({
        where: {
          valor: 40000.00,
          id: { [Op.ne]: '1' }
        }
      });
    });

    test('debe manejar errores', async () => {
      req.params = { id: '1' };
      req.body = { valor: 20000 };

      Tarifa.findByPk.mockRejectedValue(new Error('Error'));

      await tarifaController.updateTarifa(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteTarifa', () => {
    test('debe eliminar una tarifa sin clientes asociados', async () => {
      req.params = { id: '1' };

      const mockTarifa = {
        id: 1,
        destroy: jest.fn().mockResolvedValue(true)
      };

      Tarifa.findByPk.mockResolvedValue(mockTarifa);
      Cliente.count.mockResolvedValue(0);

      await tarifaController.deleteTarifa(req, res);

      expect(mockTarifa.destroy).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Tarifa eliminada correctamente'
      });
    });

    test('debe retornar 404 si no existe', async () => {
      req.params = { id: '999' };
      Tarifa.findByPk.mockResolvedValue(null);

      await tarifaController.deleteTarifa(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('debe rechazar si hay clientes usando la tarifa', async () => {
      req.params = { id: '1' };

      Tarifa.findByPk.mockResolvedValue({ id: 1 });
      Cliente.count.mockResolvedValue(30);

      await tarifaController.deleteTarifa(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No se puede eliminar la tarifa porque está siendo utilizada por 30 clientes',
        clientesAsociados: 30
      });
    });

    test('debe verificar clientes con tarifa_id', async () => {
      req.params = { id: '3' };

      Tarifa.findByPk.mockResolvedValue({ id: 3 });
      Cliente.count.mockResolvedValue(0);

      await tarifaController.deleteTarifa(req, res);

      expect(Cliente.count).toHaveBeenCalledWith({
        where: { tarifa_id: '3' }
      });
    });

    test('debe manejar errores', async () => {
      req.params = { id: '1' };
      Tarifa.findByPk.mockRejectedValue(new Error('Error'));

      await tarifaController.deleteTarifa(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getTarifaCliente', () => {
    test('debe obtener tarifa de un cliente', async () => {
      req.params = { clienteId: '1' };

      const mockCliente = {
        id: 1,
        nombre: 'Juan Pérez',
        tarifa: {
          id: 2,
          valor: 25000.00
        }
      };

      Cliente.findByPk.mockResolvedValue(mockCliente);

      await tarifaController.getTarifaCliente(req, res);

      expect(Cliente.findByPk).toHaveBeenCalledWith('1', {
        include: [
          {
            model: Tarifa,
            as: 'tarifa'
          }
        ]
      });
      expect(res.json).toHaveBeenCalledWith(mockCliente.tarifa);
    });

    test('debe retornar 404 si cliente no existe', async () => {
      req.params = { clienteId: '999' };

      Cliente.findByPk.mockResolvedValue(null);

      await tarifaController.getTarifaCliente(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Tarifa del cliente no encontrada'
      });
    });

    test('debe retornar 404 si cliente no tiene tarifa', async () => {
      req.params = { clienteId: '1' };

      Cliente.findByPk.mockResolvedValue({
        id: 1,
        nombre: 'Juan Pérez',
        tarifa: null
      });

      await tarifaController.getTarifaCliente(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Tarifa del cliente no encontrada'
      });
    });

    test('debe manejar errores', async () => {
      req.params = { clienteId: '1' };

      Cliente.findByPk.mockRejectedValue(new Error('Error'));

      await tarifaController.getTarifaCliente(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error interno del servidor',
        error: 'Error'
      });
    });
  });
});