import { logger as elysiaLogger } from '@bogeychan/elysia-logger';
import { Elysia } from 'elysia';
import fs from 'fs';
import path from 'path';
import envConfig from '../../config/env';

export interface LogMetadata {
  userId?: string;
  requestId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  route?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  error?: any;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  metadata?: LogMetadata;
  stack?: string;
}

export class LoggerUtil {
  private static instance: LoggerUtil;
  private logger: any | null = null;
  private logLevel: string;
  private logToFile: boolean;
  private logFilePath: string;

  private constructor() {
    this.logLevel = envConfig.LOG_LEVEL || 'info';
    this.logToFile = envConfig.LOG_TO_FILE === 'true';
    this.logFilePath = envConfig.LOG_FILE_PATH || './logs/app.log';
    
    // Create logs directory if it doesn't exist
    if (this.logToFile) {
      const logDir = path.dirname(this.logFilePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    }
  }

  public static getInstance(): LoggerUtil {
    if (!LoggerUtil.instance) {
      LoggerUtil.instance = new LoggerUtil();
    }
    return LoggerUtil.instance;
  }

  public initializeLogger(app: Elysia): Elysia {
    this.logger = app.use(
      elysiaLogger({
        level: this.logLevel as any,
        autoLogging: {
          ignore: (ctx) => {
            // Ignore health check and server-sent events endpoints from logging
            return ctx.path === '/health' || ctx.path.includes('__server_sent_events__');
          }
        },
        customProps: (ctx) => {
          return {
            path: ctx.path,
            method: ctx.request.method,
            userAgent: ctx.request.headers.get('user-agent'),
            ip: ctx.request.headers.get('x-forwarded-for') || ctx.request.headers.get('x-real-ip') || 'unknown',
          };
        }
      })
    );
    
    return app;
  }

  public log(level: 'info' | 'warn' | 'error' | 'debug', message: string, metadata?: LogMetadata): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata
    };

    // Add stack trace for error logs
    if (level === 'error' && metadata?.error && metadata.error.stack) {
      logEntry.stack = metadata.error.stack;
    }

    // Log to console
    console[level](`[${logEntry.timestamp}] [${level.toUpperCase()}] ${message}`, metadata || {});

    // Log to file if enabled
    if (this.logToFile) {
      this.writeToFile(logEntry);
    }
  }

  public info(message: string, metadata?: LogMetadata): void {
    this.log('info', message, metadata);
  }

  public warn(message: string, metadata?: LogMetadata): void {
    this.log('warn', message, metadata);
  }

  public error(message: string, error?: Error | any, metadata?: LogMetadata): void {
    const errorMetadata = {
      ...metadata,
      error: error ? { name: error.name, message: error.message } : undefined
    };
    this.log('error', message, errorMetadata);
  }

  public debug(message: string, metadata?: LogMetadata): void {
    if (this.logLevel === 'debug') {
      this.log('debug', message, metadata);
    }
  }

  private writeToFile(logEntry: LogEntry): void {
    try {
      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(this.logFilePath, logLine);
    } catch (err) {
      console.error('Failed to write log to file:', err);
    }
  }

  public createRequestLogger(): (req: Request, res: Response, next: Function) => void {
    return (req: any, res: any, next: Function) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const metadata: LogMetadata = {
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          route: req.route?.path || req.path,
          method: req.method,
          statusCode: res.statusCode,
          duration
        };
        
        const level = res.statusCode >= 400 ? 'warn' : 'info';
        this.log(level, `Request completed: ${req.method} ${req.path}`, metadata);
      });
      
      this.info(`Request started: ${req.method} ${req.path}`, {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        route: req.route?.path || req.path,
        method: req.method
      });
      
      next();
    };
  }

  public createPerformanceLogger(operationName: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      this.info(`${operationName} completed`, { duration });
    };
  }
}

// Export a singleton instance
export const logger = LoggerUtil.getInstance();