import { HttpContext } from "@adonisjs/core/http";
import { NextFn } from "@adonisjs/core/types/http";

import "#utils/maps";

interface RouteTimingEntry {
  timestamp: number;
  // ms
  timeElapsed: number;
}

interface MetricsHttpContextExtras {
  extras?: {
    startTime?: number;
    recorded?: true;
  } & Record<string, unknown>;
}

class Metrics {
  requestCount = 0;
  requestTimingHistory: RouteTimingEntry[] = [];

  clearOldTimings() {
    const now = Date.now();
    let shifted;
    do {
      shifted = this.requestTimingHistory.shift();
    } while (
      shifted !== undefined &&
      now - shifted.timestamp > HISTORY_RETAIN_DURATION
    );

    if (shifted !== undefined) {
      this.requestTimingHistory.unshift(shifted);
    }
  }
}

const HISTORY_RETAIN_DURATION = 60 * 1000;

// route pattern -> http method -> response status -> metrics object
export const metrics = new Map<string, Map<string, Map<number, Metrics>>>();

export function recordResponse(ctx: HttpContext & MetricsHttpContextExtras) {
  // ensure we don't record the same response twice
  ctx.extras ??= {};
  if (ctx.extras.recorded === true) {
    return;
  }
  ctx.extras.recorded = true;
  const { request, response, route, extras } = ctx;

  // record response timing
  const timeElapsed =
    extras.startTime !== undefined
      ? performance.now() - extras.startTime
      : undefined;

  // get the right metrics bucket
  const metricsEntry = metrics
    .getOrInsertWith(route?.pattern ?? "invalid route", () => new Map())
    .getOrInsertWith(request.method(), () => new Map())
    .getOrInsertWith(response.getStatus(), () => new Metrics());

  // record response
  metricsEntry.requestCount += 1;
  if (timeElapsed !== undefined) {
    metricsEntry.clearOldTimings();
    metricsEntry.requestTimingHistory.push({
      timestamp: Date.now(),
      timeElapsed,
    });
  }
}

interface Summary {
  quantiles: Record<string, number>;
  sum: number;
  count: number;
}

const QUANTILES: [number, string][] = [
  [0.1, "0.1"],
  [0.25, "0.25"],
  [0.5, "0.5"],
  [0.75, "0.75"],
  [0.9, "0.9"],
  [0.95, "0.95"],
  [0.99, "0.99"],
];

function calculateSummary(sorted: number[]): Summary {
  const result: Summary = {
    quantiles: {},
    sum: sorted.reduce((acc, cur) => acc + cur, 0),
    count: sorted.length,
  };

  for (const [quantNum, quantStr] of QUANTILES) {
    const idx = Math.ceil(quantNum * sorted.length) - 1;
    result.quantiles[quantStr] = sorted[idx];
  }

  return result;
}

export function emitMetrics(): string {
  const result: string[] = [
    "# HELP solvronis_global_response_timings A summary of response timings for requests made to all endpoints, in ms",
    "# TYPE solvronis_global_response_timings summary",
    "# HELP solvronis_route_response_timings A summary of response timings for requests made to a particular route, in ms",
    "# TYPE solvronis_route_response_timings summary",
    "# HELP solvronis_route_status_response_timings A summary of response timings for requests made to a particular route that resulted in a specific status code, in ms",
    "# TYPE solvronis_route_status_response_timings summary",
    "# HELP solvronis_route_request_count Count of all requests made to a particular route that resulted in a specific status code",
    "# TYPE solvronis_route_request_count counter",
  ];

  const globalTimings: number[][] = [];
  for (const [routeName, routeBuckets] of metrics.entries()) {
    for (const [method, methodBuckets] of routeBuckets.entries()) {
      const routeTimings: number[][] = [];
      for (const [status, statusBucket] of methodBuckets.entries()) {
        statusBucket.clearOldTimings();
        result.push(
          `solvronis_route_request_count{route="${routeName}", method="${method}", status="${status}"} ${statusBucket.requestCount}`,
        );

        if (statusBucket.requestTimingHistory.length === 0) {
          continue;
        }
        const statusTimings = statusBucket.requestTimingHistory
          .map((h) => h.timeElapsed)
          .sort((a, b) => a - b);
        routeTimings.push(statusTimings);
        const summary = calculateSummary(statusTimings);

        for (const [quantile, value] of Object.entries(summary.quantiles)) {
          result.push(
            `solvronis_route_status_response_timings{route="${routeName}", method="${method}", status="${status}", quantile="${quantile}"} ${value}`,
          );
        }
        result.push(
          `solvronis_route_status_response_timings_sum{route="${routeName}", method="${method}", status="${status}"} ${summary.sum}`,
        );
        result.push(
          `solvronis_route_status_response_timings_count{route="${routeName}", method="${method}", status="${status}"} ${summary.count}`,
        );
      }

      if (routeTimings.length === 0) {
        continue;
      }
      const routeFlattened = routeTimings.flat().sort((a, b) => a - b);
      globalTimings.push(routeFlattened);
      const summary = calculateSummary(routeFlattened);

      for (const [quantile, value] of Object.entries(summary.quantiles)) {
        result.push(
          `solvronis_route_response_timings{route="${routeName}", method="${method}", quantile="${quantile}"} ${value}`,
        );
      }
      result.push(
        `solvronis_route_response_timings_sum{route="${routeName}", method="${method}"} ${summary.sum}`,
      );
      result.push(
        `solvronis_route_response_timings_count{route="${routeName}", method="${method}"} ${summary.count}`,
      );
    }
  }

  if (globalTimings.length > 0) {
    const globalFlattened = globalTimings.flat().sort((a, b) => a - b);
    const summary = calculateSummary(globalFlattened);

    for (const [quantile, value] of Object.entries(summary.quantiles)) {
      result.push(
        `solvronis_global_response_timings{quantile="${quantile}"} ${value}`,
      );
    }
    result.push(`solvronis_global_response_timings_sum ${summary.sum}`);
    result.push(`solvronis_global_response_timings_count ${summary.count}`);
  }

  return result.join("\n");
}

export default class MetricsMiddleware {
  async handle(ctx: HttpContext & MetricsHttpContextExtras, next: NextFn) {
    ctx.extras ??= {};
    ctx.extras.startTime = performance.now();
    await next();
    recordResponse(ctx);
  }
}
