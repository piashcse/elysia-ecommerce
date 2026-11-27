import app from './server';
import envConfig from './config/env';
import { emailService } from './modules/notification/service/EmailService';

if (import.meta.main) {
  const PORT = envConfig.PORT;

  app.listen(PORT, () => {
    console.log(`Elysia E-commerce server is running on port ${PORT}`);
    console.log(`Environment: ${envConfig.NODE_ENV}`);
    console.log(`Swagger UI available at http://localhost:${PORT}/swagger`);

    if (envConfig.EMAIL_WORKER_ENABLED) {
      emailService.startWorker();
      console.log(`Email worker started (interval: ${envConfig.EMAIL_WORKER_INTERVAL_MS}ms)`);
    }
  });
}

export default app;
