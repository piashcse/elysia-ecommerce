import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

const quoteIdent = (value: string) => `"${value.replace(/"/g, '""')}"`;

const host = process.env.DB_HOST || 'localhost';
const port = Number(process.env.DB_PORT || 5432);
const user = process.env.DB_USER || process.env.DB_USERNAME || 'postgres';
const password = process.env.DB_PASSWORD || 'postgres';
const testDbName = process.env.TEST_DB_NAME || 'elysia_ecom_test';

const adminPool = new Pool({ host, port, user, password, database: 'postgres' });

try {
  const existing = await adminPool.query('SELECT 1 FROM pg_database WHERE datname = $1', [testDbName]);
  if (existing.rowCount === 0) {
    await adminPool.query(`CREATE DATABASE ${quoteIdent(testDbName)}`);
    console.log(`Created test database: ${testDbName}`);
  }
} catch (error) {
  if ((error as { code?: string }).code !== '42P04') throw error;
} finally {
  await adminPool.end();
}

const testPool = new Pool({ host, port, user, password, database: testDbName });

try {
  await migrate(drizzle(testPool), { migrationsFolder: './drizzle' });

  const tables = await testPool.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
  );

  if (tables.rowCount > 0) {
    const tableList = tables.rows.map((row) => quoteIdent(row.tablename)).join(', ');
    await testPool.query(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`);
  }

  console.log(`Test database ready: ${testDbName}`);
} finally {
  await testPool.end();
}
