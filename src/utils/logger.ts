/**
 * Sistema de Logger Condicional
 *
 * Permite controlar logs baseado no ambiente:
 * - Desenvolvimento: Mostra todos os logs
 * - Produção: Mostra apenas erros críticos
 */

const isDevelopment = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

interface LogLevel {
  DEBUG: 0;
  INFO: 1;
  WARN: 2;
  ERROR: 3;
}

const LOG_LEVELS: LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// Em produção, só mostra WARN e ERROR
const MIN_LOG_LEVEL = isProd ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;

class Logger {
  private shouldLog(level: number): boolean {
    return level >= MIN_LOG_LEVEL;
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;

    if (data) {
      return `${prefix} ${message} | Data: ${JSON.stringify(data, null, 2)}`;
    }
    return `${prefix} ${message}`;
  }

  /**
   * Log de debug - apenas em desenvolvimento
   */
  debug(message: string, data?: any): void {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message, data));
    }
  }

  /**
   * Log informativo - apenas em desenvolvimento
   */
  info(message: string, data?: any): void {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      console.info(this.formatMessage('INFO', message, data));
    }
  }

  /**
   * Log de aviso - em desenvolvimento e produção
   */
  warn(message: string, data?: any): void {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      console.warn(this.formatMessage('WARN', message, data));
    }
  }

  /**
   * Log de erro - sempre mostrado
   */
  error(message: string, error?: any): void {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      if (error instanceof Error) {
        console.error(this.formatMessage('ERROR', message), error);
      } else {
        console.error(this.formatMessage('ERROR', message, error));
      }
    }

    // Em produção, podemos integrar com serviços como Sentry
    if (isProd && error) {
      // TODO: Integrar com Sentry ou outro serviço de monitoramento
      // Sentry.captureException(error, { extra: { message } });
    }
  }

  /**
   * Log para operações de banco de dados
   */
  database(operation: string, table: string, data?: any): void {
    if (isDevelopment) {
      this.debug(`DB ${operation.toUpperCase()} em ${table}`, data);
    }
  }

  /**
   * Log para operações de autenticação
   */
  auth(action: string, userId?: string, details?: any): void {
    const message = `Auth: ${action}${userId ? ` - User: ${userId}` : ''}`;

    if (isDevelopment) {
      this.info(message, details);
    } else {
      // Em produção, logamos eventos de auth importantes sem dados sensíveis
      if (['login_success', 'login_failed', 'logout'].includes(action)) {
        this.info(message);
      }
    }
  }

  /**
   * Log para operações de performance
   */
  performance(operation: string, duration: number, threshold: number = 1000): void {
    const message = `Performance: ${operation} levou ${duration}ms`;

    if (duration > threshold) {
      this.warn(`${message} (acima do limite de ${threshold}ms)`);
    } else if (isDevelopment) {
      this.debug(message);
    }
  }

  /**
   * Log para operações de API
   */
  api(method: string, endpoint: string, status?: number, duration?: number): void {
    const message = `API ${method.toUpperCase()} ${endpoint}`;

    if (status) {
      if (status >= 400) {
        this.error(`${message} - Status: ${status}`);
      } else if (isDevelopment) {
        this.info(`${message} - Status: ${status}${duration ? ` (${duration}ms)` : ''}`);
      }
    } else if (isDevelopment) {
      this.debug(message);
    }
  }

  /**
   * Log para workflow de fichas técnicas
   */
  ficha(action: string, fichaId: string, details?: any): void {
    const message = `Ficha ${fichaId}: ${action}`;

    if (isDevelopment) {
      this.info(message, details);
    } else {
      // Em produção, logamos apenas ações importantes
      if (['created', 'saved', 'status_changed', 'deleted'].includes(action)) {
        this.info(message);
      }
    }
  }
}

// Exportar instância única do logger
export const logger = new Logger();

// Backward compatibility - para migração gradual
export const devLog = (message: string, data?: any) => logger.debug(message, data);
export const prodError = (message: string, error?: any) => logger.error(message, error);

export default logger;