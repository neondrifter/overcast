/**
 * Analytics/metrics client disabled in Overcast.
 * Retains the public class signature so existing call sites continue to work
 * without sending any telemetry to external servers.
 */
export class MetricsClient<M extends Record<string, unknown>> {
  maxBatchSize = 100

  start() {
    // Analytics disabled in Overcast
  }

  track<E extends keyof M>(
    _event: E,
    _payload: M[E],
    _metadata: Record<string, unknown> = {},
  ) {
    // Analytics disabled in Overcast
  }

  flush() {
    // Analytics disabled in Overcast
  }
}
