// Mockear TODO antes de importar
jest.mock('../../config/db.config', () => ({
  define: jest.fn(() => ({
    belongsTo: jest.fn(),
    hasMany: jest.fn()
  }))
}));

jest.mock('../../models/sector.model', () => ({
  findAll: jest.fn(),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn()
}));

jest.mock('../../models/client.model', () => ({
  count: jest.fn()
}));

const sectorController = require('../../controllers/sector.controller');
const Sector = require('../../models/sector.model');
const Cliente = require('../../models/client.model');
const { Op } = require('sequelize');

describe('Sector Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { query: {}, params: {}, body: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getAllSectores', () => {
    test('debe obtener todos los sectores', async () => {
      const mockSectores = [
        { id: 1, nombre: 'Norte', descripcion: 'Zona norte de la ciudad' },
        { id: 2, nombre: 'Sur', descripcion: 'Zona sur de la ciudad' },
        { id: 3, nombre: 'Centro', descripcion: 'Zona centro' }
      ];

      Sector.findAll.mockResolvedValue(mockSectores);

      await sectorController.getAllSectores(req, res);

      expect(Sector.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockSectores);
    });

    test('debe retornar array vacío si no hay sectores', async () => {
      Sector.findAll.mockResolvedValue([]);

      await sectorController.getAllSectores(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    test('debe manejar errores', async () => {
      Sector.findAll.mockRejectedValue(new Error('Error DB'));

      await sectorController.getAllSectores(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error al obtener sectores',
        error: 'Error DB'
      });
    });
  });

  describe('getSectorById', () => {
    test('debe obtener un sector por ID', async () => {
      req.params = { id: '1' };
      const mockSector = {
        id: 1,
        nombre: 'Norte',
        descripcion: 'Zona norte'
      };

      Sector.findByPk.mockResolvedValue(mockSector);

      await sectorController.getSectorById(req, res);

      expect(Sector.findByPk).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith(mockSector);
    });

    test('debe retornar 404 si no existe', async () => {
      req.params = { id: '999' };
      Sector.findByPk.mockResolvedValue(null);

      await sectorController.getSectorById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Sector no encontrado'
      });
    });

    test('debe manejar errores', async () => {
      req.params = { id: '1' };
      Sector.findByPk.mockRejectedValue(new Error('Error'));

      await sectorController.getSectorById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createSector', () => {
    test('debe crear un sector válido', async () => {
      req.body = {
        nombre: 'Este',
        descripcion: 'Zona este de la ciudad'
      };

      Sector.findOne.mockResolvedValue(null);
      Sector.create.mockResolvedValue({
        id: 4,
        nombre: 'Este',
        descripcion: 'Zona este de la ciudad'
      });

      await sectorController.createSector(req, res);

      expect(Sector.create).toHaveBeenCalledWith({
        nombre: 'Este',
        descripcion: 'Zona este de la ciudad'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Sector creado correctamente',
        sector: expect.objectContaining({
          id: 4,
          nombre: 'Este'
        })
      });
    });

    test('debe crear sector sin descripción', async () => {
      req.body = { nombre: 'Oeste' };

      Sector.findOne.mockResolvedValue(null);
      Sector.create.mockResolvedValue({
        id: 5,
        nombre: 'Oeste'
      });

      await sectorController.createSector(req, res);

      expect(Sector.create).toHaveBeenCalledWith({
        nombre: 'Oeste',
        descripcion: undefined
      });
    });

    test('debe rechazar si falta el nombre', async () => {
      req.body = { descripcion: 'Solo descripción' };

      await sectorController.createSector(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'El nombre es obligatorio'
      });
    });

    test('debe rechazar si el sector ya existe', async () => {
      req.body = { nombre: 'Norte' };

      Sector.findOne.mockResolvedValue({
        id: 1,
        nombre: 'Norte'
      });

      await sectorController.createSector(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Ya existe un sector con ese nombre'
      });
    });

    test('debe verificar existencia con Op.like', async () => {
      req.body = { nombre: 'Nuevo Sector' };

      Sector.findOne.mockResolvedValue(null);
      Sector.create.mockResolvedValue({ id: 6 });

      await sectorController.createSector(req, res);

      expect(Sector.findOne).toHaveBeenCalledWith({
        where: { nombre: { [Op.like]: 'Nuevo Sector' } }
      });
    });

    test('debe manejar errores', async () => {
      req.body = { nombre: 'Test' };
      Sector.findOne.mockRejectedValue(new Error('Error'));

      await sectorController.createSector(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateSector', () => {
    test('debe actualizar un sector existente', async () => {
      req.params = { id: '1' };
      req.body = {
        nombre: 'Norte Ampliado',
        descripcion: 'Zona norte ampliada'
      };

      const mockSector = {
        id: 1,
        nombre: 'Norte',
        descripcion: 'Zona norte',
        update: jest.fn().mockResolvedValue(true)
      };

      Sector.findByPk.mockResolvedValue(mockSector);
      Sector.findOne.mockResolvedValue(null);

      await sectorController.updateSector(req, res);

      expect(mockSector.update).toHaveBeenCalledWith({
        nombre: 'Norte Ampliado',
        descripcion: 'Zona norte ampliada'
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'Sector actualizado correctamente',
        sector: mockSector
      });
    });

    test('debe retornar 404 si no existe', async () => {
      req.params = { id: '999' };
      req.body = { nombre: 'Test' };

      Sector.findByPk.mockResolvedValue(null);

      await sectorController.updateSector(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('debe rechazar duplicados al cambiar nombre', async () => {
      req.params = { id: '1' };
      req.body = { nombre: 'Sur' };

      Sector.findByPk.mockResolvedValue({
        id: 1,
        nombre: 'Norte',
        descripcion: 'Zona norte'
      });
      Sector.findOne.mockResolvedValue({
        id: 2,
        nombre: 'Sur'
      });

      await sectorController.updateSector(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Ya existe otro sector con ese nombre'
      });
    });

    test('debe permitir actualizar sin cambiar nombre', async () => {
      req.params = { id: '1' };
      req.body = {
        nombre: 'Norte',
        descripcion: 'Nueva descripción'
      };

      const mockSector = {
        id: 1,
        nombre: 'Norte',
        descripcion: 'Descripción anterior',
        update: jest.fn()
      };

      Sector.findByPk.mockResolvedValue(mockSector);

      await sectorController.updateSector(req, res);

      expect(Sector.findOne).not.toHaveBeenCalled();
      expect(mockSector.update).toHaveBeenCalled();
    });

    test('debe mantener descripción si no se proporciona', async () => {
      req.params = { id: '1' };
      req.body = { nombre: 'Nuevo Nombre' };

      const mockSector = {
        id: 1,
        nombre: 'Norte',
        descripcion: 'Descripción original',
        update: jest.fn()
      };

      Sector.findByPk.mockResolvedValue(mockSector);
      Sector.findOne.mockResolvedValue(null);

      await sectorController.updateSector(req, res);

      expect(mockSector.update).toHaveBeenCalledWith({
        nombre: 'Nuevo Nombre',
        descripcion: 'Descripción original'
      });
    });

    test('debe permitir actualizar descripción a null', async () => {
      req.params = { id: '1' };
      req.body = { nombre: 'Norte', descripcion: null };

      const mockSector = {
        id: 1,
        nombre: 'Norte',
        descripcion: 'Descripción',
        update: jest.fn()
      };

      Sector.findByPk.mockResolvedValue(mockSector);

      await sectorController.updateSector(req, res);

      expect(mockSector.update).toHaveBeenCalledWith({
        nombre: 'Norte',
        descripcion: null
      });
    });

    test('debe manejar errores', async () => {
      req.params = { id: '1' };
      req.body = { nombre: 'Test' };

      Sector.findByPk.mockRejectedValue(new Error('Error'));

      await sectorController.updateSector(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteSector', () => {
    test('debe eliminar un sector sin clientes asociados', async () => {
      req.params = { id: '1' };

      const mockSector = {
        id: 1,
        destroy: jest.fn().mockResolvedValue(true)
      };

      Sector.findByPk.mockResolvedValue(mockSector);
      Cliente.count.mockResolvedValue(0);

      await sectorController.deleteSector(req, res);

      expect(mockSector.destroy).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Sector eliminado correctamente'
      });
    });

    test('debe retornar 404 si no existe', async () => {
      req.params = { id: '999' };
      Sector.findByPk.mockResolvedValue(null);

      await sectorController.deleteSector(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('debe rechazar si hay clientes usando el sector', async () => {
      req.params = { id: '1' };

      Sector.findByPk.mockResolvedValue({ id: 1 });
      Cliente.count.mockResolvedValue(25);

      await sectorController.deleteSector(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No se puede eliminar el sector porque está siendo utilizado por 25 clientes',
        clientesAsociados: 25
      });
    });

    test('debe verificar clientes con sector_id', async () => {
      req.params = { id: '3' };

      Sector.findByPk.mockResolvedValue({ id: 3 });
      Cliente.count.mockResolvedValue(0);

      await sectorController.deleteSector(req, res);

      expect(Cliente.count).toHaveBeenCalledWith({
        where: { sector_id: '3' }
      });
    });

    test('debe manejar errores', async () => {
      req.params = { id: '1' };
      Sector.findByPk.mockRejectedValue(new Error('Error'));

      await sectorController.deleteSector(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});