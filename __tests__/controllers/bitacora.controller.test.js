
jest.mock('../../config/db.config', () => {
  const mockSequelize = {
    define: jest.fn(),
    fn: jest.fn(),
    col: jest.fn()
  };
  return mockSequelize;
});

jest.mock('../../models/user.model', () => ({
  hasMany: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn()
}));

jest.mock('../../models/bitacora.model', () => ({
  findAll: jest.fn(),
  findByPk: jest.fn(),
  count: jest.fn(),
  destroy: jest.fn(),
  create: jest.fn(),
  belongsTo: jest.fn(),
  sequelize: {
    fn: jest.fn((fn, col) => `${fn}(${col})`),
    col: jest.fn(name => name)
  }
}));

jest.mock('exceljs');

const bitacoraController = require('../../controllers/bitacora.controller');
const Bitacora = require('../../models/bitacora.model');
const User = require('../../models/user.model');
const ExcelJS = require('exceljs');
const { Op } = require('sequelize');

describe('Bitacora Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { query: {}, params: {}, body: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
      end: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('getAllBitacora', () => {
    test('debe obtener registros con valores por defecto', async () => {
      const mockRegistros = [{ id: 1, modulo: 'usuarios' }];
      Bitacora.findAll.mockResolvedValue(mockRegistros);
      Bitacora.count.mockResolvedValue(1);

      await bitacoraController.getAllBitacora(req, res);

      expect(res.json).toHaveBeenCalledWith({
        registros: mockRegistros,
        total: 1,
        limit: 100,
        offset: 0,
        hasMore: false
      });
    });

    test('debe aplicar filtros de usuario y módulo', async () => {
      req.query = { usuario_id: '5', modulo: 'usuarios' };
      Bitacora.findAll.mockResolvedValue([]);
      Bitacora.count.mockResolvedValue(0);

      await bitacoraController.getAllBitacora(req, res);

      expect(Bitacora.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    test('debe manejar errores correctamente', async () => {
      Bitacora.findAll.mockRejectedValue(new Error('DB error'));

      await bitacoraController.getAllBitacora(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error al obtener registros de bitácora',
        error: 'DB error'
      });
    });
  });

  describe('getBitacoraByUsuario', () => {
    test('debe obtener bitácora de usuario específico', async () => {
      req.params = { usuario_id: '7' };
      Bitacora.findAll.mockResolvedValue([]);
      Bitacora.count.mockResolvedValue(0);

      await bitacoraController.getBitacoraByUsuario(req, res);

      expect(Bitacora.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    test('debe manejar errores', async () => {
      req.params = { usuario_id: '1' };
      Bitacora.findAll.mockRejectedValue(new Error('Error'));

      await bitacoraController.getBitacoraByUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getEstadisticas', () => {
    test('debe obtener estadísticas completas', async () => {
      Bitacora.count.mockResolvedValue(100);
      Bitacora.findAll
        .mockResolvedValueOnce([{ modulo: 'usuarios', total: 50 }])
        .mockResolvedValueOnce([{ accion: 'crear', total: 30 }])
        .mockResolvedValueOnce([{ usuario_id: 1, total: 20 }])
        .mockResolvedValueOnce([{ fecha: '2024-01-01', total: 10 }]);

      await bitacoraController.getEstadisticas(req, res);

      expect(res.json).toHaveBeenCalledWith({
        totalAcciones: 100,
        accionesPorModulo: [{ modulo: 'usuarios', total: 50 }],
        accionesPorTipo: [{ accion: 'crear', total: 30 }],
        usuariosMasActivos: [{ usuario_id: 1, total: 20 }],
        actividadPorDia: [{ fecha: '2024-01-01', total: 10 }]
      });
    });

    test('debe manejar errores', async () => {
      Bitacora.count.mockRejectedValue(new Error('Error'));

      await bitacoraController.getEstadisticas(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('exportarBitacora', () => {
    let mockWorkbook, mockWorksheet;

    beforeEach(() => {
      mockWorksheet = {
        columns: [],
        getRow: jest.fn().mockReturnValue({ font: {}, fill: {} }),
        addRow: jest.fn()
      };
      mockWorkbook = {
        addWorksheet: jest.fn().mockReturnValue(mockWorksheet),
        xlsx: { write: jest.fn().mockResolvedValue(undefined) }
      };
      ExcelJS.Workbook.mockImplementation(() => mockWorkbook);
    });

    test('debe exportar bitácora a Excel', async () => {
      Bitacora.findAll.mockResolvedValue([{
        id: 1,
        fecha_hora: new Date(),
        usuario_id: 1,
        usuario: { Nombre: 'Juan', Apellidos: 'Pérez' },
        accion: 'crear',
        modulo: 'usuarios',
        descripcion: 'Test',
        ip_address: '127.0.0.1'
      }]);

      await bitacoraController.exportarBitacora(req, res);

      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Bitácora');
      expect(mockWorksheet.addRow).toHaveBeenCalled();
      expect(res.end).toHaveBeenCalled();
    });

    test('debe manejar usuario null', async () => {
      Bitacora.findAll.mockResolvedValue([{
        id: 1,
        fecha_hora: new Date(),
        usuario_id: 1,
        usuario: null,
        accion: 'crear',
        modulo: 'usuarios',
        descripcion: 'Test',
        ip_address: '127.0.0.1'
      }]);

      await bitacoraController.exportarBitacora(req, res);

      expect(mockWorksheet.addRow).toHaveBeenCalledWith(
        expect.objectContaining({ usuario_nombre: 'Desconocido' })
      );
    });

    test('debe manejar errores', async () => {
      Bitacora.findAll.mockRejectedValue(new Error('Error'));

      await bitacoraController.exportarBitacora(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getModulos', () => {
    test('debe obtener lista de módulos ordenados', async () => {
      Bitacora.findAll.mockResolvedValue([
        { modulo: 'usuarios' },
        { modulo: 'clientes' }
      ]);

      await bitacoraController.getModulos(req, res);

      expect(res.json).toHaveBeenCalledWith(['clientes', 'usuarios']);
    });

    test('debe manejar errores', async () => {
      Bitacora.findAll.mockRejectedValue(new Error('Error'));

      await bitacoraController.getModulos(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAcciones', () => {
    test('debe obtener lista de acciones ordenadas', async () => {
      Bitacora.findAll.mockResolvedValue([
        { accion: 'eliminar' },
        { accion: 'crear' }
      ]);

      await bitacoraController.getAcciones(req, res);

      expect(res.json).toHaveBeenCalledWith(['crear', 'eliminar']);
    });

    test('debe manejar errores', async () => {
      Bitacora.findAll.mockRejectedValue(new Error('Error'));

      await bitacoraController.getAcciones(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('limpiarRegistrosAntiguos', () => {
    test('debe eliminar registros antiguos', async () => {
      Bitacora.destroy.mockResolvedValue(150);

      await bitacoraController.limpiarRegistrosAntiguos(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ eliminados: 150 })
      );
    });

    test('debe usar días personalizados', async () => {
      req.query = { dias: '30' };
      Bitacora.destroy.mockResolvedValue(50);

      await bitacoraController.limpiarRegistrosAntiguos(req, res);

      expect(Bitacora.destroy).toHaveBeenCalled();
    });

    test('debe manejar errores', async () => {
      Bitacora.destroy.mockRejectedValue(new Error('Error'));

      await bitacoraController.limpiarRegistrosAntiguos(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});