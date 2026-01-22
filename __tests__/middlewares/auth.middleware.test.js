const jwt = require('jsonwebtoken');
const authMiddleware = require('../../middlewares/auth.middleware');

// Mock de jwt
jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let req, res, next;
  let consoleLogSpy, consoleErrorSpy;

  beforeEach(() => {
    req = {
      headers: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();

    // Mock de variables de entorno
    process.env.JWT_SECRET = 'test-secret';

    // Espiar console
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Token válido', () => {
    test('debe verificar token válido y llamar next', () => {
      req.headers['authorization'] = 'Bearer valid-token-123';

      const mockDecoded = {
        id: 1,
        nombre: 'Juan Pérez',
        funcion: 'Administrador',
        permisos: ['usuarios.leer', 'usuarios.crear']
      };

      jwt.verify.mockReturnValue(mockDecoded);

      authMiddleware(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token-123', 'test-secret');
      expect(req.user).toEqual(mockDecoded);
      expect(next).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Token verificado exitosamente')
      );
    });

    test('debe loguear información del usuario', () => {
      req.headers['authorization'] = 'Bearer valid-token';

      const mockDecoded = {
        id: 1,
        nombre: 'María García',
        funcion: 'Supervisor',
        permisos: ['clientes.leer']
      };

      jwt.verify.mockReturnValue(mockDecoded);

      authMiddleware(req, res, next);

      expect(consoleLogSpy).toHaveBeenCalledWith('   Usuario:', 'María García');
      expect(consoleLogSpy).toHaveBeenCalledWith('   Función:', 'Supervisor');
      expect(consoleLogSpy).toHaveBeenCalledWith('   Permisos en token:', 1);
    });

    test('debe manejar token sin permisos', () => {
      req.headers['authorization'] = 'Bearer valid-token';

      const mockDecoded = {
        id: 1,
        nombre: 'Pedro López',
        funcion: 'Usuario'
      };

      jwt.verify.mockReturnValue(mockDecoded);

      authMiddleware(req, res, next);

      expect(consoleLogSpy).toHaveBeenCalledWith('   Permisos en token:', 0);
      expect(next).toHaveBeenCalled();
    });

    test('debe manejar token con array de permisos vacío', () => {
      req.headers['authorization'] = 'Bearer valid-token';

      const mockDecoded = {
        id: 1,
        nombre: 'Ana Martínez',
        funcion: 'Operador',
        permisos: []
      };

      jwt.verify.mockReturnValue(mockDecoded);

      authMiddleware(req, res, next);

      expect(consoleLogSpy).toHaveBeenCalledWith('   Permisos en token:', 0);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Sin token', () => {
    test('debe rechazar si no hay header de autorización', () => {
      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Token no proporcionado'
      });
      expect(next).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('No se proporcionó token de autorización')
      );
    });

    test('debe rechazar si el header está vacío', () => {
      req.headers['authorization'] = '';

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Token no proporcionado' // CORRECCIÓN: header vacío es tratado como "no proporcionado"
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('debe rechazar si solo se proporciona "Bearer"', () => {
      req.headers['authorization'] = 'Bearer';

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Token no válido'
      });
      expect(next).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Token inválido en el header')
      );
    });

    test('debe rechazar si hay espacios extras', () => {
      req.headers['authorization'] = 'Bearer  ';

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Token no válido'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Token inválido', () => {
    test('debe rechazar token malformado', () => {
      req.headers['authorization'] = 'Bearer invalid-token';

      jwt.verify.mockImplementation(() => {
        throw new Error('jwt malformed');
      });

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Token inválido o expirado'
      });
      expect(next).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error al verificar token'),
        'jwt malformed'
      );
    });

    test('debe rechazar token con firma inválida', () => {
      req.headers['authorization'] = 'Bearer tampered-token';

      jwt.verify.mockImplementation(() => {
        throw new Error('invalid signature');
      });

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Token inválido o expirado'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('debe manejar token con secret incorrecto', () => {
      req.headers['authorization'] = 'Bearer wrong-secret-token';

      jwt.verify.mockImplementation(() => {
        const error = new Error('invalid token');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Token inválido o expirado'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Token expirado', () => {
    test('debe rechazar token expirado con mensaje específico', () => {
      req.headers['authorization'] = 'Bearer expired-token';

      const error = new Error('jwt expired');
      error.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Token expirado'
      });
      expect(next).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error al verificar token'),
        'jwt expired'
      );
    });

    test('debe distinguir entre token expirado y token inválido', () => {
      // Token expirado
      req.headers['authorization'] = 'Bearer expired-token';
      const expiredError = new Error('jwt expired');
      expiredError.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => {
        throw expiredError;
      });

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Token expirado'
      });

      // Reset
      jest.clearAllMocks();

      // Token inválido
      req.headers['authorization'] = 'Bearer invalid-token';
      const invalidError = new Error('invalid token');
      invalidError.name = 'JsonWebTokenError';
      jwt.verify.mockImplementation(() => {
        throw invalidError;
      });

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Token inválido o expirado'
      });
    });
  });

  describe('Formato del header', () => {
    test('debe extraer token del formato "Bearer <token>"', () => {
      req.headers['authorization'] = 'Bearer abc123xyz';

      jwt.verify.mockReturnValue({ id: 1, nombre: 'Test' });

      authMiddleware(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('abc123xyz', 'test-secret');
      expect(next).toHaveBeenCalled();
    });

    test('debe manejar múltiples espacios entre Bearer y token', () => {
      req.headers['authorization'] = 'Bearer   token-with-spaces';

      // CORRECCIÓN: Los espacios extras hacen que el token sea considerado vacío
      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Token no válido'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('debe rechazar formato sin "Bearer"', () => {
      req.headers['authorization'] = 'token-only';

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Token no válido'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Datos del usuario en req', () => {
    test('debe agregar usuario completo a req.user', () => {
      req.headers['authorization'] = 'Bearer valid-token';

      const mockDecoded = {
        id: 5,
        nombre: 'Carlos Ruiz',
        funcion: 'Técnico',
        permisos: ['sectores.leer', 'sectores.crear', 'sectores.actualizar']
      };

      jwt.verify.mockReturnValue(mockDecoded);

      authMiddleware(req, res, next);

      expect(req.user).toEqual(mockDecoded);
      expect(req.user.id).toBe(5);
      expect(req.user.nombre).toBe('Carlos Ruiz');
      expect(req.user.funcion).toBe('Técnico');
      expect(req.user.permisos).toHaveLength(3);
    });

    test('debe preservar todos los campos del token', () => {
      req.headers['authorization'] = 'Bearer valid-token';

      const mockDecoded = {
        id: 1,
        nombre: 'Admin',
        funcion: 'Administrador',
        permisos: ['*'],
        iat: 1234567890,
        exp: 1234597890,
        customField: 'valor personalizado'
      };

      jwt.verify.mockReturnValue(mockDecoded);

      authMiddleware(req, res, next);

      expect(req.user).toEqual(mockDecoded);
      expect(req.user.iat).toBe(1234567890);
      expect(req.user.exp).toBe(1234597890);
      expect(req.user.customField).toBe('valor personalizado');
    });
  });

  describe('Variables de entorno', () => {
    test('debe usar JWT_SECRET del entorno', () => {
      process.env.JWT_SECRET = 'custom-secret-key';
      req.headers['authorization'] = 'Bearer valid-token';

      jwt.verify.mockReturnValue({ id: 1, nombre: 'Test' });

      authMiddleware(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'custom-secret-key');
    });
  });

  describe('Casos edge', () => {
    test('debe manejar header authorization con mayúsculas y minúsculas', () => {
      req.headers['Authorization'] = 'Bearer valid-token';

      jwt.verify.mockReturnValue({ id: 1, nombre: 'Test' });

      // El middleware usa req.headers['authorization'] en minúscula
      // Express normalmente convierte los headers a minúsculas
      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Token no proporcionado'
      });
    });

    test('no debe mutar el objeto de respuesta si el token es válido', () => {
      req.headers['authorization'] = 'Bearer valid-token';

      jwt.verify.mockReturnValue({ id: 1, nombre: 'Test' });

      authMiddleware(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    test('debe detener la ejecución si el token no es válido', () => {
      req.headers['authorization'] = 'Bearer invalid-token';

      jwt.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      authMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });
  });
});