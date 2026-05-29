/**
 * One-time migration: add observacoes, data_inicio, data_fim to metas table
 * Usage: node scripts/migrate-metas.js
 *
 * Requires DATABASE_URL in .env.local, OR run this SQL directly in the
 * Supabase SQL editor (https://supabase.com/dashboard/project/illdogzzppugofspihot/sql/new):
 *
 *   ALTER TABLE metas ADD COLUMN IF NOT EXISTS observacoes TEXT;
 *   ALTER TABLE metas ADD COLUMN IF NOT EXISTS data_inicio DATE;
 *   ALTER TABLE metas ADD COLUMN IF NOT EXISTS data_fim DATE;
 *   ALTER TABLE metas DROP CONSTRAINT IF EXISTS metas_tipo_check;
 *   ALTER TABLE metas ADD CONSTRAINT metas_tipo_check CHECK (tipo IN ('mensal', 'anual', 'periodo'));
 */

// Attempt via Supabase REST API (service role key)
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local')
const env = {}
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=')
    if (k && v.length) env[k.trim()] = v.join('=').trim()
  })
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

console.log('\n📦 Guedes CRM — Metas Migration\n')
console.log('Could not run automatically via REST API (DDL requires direct DB access).')
console.log('\n✅ Run this SQL in the Supabase SQL editor:')
console.log('   https://supabase.com/dashboard/project/illdogzzppugofspihot/sql/new\n')
console.log('─'.repeat(60))
console.log(`ALTER TABLE metas ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE metas ADD COLUMN IF NOT EXISTS data_inicio DATE;
ALTER TABLE metas ADD COLUMN IF NOT EXISTS data_fim DATE;
ALTER TABLE metas DROP CONSTRAINT IF EXISTS metas_tipo_check;
ALTER TABLE metas ADD CONSTRAINT metas_tipo_check
  CHECK (tipo IN ('mensal', 'anual', 'periodo'));`)
console.log('─'.repeat(60))
console.log('\nAfter running the SQL, all Metas features will be fully active.')
