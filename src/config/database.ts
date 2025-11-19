import { DataSource } from 'typeorm';
import envConfig from './env';
import { User } from '../modules/user/entity/User';
import { VerificationCode } from '../modules/auth/entity/VerificationCode';
import { Product } from '../modules/product/entity/Product';
import { Category } from '../modules/category/entity/Category';
import { Cart } from '../modules/cart/entity/Cart';
import { CartItem } from '../modules/cart/entity/CartItem';
import { Wishlist } from '../modules/wishlist/entity/Wishlist';
import { Order } from '../modules/order/entity/Order';
import { OrderItem } from '../modules/order/entity/OrderItem';
import { Payment } from '../modules/payment/entity/Payment';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: envConfig.DB_HOST,
  port: envConfig.DB_PORT,
  username: envConfig.DB_USER,
  password: envConfig.DB_PASSWORD,
  database: envConfig.DB_NAME,
  synchronize: envConfig.NODE_ENV === 'development', // Auto-create tables in development
  logging: envConfig.NODE_ENV !== 'production' ? ['error', 'warn', 'schema'] : false, // Only log errors, warnings and schema changes, not queries
  entities: [
    User,
    VerificationCode,
    Product,
    Category,
    Cart,
    CartItem,
    Wishlist,
    Order,
    OrderItem,
    Payment
  ],
  migrations: ['./src/database/migrations/*.ts', './src/database/migrations/*.js'],
  subscribers: [],
});

export const connectDB = async (): Promise<void> => {
  try {
    console.log(`Attempting to connect to database: ${envConfig.DB_NAME}`);
    console.log(`Environment: ${envConfig.NODE_ENV}`);
    console.log(`Host: ${envConfig.DB_HOST}`);
    console.log(`User: ${envConfig.DB_USER}`);

    await AppDataSource.initialize();
    console.log(`Connected to PostgreSQL database: ${envConfig.DB_NAME}`);

    if (envConfig.NODE_ENV !== 'development') {
      // In non-development environments, run migrations instead of synchronize
      const migrations = await AppDataSource.runMigrations({ transaction: 'each' });
      if (migrations.length > 0) {
        console.log(`${migrations.length} migration(s) were run successfully`);
      } else {
        console.log('No pending migrations to run');
      }
    } else {
      console.log('Database schema synchronization enabled for development');
    }
  } catch (error) {
    console.error('Error connecting to database:', error);
    process.exit(1);
  }
};