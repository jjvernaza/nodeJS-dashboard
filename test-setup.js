const dotenv = require('dotenv');

// Cargar variables de entorno para testing
dotenv.config({ path: '.env.test' });

// Mock de console para pruebas más limpias
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Configuración global para Jest
beforeAll(async () => {
  // Configuración inicial
});

afterAll(async () => {
  // Limpieza final
});
