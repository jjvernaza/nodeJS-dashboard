// Mockear TODO antes de importar
jest.mock('../../config/db.config', () => ({
  define: jest.fn(() => ({
    belongsTo: jest.fn(),
    hasMany: jest.fn()
  })),
  fn: jest.fn(),
  col: jest.fn()
}));

// Mock de moment ANTES de cualquier otro mock
jest.mock('moment', () => {
  const actualMoment = jest.requireActual('moment');
  return jest.fn((date, formats) => {
    if (!date) return actualMoment();
    const m = actualMoment(date, formats);
    return {
      ...m,
      format: jest.fn((format) => {
        if (format === 'YYYY-MM-DD') {
          return '2024-01-15';
        }
        return m.format(format);
      })
    };
  });
});

jest.mock('../../models/payment.model', () => ({
  findAll: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  sequelize: {
    fn: jest.fn(),
    col: jest.fn()
  }
}));

jest.mock('../../models/client.model', () => ({
  findByPk: jest.fn(),
  findAll: jest.fn()
}));

jest.mock('../../models/metodo_pago.model', () => ({
  findByPk: jest.fn(),
  findAll: jest.fn()
}));

jest.mock('../../models/tarifa.model', () => ({
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

jest.mock('../../models/estado.model', () => ({
  findByPk: jest.fn(),
  findAll: jest.fn()
}));

jest.mock('xlsx');

const paymentController = require('../../controllers/payment.controller');
const Pago = require('../../models/payment.model');
const Cliente = require('../../models/client.model');
const MetodoDePago = require('../../models/metodo_pago.model');
const XLSX = require('xlsx');

describe('Payment Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { query: {}, params: {}, body: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      setHeader: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('addPayment', () => {
    test('debe crear un pago válido', async () => {
      req.body = {
        ClienteID: 1,
        FechaPago: '2024-01-15',
        Mes: 'ENERO',
        Ano: 2024,
        Monto: 50000,
        Metodo_de_PagoID: 1
      };

      const mockCliente = {
        ID: 1,
        tarifa: { valor: 50000 },
        plan: { id: 1, nombre: 'Básico', velocidad: '10MB' },
        plan_mb_id: 1,
        tarifa_id: 1
      };

      Cliente.findByPk.mockResolvedValue(mockCliente);
      MetodoDePago.findByPk.mockResolvedValue({ ID: 1, Metodo: 'Efectivo' });
      Pago.create.mockResolvedValue({ ID: 1, ...req.body });

      await paymentController.addPayment(req, res);

      expect(Pago.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('debe usar tarifa del cliente si no se proporciona monto', async () => {
      req.body = {
        ClienteID: 1,
        FechaPago: '2024-01-15',
        Mes: 'ENERO',
        Ano: 2024,
        Metodo_de_PagoID: 1
      };

      const mockCliente = {
        ID: 1,
        tarifa: { valor: 50000 },
        plan: { velocidad: '10MB' },
        plan_mb_id: 1,
        tarifa_id: 1
      };

      Cliente.findByPk.mockResolvedValue(mockCliente);
      MetodoDePago.findByPk.mockResolvedValue({ ID: 1 });
      Pago.create.mockResolvedValue({ ID: 1 });

      await paymentController.addPayment(req, res);

      expect(Pago.create).toHaveBeenCalledWith(
        expect.objectContaining({
          Monto: 50000
        })
      );
    });

    test('debe retornar 404 si cliente no existe', async () => {
      req.body = { ClienteID: 999 };
      Cliente.findByPk.mockResolvedValue(null);

      await paymentController.addPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('debe retornar 404 si método de pago no existe', async () => {
      req.body = {
        ClienteID: 1,
        Metodo_de_PagoID: 999
      };

      Cliente.findByPk.mockResolvedValue({ ID: 1, tarifa: { valor: 50000 } });
      MetodoDePago.findByPk.mockResolvedValue(null);

      await paymentController.addPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('debe retornar 400 si no hay monto', async () => {
      req.body = {
        ClienteID: 1,
        Metodo_de_PagoID: 1
      };

      Cliente.findByPk.mockResolvedValue({ ID: 1 });
      MetodoDePago.findByPk.mockResolvedValue({ ID: 1 });

      await paymentController.addPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('debe manejar errores', async () => {
      req.body = { ClienteID: 1 };
      Cliente.findByPk.mockRejectedValue(new Error('Error'));

      await paymentController.addPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getMetodosPago', () => {
    test('debe obtener todos los métodos de pago', async () => {
      const mockMetodos = [
        { ID: 1, Metodo: 'Efectivo' },
        { ID: 2, Metodo: 'Transferencia' }
      ];

      MetodoDePago.findAll.mockResolvedValue(mockMetodos);

      await paymentController.getMetodosPago(req, res);

      expect(res.json).toHaveBeenCalledWith(mockMetodos);
    });

    test('debe retornar 404 si no hay métodos', async () => {
      MetodoDePago.findAll.mockResolvedValue([]);

      await paymentController.getMetodosPago(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('debe manejar errores', async () => {
      MetodoDePago.findAll.mockRejectedValue(new Error('Error'));

      await paymentController.getMetodosPago(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getPagosCliente', () => {
    test('debe obtener pagos de un cliente', async () => {
      req.params = { clienteID: '1' };
      const mockPagos = [
        { ID: 1, ClienteID: 1, Monto: 50000 }
      ];

      Pago.findAll.mockResolvedValue(mockPagos);

      await paymentController.getPagosCliente(req, res);

      expect(Pago.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockPagos);
    });

    test('debe retornar array vacío si no hay pagos', async () => {
      req.params = { clienteID: '1' };
      Pago.findAll.mockResolvedValue([]);

      await paymentController.getPagosCliente(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    test('debe retornar 400 si falta clienteID', async () => {
      req.params = {};

      await paymentController.getPagosCliente(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('debe manejar errores', async () => {
      req.params = { clienteID: '1' };
      Pago.findAll.mockRejectedValue(new Error('Error'));

      await paymentController.getPagosCliente(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAllPagos', () => {
    test('debe obtener todos los pagos', async () => {
      const mockPagos = [
        { ID: 1, Monto: 50000 },
        { ID: 2, Monto: 60000 }
      ];

      Pago.findAll.mockResolvedValue(mockPagos);

      await paymentController.getAllPagos(req, res);

      expect(res.json).toHaveBeenCalledWith(mockPagos);
    });

    test('debe manejar errores', async () => {
      Pago.findAll.mockRejectedValue(new Error('Error'));

      await paymentController.getAllPagos(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updatePayment', () => {
    test('debe actualizar un pago', async () => {
      req.params = { id: '1' };
      req.body = { Monto: 55000 };

      const mockPago = {
        ID: 1,
        update: jest.fn().mockResolvedValue(true)
      };

      Pago.findByPk.mockResolvedValue(mockPago);

      await paymentController.updatePayment(req, res);

      expect(mockPago.update).toHaveBeenCalled();
    });

    test('debe retornar 404 si no existe', async () => {
      req.params = { id: '999' };
      Pago.findByPk.mockResolvedValue(null);

      await paymentController.updatePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('debe validar método de pago si se actualiza', async () => {
      req.params = { id: '1' };
      req.body = { Metodo_de_PagoID: 999 };

      Pago.findByPk.mockResolvedValue({ ID: 1, update: jest.fn() });
      MetodoDePago.findByPk.mockResolvedValue(null);

      await paymentController.updatePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('debe manejar errores', async () => {
      req.params = { id: '1' };
      Pago.findByPk.mockRejectedValue(new Error('Error'));

      await paymentController.updatePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deletePayment', () => {
    test('debe eliminar un pago', async () => {
      req.params = { id: '1' };

      const mockPago = {
        destroy: jest.fn().mockResolvedValue(true)
      };

      Pago.findByPk.mockResolvedValue(mockPago);

      await paymentController.deletePayment(req, res);

      expect(mockPago.destroy).toHaveBeenCalled();
    });

    test('debe retornar 404 si no existe', async () => {
      req.params = { id: '999' };
      Pago.findByPk.mockResolvedValue(null);

      await paymentController.deletePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('debe manejar errores', async () => {
      req.params = { id: '1' };
      Pago.findByPk.mockRejectedValue(new Error('Error'));

      await paymentController.deletePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getMonthlyIncome', () => {
    test('debe obtener ingresos mensuales', async () => {
      req.query = { anio: '2024' };

      Pago.findAll.mockResolvedValue([
        { Mes: 'ENERO', Ano: 2024, total: '100000' }
      ]);

      await paymentController.getMonthlyIncome(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });

    test('debe usar año actual por defecto', async () => {
      Pago.findAll.mockResolvedValue([]);

      await paymentController.getMonthlyIncome(req, res);

      expect(Pago.findAll).toHaveBeenCalled();
    });

    test('debe manejar errores', async () => {
      Pago.findAll.mockRejectedValue(new Error('Error'));

      await paymentController.getMonthlyIncome(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('generarReporteClientesPagos', () => {
    beforeEach(() => {
      XLSX.utils = {
        book_new: jest.fn(() => ({})),
        aoa_to_sheet: jest.fn(() => ({ '!ref': 'A1:M10', '!cols': [] })),
        book_append_sheet: jest.fn(),
        decode_range: jest.fn(() => ({ s: { c: 0 }, e: { c: 12 } })),
        encode_col: jest.fn(c => String.fromCharCode(65 + c))
      };
      XLSX.write = jest.fn(() => Buffer.from('test'));
    });

    test('debe generar reporte Excel', async () => {
      Cliente.findAll.mockResolvedValue([
        {
          ID: 1,
          NombreCliente: 'Juan',
          ApellidoCliente: 'Pérez',
          Cedula: '123',
          Telefono: '300123',
          Ubicacion: 'Cali',
          plan: { nombre: 'Básico' },
          tarifa: { valor: 50000 },
          sector: { nombre: 'Norte' },
          estado: { Estado: 'Activo' }
        }
      ]);

      Pago.findAll.mockResolvedValue([]);

      await paymentController.generarReporteClientesPagos(req, res);

      expect(res.setHeader).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalled();
    });

    test('debe usar año actual por defecto', async () => {
      Cliente.findAll.mockResolvedValue([]);
      Pago.findAll.mockResolvedValue([]);

      await paymentController.generarReporteClientesPagos(req, res);

      expect(Cliente.findAll).toHaveBeenCalled();
    });

    test('debe manejar errores', async () => {
      Cliente.findAll.mockRejectedValue(new Error('Error'));

      await paymentController.generarReporteClientesPagos(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});