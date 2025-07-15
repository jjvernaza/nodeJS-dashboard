const request = require('supertest');
const app = require('../../index');
const db = require('../../config/db');
const bcrypt = require('bcryptjs');

describe('SPRINT 1 - User Controller - VozIP', () => {
  let authToken;
  let adminUserId;

  beforeAll(async () => {
    // Conectar a la base de datos de pruebas
    await db.authenticate();
    
    // Login como admin para obtener token
    const loginResponse = await request(app)
      .post('/api/users/login')
      .send({
        user: 'admin',
        password: 'admin123'
      });
    
    if (loginResponse.status === 200) {
      authToken = loginResponse.body.token;
      adminUserId = loginResponse.body.user.id;
    }
  });

  beforeEach(async () => {
    // Limpiar usuarios de prueba antes de cada test
    await db.query('DELETE FROM usuarios WHERE usuario LIKE "testuser%"', { 
      type: db.QueryTypes.DELETE 
    });
  });

  afterAll(async () => {
    // Limpiar datos de prueba y cerrar conexión
    await db.query('DELETE FROM usuarios WHERE usuario LIKE "testuser%"', { 
      type: db.QueryTypes.DELETE 
    });
    await db.close();
  });

  describe('👥 User CRUD Operations', () => {
    it('should create new VozIP user successfully', async () => {
      const nuevoUsuario = {
        usuario: 'testuser001',
        password: 'password123',
        nombre: 'Juan Carlos',
        apellidos: 'Técnico VozIP',
        funcion: 'Técnico',
        telefono: '3001234567',
        email: 'juan.tecnico@vozip.co',
        especialidad: 'Instalación Rural',
        zonaAsignada: 'Dagua Valle del Cauca',
        fechaIngreso: new Date().toISOString()
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(nuevoUsuario)
        .expect(201);

      expect(response.body.message).toContain('Usuario creado');
      expect(response.body).toHaveProperty('userId');
      expect(response.body.usuario.nombre).toBe('Juan Carlos');
      expect(response.body.usuario.funcion).toBe('Técnico');
    });

    it('should get all VozIP users', async () => {
      // Crear algunos usuarios de prueba primero
      const usuarios = [
        {
          usuario: 'testuser002',
          password: 'password123',
          nombre: 'María',
          apellidos: 'Admin VozIP',
          funcion: 'Administrador'
        },
        {
          usuario: 'testuser003',
          password: 'password123',
          nombre: 'Carlos',
          apellidos: 'Empleado VozIP',
          funcion: 'Empleado'
        }
      ];

      for (const usuario of usuarios) {
        await request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${authToken}`)
          .send(usuario);
      }

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('usuarios');
      expect(Array.isArray(response.body.usuarios)).toBe(true);
      expect(response.body.usuarios.length).toBeGreaterThanOrEqual(2);
    });

    it('should get user by ID', async () => {
      // Crear usuario primero
      const usuario = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuario: 'testuser004',
          password: 'password123',
          nombre: 'Ana',
          apellidos: 'Soporte VozIP',
          funcion: 'Empleado',
          telefono: '3009876543'
        });

      const userId = usuario.body.userId;

      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.user.nombre).toBe('Ana');
      expect(response.body.user.apellidos).toBe('Soporte VozIP');
      expect(response.body.user.funcion).toBe('Empleado');
    });

    it('should update user information', async () => {
      // Crear usuario primero
      const usuario = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuario: 'testuser005',
          password: 'password123',
          nombre: 'Pedro',
          apellidos: 'Update Test',
          funcion: 'Empleado'
        });

      const userId = usuario.body.userId;

      const datosActualizacion = {
        nombre: 'Pedro Actualizado',
        funcion: 'Administrador',
        telefono: '3007654321',
        email: 'pedro.actualizado@vozip.co',
        especialidad: 'Gestión Rural',
        fechaActualizacion: new Date().toISOString()
      };

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(datosActualizacion)
        .expect(200);

      expect(response.body.message).toContain('Usuario actualizado exitosamente');

      // Verificar que los cambios se guardaron
      const userUpdated = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(userUpdated.body.user.nombre).toBe('Pedro Actualizado');
      expect(userUpdated.body.user.funcion).toBe('Administrador');
    });

    it('should change user password', async () => {
      // Crear usuario primero
      const usuario = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuario: 'testuser006',
          password: 'oldpassword123',
          nombre: 'Luis',
          apellidos: 'Password Test',
          funcion: 'Técnico'
        });

      const userId = usuario.body.userId;

      const response = await request(app)
        .put(`/api/users/${userId}/password`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          newPassword: 'newpassword456',
          confirmPassword: 'newpassword456'
        })
        .expect(200);

      expect(response.body.message).toContain('Contraseña actualizada exitosamente');

      // Verificar que puede hacer login con la nueva contraseña
      const loginTest = await request(app)
        .post('/api/users/login')
        .send({
          user: 'testuser006',
          password: 'newpassword456'
        })
        .expect(200);

      expect(loginTest.body).toHaveProperty('token');
    });

    it('should delete user', async () => {
      // Crear usuario primero
      const usuario = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuario: 'testuser007',
          password: 'password123',
          nombre: 'Delete',
          apellidos: 'Test User',
          funcion: 'Empleado'
        });

      const userId = usuario.body.userId;

      const response = await request(app)
        .delete(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toContain('Usuario eliminado exitosamente');

      // Verificar que el usuario ya no existe
      const userCheck = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(userCheck.body.error).toContain('Usuario no encontrado');
    });
  });

  describe('🔐 VozIP User Roles and Permissions', () => {
    it('should create admin user with full permissions', async () => {
      const adminUser = {
        usuario: 'admin_vozip_test',
        password: 'admin123',
        nombre: 'Administrador',
        apellidos: 'VozIP Principal',
        funcion: 'Administrador',
        permisos: ['dashboard', 'clientes', 'pagos', 'morosos', 'servicios', 'usuarios', 'reportes'],
        nivelAcceso: 'total',
        puedeEliminar: true,
        puedeCrearUsuarios: true
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(adminUser)
        .expect(201);

      expect(response.body.message).toContain('Usuario creado');
      expect(response.body.usuario.funcion).toBe('Administrador');
    });

    it('should create rural technician user with limited permissions', async () => {
      const techUser = {
        usuario: 'tecnico_rural_test',
        password: 'tecnico123',
        nombre: 'Carlos Eduardo',
        apellidos: 'Técnico Rural',
        funcion: 'Técnico',
        especialidad: 'Instalación Fibra Rural',
        zonaAsignada: 'Veredas Altas Dagua',
        permisos: ['clientes', 'servicios', 'visitas_tecnicas'],
        vehiculo: 'Moto Honda XR150',
        telefono: '3201234567',
        horarioServicio: '7:00 AM - 5:00 PM'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(techUser)
        .expect(201);

      expect(response.body.message).toContain('Usuario creado');
      expect(response.body.usuario.funcion).toBe('Técnico');
      expect(response.body.usuario.especialidad).toBe('Instalación Fibra Rural');
    });

    it('should create employee user with standard permissions', async () => {
      const employeeUser = {
        usuario: 'empleado_vozip_test',
        password: 'empleado123',
        nombre: 'María Isabel',
        apellidos: 'Atención Cliente',
        funcion: 'Empleado',
        area: 'Atención al Cliente',
        permisos: ['clientes', 'pagos', 'consultas'],
        turno: 'mañana',
        telefono: '3151234567',
        extension: '101'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(employeeUser)
        .expect(201);

      expect(response.body.message).toContain('Usuario creado');
      expect(response.body.usuario.funcion).toBe('Empleado');
      expect(response.body.usuario.area).toBe('Atención al Cliente');
    });

    it('should validate user role restrictions', async () => {
      // Crear usuario con función limitada
      const limitedUser = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuario: 'limited_user_test',
          password: 'limited123',
          nombre: 'Usuario',
          apellidos: 'Limitado',
          funcion: 'Empleado'
        });

      // Hacer login con usuario limitado
      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({
          user: 'limited_user_test',
          password: 'limited123'
        })
        .expect(200);

      const limitedToken = loginResponse.body.token;

      // Intentar realizar acción administrativa (debería fallar)
      const response = await request(app)
        .delete(`/api/users/${limitedUser.body.userId}`)
        .set('Authorization', `Bearer ${limitedToken}`)
        .expect(403);

      expect(response.body.error).toContain('permisos insuficientes');
    });
  });

  describe('❌ Error Handling and Validation', () => {
    it('should reject duplicate username', async () => {
      const usuario = {
        usuario: 'duplicate_test',
        password: 'password123',
        nombre: 'Usuario',
        apellidos: 'Duplicado',
        funcion: 'Empleado'
      };

      // Crear primer usuario
      await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(usuario)
        .expect(201);

      // Intentar crear usuario duplicado
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(usuario)
        .expect(400);

      expect(response.body.error).toContain('Usuario ya existe');
    });

    it('should validate required fields', async () => {
      const usuarioIncompleto = {
        usuario: 'incomplete_user',
        password: 'password123'
        // Faltan nombre, apellidos, funcion
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(usuarioIncompleto)
        .expect(400);

      expect(response.body.error).toContain('campos requeridos');
    });

    it('should validate password strength', async () => {
      const usuarioPasswordDebil = {
        usuario: 'weak_password_user',
        password: '123', // Contraseña muy débil
        nombre: 'Usuario',
        apellidos: 'Password Débil',
        funcion: 'Empleado'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(usuarioPasswordDebil)
        .expect(400);

      expect(response.body.error).toContain('contraseña debe tener');
    });

    it('should validate email format', async () => {
      const usuarioEmailInvalido = {
        usuario: 'invalid_email_user',
        password: 'password123',
        nombre: 'Usuario',
        apellidos: 'Email Inválido',
        funcion: 'Empleado',
        email: 'email-invalido-sin-arroba'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(usuarioEmailInvalido)
        .expect(400);

      expect(response.body.error).toContain('formato de email inválido');
    });

    it('should validate Colombian phone number format', async () => {
      const usuarioTelefonoInvalido = {
        usuario: 'invalid_phone_user',
        password: 'password123',
        nombre: 'Usuario',
        apellidos: 'Teléfono Inválido',
        funcion: 'Empleado',
        telefono: '123456' // Formato inválido
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(usuarioTelefonoInvalido)
        .expect(400);

      expect(response.body.error).toContain('formato de teléfono inválido');
    });

    it('should handle non-existent user ID', async () => {
      const response = await request(app)
        .get('/api/users/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toContain('Usuario no encontrado');
    });

    it('should require authorization for protected endpoints', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(401);

      expect(response.body.error).toContain('Token no proporcionado');
    });
  });

  describe('🔍 User Search and Filtering', () => {
    beforeEach(async () => {
      // Crear varios usuarios para las pruebas de búsqueda
      const usuariosPrueba = [
        {
          usuario: 'search_admin',
          password: 'password123',
          nombre: 'Admin',
          apellidos: 'Búsqueda',
          funcion: 'Administrador',
          area: 'Gerencia'
        },
        {
          usuario: 'search_tech',
          password: 'password123',
          nombre: 'Técnico',
          apellidos: 'Búsqueda',
          funcion: 'Técnico',
          especialidad: 'Fibra'
        },
        {
          usuario: 'search_emp',
          password: 'password123',
          nombre: 'Empleado',
          apellidos: 'Búsqueda',
          funcion: 'Empleado',
          area: 'Ventas'
        }
      ];

      for (const usuario of usuariosPrueba) {
        await request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${authToken}`)
          .send(usuario);
      }
    });

    it('should search users by name', async () => {
      const response = await request(app)
        .get('/api/users/search?nombre=Admin')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.usuarios).toBeDefined();
      expect(response.body.usuarios.length).toBeGreaterThan(0);
      expect(response.body.usuarios[0].nombre).toContain('Admin');
    });

    it('should filter users by function', async () => {
      const response = await request(app)
        .get('/api/users?funcion=Técnico')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.usuarios).toBeDefined();
      const tecnicos = response.body.usuarios.filter(u => u.funcion === 'Técnico');
      expect(tecnicos.length).toBeGreaterThan(0);
    });

    it('should get users by area', async () => {
      const response = await request(app)
        .get('/api/users?area=Ventas')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.usuarios).toBeDefined();
      const ventasUsers = response.body.usuarios.filter(u => u.area === 'Ventas');
      expect(ventasUsers.length).toBe(1);
    });
  });

  describe('📊 User Statistics', () => {
    it('should get user statistics', async () => {
      const response = await request(app)
        .get('/api/users/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalUsuarios');
      expect(response.body).toHaveProperty('usuariosPorFuncion');
      expect(response.body).toHaveProperty('usuariosActivos');
      expect(response.body).toHaveProperty('usuariosCreados30Dias');
      
      expect(typeof response.body.totalUsuarios).toBe('number');
      expect(Array.isArray(response.body.usuariosPorFuncion)).toBe(true);
    });

    it('should get active users count', async () => {
      const response = await request(app)
        .get('/api/users/active-count')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('usuariosActivos');
      expect(response.body).toHaveProperty('ultimaActividad');
      expect(typeof response.body.usuariosActivos).toBe('number');
    });
  });
});
