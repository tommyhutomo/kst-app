import { neon } from '@neondatabase/serverless';

let sql;

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not configured');
  }
  if (!sql) {
    sql = neon(url);
  }
  return sql;
}
