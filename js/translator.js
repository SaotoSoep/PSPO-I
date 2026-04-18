function scoreCandidate(source, target) {
  return (
    Math.abs(source.chest - target.chest) * 0.55 +
    Math.abs(source.shoulders - target.shoulders) * 0.3 +
    Math.abs(source.length - target.length) * 0.15
  );
}

window.FitMatchTranslate = function translateSize(sourceBrandId, sourceSize, targetBrandId) {
  const normalizeApi = window.FitMatchNormalize;
  if (!normalizeApi?.getCanonicalBrandChart) {
    return null;
  }

  const { getCanonicalBrandChart } = normalizeApi;
  const sourceChart = getCanonicalBrandChart(sourceBrandId);
  const targetChart = getCanonicalBrandChart(targetBrandId);

  if (!sourceChart || !targetChart) {
    return null;
  }

  const sourceEntry = sourceChart.find((entry) => entry.size === sourceSize);
  if (!sourceEntry) {
    return null;
  }

  const ranked = targetChart
    .map((candidate) => ({
      ...candidate,
      score: scoreCandidate(sourceEntry, candidate)
    }))
    .sort((a, b) => a.score - b.score);

  const bestMatch = ranked[0];
  const runnerUp = ranked[1];
  const confidenceGap = runnerUp ? runnerUp.score - bestMatch.score : bestMatch.score;

  return {
    sourceSize,
    translatedSize: bestMatch.size,
    fitDirection: bestMatch.score <= 2 ? "very close" : bestMatch.score <= 4 ? "close" : "approximate",
    confidence:
      confidenceGap >= 1.5 ? "high" : confidenceGap >= 0.7 ? "medium" : "low",
    reasoning: `The target size with the closest chest, shoulder, and length profile is ${bestMatch.size}.`
  };
};
