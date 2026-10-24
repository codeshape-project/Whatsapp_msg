
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { config } from './config.js';
import { supabase } from './db.js';
import { requireAuth } from './middleware/auth.js';

import contacts from './routes/contacts.js';
import campaigns from './routes/campaigns.js';
import reports from './routes/reports.js';
import webhooks from './routes/webhooks.js';
import dashboard from './routes/dashboard.js';
import templates from './routes/templates.js';
import masterManagement from "./routes/masterManagement.js";
const app = express();

const allowedOrigins = (config.frontendUrl || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim().replace(/\/$/, ''));

// Middleware must be registered before API routes.
app.use(helmet());

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
      return callback(null, true);
    }

    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS','PUT'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-organization-id'
  ],
  optionsSuccessStatus: 204
}));

app.use('/api/webhooks', express.json({ limit: '1mb' }), webhooks);

app.use(express.json({ limit: '1mb' }));

app.use(
  '/api/',
  rateLimit({
    windowMs: 60_000,
    limit: 180,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'whatsapp-bulk-backend',
    databaseConfigured: Boolean(supabase),
    metaConfigured: Boolean(
      config.metaPhoneNumberId && config.metaAccessToken
    )
  });
});

app.get('/api/organizations', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('organization_members')
      .select('role,organizations(id,slug,name,type,location)')
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({
      data: (data || []).map(item => ({
        ...item.organizations,
        role: item.role
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Protected API routes
app.use('/api/dashboard', requireAuth, dashboard);
app.use('/api/contacts', requireAuth, contacts);
app.use('/api/campaigns', requireAuth, campaigns);
app.use('/api/templates', requireAuth, templates);
app.use('/api/reports', requireAuth, reports);
app.use("/api/master", requireAuth, masterManagement);
app.use((req, res) => {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.path}`
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);

  const status = err.status || err.statusCode || 500;

  res.status(status).json({
    error: status < 500
      ? err.message
      : 'Unexpected server error. Check backend logs.'
  });
});

export default app;
