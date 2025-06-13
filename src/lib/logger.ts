interface LogContext {
  [key: string]: any;
}

interface LogMetadata {
  timestamp: string;
  level: LogLevel;
  service: string;
  environment: string;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  correlationId?: string;
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

interface LogEntry extends LogMetadata {
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  performance?: {
    duration: number;
    memory: NodeJS.MemoryUsage;
  };
}

class Logger {
  private service: string;
  private environment: string;
  private requestId?: string;
  private userId?: string;
  private sessionId?: string;
  private correlationId?: string;

  constructor(service: string = 'risedial-app') {
    this.service = service;
    this.environment = process.env.NODE_ENV || 'development';
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      environment: this.environment,
      message,
      requestId: this.requestId,
      userId: this.userId,
      sessionId: this.sessionId,
      correlationId: this.correlationId,
    };

    if (context) {
      entry.context = context;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      };
    }

    return entry;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      critical: 4,
    };

    const currentLevel = process.env.LOG_LEVEL as LogLevel || 'info';
    return levels[level] >= levels[currentLevel];
  }

  private writeLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    const output = JSON.stringify(entry);

    // In production, you might want to send to external logging service
    // For now, using console with appropriate methods
    switch (entry.level) {
      case 'debug':
        console.debug(output);
        break;
      case 'info':
        console.info(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'error':
      case 'critical':
        console.error(output);
        break;
    }

    // In production, send critical errors to monitoring service
    if (entry.level === 'critical' && this.environment === 'production') {
      this.sendToMonitoring(entry);
    }
  }

  private async sendToMonitoring(entry: LogEntry): Promise<void> {
    // Implement your monitoring service integration here
    // Examples: Sentry, DataDog, New Relic, etc.
    try {
      // Example placeholder for monitoring service
      if (process.env.MONITORING_WEBHOOK_URL) {
        await fetch(process.env.MONITORING_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            alert: 'Critical Error',
            service: entry.service,
            environment: entry.environment,
            message: entry.message,
            error: entry.error,
            timestamp: entry.timestamp,
          }),
        });
      }
    } catch (monitoringError) {
      console.error('Failed to send to monitoring service:', monitoringError);
    }
  }

  // Context setters for request tracking
  setRequestId(requestId: string): Logger {
    const newLogger = new Logger(this.service);
    newLogger.environment = this.environment;
    newLogger.requestId = requestId;
    newLogger.userId = this.userId;
    newLogger.sessionId = this.sessionId;
    newLogger.correlationId = this.correlationId;
    return newLogger;
  }

  setUserId(userId: string): Logger {
    const newLogger = new Logger(this.service);
    newLogger.environment = this.environment;
    newLogger.requestId = this.requestId;
    newLogger.userId = userId;
    newLogger.sessionId = this.sessionId;
    newLogger.correlationId = this.correlationId;
    return newLogger;
  }

  setSessionId(sessionId: string): Logger {
    const newLogger = new Logger(this.service);
    newLogger.environment = this.environment;
    newLogger.requestId = this.requestId;
    newLogger.userId = this.userId;
    newLogger.sessionId = sessionId;
    newLogger.correlationId = this.correlationId;
    return newLogger;
  }

  setCorrelationId(correlationId: string): Logger {
    const newLogger = new Logger(this.service);
    newLogger.environment = this.environment;
    newLogger.requestId = this.requestId;
    newLogger.userId = this.userId;
    newLogger.sessionId = this.sessionId;
    newLogger.correlationId = correlationId;
    return newLogger;
  }

  // Logging methods
  debug(message: string, context?: LogContext): void {
    this.writeLog(this.createLogEntry('debug', message, context));
  }

  info(message: string, context?: LogContext): void {
    this.writeLog(this.createLogEntry('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    this.writeLog(this.createLogEntry('warn', message, context));
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.writeLog(this.createLogEntry('error', message, context, error));
  }

  critical(message: string, error?: Error, context?: LogContext): void {
    this.writeLog(this.createLogEntry('critical', message, context, error));
  }

  // Performance logging
  async time<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const start = Date.now();
    const startMemory = process.memoryUsage();
    
    try {
      const result = await fn();
      const duration = Date.now() - start;
      const endMemory = process.memoryUsage();
      
      this.info(`Operation completed: ${operation}`, {
        ...context,
        performance: {
          duration,
          memory: {
            heapUsed: endMemory.heapUsed - startMemory.heapUsed,
            heapTotal: endMemory.heapTotal - startMemory.heapTotal,
            external: endMemory.external - startMemory.external,
          },
        },
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`Operation failed: ${operation}`, error as Error, {
        ...context,
        performance: { duration, memory: process.memoryUsage() },
      });
      throw error;
    }
  }

  // API request logging
  logRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    
    this.writeLog(
      this.createLogEntry(level, `${method} ${path} - ${statusCode}`, {
        ...context,
        http: {
          method,
          path,
          statusCode,
          duration,
        },
      })
    );
  }
}

// Create singleton instance
export const logger = new Logger();

// Export types for use in other modules
export type { LogLevel, LogContext, LogEntry };
export { Logger }; 