/**
 * Structured logging for cart, payment, and error tracking
 * Supports dev console and production error tracking (e.g., Sentry)
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

interface LogContext {
  userId?: string;
  cartId?: string;
  orderId?: string;
  requestId?: string;
  [key: string]: any;
}

class Logger {
  private isDev = process.env.NODE_ENV === 'development';

  private formatLog(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      context,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: this.isDev ? error.stack : undefined,
        },
      }),
    };
    return logEntry;
  }

  debug(message: string, context?: LogContext) {
    const entry = this.formatLog(LogLevel.DEBUG, message, context);
    if (this.isDev) console.log(JSON.stringify(entry));
  }

  info(message: string, context?: LogContext) {
    const entry = this.formatLog(LogLevel.INFO, message, context);
    console.log(JSON.stringify(entry));
  }

  warn(message: string, context?: LogContext, error?: Error) {
    const entry = this.formatLog(LogLevel.WARN, message, context, error);
    console.warn(JSON.stringify(entry));
  }

  error(message: string, error: Error, context?: LogContext) {
    const entry = this.formatLog(LogLevel.ERROR, message, context, error);
    console.error(JSON.stringify(entry));
    
    // TODO: Send to Sentry or external logging service
    // if (!this.isDev) {
    //   captureException(error, { extra: context });
    // }
  }

  fatal(message: string, error: Error, context?: LogContext) {
    const entry = this.formatLog(LogLevel.FATAL, message, context, error);
    console.error(JSON.stringify(entry));
    
    // TODO: Send to Sentry with high priority
    // captureException(error, { level: 'fatal', extra: context });
  }
}

export const logger = new Logger();
