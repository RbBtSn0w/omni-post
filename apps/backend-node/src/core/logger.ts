/**
 * OpenTelemetry-native logging facade for omni-post backend.
 *
 * Replaces the legacy Winston logger with structured logging via
 * the OpenTelemetry Logs API. Exports a compatible API surface
 * (logger.info/warn/error/debug) and platform-specific loggers.
 */

import { SeverityNumber, type Logger as OtelLoggerType } from '@opentelemetry/api-logs';
import type { AttributeValue, Attributes } from '@opentelemetry/api';
import { getOtelLogger } from './telemetry.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SEVERITY_MAP: Record<LogLevel, SeverityNumber> = {
    debug: SeverityNumber.DEBUG,
    info: SeverityNumber.INFO,
    warn: SeverityNumber.WARN,
    error: SeverityNumber.ERROR,
};

const LEVEL_ORDER: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
};

function resolveMinLogLevel(): LogLevel {
    const raw = process.env.LOG_LEVEL?.trim().toLowerCase();
    if (raw === 'debug' || raw === 'info' || raw === 'warn' || raw === 'error') return raw;
    return 'info';
}

function shouldLog(level: LogLevel): boolean {
    return LEVEL_ORDER[level] >= LEVEL_ORDER[resolveMinLogLevel()];
}

/**
 * Timestamp string in ISO-like format for console output.
 */
function timestamp(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function toAttributeValue(value: unknown): AttributeValue | undefined {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return value;
    }
    if (value instanceof Error) {
        return value.message;
    }
    if (Array.isArray(value)) {
        if (value.length === 0) return undefined;
        if (value.every(item => typeof item === 'string')) return value as string[];
        if (value.every(item => typeof item === 'number')) return value as number[];
        if (value.every(item => typeof item === 'boolean')) return value as boolean[];
        try {
            return JSON.stringify(value);
        } catch {
            return undefined;
        }
    }
    if (value == null) {
        return undefined;
    }
    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}

function sanitizeAttributes(meta?: unknown): Attributes | undefined {
    if (meta instanceof Error) {
        return {
            'error.message': meta.message,
            'error.name': meta.name,
            ...(meta.stack ? { 'error.stack': meta.stack } : {}),
        };
    }
    if (typeof meta !== 'object' || meta === null) return undefined;
    const attrs: Attributes = {};
    for (const [key, value] of Object.entries(meta as Record<string, unknown>)) {
        if (value instanceof Error) {
            attrs[`${key}.message`] = value.message;
            attrs[`${key}.name`] = value.name;
            if (value.stack) attrs[`${key}.stack`] = value.stack;
            continue;
        }
        const normalized = toAttributeValue(value);
        if (normalized !== undefined) {
            attrs[key] = normalized;
        }
    }
    return Object.keys(attrs).length > 0 ? attrs : undefined;
}

function extractErrorMeta(meta?: unknown): Error | undefined {
    if (meta instanceof Error) return meta;
    if (typeof meta !== 'object' || meta === null) return undefined;
    const maybeError = (meta as Record<string, unknown>).error;
    return maybeError instanceof Error ? maybeError : undefined;
}

/**
 * Emit a structured log record via OTel and also print to console.
 */
function emit(otelLogger: OtelLoggerType, level: LogLevel, message: string, meta?: unknown): void {
    if (!shouldLog(level)) return;

    // Console output (preserves human-readable format)
    const ts = timestamp();
    const tag = level.toUpperCase();
    const attrs = sanitizeAttributes(meta);
    const prefix = typeof attrs?.platform === 'string' ? `[${attrs.platform}] ` : '';
    const consoleWriter = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    const errorMeta = extractErrorMeta(meta);

    if (errorMeta) {
        // eslint-disable-next-line no-console
        consoleWriter(`${ts} | ${tag}: ${prefix}${message} ${errorMeta.message}`);
        if (errorMeta.stack) {
            // eslint-disable-next-line no-console
            consoleWriter(errorMeta.stack);
        }
    } else if (meta !== undefined && typeof meta !== 'object') {
        // eslint-disable-next-line no-console
        consoleWriter(`${ts} | ${tag}: ${prefix}${message} ${String(meta)}`);
    } else {
        // eslint-disable-next-line no-console
        consoleWriter(`${ts} | ${tag}: ${prefix}${message}`);
    }

    // OTel structured log record
    otelLogger.emit({
        severityNumber: SEVERITY_MAP[level],
        severityText: tag,
        body: message,
        attributes: attrs,
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
        if (defaultMeta && meta instanceof Error) {
            return { ...defaultMeta, error: meta };
        }
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
