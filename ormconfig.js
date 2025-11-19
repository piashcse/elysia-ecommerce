module.exports = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'ecommerce_db',
  synchronize: false,
  logging: false,
  entities: [
    './src/modules/**/*.entity.{ts,js}'
  ],
  migrations: [
    './src/database/migrations/*.js',
    './src/database/migrations/*.ts'
  ],
  subscribers: [],
};
