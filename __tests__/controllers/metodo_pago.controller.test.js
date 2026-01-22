// Mockear TODO antes de importar
jest.mock('../../config/db.config', () => ({
  define: jest.fn(() => ({
    belongsTo: jest.fn(),
    hasMany: jest.fn()
  }))
}));

jest.mock('../../models/metodo_pago.model', () => ({
  findAll: jest.fn(),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn()
}));

const metodoPagoController = require('../../controllers/metodo_pago.controller');
const MetodoDePago = require('../../models/metodo_pago.model');
const { Op } = require('sequelize');

describe('Metodo Pago Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { query: {}, params: {}, body: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getAllMetodosPago', () => {
    test('debe obtener todos los métodos de pago', async () => {
      const mockMetodos = [
        { ID: 1, Metodo: 'Efectivo' },
        { ID: 2, Metodo: 'Transferencia' },
        { ID: 3, Metodo: 'Nequi' }
      ];

      MetodoDePago.findAll.mockResolvedValue(mockMetodos);

      await metodoPagoController.getAllMetodosPago(req, res);

      expect(MetodoDePago.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockMetodos);
    });

    test('debe retornar array vacío si no hay métodos', async () => {
      MetodoDePago.findAll.mockResolvedValue([]);

      await metodoPagoController.getAllMetodosPago(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    test('debe manejar errores', async () => {
      MetodoDePago.findAll.mockRejectedValue(new Error('Error DB'));

      await metodoPagoController.getAllMetodosPago(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error al obtener métodos de pago',
        error: 'Error DB'
      });
    });
  });

  describe('getMetodoPagoById', () => {
    test('debe obtener un método de pago por ID', async () => {
      req.params = { id: '1' };
      const mockMetodo = { ID: 1, Metodo: 'Efectivo' };

      MetodoDePago.findByPk.mockResolvedValue(mockMetodo);

      await metodoPagoController.getMetodoPagoById(req, res);

      expect(MetodoDePago.findByPk).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith(mockMetodo);
    });

    test('debe retornar 404 si no existe', async () => {
      req.params = { id: '999' };
      MetodoDePago.findByPk.mockResolvedValue(null);

      await metodoPagoController.getMetodoPagoById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Método de pago no encontrado'
      });
    });

    test('debe manejar errores', async () => {
      req.params = { id: '1' };
      MetodoDePago.findByPk.mockRejectedValue(new Error('Error'));

      await metodoPagoController.getMetodoPagoById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createMetodoPago', () => {
    test('debe crear un método de pago válido', async () => {
      req.body = { Metodo: 'Tarjeta Débito' };

      MetodoDePago.findOne.mockResolvedValue(null);
      MetodoDePago.create.mockResolvedValue({
        ID: 4,
        Metodo: 'Tarjeta Débito'
      });

      await metodoPagoController.createMetodoPago(req, res);

      expect(MetodoDePago.create).toHaveBeenCalledWith({
        Metodo: 'Tarjeta Débito'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Método de pago creado correctamente',
        id: 4
      });
    });

    test('debe rechazar si falta el campo Metodo', async () => {
      req.body = {};

      await metodoPagoController.createMetodoPago(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'El campo Metodo es obligatorio'
      });
    });

    test('debe rechazar si el método ya existe', async () => {
      req.body = { Metodo: 'Efectivo' };

      MetodoDePago.findOne.mockResolvedValue({
        ID: 1,
        Metodo: 'Efectivo'
      });

      await metodoPagoController.createMetodoPago(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Ya existe un método de pago con ese nombre'
      });
    });

    test('debe verificar existencia con findOne', async () => {
      req.body = { Metodo: 'Nuevo Método' };

      MetodoDePago.findOne.mockResolvedValue(null);
      MetodoDePago.create.mockResolvedValue({ ID: 5 });

      await metodoPagoController.createMetodoPago(req, res);

      expect(MetodoDePago.findOne).toHaveBeenCalledWith({
        where: { Metodo: 'Nuevo Método' }
      });
    });

    test('debe manejar errores', async () => {
      req.body = { Metodo: 'Test' };
      MetodoDePago.findOne.mockRejectedValue(new Error('Error'));

      await metodoPagoController.createMetodoPago(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateMetodoPago', () => {
    test('debe actualizar un método de pago existente', async () => {
      req.params = { id: '1' };
      req.body = { Metodo: 'Efectivo Actualizado' };

      const mockMetodo = {
        ID: 1,
        Metodo: 'Efectivo',
        update: jest.fn().mockResolvedValue(true)
      };

      MetodoDePago.findByPk.mockResolvedValue(mockMetodo);
      MetodoDePago.findOne.mockResolvedValue(null);

      await metodoPagoController.updateMetodoPago(req, res);

      expect(mockMetodo.update).toHaveBeenCalledWith({
        Metodo: 'Efectivo Actualizado'
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'Método de pago actualizado correctamente',
        metodoPago: mockMetodo
      });
    });

    test('debe retornar 404 si no existe', async () => {
      req.params = { id: '999' };
      req.body = { Metodo: 'Test' };

      MetodoDePago.findByPk.mockResolvedValue(null);

      await metodoPagoController.updateMetodoPago(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('debe rechazar si falta el campo Metodo', async () => {
      req.params = { id: '1' };
      req.body = {};

      MetodoDePago.findByPk.mockResolvedValue({ ID: 1 });

      await metodoPagoController.updateMetodoPago(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('debe rechazar duplicados excluyendo el actual', async () => {
      req.params = { id: '1' };
      req.body = { Metodo: 'Transferencia' };

      MetodoDePago.findByPk.mockResolvedValue({
        ID: 1,
        Metodo: 'Efectivo'
      });
      MetodoDePago.findOne.mockResolvedValue({
        ID: 2,
        Metodo: 'Transferencia'
      });

      await metodoPagoController.updateMetodoPago(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Ya existe otro método de pago con ese nombre'
      });
    });

    test('debe verificar duplicados con Op.ne', async () => {
      req.params = { id: '1' };
      req.body = { Metodo: 'Test' };

      MetodoDePago.findByPk.mockResolvedValue({
        ID: 1,
        update: jest.fn()
      });
      MetodoDePago.findOne.mockResolvedValue(null);

      await metodoPagoController.updateMetodoPago(req, res);

      expect(MetodoDePago.findOne).toHaveBeenCalledWith({
        where: {
          Metodo: 'Test',
          ID: { [Op.ne]: '1' }
        }
      });
    });

    test('debe manejar errores', async () => {
      req.params = { id: '1' };
      req.body = { Metodo: 'Test' };

      MetodoDePago.findByPk.mockRejectedValue(new Error('Error'));

      await metodoPagoController.updateMetodoPago(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteMetodoPago', () => {
    test('debe eliminar un método de pago', async () => {
      req.params = { id: '1' };

      const mockMetodo = {
        ID: 1,
        destroy: jest.fn().mockResolvedValue(true)
      };

      MetodoDePago.findByPk.mockResolvedValue(mockMetodo);

      await metodoPagoController.deleteMetodoPago(req, res);

      expect(mockMetodo.destroy).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Método de pago eliminado correctamente'
      });
    });

    test('debe retornar 404 si no existe', async () => {
      req.params = { id: '999' };
      MetodoDePago.findByPk.mockResolvedValue(null);

      await metodoPagoController.deleteMetodoPago(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('debe manejar errores', async () => {
      req.params = { id: '1' };
      MetodoDePago.findByPk.mockRejectedValue(new Error('Error'));

      await metodoPagoController.deleteMetodoPago(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});