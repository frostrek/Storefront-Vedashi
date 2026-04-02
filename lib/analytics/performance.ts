/**
 * Vedashi Performance Metrics Store
 * ─────────────────────────────────
 * Centralised store for performance metrics (page load, API latency).
 */

const STORAGE_KEY = 'vedashi_performance_metrics';

interface PerformanceData {
  page_load_time?: number;
  api_latencies: number[];
}

class PerformanceStore {
  private static isClient() {
    return typeof window !== 'undefined';
  }

  private static getData(): PerformanceData {
    if (!this.isClient()) return { api_latencies: [] };
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return { api_latencies: [] };
  }

  private static saveData(data: PerformanceData) {
    if (!this.isClient()) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  }

  static setPageLoadTime(ms: number) {
    const data = this.getData();
    data.page_load_time = ms;
    this.saveData(data);
  }

  static getPageLoadTime(): number | undefined {
    return this.getData().page_load_time;
  }

  static recordApiLatency(ms: number) {
    const data = this.getData();
    data.api_latencies.push(ms);
    // Keep only the last 50 latencies to avoid unbounded growth
    if (data.api_latencies.length > 50) {
      data.api_latencies = data.api_latencies.slice(-50);
    }
    this.saveData(data);
  }

  static getAverageApiLatency(): number | undefined {
    const { api_latencies } = this.getData();
    if (api_latencies.length === 0) return undefined;
    const sum = api_latencies.reduce((a, b) => a + b, 0);
    return Math.round(sum / api_latencies.length);
  }

  static getPerformanceCategory(ms: number, type: 'page_load' | 'api'): 'fast' | 'moderate' | 'slow' {
    if (type === 'page_load') {
      if (ms < 1500) return 'fast';
      if (ms <= 3000) return 'moderate';
      return 'slow';
    } else {
      // API latency
      if (ms < 300) return 'fast';
      if (ms <= 1000) return 'moderate';
      return 'slow';
    }
  }

  static getPerformanceSummary() {
    const pageLoadTime = this.getPageLoadTime();
    const apiLatencyAvg = this.getAverageApiLatency();

    let pageCategory;
    if (pageLoadTime !== undefined) {
      pageCategory = this.getPerformanceCategory(pageLoadTime, 'page_load');
    }

    return {
      page_load_time: pageLoadTime,
      api_latency_avg: apiLatencyAvg,
      performance_category: pageCategory as 'fast' | 'moderate' | 'slow' | undefined,
    };
  }
}

export default PerformanceStore;
