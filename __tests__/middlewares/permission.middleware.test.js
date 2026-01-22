const { 
  checkPermission, 
  checkAllPermissions, 
  isAdmin 
} = require('../../middlewares/permission.middleware');

describe('Permission Middleware', () => {
  let req, res, next;
  let consoleLogSpy, consoleErrorSpy;

  beforeEach(() => {
    req = {
      user: {
        id: 1,
        nombre: 'Juan Pérez',
        funcion: 'Administrador',
        permisos: ['usuarios.leer', 'usuarios.crear', 'clientes.leer']
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
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

  describe('checkPermission', () => {
    describe('Con permisos válidos', () => {
      test('debe permitir acceso con un solo permiso requerido (string)', () => {
        const middleware = checkPermission('usuarios.leer');

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining('Permiso concedido')
        );
      });

      test('debe permitir acceso con un solo permiso requerido (array)', () => {
        const middleware = checkPermission(['usuarios.crear']);

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });

      test('debe permitir acceso si tiene al menos uno de los permisos requeridos', () => {
        const middleware = checkPermission(['usuarios.leer', 'usuarios.eliminar']);

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });

      test('debe permitir acceso con múltiples permisos donde tiene uno', () => {
        const middleware = checkPermission([
          'permisos.gestionar',
          'usuarios.crear',
          'clientes.eliminar'
        ]);

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });

      test('debe loguear información de verificación', () => {
        const middleware = checkPermission('usuarios.leer');

        middleware(req, res, next);

        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining('Verificando permisos')
        );
        expect(consoleLogSpy).toHaveBeenCalledWith('   Usuario:', 'Juan Pérez');
        expect(consoleLogSpy).toHaveBeenCalledWith(
          '   Permisos requeridos:',
          ['usuarios.leer']
        );
        expect(consoleLogSpy).toHaveBeenCalledWith(
          '   Permisos del usuario:',
          expect.any(Array)
        );
      });
    });

    describe('Sin permisos válidos', () => {
      test('debe denegar acceso si no tiene el permiso requerido', () => {
        const middleware = checkPermission('usuarios.eliminar');

        middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          message: 'No tienes permisos suficientes para realizar esta acción',
          permisosRequeridos: ['usuarios.eliminar'],
          permisosUsuario: req.user.permisos
        });
      });

      test('debe denegar acceso si no tiene ninguno de los permisos requeridos', () => {
        const middleware = checkPermission([
          'usuarios.eliminar',
          'permisos.gestionar',
          'sistema.configurar'
        ]);

        middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          message: 'No tienes permisos suficientes para realizar esta acción',
          permisosRequeridos: expect.any(Array),
          permisosUsuario: req.user.permisos
        });
      });

      test('debe loguear acceso denegado', () => {
        const middleware = checkPermission('usuarios.eliminar');

        middleware(req, res, next);

        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining('Acceso denegado')
        );
      });
    });

    describe('Usuario sin permisos', () => {
      test('debe manejar usuario sin array de permisos', () => {
        req.user.permisos = undefined;
        const middleware = checkPermission('usuarios.leer');

        middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
      });

      test('debe manejar usuario con array de permisos vacío', () => {
        req.user.permisos = [];
        const middleware = checkPermission('usuarios.leer');

        middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
      });

      test('debe manejar usuario con permisos null', () => {
        req.user.permisos = null;
        const middleware = checkPermission('usuarios.leer');

        middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
      });
    });

    describe('Casos edge', () => {
      test('debe manejar permiso vacío como string', () => {
        const middleware = checkPermission('');

        middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
      });

      test('debe manejar array vacío de permisos requeridos', () => {
        const middleware = checkPermission([]);

        middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
      });

      test('debe ser case-sensitive en permisos', () => {
        const middleware = checkPermission('USUARIOS.LEER');

        middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
      });

      test('debe manejar errores inesperados', () => {
        req.user = null; // Esto causará un error al acceder a req.user.permisos
        const middleware = checkPermission('usuarios.leer');

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Error al verificar permisos'
        });
        expect(consoleErrorSpy).toHaveBeenCalled();
      });
    });
  });

  describe('checkAllPermissions', () => {
    describe('Con todos los permisos', () => {
      test('debe permitir acceso si tiene todos los permisos requeridos', () => {
        const middleware = checkAllPermissions(['usuarios.leer', 'usuarios.crear']);

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });

      test('debe permitir acceso con un solo permiso requerido', () => {
        const middleware = checkAllPermissions(['usuarios.leer']);

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });

      test('debe permitir acceso con tres permisos que tiene', () => {
        const middleware = checkAllPermissions([
          'usuarios.leer',
          'usuarios.crear',
          'clientes.leer'
        ]);

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });
    });

    describe('Sin todos los permisos', () => {
      test('debe denegar acceso si falta un permiso', () => {
        const middleware = checkAllPermissions([
          'usuarios.leer',
          'usuarios.eliminar'
        ]);

        middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          message: 'No tienes todos los permisos necesarios para realizar esta acción',
          permisosRequeridos: ['usuarios.leer', 'usuarios.eliminar'],
          permisosUsuario: req.user.permisos
        });
      });

      test('debe denegar acceso si no tiene ninguno de los permisos', () => {
        const middleware = checkAllPermissions([
          'sistema.configurar',
          'permisos.gestionar'
        ]);

        middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
      });

      test('debe denegar si tiene solo algunos de los permisos', () => {
        const middleware = checkAllPermissions([
          'usuarios.leer',
          'usuarios.crear',
          'usuarios.actualizar',
          'usuarios.eliminar'
        ]);

        middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
      });
    });

    describe('Casos edge', () => {
      test('debe denegar acceso con array vacío de permisos de usuario', () => {
        req.user.permisos = [];
        const middleware = checkAllPermissions(['usuarios.leer']);

        middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
      });

      test('debe denegar acceso si usuario no tiene array de permisos', () => {
        req.user.permisos = undefined;
        const middleware = checkAllPermissions(['usuarios.leer']);

        middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
      });

      test('debe manejar errores inesperados', () => {
        req.user = null;
        const middleware = checkAllPermissions(['usuarios.leer']);

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Error al verificar permisos'
        });
        expect(consoleErrorSpy).toHaveBeenCalled();
      });
    });
  });

  describe('isAdmin', () => {
    describe('Usuarios administradores', () => {
      test('debe permitir acceso a Administrador', () => {
        req.user.funcion = 'Administrador';

        isAdmin(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });

      test('debe permitir acceso a Gerente', () => {
        req.user.funcion = 'Gerente';

        isAdmin(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });

      test('debe permitir acceso a Admin', () => {
        req.user.funcion = 'Admin';

        isAdmin(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });

      test('debe permitir acceso usando campo Funcion con mayúscula', () => {
        delete req.user.funcion;
        req.user.Funcion = 'Administrador';

        isAdmin(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });
    });

    describe('Usuarios no administradores', () => {
      test('debe denegar acceso a Operador', () => {
        req.user.funcion = 'Operador';

        isAdmin(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Esta acción requiere permisos de administrador'
        });
      });

      test('debe denegar acceso a Técnico', () => {
        req.user.funcion = 'Técnico';

        isAdmin(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
      });

      test('debe denegar acceso a Supervisor', () => {
        req.user.funcion = 'Supervisor';

        isAdmin(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
      });

      test('debe denegar acceso a Usuario', () => {
        req.user.funcion = 'Usuario';

        isAdmin(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
      });
    });

    describe('Casos edge', () => {
      test('debe denegar acceso si no hay función definida', () => {
        req.user.funcion = undefined;
        req.user.Funcion = undefined;

        isAdmin(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
      });

      test('debe denegar acceso con función vacía', () => {
        req.user.funcion = '';

        isAdmin(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
      });

      test('debe denegar acceso con función null', () => {
        req.user.funcion = null;

        isAdmin(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
      });

      test('debe ser case-sensitive con roles', () => {
        req.user.funcion = 'administrador'; // minúscula

        isAdmin(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
      });

      test('debe denegar acceso con rol similar pero incorrecto', () => {
        req.user.funcion = 'Administrador General';

        isAdmin(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
      });

      test('debe manejar errores inesperados', () => {
        req.user = null;

        isAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Error al verificar permisos de administrador'
        });
        expect(consoleErrorSpy).toHaveBeenCalled();
      });
    });
  });

  describe('Integración entre middlewares', () => {
    test('checkPermission debe funcionar después de autenticación', () => {
      // Simular que el usuario viene de authMiddleware
      req.user = {
        id: 1,
        nombre: 'Usuario Autenticado',
        permisos: ['clientes.leer']
      };

      const middleware = checkPermission('clientes.leer');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('isAdmin debe funcionar con usuario de authMiddleware', () => {
      req.user = {
        id: 1,
        nombre: 'Admin Usuario',
        funcion: 'Administrador'
      };

      isAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('múltiples permisos en cadena', () => {
      const middleware1 = checkPermission('usuarios.leer');
      const middleware2 = checkPermission('usuarios.crear');

      middleware1(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);

      jest.clearAllMocks();
      middleware2(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});