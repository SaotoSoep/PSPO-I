function normalizeMeasurements(measurements) {
  return {
    chest: measurements.chest,
    shoulders: measurements.shoulders,
    length: measurements.length
  };
}

window.FitMatchNormalize = {
  getBrandList() {
    const sizingDataset = window.FitMatchData;
    if (!sizingDataset?.brands) return [];

    return Object.entries(sizingDataset.brands).map(([id, brand]) => ({
      id,
      ...brand
    }));
  },

  getSizeOptions(brandId) {
    const sizingDataset = window.FitMatchData;
    if (!sizingDataset?.brands) return [];

    const brand = sizingDataset.brands[brandId];
    if (!brand) return [];

    return Object.entries(brand.sizes).map(([size, measurements]) => ({
      size,
      measurements,
      normalized: normalizeMeasurements(measurements)
    }));
  },

  getCanonicalBrandChart(brandId) {
    const sizingDataset = window.FitMatchData;
    if (!sizingDataset?.brands) return null;

    const brand = sizingDataset.brands[brandId];
    if (!brand) return null;

    return Object.entries(brand.sizes).map(([size, measurements]) => ({
      size,
      ...normalizeMeasurements(measurements)
    }));
  }
};
