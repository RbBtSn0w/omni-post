/**
 * OpenTelemetry initialization for omni-post backend.
 *
 * Configures ConsoleSpanExporter and ConsoleLogRecordExporter
 * for local development tracing and structured logging.
 */

import { trace, type Tracer } from '@opentelemetry/api';
import { logs } from '@opentelemetry/api-logs';
import { ConsoleLogRecordExporter, SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';

const SERVICE_NAME = 'omni-post-backend';
const TRACER_NAME = 'omni-post';

let sdk: NodeSDK | undefined;
let startupPromise: Promise<void> | undefined;

function isTelemetryEnabled(): boolean {
    const raw = process.env.OTEL_ENABLED;
    if (raw !== undefined) {
        const normalized = raw.trim().toLowerCase();
        return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
    }
    return process.env.NODE_ENV === 'development';
}

/**
 * Initialize the OpenTelemetry SDK with console exporters.
 * Must be called before any other module imports that need tracing.
 */
export async function initTelemetry(): Promise<void> {
    if (!isTelemetryEnabled()) return;
    if (sdk) return;
    if (startupPromise) {
        await startupPromise;
        return;
    }

    const nextSdk = new NodeSDK({
        serviceName: SERVICE_NAME,
        traceExporter: new ConsoleSpanExporter(),
        logRecordProcessor: new SimpleLogRecordProcessor(new ConsoleLogRecordExporter()),
    });

    startupPromise = Promise.resolve(nextSdk.start())
        .then(() => {
            sdk = nextSdk;
        })
        .catch((error: unknown) => {
            // eslint-disable-next-line no-console
            console.error('Failed to initialize OpenTelemetry SDK', error);
            throw error;
        })
        .finally(() => {
            startupPromise = undefined;
        });

    await startupPromise;
}

/**
 * Gracefully shut down the OpenTelemetry SDK, flushing pending spans/logs.
 */
export async function shutdownTelemetry(): Promise<void> {
    if (!sdk) return;
    await sdk.shutdown();
    sdk = undefined;
}

/**
 * Get the application tracer instance.
 */
export function getTracer(): Tracer {
    return trace.getTracer(TRACER_NAME);
}

/**
 * Get the OTel LoggerProvider logger for structured log emission.
 */
export function getOtelLogger(name: string = TRACER_NAME) {
    return logs.getLogger(name);
}
