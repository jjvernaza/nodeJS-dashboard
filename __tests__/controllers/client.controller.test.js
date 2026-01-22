// Mockear TODO antes de importar
jest.mock('../../config/db.config', () => ({
  define: jest.fn(() => ({
    belongsTo: jest.fn(),
    hasMany: jest.fn()
  })),
  fn: jest.fn(),
  col: jest.fn(),
  where: jest.fn()
}));

jest.mock('../../models/estado.model', () => ({
  findByPk: jest.fn(),
  findAll: jest.fn()
}));

jest.mock('../../models/service_type.model', () => ({
  findByPk: jest.fn(),
  findAll: jest.fn()
}));

jest.mock('../../models/plan_mb.model', () => ({
  findByPk: jest.fn(),
  findAll: jest.fn()
}));

jest.mock('../../models/sector.model', () => ({
  findByPk: jest.fn(),
  findAll: jest.fn()
}));

jest.mock('../../models/tarifa.model', () => ({
  findByPk: jest.fn(),
  findAll: jest.fn()
}));

jest.mock('../../models/client.model', () => ({
  findAll: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  belongsTo: jest.fn()
}));

jest.mock('../../models/payment.model', () => ({
  findAll: jest.fn(),
  findByPk: jest.fn()
}));

jest.mock('xlsx');

const clientController = require('../../controllers/client.controller');
const Cliente = require('../../models/client.model');
const Pago = require('../../models/payment.model');
const TipoServicio = require('../../models/service_type.model');
const Estado = require('../../models/estado.model');
const Plan = require('../../models/plan_mb.model');
const Sector = require('../../models/sector.model');
const Tarifa = require('../../models/tarifa.model');
const XLSX = require('xlsx');

