
import 'dotenv/config';

const required = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
];

for (const key of required) {
  if (!process.env[key]) {
    console.warn(
      `[config] ${key} is not set; database routes will fail until configured.`
    );
  }
}

export const config = {
  port: Number(process.env.PORT || 5000),

  frontendUrl:
    process.env.FRONTEND_URL || 'http://localhost:5173',

  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceKey:
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  metaGraphVersion: process.env.META_GRAPH_VERSION || 'v23.0',
  metaPhoneNumberId: process.env.META_PHONE_NUMBER_ID || '',
  metaWabaId: process.env.META_WABA_ID || '',
  metaAccessToken: process.env.META_ACCESS_TOKEN || '',
  metaVerifyToken: process.env.META_VERIFY_TOKEN || '',
  metaAppSecret: process.env.META_APP_SECRET || '',

  maxImportRows: Number(process.env.MAX_IMPORT_ROWS || 5000),

  nodeEnv: process.env.NODE_ENV || 'development',
};
