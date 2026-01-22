const { registrarAuditoria } = require('../../utils/auditoria.helper');

// Mock del modelo Bitacora
jest.mock('../../models/bitacora.model', () => ({
  create: jest.fn()
}));

const Bitacora = require('../../models/bitacora.model');

describe('Auditoria Helper', () => {
  let req;
  let consoleLogSpy, consoleErrorSpy;

  beforeEach(() => {
    req = {
      ip: '192.168.1.100',
      connection: {
        remoteAddress: '10.0.0.1'
      },
      get: jest.fn((header) => {
        if (header === 'user-agent') {
          return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
        }
        return null;
      })
    };

    // Espiar console
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Registro básico', () => {
    test('debe registrar una auditoría básica', async () => {
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarAuditoria(
        1,
        'USUARIOS',
        'CREAR',
        'Usuario creado exitosamente',
        req
      );

      expect(Bitacora.create).toHaveBeenCalledWith({
        usuario_id: 1,
        accion: 'CREAR',
        modulo: 'USUARIOS',
        descripcion: 'Usuario creado exitosamente',
        datos_anteriores: null,
        datos_nuevos: null,
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        fecha_hora: expect.any(Date)
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[USUARIOS] CREAR - Usuario creado exitosamente')
      );
    });

    test('debe registrar con todos los parámetros', async () => {
      const datosAnteriores = { nombre: 'Juan Antiguo' };
      const datosNuevos = { nombre: 'Juan Nuevo' };

      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarAuditoria(
        2,
        'CLIENTES',
        'ACTUALIZAR',
        'Cliente actualizado',
        req,
        datosAnteriores,
        datosNuevos
      );

      expect(Bitacora.create).toHaveBeenCalledWith({
        usuario_id: 2,
        accion: 'ACTUALIZAR',
        modulo: 'CLIENTES',
        descripcion: 'Cliente actualizado',
        datos_anteriores: datosAnteriores,
        datos_nuevos: datosNuevos,
        ip_address: '192.168.1.100',
        user_agent: expect.any(String),
        fecha_hora: expect.any(Date)
      });
    });

    test('debe registrar diferentes módulos', async () => {
      Bitacora.create.mockResolvedValue({ id: 1 });

      const modulos = ['USUARIOS', 'CLIENTES', 'PAGOS', 'SECTORES', 'PERMISOS'];

      for (const modulo of modulos) {
        await registrarAuditoria(
          1,
          modulo,
          'CREAR',
          `Acción en ${modulo}`,
          req
        );
      }

      expect(Bitacora.create).toHaveBeenCalledTimes(5);
    });

    test('debe registrar diferentes acciones', async () => {
      Bitacora.create.mockResolvedValue({ id: 1 });

      const acciones = ['LOGIN', 'LOGOUT', 'CREAR', 'ACTUALIZAR', 'ELIMINAR', 'EXPORTAR'];

      for (const accion of acciones) {
        await registrarAuditoria(
          1,
          'USUARIOS',
          accion,
          `Acción: ${accion}`,
          req
        );
      }

      expect(Bitacora.create).toHaveBeenCalledTimes(6);
    });
  });

  describe('Manejo de IP address', () => {
    test('debe usar req.ip si está disponible', async () => {
      req.ip = '172.16.0.50';
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarAuditoria(1, 'USUARIOS', 'CREAR', 'Test', req);

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ip_address: '172.16.0.50'
        })
      );
    });

    test('debe usar req.connection.remoteAddress como fallback', async () => {
      req.ip = null;
      req.connection.remoteAddress = '10.0.0.25';
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarAuditoria(1, 'USUARIOS', 'CREAR', 'Test', req);

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ip_address: '10.0.0.25'
        })
      );
    });

    test('debe usar "Desconocida" si no hay IP disponible', async () => {
      req.ip = null;
      req.connection = {};
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarAuditoria(1, 'USUARIOS', 'CREAR', 'Test', req);

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ip_address: 'Desconocida'
        })
      );
    });

    test('debe limpiar formato IPv6 (::ffff:)', async () => {
      req.ip = '::ffff:192.168.1.100';
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarAuditoria(1, 'USUARIOS', 'CREAR', 'Test', req);

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ip_address: '192.168.1.100'
        })
      );
    });

    test('debe manejar IP localhost IPv6', async () => {
      req.ip = '::1';
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarAuditoria(1, 'USUARIOS', 'CREAR', 'Test', req);

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ip_address: '::1'
        })
      );
    });

    test('debe usar "Sistema" si no hay request', async () => {
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarAuditoria(1, 'USUARIOS', 'CREAR', 'Test', null);

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ip_address: 'Sistema'
        })
      );
    });
  });

  describe('Manejo de User Agent', () => {
    test('debe obtener user agent del request', async () => {
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarAuditoria(1, 'USUARIOS', 'CREAR', 'Test', req);

      expect(req.get).toHaveBeenCalledWith('user-agent');
      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        })
      );
    });

    test('debe usar "Sistema" si no hay request', async () => {
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarAuditoria(1, 'USUARIOS', 'CREAR', 'Test', null);

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_agent: 'Sistema'
        })
      );
    });

    test('debe manejar user agent vacío', async () => {
      req.get = jest.fn().mockReturnValue('');
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarAuditoria(1, 'USUARIOS', 'CREAR', 'Test', req);

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_agent: ''
        })
      );
    });

    test('debe manejar diferentes user agents', async () => {
      const userAgents = [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        'PostmanRuntime/7.26.8',
        'curl/7.68.0'
      ];

      Bitacora.create.mockResolvedValue({ id: 1 });

      for (const ua of userAgents) {
        req.get = jest.fn().mockReturnValue(ua);
        await registrarAuditoria(1, 'USUARIOS', 'CREAR', 'Test', req);
      }

      expect(Bitacora.create).toHaveBeenCalledTimes(3);
    });
  });

  describe('Usuario ID', () => {
    test('debe registrar con usuario_id válido', async () => {
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarAuditoria(5, 'USUARIOS', 'CREAR', 'Test', req);

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          usuario_id: 5
        })
      );
    });

    test('debe permitir usuario_id null', async () => {
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarAuditoria(null, 'SISTEMA', 'TAREA_AUTOMATICA', 'Tarea ejecutada', req);

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          usuario_id: null
        })
      );
    });

    test('debe convertir undefined a null', async () => {
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarAuditoria(undefined, 'SISTEMA', 'TAREA', 'Test', req);

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          usuario_id: null
        })
      );
    });

    test('debe permitir 0 como usuario_id', async () => {
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarAuditoria(0, 'USUARIOS', 'CREAR', 'Test', req);

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          usuario_id: null // 0 || null = null
        })
      );
    });
  });

  describe('Datos anteriores y nuevos', () => {
    test('debe incluir datos_anteriores', async () => {
      const datosAnteriores = {
        nombre: 'Juan',
        email: 'juan@old.com'
      };

      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarAuditoria(
        1,
        'USUARIOS',
        'ACTUALIZAR',
        'Test',
        req,
        datosAnteriores
      );

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          datos_anteriores: datosAnteriores
        })
      );
    });

    test('debe incluir datos_nuevos', async () => {
      const datosNuevos = {
        nombre: 'Juan Carlos',
        email: 'juan@new.com'
      };

      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarAuditoria(
        1,
        'USUARIOS',
        'ACTUALIZAR',
        'Test',
        req,
        null,
        datosNuevos
      );

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          datos_nuevos: datosNuevos
        })
      );
    });

    test('debe incluir ambos datos_anteriores y datos_nuevos', async () => {
      const datosAnteriores = { estado: 'activo' };
      const datosNuevos = { estado: 'inactivo' };

      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarAuditoria(
        1,
        'USUARIOS',
        'ACTUALIZAR',
        'Test',
        req,
        datosAnteriores,
        datosNuevos
      );

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          datos_anteriores: datosAnteriores,
          datos_nuevos: datosNuevos
        })
      );
    });

    test('debe manejar datos complejos', async () => {
      const datosNuevos = {
        usuario: {
          nombre: 'Juan',
          permisos: ['leer', 'escribir'],
          config: {
            tema: 'oscuro',
            notificaciones: true
          }
        }
      };

      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarAuditoria(
        1,
        'USUARIOS',
        'ACTUALIZAR',
        'Test',
        req,
        null,
        datosNuevos
      );

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          datos_nuevos: datosNuevos
        })
      );
    });

    test('debe manejar datos null', async () => {
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarAuditoria(
        1,
        'USUARIOS',
        'CREAR',
        'Test',
        req,
        null,
        null
      );

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          datos_anteriores: null,
          datos_nuevos: null
        })
      );
    });
  });

  describe('Fecha y hora', () => {
    test('debe incluir fecha_hora actual', async () => {
      const antes = new Date();
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarAuditoria(1, 'USUARIOS', 'CREAR', 'Test', req);

      const despues = new Date();
      const llamada = Bitacora.create.mock.calls[0][0];

      expect(llamada.fecha_hora).toBeInstanceOf(Date);
      expect(llamada.fecha_hora.getTime()).toBeGreaterThanOrEqual(antes.getTime());
      expect(llamada.fecha_hora.getTime()).toBeLessThanOrEqual(despues.getTime());
    });
  });

  describe('Logging', () => {
    test('debe loguear el registro exitoso', async () => {
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarAuditoria(1, 'USUARIOS', 'CREAR', 'Usuario creado', req);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '📝 Bitácora: [USUARIOS] CREAR - Usuario creado'
      );
    });

    test('debe loguear diferentes módulos y acciones', async () => {
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarAuditoria(1, 'CLIENTES', 'ACTUALIZAR', 'Cliente actualizado', req);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '📝 Bitácora: [CLIENTES] ACTUALIZAR - Cliente actualizado'
      );
    });
  });

  describe('Manejo de errores', () => {
    test('debe manejar error al crear registro', async () => {
      Bitacora.create.mockRejectedValue(new Error('Error de base de datos'));

      await registrarAuditoria(1, 'USUARIOS', 'CREAR', 'Test', req);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error al registrar en bitácora'),
        'Error de base de datos'
      );
    });

    test('no debe lanzar error aunque falle el registro', async () => {
      Bitacora.create.mockRejectedValue(new Error('Error DB'));

      await expect(
        registrarAuditoria(1, 'USUARIOS', 'CREAR', 'Test', req)
      ).resolves.not.toThrow();
    });

    test('debe manejar error de conexión', async () => {
      Bitacora.create.mockRejectedValue(new Error('Connection timeout'));

      await registrarAuditoria(1, 'USUARIOS', 'CREAR', 'Test', req);

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('debe continuar ejecución después de error', async () => {
      Bitacora.create.mockRejectedValue(new Error('Error'));

      const resultado = await registrarAuditoria(1, 'USUARIOS', 'CREAR', 'Test', req);

      expect(resultado).toBeUndefined();
    });
  });

  describe('Casos edge', () => {
    test('debe manejar request sin método get', async () => {
      const reqSinGet = {
        ip: '192.168.1.1',
        connection: { remoteAddress: '192.168.1.1' }
      };
      
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarAuditoria(1, 'USUARIOS', 'CREAR', 'Test', reqSinGet);

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('debe manejar descripción vacía', async () => {
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarAuditoria(1, 'USUARIOS', 'CREAR', '', req);

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          descripcion: ''
        })
      );
    });

    test('debe manejar descripción larga', async () => {
      const descripcionLarga = 'A'.repeat(1000);
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarAuditoria(1, 'USUARIOS', 'CREAR', descripcionLarga, req);

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          descripcion: descripcionLarga
        })
      );
    });

    test('debe manejar request parcial', async () => {
      const reqParcial = { 
        ip: '192.168.1.1',
        connection: { remoteAddress: '192.168.1.1' },
        get: jest.fn().mockReturnValue('Mozilla/5.0')
      };
      
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarAuditoria(1, 'USUARIOS', 'CREAR', 'Test', reqParcial);

      expect(Bitacora.create).toHaveBeenCalled();
    });
  });

  describe('Diferentes tipos de acciones', () => {
    test('debe registrar LOGIN', async () => {
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarAuditoria(
        1,
        'AUTENTICACION',
        'LOGIN',
        'Inicio de sesión exitoso',
        req
      );

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          modulo: 'AUTENTICACION',
          accion: 'LOGIN'
        })
      );
    });

    test('debe registrar LOGOUT', async () => {
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarAuditoria(
        1,
        'AUTENTICACION',
        'LOGOUT',
        'Cierre de sesión',
        req
      );

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'LOGOUT'
        })
      );
    });

    test('debe registrar EXPORTAR', async () => {
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarAuditoria(
        1,
        'CLIENTES',
        'EXPORTAR',
        'Exportación de clientes morosos',
        req
      );

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'EXPORTAR'
        })
      );
    });

    test('debe registrar ELIMINAR', async () => {
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarAuditoria(
        1,
        'USUARIOS',
        'ELIMINAR',
        'Usuario eliminado ID: 5',
        req
      );

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'ELIMINAR'
        })
      );
    });
  });
});