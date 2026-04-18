window.FitMatchData = {
  productTypes: {
    tshirt: {
      label: "Women's T-shirt",
      description: "A compact starting category for comparing cut, width, and length across brands."
    }
  },
  brands: {
    mango: {
      label: "Mango",
      fitProfile: "regular",
      productType: "tshirt",
      source: "mock brand chart",
      notes: "A regular fit with slightly more room through the chest and length.",
      sizes: {
        XS: { chest: 84, shoulders: 36, length: 56 },
        S: { chest: 88, shoulders: 38, length: 58 },
        M: { chest: 92, shoulders: 40, length: 60 },
        L: { chest: 98, shoulders: 42, length: 62 },
        XL: { chest: 104, shoulders: 44, length: 64 }
      }
    },
    uniqlo: {
      label: "Uniqlo",
      fitProfile: "clean-regular",
      productType: "tshirt",
      source: "mock brand chart",
      notes: "A balanced everyday fit with consistent grading across sizes.",
      sizes: {
        XS: { chest: 82, shoulders: 35, length: 55 },
        S: { chest: 86, shoulders: 37, length: 57 },
        M: { chest: 90, shoulders: 39, length: 59 },
        L: { chest: 96, shoulders: 41, length: 61 },
        XL: { chest: 102, shoulders: 43, length: 63 }
      }
    },
    zara: {
      label: "Zara",
      fitProfile: "slim",
      productType: "tshirt",
      source: "mock brand chart",
      notes: "Runs slimmer and slightly shorter than the baseline.",
      sizes: {
        XS: { chest: 80, shoulders: 35, length: 54 },
        S: { chest: 84, shoulders: 36, length: 56 },
        M: { chest: 88, shoulders: 38, length: 58 },
        L: { chest: 94, shoulders: 40, length: 60 },
        XL: { chest: 100, shoulders: 42, length: 62 }
      }
    },
    cos: {
      label: "COS",
      fitProfile: "boxy",
      productType: "tshirt",
      source: "mock brand chart",
      notes: "Boxier silhouette with broader shoulders and more length.",
      sizes: {
        XS: { chest: 86, shoulders: 38, length: 58 },
        S: { chest: 90, shoulders: 40, length: 60 },
        M: { chest: 96, shoulders: 42, length: 62 },
        L: { chest: 102, shoulders: 44, length: 64 },
        XL: { chest: 108, shoulders: 46, length: 66 }
      }
    }
  }
};
