export function mean(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function stdDev(values: number[]) {
  if (values.length < 2) {
    return 0;
  }

  const avg = mean(values);
  const variance =
    values.reduce((sum, value) => sum + (value - avg) ** 2, 0) /
    (values.length - 1);

  return Math.sqrt(variance);
}

export function median(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export function coefficientOfVariation(values: number[]) {
  const avg = mean(values);

  if (avg === 0) {
    return Number.POSITIVE_INFINITY;
  }

  return stdDev(values) / avg;
}

export function exponentialSmoothing(series: number[], alpha = 0.3) {
  if (series.length === 0) {
    return 0;
  }

  return series.reduce(
    (smoothed, value, index) =>
      index === 0 ? value : alpha * value + (1 - alpha) * smoothed,
    series[0],
  );
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
