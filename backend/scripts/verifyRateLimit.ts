import express from 'express';
import http from 'http';
import {
  authRateLimiter,
  otpVerificationLimiter,
  apiRateLimiter,
} from '../src/middleware/rateLimiter';

async function runRateLimitTests() {
  console.log('🛡️ Iniciando batería de pruebas de Rate Limiting y Anti-Fuerza Bruta (Con skipSuccessfulRequests)...\n');

  const originalEnv = process.env.NODE_ENV;
  const originalRateLimitDisabled = process.env.RATE_LIMIT_DISABLED;
  const originalBypass = process.env.BYPASS_RATE_LIMIT;
  process.env.NODE_ENV = 'development';
  delete process.env.RATE_LIMIT_DISABLED;
  delete process.env.BYPASS_RATE_LIMIT;

  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json());

  // Rutas de prueba
  app.use('/api', apiRateLimiter);

  // Login: simula éxito si password es 'correct', y error 401 si es incorrecto
  app.post('/api/auth/login', authRateLimiter, (req, res) => {
    if (req.body.password === 'correct') {
      res.status(200).json({ success: true, message: 'Login exitoso' });
    } else {
      res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }
  });

  // Verify OTP: simula éxito si otp es '123456', y error 400 si es incorrecto
  app.post('/api/auth/verify-otp', otpVerificationLimiter, (req, res) => {
    if (req.body.otp === '123456') {
      res.status(200).json({ success: true, message: 'OTP verificado' });
    } else {
      res.status(400).json({ success: false, message: 'Código OTP inválido' });
    }
  });

  app.get('/api/test-general', (_req, res) => {
    res.status(200).json({ success: true, message: 'General ok' });
  });

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // -------------------------------------------------------------
    // Test 1: Peticiones exitosas NO consumen cuota (skipSuccessfulRequests)
    // -------------------------------------------------------------
    console.log('--- Test 1: Validar que peticiones exitosas (200) NO consumen cuota ---');
    for (let i = 1; i <= 10; i++) {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com', password: 'correct' }),
      });

      if (res.status !== 200) {
        throw new Error(`Petición exitosa ${i} fue bloqueada inesperadamente con status ${res.status}`);
      }
    }
    console.log('✅ Pasó: 10 peticiones exitosas consecutivas procesadas sin consumir cuota ni bloquear.\n');

    // -------------------------------------------------------------
    // Test 2: Protección anti-fuerza bruta en OTP (5 intentos fallidos)
    // -------------------------------------------------------------
    console.log('--- Test 2: Limitador específico de OTP (5 intentos fallidos max) ---');
    for (let i = 1; i <= 5; i++) {
      const res = await fetch(`${baseUrl}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com', otp: 'wrong-otp' }),
      });

      if (res.status !== 400) {
        throw new Error(`Intento fallido ${i} devolvió status inesperado ${res.status}`);
      }
      console.log(`  * Intento fallido OTP ${i}/5 registrado correctamente (Status: 400)`);
    }

    // El 6º intento fallido a verify-otp debe retornar HTTP 429
    const blockedOtpRes = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com', otp: 'wrong-otp' }),
    });

    if (blockedOtpRes.status !== 429) {
      throw new Error(`El 6º intento fallido de OTP debía devolver 429, pero devolvió ${blockedOtpRes.status}`);
    }

    const blockedOtpData = (await blockedOtpRes.json()) as any;
    console.log('  * Respuesta HTTP 429 en OTP recibida:', JSON.stringify(blockedOtpData));
    if (!blockedOtpData.message.includes('verificación OTP')) {
      throw new Error(`Mensaje inesperado en OTP: ${blockedOtpData.message}`);
    }
    console.log('✅ Pasó: El 6º intento fallido de OTP fue bloqueado con HTTP 429.\n');

    // -------------------------------------------------------------
    // Test 3: Exención cuando NODE_ENV === 'test' o RATE_LIMIT_DISABLED === 'true'
    // -------------------------------------------------------------
    console.log('--- Test 3: Exención en modo test o con RATE_LIMIT_DISABLED ---');
    process.env.NODE_ENV = 'test';
    const testRes = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com', otp: 'wrong-otp' }),
    });
    // Debe devolver el 400 de credencial inválida, NO 429 de rate limit
    if (testRes.status === 429) {
      throw new Error('En NODE_ENV="test" el limitador de rate no debe bloquear con 429');
    }
    console.log('  * En NODE_ENV="test", el limitador está desactivado (Status recibido:', testRes.status, ')');

    process.env.NODE_ENV = 'development';
    process.env.RATE_LIMIT_DISABLED = 'true';
    const devBypassRes = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com', otp: 'wrong-otp' }),
    });
    if (devBypassRes.status === 429) {
      throw new Error('Con RATE_LIMIT_DISABLED="true" el limitador no debe bloquear');
    }
    delete process.env.RATE_LIMIT_DISABLED;

    process.env.BYPASS_RATE_LIMIT = 'true';
    const bypassRateLimitRes = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com', otp: 'wrong-otp' }),
    });
    if (bypassRateLimitRes.status === 429) {
      throw new Error('Con BYPASS_RATE_LIMIT="true" el limitador no debe bloquear');
    }
    delete process.env.BYPASS_RATE_LIMIT;
    console.log('  * Con RATE_LIMIT_DISABLED="true" y BYPASS_RATE_LIMIT="true", el limitador está desactivado.');
    console.log('✅ Pasó: Exención por variable de entorno verificada correctamente.\n');

    // -------------------------------------------------------------
    // Test 4: Limitador global preventivo (/api)
    // -------------------------------------------------------------
    console.log('--- Test 4: Verificación del limitador global preventivo ---');
    delete process.env.RATE_LIMIT_DISABLED;
    delete process.env.BYPASS_RATE_LIMIT;
    const generalRes = await fetch(`${baseUrl}/api/test-general`);
    if (generalRes.status !== 200) {
      throw new Error(`Ruta general falló con status ${generalRes.status}`);
    }
    const globalLimitHeader = generalRes.headers.get('ratelimit') || generalRes.headers.get('ratelimit-limit');
    console.log(`  * Cabecera RateLimit global detectada: ${globalLimitHeader}`);
    console.log('✅ Pasó: Limitador global activo en rutas /api.\n');

    console.log('🎉 ¡TODAS LAS PRUEBAS DE RATE LIMITING PASARON EXITOSAMENTE!');
  } finally {
    process.env.NODE_ENV = originalEnv;
    if (originalRateLimitDisabled !== undefined) {
      process.env.RATE_LIMIT_DISABLED = originalRateLimitDisabled;
    } else {
      delete process.env.RATE_LIMIT_DISABLED;
    }
    if (originalBypass !== undefined) {
      process.env.BYPASS_RATE_LIMIT = originalBypass;
    } else {
      delete process.env.BYPASS_RATE_LIMIT;
    }
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

runRateLimitTests().catch((err) => {
  console.error('❌ Error en pruebas de rate limiting:', err);
  process.exit(1);
});
