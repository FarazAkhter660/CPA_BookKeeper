/**
 * OpenTelemetry Observability Setup
 * 
 * This module configures OpenTelemetry for tracing and metrics
 * in the AI CPA Bookkeeper application.
 */

import { trace, context, Span, SpanStatusCode, SpanKind } from '@opentelemetry/api';
import { 
  registerInstrumentations 
} from '@opentelemetry/instrumentation';

// For production, you would configure actual exporters
// For now, we'll use console logging for development

/**
 * Initialize OpenTelemetry
 */
export function initializeTelemetry() {
  // In production, this would initialize actual OpenTelemetry SDK
  // with exporters for OTLP, Jaeger, or other backends
  
  if (typeof window === 'undefined') {
    // Server-side initialization
    try {
      registerInstrumentations({
        instrumentations: [
          // Add instrumentations as needed
        ],
      });
    } catch (error) {
      console.warn('Failed to initialize OpenTelemetry instrumentations:', error);
    }
  }
}

/**
 * Get the current tracer
 */
export function getTracer(name: string = 'cpa-bookkeeper') {
  return trace.getTracer(name);
}

/**
 * Create a span for agent operations
 */
export function createAgentSpan(operation: string, userId?: string): Span {
  const tracer = getTracer('agent');
  return tracer.startSpan(operation, {
    kind: SpanKind.SERVER,
    attributes: {
      'user.id': userId || 'anonymous',
      'operation.name': operation,
      'service.name': 'cpa-bookkeeper',
    },
  });
}

/**
 * Create a span for tool execution
 */
export function createToolSpan(toolName: string, parameters: Record<string, unknown>): Span {
  const tracer = getTracer('tools');
  return tracer.startSpan(`tool.${toolName}`, {
    kind: SpanKind.INTERNAL,
    attributes: {
      'tool.name': toolName,
      'tool.parameters': JSON.stringify(parameters),
      'service.name': 'cpa-bookkeeper',
    },
  });
}

/**
 * Create a span for CRA rule validation
 */
export function createCRAValidationSpan(rule: string, input: Record<string, unknown>): Span {
  const tracer = getTracer('cra-rules');
  return tracer.startSpan(`cra.validation.${rule}`, {
    kind: SpanKind.INTERNAL,
    attributes: {
      'cra.rule': rule,
      'validation.input': JSON.stringify(input),
      'service.name': 'cpa-bookkeeper',
    },
  });
}

/**
 * Wrap an async function with tracing
 */
export async function withTracing<T>(
  operation: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Record<string, unknown>
): Promise<T> {
  const tracer = getTracer('cpa-bookkeeper');
  const span = tracer.startSpan(operation, {
    kind: SpanKind.INTERNAL,
    attributes: {
      ...attributes,
      'service.name': 'cpa-bookkeeper',
    },
  });

  try {
    const result = await fn(span);
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    span.recordException(error instanceof Error ? error : new Error(String(error)));
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Record a metric
 */
export function recordMetric(name: string, value: number, attributes?: Record<string, unknown>) {
  // In production, this would use actual OpenTelemetry metrics
  console.log(`[METRIC] ${name}: ${value}`, attributes);
}

/**
 * Record a counter metric
 */
export function incrementCounter(name: string, value: number = 1, attributes?: Record<string, unknown>) {
  recordMetric(name, value, attributes);
}

/**
 * Record a histogram metric
 */
export function recordHistogram(name: string, value: number, attributes?: Record<string, unknown>) {
  recordMetric(name, value, attributes);
}

/**
 * Agent-specific metrics
 */
export const AgentMetrics = {
  recordAgentExecution: (duration: number, success: boolean, toolCount: number) => {
    incrementCounter('agent.executions.total', 1, { success: success.toString() });
    recordHistogram('agent.execution.duration', duration);
    recordHistogram('agent.tool.count', toolCount);
  },

  recordToolExecution: (toolName: string, duration: number, success: boolean) => {
    incrementCounter('tool.executions.total', 1, { 
      tool: toolName, 
      success: success.toString() 
    });
    recordHistogram('tool.execution.duration', duration, { tool: toolName });
  },

  recordCRAValidation: (rule: string, result: 'valid' | 'invalid', duration: number) => {
    incrementCounter('cra.validations.total', 1, { rule, result });
    recordHistogram('cra.validation.duration', duration, { rule });
  },

  recordPromptInjection: (detected: boolean, type?: string) => {
    incrementCounter('security.prompt_injection', 1, { 
      detected: detected.toString(),
      type: type || 'unknown'
    });
  },

  recordApprovalRequest: (action: string, status: string) => {
    incrementCounter('approval.requests', 1, { action, status });
  },
};

/**
 * Security-specific metrics
 */
export const SecurityMetrics = {
  recordSecurityEvent: (event: string, severity: 'low' | 'medium' | 'high' | 'critical') => {
    incrementCounter('security.events', 1, { event, severity });
  },

  recordAuthenticationAttempt: (success: boolean, method: string) => {
    incrementCounter('auth.attempts', 1, { success: success.toString(), method });
  },

  recordAuthorizationCheck: (resource: string, allowed: boolean) => {
    incrementCounter('auth.checks', 1, { resource, allowed: allowed.toString() });
  },
};

/**
 * Performance metrics
 */
export const PerformanceMetrics = {
  recordRequestDuration: (endpoint: string, duration: number, statusCode: number) => {
    recordHistogram('http.request.duration', duration, { endpoint, status: statusCode.toString() });
  },

  recordDatabaseQuery: (query: string, duration: number) => {
    recordHistogram('db.query.duration', duration, { query });
  },

  recordCacheHit: (key: string, hit: boolean) => {
    incrementCounter('cache.access', 1, { key, hit: hit.toString() });
  },
};
