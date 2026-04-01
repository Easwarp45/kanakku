/**
 * Performance monitoring utilities for tracking component render times
 * and identifying performance bottlenecks.
 *
 * @module performance
 */

function getPerformanceApi(): Performance | undefined {
  if (typeof globalThis === 'undefined' || typeof globalThis.performance === 'undefined') {
    return undefined;
  }

  return globalThis.performance;
}

function canUseUserTiming(perf: Performance | undefined): perf is Performance {
  return Boolean(
    perf &&
      typeof perf.mark === 'function' &&
      typeof perf.measure === 'function' &&
      typeof perf.getEntriesByName === 'function'
  );
}

function safeClearMarks(perf: Performance | undefined, markName?: string) {
  if (!perf || typeof perf.clearMarks !== 'function') return;

  if (typeof markName === 'string') {
    perf.clearMarks(markName);
    return;
  }

  perf.clearMarks();
}

function safeClearMeasures(perf: Performance | undefined, measureName?: string) {
  if (!perf || typeof perf.clearMeasures !== 'function') return;

  if (typeof measureName === 'string') {
    perf.clearMeasures(measureName);
    return;
  }

  perf.clearMeasures();
}

/**
 * Measures and logs the render time of a component.
 *
 * @param componentName - Name of the component being measured
 * @param callback - Function to execute and measure
 * @returns The result of the callback function
 *
 * @example
 * ```tsx
 * const result = measureRender('ExpensiveComponent', () => {
 *   // Your expensive operation
 *   return processData(data);
 * });
 * ```
 */
export function measureRender<T>(componentName: string, callback: () => T): T {
  const perf = getPerformanceApi();
  if (!canUseUserTiming(perf)) {
    return callback();
  }

  const markName = `${componentName}-start`;
  const measureName = `${componentName}-render`;

  perf.mark(markName);
  const result = callback();
  perf.measure(measureName, markName);

  const measure = perf.getEntriesByName(measureName)[0] as PerformanceMeasure | undefined;
  if (measure && measure.duration > 16) {
    // Log if render takes longer than 1 frame (16ms at 60fps)
    console.warn(
      `⚠️ ${componentName} took ${measure.duration.toFixed(2)}ms to render (> 16ms threshold)`
    );
  }

  safeClearMarks(perf, markName);
  safeClearMeasures(perf, measureName);

  return result;
}

/**
 * React hook for measuring component render performance.
 *
 * Automatically logs render time on every render. Use sparingly in development only.
 *
 * @param componentName - Name of the component
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   useRenderTracking('MyComponent');
 *   return <div>...</div>;
 * }
 * ```
 */
export function useRenderTracking(componentName: string) {
  if (process.env.NODE_ENV !== 'development') return;

  const perf = getPerformanceApi();
  if (!canUseUserTiming(perf)) return;

  const startMark = `${componentName}-render-start`;
  perf.mark(startMark);

  // Use queueMicrotask to measure after render completes
  queueMicrotask(() => {
    const measureName = `${componentName}-render`;
    perf.measure(measureName, startMark);

    const measure = perf.getEntriesByName(measureName)[0] as PerformanceMeasure | undefined;
    if (measure) {
      const duration = measure.duration;
      if (duration > 16) {
        console.warn(
          `🐌 ${componentName} render: ${duration.toFixed(2)}ms (exceeds 16ms frame budget)`
        );
      } else if (duration > 8) {
        console.log(
          `⚠️ ${componentName} render: ${duration.toFixed(2)}ms (approaching budget)`
        );
      }
    }

    safeClearMarks(perf, startMark);
    safeClearMeasures(perf, measureName);
  });
}

/**
 * Tracks the time taken for an async operation.
 *
 * @param operationName - Name of the operation
 * @param operation - Async function to measure
 * @returns Promise resolving to the operation result
 *
 * @example
 * ```tsx
 * const data = await trackAsyncOperation('fetchGroupMembers', async () => {
 *   const response = await supabase.from('group_members').select('*');
 *   return response.data;
 * });
 * ```
 */
export async function trackAsyncOperation<T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<T> {
  const perf = getPerformanceApi();
  const now = perf && typeof perf.now === 'function' ? () => perf.now() : () => Date.now();
  const startTime = now();

  try {
    const result = await operation();
    const duration = now() - startTime;

    if (duration > 1000) {
      console.warn(
        `🐌 ${operationName} took ${duration.toFixed(0)}ms (> 1 second)`
      );
    } else if (process.env.NODE_ENV === 'development') {
      console.log(`✓ ${operationName} completed in ${duration.toFixed(0)}ms`);
    }

    return result;
  } catch (error) {
    const duration = now() - startTime;
    console.error(
      `❌ ${operationName} failed after ${duration.toFixed(0)}ms:`,
      error
    );
    throw error;
  }
}

/**
 * Reports Web Vitals metrics to the console (development mode).
 *
 * In production, you would send these to analytics instead.
 *
 * @param metric - Web Vitals metric object
 */
export function reportWebVitals(metric: any) {
  const { name, value, id } = metric;

  // Define thresholds for each metric
  const thresholds: Record<string, { good: number; poor: number }> = {
    CLS: { good: 0.1, poor: 0.25 },
    FID: { good: 100, poor: 300 },
    FCP: { good: 1800, poor: 3000 },
    LCP: { good: 2500, poor: 4000 },
    TTFB: { good: 800, poor: 1800 },
    INP: { good: 200, poor: 500 },
  };

  const threshold = thresholds[name];
  if (!threshold) {
    console.log(`📊 ${name}: ${value}`);
    return;
  }

  let rating: 'good' | 'needs-improvement' | 'poor';
  if (value <= threshold.good) {
    rating = 'good';
  } else if (value <= threshold.poor) {
    rating = 'needs-improvement';
  } else {
    rating = 'poor';
  }

  const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';

  console.log(`${emoji} ${name}: ${value.toFixed(2)} (${rating}) [${id}]`);

  // In production, send to analytics:
  // analytics.track('web-vital', { name, value, id, rating });
}

/**
 * Gets performance marks and measures for debugging.
 *
 * @returns Object containing all performance entries
 */
export function getPerformanceSnapshot() {
  const perf = getPerformanceApi();
  if (!perf || typeof perf.getEntriesByType !== 'function') {
    return {
      marks: [] as PerformanceEntry[],
      measures: [] as PerformanceEntry[],
      navigation: undefined,
      resources: [] as PerformanceEntry[],
    };
  }

  return {
    marks: perf.getEntriesByType('mark'),
    measures: perf.getEntriesByType('measure'),
    navigation: perf.getEntriesByType('navigation')[0],
    resources: perf.getEntriesByType('resource'),
  };
}

/**
 * Clears all performance marks and measures.
 * Useful when you want a clean slate for profiling.
 */
export function clearAllPerformanceData() {
  const perf = getPerformanceApi();
  safeClearMarks(perf);
  safeClearMeasures(perf);
  console.log('🧹 Performance data cleared');
}
