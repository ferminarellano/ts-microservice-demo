import 'dotenv/config';
import express from 'express';
import { createApiRoutes } from './routes/index.js';
import { errorHandler } from './middlewares/index.js';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', createApiRoutes());

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(port, () => {
  console.log(`🚀 Engage Microservice listening on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔍 DaXtra Base URL: ${process.env.DAXTRA_BASE_URL}`);
  console.log(`⚡ Turbo Mode: ${process.env.DAXTRA_TURBO === 'true' ? 'Enabled' : 'Disabled'}`);
});

export default app;
