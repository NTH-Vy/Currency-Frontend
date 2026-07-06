export const trackPerformanceMetric = (name: string, value: number) => {
  if (typeof window === 'undefined') return;

  try {
    window.dispatchEvent(new CustomEvent('currency:perf', { detail: { name, value } }));
  } catch {
    // no-op
  }
};
