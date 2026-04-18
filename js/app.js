document.addEventListener("DOMContentLoaded", () => {
  const sizingDataset = window.FitMatchData;
  const normalizeApi = window.FitMatchNormalize;
  const translateSize = window.FitMatchTranslate;

  const brandGrid = document.getElementById("datasetGrid");
  const sourceBrandSelect = document.getElementById("sourceBrand");
  const targetBrandSelect = document.getElementById("targetBrand");
  const sourceSizeSelect = document.getElementById("sourceSize");
  const compareForm = document.getElementById("compareForm");
  const translationResult = document.getElementById("translationResult");
  const saveFeedbackButton = document.getElementById("saveFeedback");
  const feedbackOutcome = document.getElementById("feedbackOutcome");
  const feedbackNotes = document.getElementById("feedbackNotes");
  const feedbackStatus = document.getElementById("feedbackStatus");

  if (!sizingDataset?.brands || !normalizeApi || !translateSize) {
    translationResult.innerHTML = `
      <h3>Loading issue</h3>
      <p>The sizing dataset did not initialize correctly. Please refresh the page.</p>
    `;
    return;
  }

  const { getBrandList, getCanonicalBrandChart } = normalizeApi;
  const brands = getBrandList();

  function renderDataset() {
    brandGrid.innerHTML = brands
      .map((brand) => {
        const chart = getCanonicalBrandChart(brand.id) || [];
        return `
          <article class="brand-card">
            <h3>${brand.label}</h3>
            <p>${brand.notes}</p>
            <ul>
              ${chart
                .map(
                  (size) =>
                    `<li>${size.size}: chest ${size.chest}cm, shoulders ${size.shoulders}cm, length ${size.length}cm</li>`
                )
                .join("")}
            </ul>
          </article>
        `;
      })
      .join("");
  }

  function populateBrandSelects() {
    if (!brands.length) {
      sourceBrandSelect.innerHTML = `<option value="">No brands loaded</option>`;
      targetBrandSelect.innerHTML = `<option value="">No brands loaded</option>`;
      sourceSizeSelect.innerHTML = `<option value="">No sizes loaded</option>`;
      return;
    }

    const options = brands
      .map((brand) => `<option value="${brand.id}">${brand.label}</option>`)
      .join("");

    sourceBrandSelect.innerHTML = options;
    targetBrandSelect.innerHTML = options;
    sourceBrandSelect.value = brands[0]?.id ?? "";
    targetBrandSelect.value = brands[1]?.id ?? brands[0]?.id ?? "";

    refreshSizes();
  }

  function refreshSizes() {
    const sourceBrand = sourceBrandSelect.value;
    const chart = getCanonicalBrandChart(sourceBrand) || [];

    sourceSizeSelect.innerHTML = chart
      .map((entry) => `<option value="${entry.size}">${entry.size}</option>`)
      .join("");

    sourceSizeSelect.value = chart.find((entry) => entry.size === "S") ? "S" : chart[0]?.size ?? "S";
  }

  function renderTranslation() {
    const sourceBrand = sourceBrandSelect.value;
    const targetBrand = targetBrandSelect.value;
    const sourceSize = sourceSizeSelect.value;
    const result = translateSize(sourceBrand, sourceSize, targetBrand);
    const sourceLabel = sizingDataset.brands[sourceBrand]?.label ?? sourceBrand;
    const targetLabel = sizingDataset.brands[targetBrand]?.label ?? targetBrand;

    if (!result) {
      translationResult.innerHTML = `
        <h3>Translation result</h3>
        <p>Could not compare the selected brands.</p>
      `;
      return;
    }

    translationResult.innerHTML = `
      <h3>${sourceLabel} ${sourceSize} -> ${targetLabel} ${result.translatedSize}</h3>
      <p>${result.reasoning}</p>
      <p>Fit match: <strong>${result.fitDirection}</strong> | Confidence: <strong>${result.confidence}</strong></p>
    `;
  }

  function saveLocalFeedback() {
    const payload = {
      outcome: feedbackOutcome.value,
      notes: feedbackNotes.value.trim(),
      sourceBrand: sourceBrandSelect.value,
      sourceSize: sourceSizeSelect.value,
      targetBrand: targetBrandSelect.value,
      savedAt: new Date().toISOString()
    };

    localStorage.setItem("fitmatch-feedback", JSON.stringify(payload));
    feedbackStatus.textContent = `Saved locally: ${payload.outcome.replaceAll("_", " ")}.`;
  }

  renderDataset();
  populateBrandSelects();
  renderTranslation();

  sourceBrandSelect.addEventListener("change", () => {
    refreshSizes();
    renderTranslation();
  });

  targetBrandSelect.addEventListener("change", renderTranslation);
  sourceSizeSelect.addEventListener("change", renderTranslation);

  compareForm.addEventListener("submit", (event) => {
    event.preventDefault();
    renderTranslation();
  });

  saveFeedbackButton.addEventListener("click", saveLocalFeedback);
});
