describe('SPRINT 1 - Auth Middleware - VozIP', () => {
    const express = require('express');
    const authMiddleware = require('../../../middlewares/auth');
  
    const app = express();
    app.use(express.json());
    app.get('/protected', authMiddleware, (req, res) => {
      res.json({ message: 'Access granted', user: req.user });
    });
  
    describe('🔒 Token Validation', () => {
      it('should allow access with valid token', async () => {
        const token = jwt.sign(
          { id: 1, usuario: 'testuser' },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );
  
        const response = await request(app)
          .get('/protected')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);
  
        expect(response.body.message).toBe('Access granted');
        expect(response.body.user).toHaveProperty('id', 1);
      });
  
      it('should reject invalid token', async () => {
        const response = await request(app)
          .get('/protected')
          .set('Authorization', 'Bearer invalidtoken')
          .expect(401);
  
        expect(response.body.error).toContain('Token inválido');
      });
  
      it('should reject missing token', async () => {
        const response = await request(app)
          .get('/protected')
          .expect(401);
  
        expect(response.body.error).toContain('Token no proporcionado');
      });
    });
  });