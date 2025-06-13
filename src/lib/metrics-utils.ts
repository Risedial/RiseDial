// Metrics utilities that can be shared across the application

// Request tracking
let requestCount = 0;
let errorCount = 0;
let warningCount = 0;

export interface MetricsData {
  timestamp: string;
  environment: string;
  version: string;
  performance: {
    responseTime: number;
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
    cpuUsage?: number;
  };
  health: {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    environment: boolean;
    database: boolean;
    supabase: boolean;
  };
  system: {
    nodeVersion: string;
    platform: string;
    arch: string;
    timezone: string;
  };
  application: {
    activeConnections: number;
    totalRequests: number;
    errors: number;
    warnings: number;
  };
  vercel?: {
    region: string;
    deployment: string;
    functionName: string;
  };
}

export interface MetricsHistoryEntry {
  id: string;
  timestamp: string;
  data: MetricsData;
  alerts: string[];
}

// Simple in-memory metrics store (in production, use a proper database)
const metricsHistory: MetricsHistoryEntry[] = [];
const MAX_HISTORY_SIZE = 100;

export function incrementWarningCount(): void {
  warningCount++;
}

export function incrementErrorCount(): void {
  errorCount++;
}

export function incrementRequestCount(): number {
  return ++requestCount;
}

export function getMetricsCounts() {
  return {
    requests: requestCount,
    errors: errorCount,
    warnings: warningCount
  };
}

export function addMetricsEntry(entry: MetricsHistoryEntry): void {
  metricsHistory.push(entry);
  
  // Keep only recent history
  if (metricsHistory.length > MAX_HISTORY_SIZE) {
    metricsHistory.shift();
  }
}

export function getMetricsHistory(): MetricsHistoryEntry[] {
  return [...metricsHistory];
}

export function getRecentMetrics(limit: number = 10, includeData: boolean = false) {
  return metricsHistory
    .slice(-Math.min(limit, 50))
    .map(entry => ({
      id: entry.id,
      timestamp: entry.timestamp,
      alerts: entry.alerts,
      summary: {
        overall: entry.data.health.overall,
        responseTime: entry.data.performance.responseTime,
        memoryUsage: `${Math.round(entry.data.performance.memoryUsage.heapUsed / 1024 / 1024)}MB`,
        uptime: `${Math.round(entry.data.performance.uptime / 60)}min`
      },
      ...(includeData && { data: entry.data })
    }));
}

export function generateAlerts(metrics: MetricsData): string[] {
  const alerts: string[] = [];
  
  // Memory usage alerts
  const memoryUsageMB = metrics.performance.memoryUsage.heapUsed / 1024 / 1024;
  if (memoryUsageMB > 256) {
    alerts.push(`High memory usage: ${Math.round(memoryUsageMB)}MB`);
  }
  
  // Response time alerts
  if (metrics.performance.responseTime > 5000) {
    alerts.push(`Slow response time: ${metrics.performance.responseTime}ms`);
  }
  
  // Health alerts
  if (metrics.health.overall === 'unhealthy') {
    alerts.push('System health is unhealthy');
  } else if (metrics.health.overall === 'degraded') {
    alerts.push('System health is degraded');
  }
  
  // Database connectivity alerts
  if (!metrics.health.database) {
    alerts.push('Database connectivity issues detected');
  }
  
  // Error rate alerts
  if (metrics.application.errors > 0) {
    const errorRate = (metrics.application.errors / metrics.application.totalRequests) * 100;
    if (errorRate > 5) {
      alerts.push(`High error rate: ${errorRate.toFixed(1)}%`);
    }
  }
  
  return alerts;
} 