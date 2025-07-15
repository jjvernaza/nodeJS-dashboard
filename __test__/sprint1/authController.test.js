const request = require('supertest');
const app = require('../../index');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('SPRINT 1 - Auth Controller - VozIP', () => {
  beforeEach(async () => {
    // Limpiar usuarios de prueba
    await db.query('DELETE FROM usuarios WHERE usuario LIKE "test%"', { type: db.QueryTypes.DELETE });
  });

  describe('🔐 User Authentication', () => {
    beforeEach(async () => {
      // Crear usuario de prueba
      const hashedPassword = await bcrypt.hash('test123', 10);
      await db.query(`
        INSERT INTO usuarios (usuario, password, nombre, apellidos, funcion)
        VALUES ('testuser', ?, 'Test', 'User', 'Administrador')
      `, { replacements: [hashedPassword], type: db.QueryTypes.INSERT });
    });

    it('should login VozIP user successfully', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          user: 'testuser',
          password: 'test123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.message).toBe('Login exitoso');
      expect(response.body.user.funcion).toBe('Administrador');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          user: 'testuser',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.error).toContain('Credenciales incorrectas');
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          user: 'nonexistent',
          password: 'password'
        })
        .expect(401);

      expect(response.body.error).toContain('Usuario no encontrado');
    });
  });

  describe('🔒 Token Management', () => {
    it('should verify valid token', async () => {
      const token = jwt.sign(
        { id: 1, usuario: 'testuser' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/users/verify-token')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.message).toBe('Token válido');
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/users/verify-token')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401);

      expect(response.body.error).toContain('Token inválido');
    });

    it('should reject missing token', async () => {
      const response = await request(app)
        .get('/api/users/verify-token')
        .expect(401);

      expect(response.body.error).toContain('Token no proporcionado');
    });
  });
});