describe('Client Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { query: {}, params: {}, body: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      setHeader: jest.fn()
    };
    
    // Mock de sequelize para CONCAT
    global.sequelize = {
      fn: jest.fn(),
      col: jest.fn(),
      where: jest.fn()
    };
    
    jest.clearAllMocks();
  });

  describe('obtenerMorosos', () => {
    test('debe obtener clientes morosos', async () => {
      const mockCliente = {
        ID: 1,
        NombreCliente: 'Juan',
        ApellidoCliente: 'Pérez',
        Telefono: '123456',
        Ubicacion: 'Cali',
        Cedula: '123456789',
        FechaInstalacion: new Date('2024-01-01'),
        EstadoID: 1,
        tarifa: { valor: 50000 },
        tipoServicio: { Tipo: 'Internet' },
        sector: { nombre: 'Norte' }
      };

      Cliente.findAll.mockResolvedValue([mockCliente]);
      Pago.findAll.mockResolvedValue([]);

      await clientController.obtenerMorosos(req, res);

      expect(Cliente.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    test('debe filtrar por meses mínimos', async () => {
      req.query = { meses: '6' };
      Cliente.findAll.mockResolvedValue([]);

      await clientController.obtenerMorosos(req, res);

      expect(Cliente.findAll).toHaveBeenCalled();
    });

    test('debe manejar errores', async () => {
      Cliente.findAll.mockRejectedValue(new Error('Error'));

      await clientController.obtenerMorosos(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('addCliente', () => {
    test('debe crear un cliente válido', async () => {
      req.body = {
        NombreCliente: 'Pedro',
        ApellidoCliente: 'García',
        plan_mb_id: 1,
        FechaInstalacion: '2024-01-15',
        EstadoID: 1,
        tarifa_id: 1,
        sector_id: 1,
        IPAddress: '192.168.1.100',
        Telefono: '3001234567',
        Ubicacion: 'Calle 10',
        Cedula: '987654321',
        TipoServicioID: 1
      };

      Estado.findByPk.mockResolvedValue({ ID: 1 });
      TipoServicio.findByPk.mockResolvedValue({ ID: 1 });
      Plan.findByPk.mockResolvedValue({ id: 1 });
      Sector.findByPk.mockResolvedValue({ id: 1 });
      Tarifa.findByPk.mockResolvedValue({ id: 1 });
      Cliente.create.mockResolvedValue({ ID: 1 });

      await clientController.addCliente(req, res);

      expect(Cliente.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('debe rechazar si faltan campos', async () => {
      req.body = { NombreCliente: 'Pedro' };

      await clientController.addCliente(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('debe validar EstadoID', async () => {
      req.body = {
        NombreCliente: 'Pedro',
        ApellidoCliente: 'García',
        plan_mb_id: 1,
        FechaInstalacion: '2024-01-15',
        EstadoID: 999,
        tarifa_id: 1,
        sector_id: 1,
        IPAddress: '192.168.1.100',
        Telefono: '3001234567',
        Ubicacion: 'Calle 10',
        Cedula: '123',
        TipoServicioID: 1
      };

      Estado.findByPk.mockResolvedValue(null);

      await clientController.addCliente(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('debe manejar errores', async () => {
      req.body = {
        NombreCliente: 'Pedro',
        ApellidoCliente: 'García',
        plan_mb_id: 1,
        FechaInstalacion: '2024-01-15',
        EstadoID: 1,
        tarifa_id: 1,
        sector_id: 1,
        IPAddress: '192.168.1.100',
        Telefono: '3001234567',
        Ubicacion: 'Calle 10',
        Cedula: '123',
        TipoServicioID: 1
      };

      Estado.findByPk.mockRejectedValue(new Error('Error'));

      await clientController.addCliente(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('searchClient', () => {
    test('debe buscar clientes', async () => {
      req.query = { nombre: 'Juan' };
      Cliente.findAll.mockResolvedValue([
        { ID: 1, NombreCliente: 'Juan', ApellidoCliente: 'Pérez' }
      ]);

      await clientController.searchClient(req, res);

      expect(Cliente.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    test('debe rechazar búsqueda vacía', async () => {
      req.query = { nombre: '' };

      await clientController.searchClient(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('debe rechazar búsqueda sin parámetro', async () => {
      req.query = {};

      await clientController.searchClient(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('debe retornar 404 si no encuentra', async () => {
      req.query = { nombre: 'NoExiste' };
      Cliente.findAll.mockResolvedValue([]);

      await clientController.searchClient(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('debe manejar errores', async () => {
      req.query = { nombre: 'Juan' };
      Cliente.findAll.mockRejectedValue(new Error('Error'));

      await clientController.searchClient(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateClient', () => {
    test('debe actualizar cliente', async () => {
      req.params = { id: '1' };
      req.body = { Telefono: '3009876543' };

      const mockCliente = {
        ID: 1,
        update: jest.fn().mockResolvedValue(true)
      };

      Cliente.findByPk.mockResolvedValue(mockCliente);

      await clientController.updateClient(req, res);

      expect(mockCliente.update).toHaveBeenCalled();
    });

    test('debe retornar 404 si no existe', async () => {
      req.params = { id: '999' };
      Cliente.findByPk.mockResolvedValue(null);

      await clientController.updateClient(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('debe validar EstadoID en actualización', async () => {
      req.params = { id: '1' };
      req.body = { EstadoID: 999 };

      Cliente.findByPk.mockResolvedValue({ ID: 1, update: jest.fn() });
      Estado.findByPk.mockResolvedValue(null);

      await clientController.updateClient(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('debe manejar errores', async () => {
      req.params = { id: '1' };
      Cliente.findByPk.mockRejectedValue(new Error('Error'));

      await clientController.updateClient(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteClient', () => {
    test('debe eliminar cliente', async () => {
      req.params = { id: '1' };
      const mockCliente = {
        destroy: jest.fn().mockResolvedValue(true)
      };

      Cliente.findByPk.mockResolvedValue(mockCliente);

      await clientController.deleteClient(req, res);

      expect(mockCliente.destroy).toHaveBeenCalled();
    });

    test('debe retornar 404 si no existe', async () => {
      req.params = { id: '999' };
      Cliente.findByPk.mockResolvedValue(null);

      await clientController.deleteClient(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('deve manejar errores', async () => {
      req.params = { id: '1' };
      Cliente.findByPk.mockRejectedValue(new Error('Error'));

      await clientController.deleteClient(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAllClients', () => {
    test('debe obtener todos los clientes', async () => {
      Cliente.findAll.mockResolvedValue([
        { ID: 1, NombreCliente: 'Juan' },
        { ID: 2, NombreCliente: 'Ana' }
      ]);

      await clientController.getAllClients(req, res);

      expect(Cliente.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    test('debe manejar errores', async () => {
      Cliente.findAll.mockRejectedValue(new Error('Error'));

      await clientController.getAllClients(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('exportClientsToExcel', () => {
    beforeEach(() => {
      XLSX.utils = {
        book_new: jest.fn(() => ({})),
        json_to_sheet: jest.fn(() => ({ '!cols': [] })),
        book_append_sheet: jest.fn()
      };
      XLSX.write = jest.fn(() => Buffer.from('test'));
    });

    test('debe exportar clientes a Excel', async () => {
      Cliente.findAll.mockResolvedValue([
        {
          ID: 1,
          NombreCliente: 'Juan',
          ApellidoCliente: 'Pérez',
          Cedula: '123',
          FechaInstalacion: new Date(),
          IPAddress: '192.168.1.1',
          Telefono: '300123',
          Ubicacion: 'Cali',
          plan: { nombre: 'Básico', velocidad: '10MB' },
          tipoServicio: { Tipo: 'Internet' },
          tarifa: { valor: 50000 },
          sector: { nombre: 'Norte' },
          estado: { Estado: 'Activo' }
        }
      ]);

      await clientController.exportClientsToExcel(req, res);

      expect(res.setHeader).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalled();
    });

    test('debe manejar errores', async () => {
      Cliente.findAll.mockRejectedValue(new Error('Error'));

      await clientController.exportClientsToExcel(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('exportMorososToExcel', () => {
    beforeEach(() => {
      XLSX.utils = {
        book_new: jest.fn(() => ({})),
        json_to_sheet: jest.fn(() => ({ '!cols': [] })),
        book_append_sheet: jest.fn()
      };
      XLSX.write = jest.fn(() => Buffer.from('test'));
    });

    test('debe exportar morosos a Excel', async () => {
      Cliente.findAll.mockResolvedValue([]);
      Pago.findAll.mockResolvedValue([]);

      await clientController.exportMorososToExcel(req, res);

      expect(res.setHeader).toHaveBeenCalled();
    });

    test('debe manejar errores', async () => {
      Cliente.findAll.mockRejectedValue(new Error('Error'));

      await clientController.exportMorososToExcel(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});