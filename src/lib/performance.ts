/**
 * Performance monitoring utilities for tracking component render times
 * and identifying performance bottlenecks.
 *
 * @module performance
 */

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
  const markName = `${componentName}-start`;
  const measureName = `${componentName}-render`;

  performance.mark(markName);
  const result = callback();
  performance.measure(measureName, markName);

  const measure = performance.getEntriesByName(measureName)[0];
  if (measure && measure.duration > 16) {
    // Log if render takes longer than 1 frame (16ms at 60fps)
    console.warn(
      `⚠️ ${componentName} took ${measure.duration.toFixed(2)}ms to render (> 16ms threshold)`
    );
  }

  performance.clearMarks(markName);
  performance.clearMeasures(measureName);

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

  const startMark = `${componentName}-render-start`;
  performance.mark(startMark);

  // Use queueMicrotask to measure after render completes
  queueMicrotask(() => {
    const measureName = `${componentName}-render`;
    performance.measure(measureName, startMark);

    const measure = performance.getEntriesByName(measureName)[0];
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

    performance.clearMarks(startMark);
    performance.clearMeasures(measureName);
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
  const startTime = performance.now();

  try {
    const result = await operation();
    const duration = performance.now() - startTime;

    if (duration > 1000) {
      console.warn(
        `🐌 ${operationName} took ${duration.toFixed(0)}ms (> 1 second)`
      );
    } else if (process.env.NODE_ENV === 'development') {
      console.log(`✓ ${operationName} completed in ${duration.toFixed(0)}ms`);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
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
  return {
    marks: performance.getEntriesByType('mark'),
    measures: performance.getEntriesByType('measure'),
    navigation: performance.getEntriesByType('navigation')[0],
    resources: performance.getEntriesByType('resource'),
  };
}

/**
 * Clears all performance marks and measures.
 * Useful when you want a clean slate for profiling.
 */
export function clearAllPerformanceData() {
  performance.clearMarks();
  performance.clearMeasures();
  console.log('🧹 Performance data cleared');
}
