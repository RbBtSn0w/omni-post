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

/**
 * Initialize the OpenTelemetry SDK with console exporters.
 * Must be called before any other module imports that need tracing.
 */
export function initTelemetry(): void {
    if (sdk) return; // Already initialized

    sdk = new NodeSDK({
        serviceName: SERVICE_NAME,
        traceExporter: new ConsoleSpanExporter(),
        logRecordProcessor: new SimpleLogRecordProcessor(new ConsoleLogRecordExporter()),
    });

    sdk.start();
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
