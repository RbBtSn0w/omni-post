/**
 * OpenTelemetry-native logging facade for omni-post backend.
 *
 * Replaces the legacy Winston logger with structured logging via
 * the OpenTelemetry Logs API. Exports a compatible API surface
 * (logger.info/warn/error/debug) and platform-specific loggers.
 */

import { SeverityNumber, type Logger as OtelLoggerType } from '@opentelemetry/api-logs';
import { getOtelLogger } from './telemetry.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SEVERITY_MAP: Record<LogLevel, SeverityNumber> = {
    debug: SeverityNumber.DEBUG,
    info: SeverityNumber.INFO,
    warn: SeverityNumber.WARN,
    error: SeverityNumber.ERROR,
};

/**
 * Timestamp string in ISO-like format for console output.
 */
function timestamp(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * Emit a structured log record via OTel and also print to console.
 */
function emit(otelLogger: OtelLoggerType, level: LogLevel, message: string, meta?: unknown): void {
    // Console output (preserves human-readable format)
    const ts = timestamp();
    const tag = level.toUpperCase();
    const attrs = (typeof meta === 'object' && meta !== null) ? meta as Record<string, unknown> : undefined;
    const prefix = attrs?.platform ? `[${attrs.platform}] ` : '';

    if (meta !== undefined && typeof meta !== 'object') {
        // eslint-disable-next-line no-console
        console.log(`${ts} | ${tag}: ${prefix}${message} ${String(meta)}`);
    } else {
        // eslint-disable-next-line no-console
        console.log(`${ts} | ${tag}: ${prefix}${message}`);
    }

    // OTel structured log record
    otelLogger.emit({
        severityNumber: SEVERITY_MAP[level],
        severityText: tag,
        body: message,
        attributes: attrs as Record<string, string> | undefined,
    });
}

/** Facade interface matching the legacy Winston logger API surface. */
interface LoggerFacade {
    debug(message: string, meta?: unknown): void;
    info(message: string, meta?: unknown): void;
    warn(message: string, meta?: unknown): void;
    error(message: string, meta?: unknown): void;
}

function createLoggerFacade(name: string, defaultMeta?: Record<string, unknown>): LoggerFacade {
    const otelLog = getOtelLogger(name);
    const merged = (meta?: unknown): unknown => {
        if (defaultMeta && typeof meta === 'object' && meta !== null) {
            return { ...defaultMeta, ...meta };
        }
        return defaultMeta ?? meta;
    };

    return {
        debug: (msg, meta?) => emit(otelLog, 'debug', msg, merged(meta)),
        info: (msg, meta?) => emit(otelLog, 'info', msg, merged(meta)),
        warn: (msg, meta?) => emit(otelLog, 'warn', msg, merged(meta)),
        error: (msg, meta?) => emit(otelLog, 'error', msg, merged(meta)),
    };
}

// Main logger (console only, no platform context)
export const logger: LoggerFacade = createLoggerFacade('omni-post');

// Platform-specific loggers (matching legacy per-platform exports)
export const douyinLogger: LoggerFacade = createLoggerFacade('douyin', { platform: 'douyin' });
export const wxChannelsLogger: LoggerFacade = createLoggerFacade('wx_channels', { platform: 'wx_channels' });
export const xhsLogger: LoggerFacade = createLoggerFacade('xhs', { platform: 'xhs' });
export const bilibiliLogger: LoggerFacade = createLoggerFacade('bilibili', { platform: 'bilibili' });
export const kuaishouLogger: LoggerFacade = createLoggerFacade('kuaishou', { platform: 'kuaishou' });
export const xiaohongshuLogger: LoggerFacade = createLoggerFacade('xiaohongshu', { platform: 'xiaohongshu' });
