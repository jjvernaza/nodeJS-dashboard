// Mockear TODO antes de importar
jest.mock('../../config/db.config', () => ({
  define: jest.fn(() => ({
    belongsTo: jest.fn(),
    hasMany: jest.fn()
  }))
}));

jest.mock('../../models/service_type.model', () => ({
  findAll: jest.fn(),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn()
}));

jest.mock('../../models/client.model', () => ({
  count: jest.fn(),
  findAll: jest.fn(),
  sum: jest.fn()
}));

jest.mock('../../models/estado.model', () => ({
  findAll: jest.fn()
}));

jest.mock('../../models/payment.model', () => ({
  sum: jest.fn()
}));

jest.mock('../../models/sector.model', () => ({}));
jest.mock('../../models/tarifa.model', () => ({}));

const serviceController = require('../../controllers/service.controller');
const TipoServicio = require('../../models/service_type.model');
const Cliente = require('../../models/client.model');
const Estado = require('../../models/estado.model');
const Pago = require('../../models/payment.model');
const { Op } = require('sequelize');

describe('Service Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { query: {}, params: {}, body: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getTiposServicio', () => {
    test('debe obtener todos los tipos de servicio', async () => {
      const mockTipos = [
        { ID: 1, Tipo: 'Fibra Óptica' },
        { ID: 2, Tipo: 'Internet Inalámbrico' },
        { ID: 3, Tipo: 'ADSL' }
      ];

      TipoServicio.findAll.mockResolvedValue(mockTipos);

      await serviceController.getTiposServicio(req, res);

      expect(TipoServicio.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockTipos);
    });

    test('debe retornar array vacío si no hay tipos', async () => {
      TipoServicio.findAll.mockResolvedValue([]);

      await serviceController.getTiposServicio(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    test('debe manejar errores', async () => {
      TipoServicio.findAll.mockRejectedValue(new Error('Error DB'));

      await serviceController.getTiposServicio(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error al obtener tipos de servicio',
        error: 'Error DB'
      });
    });
  });

  describe('getTipoServicioById', () => {
    test('debe obtener un tipo de servicio por ID', async () => {
      req.params = { id: '1' };
      const mockTipo = {
        ID: 1,
        Tipo: 'Fibra Óptica'
      };

      TipoServicio.findByPk.mockResolvedValue(mockTipo);

      await serviceController.getTipoServicioById(req, res);

      expect(TipoServicio.findByPk).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith(mockTipo);
    });

    test('debe retornar 404 si no existe', async () => {
      req.params = { id: '999' };
      TipoServicio.findByPk.mockResolvedValue(null);

      await serviceController.getTipoServicioById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Tipo de servicio no encontrado'
      });
    });

    test('debe manejar errores', async () => {
      req.params = { id: '1' };
      TipoServicio.findByPk.mockRejectedValue(new Error('Error'));

      await serviceController.getTipoServicioById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createTipoServicio', () => {
    test('debe crear un tipo de servicio válido', async () => {
      req.body = { Tipo: 'Fibra 100MB' };

      TipoServicio.findOne.mockResolvedValue(null);
      TipoServicio.create.mockResolvedValue({
        ID: 4,
        Tipo: 'Fibra 100MB'
      });

      await serviceController.createTipoServicio(req, res);

      expect(TipoServicio.create).toHaveBeenCalledWith({
        Tipo: 'Fibra 100MB'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Tipo de servicio creado correctamente',
        tipoServicio: expect.objectContaining({
          ID: 4,
          Tipo: 'Fibra 100MB'
        })
      });
    });

    test('debe rechazar si falta el Tipo', async () => {
      req.body = {};

      await serviceController.createTipoServicio(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'El campo Tipo es obligatorio'
      });
    });

    test('debe rechazar si el tipo ya existe', async () => {
      req.body = { Tipo: 'Fibra Óptica' };

      TipoServicio.findOne.mockResolvedValue({
        ID: 1,
        Tipo: 'Fibra Óptica'
      });

      await serviceController.createTipoServicio(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Ya existe un tipo de servicio con ese nombre'
      });
    });

    test('debe verificar existencia con Op.like', async () => {
      req.body = { Tipo: 'Nuevo Servicio' };

      TipoServicio.findOne.mockResolvedValue(null);
      TipoServicio.create.mockResolvedValue({ ID: 5 });

      await serviceController.createTipoServicio(req, res);

      expect(TipoServicio.findOne).toHaveBeenCalledWith({
        where: { Tipo: { [Op.like]: 'Nuevo Servicio' } }
      });
    });

    test('debe manejar errores', async () => {
      req.body = { Tipo: 'Test' };
      TipoServicio.findOne.mockRejectedValue(new Error('Error'));

      await serviceController.createTipoServicio(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateTipoServicio', () => {
    test('debe actualizar un tipo de servicio existente', async () => {
      req.params = { id: '1' };
      req.body = { Tipo: 'Fibra Premium' };

      const mockTipo = {
        ID: 1,
        Tipo: 'Fibra Óptica',
        update: jest.fn().mockResolvedValue(true)
      };

      TipoServicio.findByPk.mockResolvedValue(mockTipo);
      TipoServicio.findOne.mockResolvedValue(null);

      await serviceController.updateTipoServicio(req, res);

      expect(mockTipo.update).toHaveBeenCalledWith({
        Tipo: 'Fibra Premium'
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'Tipo de servicio actualizado correctamente',
        tipoServicio: mockTipo
      });
    });

    test('debe retornar 404 si no existe', async () => {
      req.params = { id: '999' };
      req.body = { Tipo: 'Test' };

      TipoServicio.findByPk.mockResolvedValue(null);

      await serviceController.updateTipoServicio(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('debe rechazar si falta el Tipo', async () => {
      req.params = { id: '1' };
      req.body = {};

      TipoServicio.findByPk.mockResolvedValue({ ID: 1 });

      await serviceController.updateTipoServicio(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'El campo Tipo es obligatorio'
      });
    });

    test('debe rechazar duplicados al cambiar nombre', async () => {
      req.params = { id: '1' };
      req.body = { Tipo: 'ADSL' };

      TipoServicio.findByPk.mockResolvedValue({
        ID: 1,
        Tipo: 'Fibra Óptica'
      });
      TipoServicio.findOne.mockResolvedValue({
        ID: 2,
        Tipo: 'ADSL'
      });

      await serviceController.updateTipoServicio(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Ya existe otro tipo de servicio con ese nombre'
      });
    });

    test('debe verificar duplicados excluyendo ID actual', async () => {
      req.params = { id: '1' };
      req.body = { Tipo: 'Cable' };

      TipoServicio.findByPk.mockResolvedValue({
        ID: 1,
        Tipo: 'Fibra',
        update: jest.fn()
      });
      TipoServicio.findOne.mockResolvedValue(null);

      await serviceController.updateTipoServicio(req, res);

      expect(TipoServicio.findOne).toHaveBeenCalledWith({
        where: {
          Tipo: { [Op.like]: 'Cable' },
          ID: { [Op.ne]: '1' }
        }
      });
    });

    test('debe manejar errores', async () => {
      req.params = { id: '1' };
      req.body = { Tipo: 'Test' };

      TipoServicio.findByPk.mockRejectedValue(new Error('Error'));

      await serviceController.updateTipoServicio(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteTipoServicio', () => {
    test('debe eliminar un tipo sin clientes asociados', async () => {
      req.params = { id: '1' };

      const mockTipo = {
        ID: 1,
        destroy: jest.fn().mockResolvedValue(true)
      };

      TipoServicio.findByPk.mockResolvedValue(mockTipo);
      Cliente.count.mockResolvedValue(0);

      await serviceController.deleteTipoServicio(req, res);

      expect(mockTipo.destroy).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Tipo de servicio eliminado correctamente'
      });
    });

    test('debe retornar 404 si no existe', async () => {
      req.params = { id: '999' };
      TipoServicio.findByPk.mockResolvedValue(null);

      await serviceController.deleteTipoServicio(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('debe rechazar si hay clientes usando el tipo', async () => {
      req.params = { id: '1' };

      TipoServicio.findByPk.mockResolvedValue({ ID: 1 });
      Cliente.count.mockResolvedValue(15);

      await serviceController.deleteTipoServicio(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No se puede eliminar el tipo de servicio porque está siendo utilizado por 15 clientes',
        clientesAsociados: 15
      });
    });

    test('debe verificar clientes con TipoServicioID', async () => {
      req.params = { id: '3' };

      TipoServicio.findByPk.mockResolvedValue({ ID: 3 });
      Cliente.count.mockResolvedValue(0);

      await serviceController.deleteTipoServicio(req, res);

      expect(Cliente.count).toHaveBeenCalledWith({
        where: { TipoServicioID: '3' }
      });
    });

    test('debe manejar errores', async () => {
      req.params = { id: '1' };
      TipoServicio.findByPk.mockRejectedValue(new Error('Error'));

      await serviceController.deleteTipoServicio(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getDashboardStats', () => {
    test('debe obtener estadísticas básicas del dashboard', async () => {
      Cliente.findAll
        .mockResolvedValueOnce([
          {
            EstadoID: 1,
            estado: { ID: 1, Estado: 'activo' },
            dataValues: { cantidad: '50' }
          },
          {
            EstadoID: 2,
            estado: { ID: 2, Estado: 'suspendido' },
            dataValues: { cantidad: '10' }
          }
        ])
        .mockResolvedValueOnce([
          {
            TipoServicioID: 1,
            tipoServicio: { ID: 1, Tipo: 'Fibra' },
            dataValues: { cantidad: '30' }
          }
        ])
        .mockResolvedValueOnce([
          {
            sector_id: 1,
            sector: { id: 1, nombre: 'Norte' },
            dataValues: { cantidad: '25' }
          }
        ]);

      Pago.sum.mockResolvedValue(50000);

      await serviceController.getDashboardStats(req, res);

      expect(Cliente.findAll).toHaveBeenCalled();
      expect(Pago.sum).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          clientes: expect.any(Object),
          servicios: expect.any(Array),
          sectores: expect.any(Array),
          pagos: expect.any(Object)
        })
      );
    });

    test('debe calcular correctamente clientes activos', async () => {
      Cliente.findAll
        .mockResolvedValueOnce([
          {
            EstadoID: 1,
            estado: { ID: 1, Estado: 'activo' },
            dataValues: { cantidad: '30' }
          },
          {
            EstadoID: 2,
            estado: { ID: 2, Estado: 'convenio' },
            dataValues: { cantidad: '20' }
          }
        ])
        .mockResolvedValue([]);

      Pago.sum.mockResolvedValue(0);

      await serviceController.getDashboardStats(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.clientes.activos).toBe(50);
      expect(response.clientes.total).toBe(50);
    });

    test('debe manejar errores en dashboard', async () => {
      Cliente.findAll.mockRejectedValue(new Error('Error DB'));

      await serviceController.getDashboardStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error al obtener estadísticas del dashboard'
        })
      );
    });
  });

  describe('getEstadosDebug', () => {
    test('debe obtener información de debug de estados', async () => {
      Estado.findAll.mockResolvedValue([
        { ID: 1, Estado: 'activo' },
        { ID: 2, Estado: 'suspendido' }
      ]);

      Cliente.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(60);

      await serviceController.getEstadosDebug(req, res);

      expect(Estado.findAll).toHaveBeenCalled();
      expect(Cliente.count).toHaveBeenCalledTimes(3);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Estados encontrados en la base de datos',
          estados: expect.any(Array),
          totalClientes: 60
        })
      );
    });

    test('debe manejar errores en debug', async () => {
      Estado.findAll.mockRejectedValue(new Error('Error'));

      await serviceController.getEstadosDebug(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});