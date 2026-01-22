const { 
  registrarBitacora, 
  auditMiddleware,
  registrarLogin,
  registrarLogout 
} = require('../../middlewares/auditoria.middleware');

// Mock del modelo Bitacora
jest.mock('../../models/bitacora.model', () => ({
  create: jest.fn()
}));

const Bitacora = require('../../models/bitacora.model');

describe('Auditoria Middleware', () => {
  let req, res, next;
  let consoleLogSpy, consoleErrorSpy;

  beforeEach(() => {
    req = {
      user: { id: 1, nombre: 'Juan Pérez' },
      body: { nombre: 'Test' },
      params: {},
      query: {},
      method: 'POST',
      path: '/test',
      ip: '192.168.1.1',
      headers: {},
      get: jest.fn().mockReturnValue('Mozilla/5.0'),
      connection: {},
      socket: {}
    };

    res = {
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      statusCode: 200
    };

    next = jest.fn();

    // Espiar console
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('registrarBitacora', () => {
    test('debe registrar una entrada en bitácora', async () => {
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarBitacora(
        req,
        'CREAR',
        'USUARIOS',
        'Usuario creado correctamente',
        null,
        { nombre: 'Test' }
      );

      expect(Bitacora.create).toHaveBeenCalledWith({
        usuario_id: 1,
        accion: 'CREAR',
        modulo: 'USUARIOS',
        descripcion: 'Usuario creado correctamente',
        datos_anteriores: null,
        datos_nuevos: expect.objectContaining({ nombre: 'Test' }),
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0'
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Bitácora registrada')
      );
    });

    test('debe obtener IP de x-forwarded-for si existe', async () => {
      req.ip = undefined;
      req.headers['x-forwarded-for'] = '10.0.0.1, 10.0.0.2';
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarBitacora(req, 'CREAR', 'TEST', 'Test');

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ip_address: '10.0.0.1'
        })
      );
    });

    test('debe usar IP de connection.remoteAddress como fallback', async () => {
      req.ip = null;
      req.headers = {};
      req.connection.remoteAddress = '172.16.0.1';
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarBitacora(req, 'CREAR', 'TEST', 'Test');

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ip_address: '172.16.0.1'
        })
      );
    });

    test('debe usar "unknown" si no hay IP disponible', async () => {
      req.ip = null;
      req.headers = {};
      req.connection = {};
      req.socket = {};
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarBitacora(req, 'CREAR', 'TEST', 'Test');

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ip_address: 'unknown'
        })
      );
    });

    test('debe usar "unknown" para user_agent si no existe', async () => {
      req.get = jest.fn().mockReturnValue(null);
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarBitacora(req, 'CREAR', 'TEST', 'Test');

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_agent: 'unknown'
        })
      );
    });

    test('debe incluir datos anteriores y nuevos', async () => {
      const datosAnteriores = { nombre: 'Antiguo' };
      const datosNuevos = { nombre: 'Nuevo' };
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarBitacora(
        req,
        'ACTUALIZAR',
        'USUARIOS',
        'Usuario actualizado',
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

    test('debe limpiar datos sensibles', async () => {
      const datosConPassword = {
        nombre: 'Juan',
        password: 'secret123',
        Password: 'secret456',
        token: 'abc123',
        email: 'juan@example.com'
      };

      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarBitacora(
        req,
        'CREAR',
        'USUARIOS',
        'Test',
        null,
        datosConPassword
      );

      const llamada = Bitacora.create.mock.calls[0][0];
      expect(llamada.datos_nuevos.password).toBe('***OCULTO***');
      expect(llamada.datos_nuevos.Password).toBe('***OCULTO***');
      expect(llamada.datos_nuevos.token).toBe('***OCULTO***');
      expect(llamada.datos_nuevos.email).toBe('juan@example.com');
    });

    test('no debe registrar si no hay usuario autenticado', async () => {
      req.user = null;

      await registrarBitacora(req, 'CREAR', 'TEST', 'Test');

      expect(Bitacora.create).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('usuario no autenticado')
      );
    });

    test('debe manejar errores sin lanzar excepción', async () => {
      Bitacora.create.mockRejectedValue(new Error('Error DB'));

      await expect(
        registrarBitacora(req, 'CREAR', 'TEST', 'Test')
      ).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error al registrar en bitácora'),
        expect.any(Error)
      );
    });
  });

  describe('auditMiddleware', () => {
    test('debe registrar acción POST como CREAR', async () => {
      req.method = 'POST';
      const middleware = auditMiddleware('USUARIOS', 'Usuario creado');

      Bitacora.create.mockResolvedValue({ id: 1 });

      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();

      // Simular respuesta exitosa
      await res.json({ success: true });

      // Esperar que se complete el registro asíncrono
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'CREAR',
          modulo: 'USUARIOS'
        })
      );
    });

    test('debe registrar acción PUT como ACTUALIZAR', async () => {
      req.method = 'PUT';
      const middleware = auditMiddleware('CLIENTES', 'Cliente actualizado');

      Bitacora.create.mockResolvedValue({ id: 1 });

      middleware(req, res, next);
      await res.json({ success: true });
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'ACTUALIZAR'
        })
      );
    });

    test('debe registrar acción PATCH como ACTUALIZAR', async () => {
      req.method = 'PATCH';
      const middleware = auditMiddleware('CLIENTES', 'Cliente actualizado');

      Bitacora.create.mockResolvedValue({ id: 1 });

      middleware(req, res, next);
      await res.json({ success: true });
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'ACTUALIZAR'
        })
      );
    });

    test('debe registrar acción DELETE como ELIMINAR', async () => {
      req.method = 'DELETE';
      const middleware = auditMiddleware('SECTORES', 'Sector eliminado');

      Bitacora.create.mockResolvedValue({ id: 1 });

      middleware(req, res, next);
      await res.json({ success: true });
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'ELIMINAR'
        })
      );
    });

    test('debe registrar GET como EXPORTAR para rutas de exportación', async () => {
      req.method = 'GET';
      req.path = '/api/clientes/export';
      const middleware = auditMiddleware('CLIENTES', 'Exportación de clientes');

      Bitacora.create.mockResolvedValue({ id: 1 });

      middleware(req, res, next);
      await res.json({ success: true });
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'EXPORTAR'
        })
      );
    });

    test('debe registrar GET como EXPORTAR para rutas de reportes', async () => {
      req.method = 'GET';
      req.path = '/api/pagos/report';
      const middleware = auditMiddleware('PAGOS', 'Reporte de pagos');

      Bitacora.create.mockResolvedValue({ id: 1 });

      middleware(req, res, next);
      await res.json({ success: true });
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'EXPORTAR'
        })
      );
    });

    test('debe registrar GET como EXPORTAR para rutas de morosos', async () => {
      req.method = 'GET';
      req.path = '/api/clientes/morosos';
      const middleware = auditMiddleware('CLIENTES', 'Consulta de morosos');

      Bitacora.create.mockResolvedValue({ id: 1 });

      middleware(req, res, next);
      await res.json({ success: true });
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'EXPORTAR'
        })
      );
    });

    test('no debe registrar GET normales', async () => {
      req.method = 'GET';
      req.path = '/api/usuarios/all';
      const middleware = auditMiddleware('USUARIOS', 'Consulta de usuarios');

      Bitacora.create.mockResolvedValue({ id: 1 });

      middleware(req, res, next);
      await res.json({ success: true });
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(Bitacora.create).not.toHaveBeenCalled();
    });

    test('debe usar función para generar descripción', async () => {
      req.method = 'POST';
      const getDescripcion = (req, data) => {
        return `Usuario ${req.body.nombre} creado`;
      };
      const middleware = auditMiddleware('USUARIOS', getDescripcion);

      Bitacora.create.mockResolvedValue({ id: 1 });

      middleware(req, res, next);
      await res.json({ success: true });
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          descripcion: 'Usuario Test creado'
        })
      );
    });

    test('no debe registrar si statusCode no es 2xx', async () => {
      req.method = 'POST';
      res.statusCode = 400;
      const middleware = auditMiddleware('USUARIOS', 'Test');

      Bitacora.create.mockResolvedValue({ id: 1 });

      middleware(req, res, next);
      await res.json({ error: 'Bad request' });
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(Bitacora.create).not.toHaveBeenCalled();
    });

    test('no debe registrar si statusCode es 404', async () => {
      req.method = 'DELETE';
      res.statusCode = 404;
      const middleware = auditMiddleware('USUARIOS', 'Test');

      Bitacora.create.mockResolvedValue({ id: 1 });

      middleware(req, res, next);
      await res.json({ error: 'Not found' });
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(Bitacora.create).not.toHaveBeenCalled();
    });

    test('debe funcionar con res.send', async () => {
      req.method = 'POST';
      const middleware = auditMiddleware('USUARIOS', 'Usuario creado');

      Bitacora.create.mockResolvedValue({ id: 1 });

      middleware(req, res, next);
      await res.send('OK');
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(Bitacora.create).toHaveBeenCalled();
    });

    test('debe incluir datos anteriores si están presentes', async () => {
      req.method = 'PUT';
      req.datosAnteriores = { nombre: 'Antiguo' };
      const middleware = auditMiddleware('USUARIOS', 'Actualizado');

      Bitacora.create.mockResolvedValue({ id: 1 });

      middleware(req, res, next);
      await res.json({ success: true });
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          datos_anteriores: { nombre: 'Antiguo' }
        })
      );
    });
  });

  describe('registrarLogin', () => {
    test('debe registrar login exitoso', async () => {
      const middleware = registrarLogin;
      const loginData = {
        token: 'abc123',
        user: { id: 1, nombre: 'Juan Pérez' }
      };

      Bitacora.create.mockResolvedValue({ id: 1 });

      middleware(req, res, next);
      expect(next).toHaveBeenCalled();

      res.statusCode = 200;
      await res.json(loginData);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'LOGIN',
          modulo: 'SISTEMA',
          descripcion: expect.stringContaining('Juan Pérez')
        })
      );
    });

    test('no debe registrar si no hay token', async () => {
      const middleware = registrarLogin;
      const loginData = { user: { id: 1, nombre: 'Juan' } };

      Bitacora.create.mockResolvedValue({ id: 1 });

      middleware(req, res, next);
      res.statusCode = 200;
      await res.json(loginData);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(Bitacora.create).not.toHaveBeenCalled();
    });

    test('no debe registrar si statusCode no es 200', async () => {
      const middleware = registrarLogin;
      const loginData = {
        token: 'abc123',
        user: { id: 1, nombre: 'Juan' }
      };

      Bitacora.create.mockResolvedValue({ id: 1 });

      middleware(req, res, next);
      res.statusCode = 401;
      await res.json({ error: 'Unauthorized' });
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(Bitacora.create).not.toHaveBeenCalled();
    });

    test('no debe registrar si no hay usuario_id', async () => {
      const middleware = registrarLogin;
      const loginData = { token: 'abc123', user: {} };

      Bitacora.create.mockResolvedValue({ id: 1 });

      middleware(req, res, next);
      res.statusCode = 200;
      await res.json(loginData);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(Bitacora.create).not.toHaveBeenCalled();
    });
  });

  describe('registrarLogout', () => {
    test('debe registrar logout exitoso', async () => {
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarLogout(req, res, next);

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'LOGOUT',
          modulo: 'SISTEMA',
          descripcion: expect.stringContaining('Juan Pérez')
        })
      );

      expect(res.json).toHaveBeenCalledWith({
        message: 'Sesión cerrada exitosamente'
      });
    });

    test('debe responder aunque falle el registro', async () => {
      Bitacora.create.mockRejectedValue(new Error('Error DB'));

      await registrarLogout(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Sesión cerrada exitosamente'
      });
    });

    test('no debe registrar si no hay usuario', async () => {
      req.user = null;
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarLogout(req, res, next);

      expect(Bitacora.create).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Sesión cerrada exitosamente'
      });
    });
  });

  describe('Limpieza de datos sensibles', () => {
    test('debe ocultar password', async () => {
      const datos = { password: 'secret123', nombre: 'Juan' };
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarBitacora(req, 'CREAR', 'TEST', 'Test', null, datos);

      const llamada = Bitacora.create.mock.calls[0][0];
      expect(llamada.datos_nuevos.password).toBe('***OCULTO***');
      expect(llamada.datos_nuevos.nombre).toBe('Juan');
    });

    test('debe ocultar Password con mayúscula', async () => {
      const datos = { Password: 'secret456', email: 'test@test.com' };
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarBitacora(req, 'CREAR', 'TEST', 'Test', null, datos);

      const llamada = Bitacora.create.mock.calls[0][0];
      expect(llamada.datos_nuevos.Password).toBe('***OCULTO***');
    });

    test('debe ocultar token', async () => {
      const datos = { token: 'abc123', nombre: 'Juan' };
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarBitacora(req, 'CREAR', 'TEST', 'Test', null, datos);

      const llamada = Bitacora.create.mock.calls[0][0];
      expect(llamada.datos_nuevos.token).toBe('***OCULTO***');
    });

    test('debe ocultar secret', async () => {
      const datos = { secret: 'mysecret', dato: 'visible' };
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarBitacora(req, 'CREAR', 'TEST', 'Test', null, datos);

      const llamada = Bitacora.create.mock.calls[0][0];
      expect(llamada.datos_nuevos.secret).toBe('***OCULTO***');
    });

    test('debe limpiar objetos anidados', async () => {
      const datos = {
        usuario: {
          nombre: 'Juan',
          password: 'secret',
          config: {
            token: 'abc123'
          }
        }
      };
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarBitacora(req, 'CREAR', 'TEST', 'Test', null, datos);

      const llamada = Bitacora.create.mock.calls[0][0];
      expect(llamada.datos_nuevos.usuario.password).toBe('***OCULTO***');
      expect(llamada.datos_nuevos.usuario.config.token).toBe('***OCULTO***');
      expect(llamada.datos_nuevos.usuario.nombre).toBe('Juan');
    });

    test('debe manejar datos null', async () => {
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarBitacora(req, 'CREAR', 'TEST', 'Test', null, null);

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          datos_nuevos: null
        })
      );
    });

    test('debe manejar datos no objeto', async () => {
      Bitacora.create.mockResolvedValue({ id: 1 });

      await registrarBitacora(req, 'CREAR', 'TEST', 'Test', null, 'string');

      expect(Bitacora.create).toHaveBeenCalledWith(
        expect.objectContaining({
          datos_nuevos: 'string'
        })
      );
    });
  });
});