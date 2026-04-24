const QUESTIONS = window.PSPO_QUESTIONS || [];
const STORAGE_KEY = 'pspo-quiz-state-v1';

const state = {
  currentIndex: 0,
  selected: {},
  submitted: false,
};

const els = {
  startBtn: document.getElementById('startBtn'),
  resetBtnTop: document.getElementById('resetBtnTop'),
  clearBtn: document.getElementById('clearBtn'),
  restartBtn: document.getElementById('restartBtn'),
  prevBtn: document.getElementById('prevBtn'),
  nextBtn: document.getElementById('nextBtn'),
  submitBtn: document.getElementById('submitBtn'),
  questionHost: document.getElementById('questionHost'),
  navigator: document.getElementById('navigator'),
  quizTitle: document.getElementById('quizTitle'),
  questionMode: document.getElementById('questionMode'),
  questionCounter: document.getElementById('questionCounter'),
  progressFill: document.getElementById('progressFill'),
  answeredCount: document.getElementById('answeredCount'),
  scoreCount: document.getElementById('scoreCount'),
  statusLabel: document.getElementById('statusLabel'),
  statusDetail: document.getElementById('statusDetail'),
  results: document.getElementById('results'),
  scoreBadge: document.getElementById('scoreBadge'),
  resultsSummary: document.getElementById('resultsSummary'),
  reviewList: document.getElementById('reviewList'),
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw);
    if (typeof parsed.currentIndex === 'number') {
      state.currentIndex = clamp(parsed.currentIndex, 0, QUESTIONS.length - 1);
    }

    if (parsed.selected && typeof parsed.selected === 'object') {
      state.selected = parsed.selected;
    }

    state.submitted = Boolean(parsed.submitted);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function persistAndRender() {
  saveState();
  render();
}

function getQuestionSelection(questionNumber) {
  const value = state.selected[questionNumber];
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map(String);
}

function setQuestionSelection(questionNumber, selection) {
  state.selected[questionNumber] = Array.from(new Set(selection.map(String)));
  persistAndRender();
}

function isQuestionAnswered(questionNumber) {
  return getQuestionSelection(questionNumber).length > 0;
}

function hasQuestionCorrectAnswer(question, selection) {
  const selected = [...selection].sort();
  const correct = [...question.answer].map(String).sort();
  if (selected.length !== correct.length) {
    return false;
  }

  return selected.every((value, index) => value === correct[index]);
}

function getCorrectCount() {
  return QUESTIONS.reduce((count, question) => {
    const selection = getQuestionSelection(question.number);
    return count + (hasQuestionCorrectAnswer(question, selection) ? 1 : 0);
  }, 0);
}

function getAnsweredCount() {
  return QUESTIONS.reduce((count, question) => count + (isQuestionAnswered(question.number) ? 1 : 0), 0);
}

function formatAnswerText(question, ids) {
  if (!ids.length) {
    return 'Geen antwoord ingevuld.';
  }

  const labels = ids.map((id) => {
    const option = question.options.find((item) => item.id === id);
    return option ? `${option.id}. ${option.text}` : id;
  });

  return labels.join('; ');
}

function renderQuestion() {
  const question = QUESTIONS[state.currentIndex];
  if (!question) {
    els.questionHost.innerHTML = '';
    return;
  }

  const selection = getQuestionSelection(question.number);
  const inputType = question.chooseAll ? 'checkbox' : 'radio';
  const modeLabel = question.chooseAll ? 'Meerdere antwoorden' : 'Een antwoord';

  els.quizTitle.textContent = `Vraag ${question.number}`;
  els.questionMode.textContent = modeLabel;
  els.questionCounter.textContent = `${question.number} van ${QUESTIONS.length}`;
  els.questionHost.innerHTML = `
    <article class="question-card">
      <h3>${escapeHtml(question.prompt)}</h3>
      <p class="question-help">
        ${question.chooseAll ? 'Kies alle opties die kloppen.' : 'Kies het beste antwoord.'}
      </p>
      <div class="options">
        ${question.options
          .map((option) => {
            const checked = selection.includes(option.id) ? 'checked' : '';
            const selectedClass = selection.includes(option.id) ? 'selected' : '';
            return `
              <label class="option ${selectedClass}">
                <input
                  type="${inputType}"
                  name="question-${question.number}"
                  value="${escapeHtml(option.id)}"
                  ${checked}
                />
                <span class="option-id">${escapeHtml(option.id)}</span>
                <span class="option-text">${escapeHtml(option.text)}</span>
              </label>
            `;
          })
          .join('')}
      </div>
    </article>
  `;
}

function renderNavigator() {
  const selectedIndex = state.currentIndex;

  els.navigator.innerHTML = QUESTIONS.map((question, index) => {
    const selection = getQuestionSelection(question.number);
    const answered = selection.length > 0;
    const correct = state.submitted && hasQuestionCorrectAnswer(question, selection);
    const wrong = state.submitted && answered && !correct;

    const classes = [
      index === selectedIndex ? 'current' : '',
      answered ? 'answered' : '',
      correct ? 'correct' : '',
      wrong ? 'wrong' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return `
      <button type="button" class="${classes}" data-index="${index}" aria-label="Ga naar vraag ${question.number}">
        ${question.number}
      </button>
    `;
  }).join('');
}

function renderStats() {
  const answeredCount = getAnsweredCount();
  const correctCount = getCorrectCount();
  const progress = QUESTIONS.length ? (answeredCount / QUESTIONS.length) * 100 : 0;

  els.answeredCount.textContent = `${answeredCount}/${QUESTIONS.length}`;
  els.progressFill.style.width = `${progress}%`;

  if (state.submitted) {
    els.scoreCount.textContent = `${correctCount}/${QUESTIONS.length}`;
    els.statusLabel.textContent = 'Ingeleverd';
    els.statusDetail.textContent = `${correctCount} volledig juiste antwoorden.`;
  } else {
    els.scoreCount.textContent = '-';
    els.statusLabel.textContent = answeredCount > 0 ? 'Bezig' : 'Nog niet gestart';
    els.statusDetail.textContent =
      answeredCount > 0
        ? `${answeredCount} vraag${answeredCount === 1 ? '' : 'en'} al ingevuld.`
        : 'Je staat klaar om te beginnen.';
  }
}

function renderButtons() {
  els.prevBtn.disabled = state.currentIndex === 0;
  els.nextBtn.disabled = state.currentIndex >= QUESTIONS.length - 1;
  els.submitBtn.disabled = QUESTIONS.length === 0;
  els.submitBtn.textContent = state.submitted ? 'Score opnieuw berekenen' : 'Score zien';
}

function renderReview() {
  const answeredCount = getAnsweredCount();
  const correctCount = getCorrectCount();
  const incorrectCount = answeredCount - correctCount;
  const unansweredCount = QUESTIONS.length - answeredCount;
  const percentage = QUESTIONS.length ? Math.round((correctCount / QUESTIONS.length) * 100) : 0;

  els.results.classList.toggle('hidden', !state.submitted);

  if (!state.submitted) {
    els.resultsSummary.innerHTML = '';
    els.reviewList.innerHTML = '';
    els.scoreBadge.textContent = '-';
    return;
  }

  els.scoreBadge.textContent = `${correctCount}/${QUESTIONS.length} juist`;
  els.resultsSummary.innerHTML = `
    <div class="results-metrics">
      <div class="metric">
        <strong>${correctCount}</strong>
        <span>volledig correcte antwoorden</span>
      </div>
      <div class="metric">
        <strong>${incorrectCount}</strong>
        <span>fout of deels goed</span>
      </div>
      <div class="metric">
        <strong>${unansweredCount}</strong>
        <span>nog onbeantwoord</span>
      </div>
    </div>
    <p>
      Je eindscore is <strong>${percentage}%</strong>. Hieronder zie je per vraag wat jij koos en
      wat het correcte antwoord is.
    </p>
  `;

  els.reviewList.innerHTML = QUESTIONS.map((question) => {
    const selection = getQuestionSelection(question.number);
    const correct = hasQuestionCorrectAnswer(question, selection);
    const answered = selection.length > 0;
    const statusLabel = correct
      ? 'Goed'
      : answered
        ? 'Nog eens bekijken'
        : 'Niet beantwoord';
    const statusClass = correct ? 'good' : answered ? 'bad' : 'neutral';

    return `
      <article class="review-item ${correct ? 'correct' : 'wrong'}">
        <div class="review-top">
          <p class="review-title">Vraag ${question.number}</p>
          <span class="badge ${statusClass}">${statusLabel}</span>
        </div>
        <p class="review-question">${escapeHtml(question.prompt)}</p>
        <div class="review-grid">
          <div class="answer-line">
            <strong>Jouw antwoord:</strong> ${escapeHtml(formatAnswerText(question, selection))}
          </div>
          <div class="answer-line">
            <strong>Correct antwoord:</strong> ${escapeHtml(formatAnswerText(question, question.answer))}
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function render() {
  renderQuestion();
  renderNavigator();
  renderStats();
  renderButtons();
  renderReview();
}

function goToQuestion(index) {
  state.currentIndex = clamp(index, 0, QUESTIONS.length - 1);
  persistAndRender();
  els.questionHost.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function moveQuestion(delta) {
  goToQuestion(state.currentIndex + delta);
}

function collectCurrentSelection() {
  const question = QUESTIONS[state.currentIndex];
  if (!question) {
    return;
  }

  const inputs = Array.from(els.questionHost.querySelectorAll('input'));
  const selected = inputs.filter((input) => input.checked).map((input) => input.value);
  setQuestionSelection(question.number, selected);
}

function submitQuiz() {
  collectCurrentSelection();
  state.submitted = true;
  persistAndRender();
  els.results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetQuiz() {
  state.currentIndex = 0;
  state.selected = {};
  state.submitted = false;
  persistAndRender();
  els.questionHost.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function focusCurrentQuestion() {
  els.questionHost.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function attachEvents() {
  els.questionHost.addEventListener('change', (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    const question = QUESTIONS[state.currentIndex];
    if (!question) {
      return;
    }

    if (question.chooseAll) {
      const selection = Array.from(
        els.questionHost.querySelectorAll('input:checked'),
        (checked) => checked.value,
      );
      setQuestionSelection(question.number, selection);
      return;
    }

    setQuestionSelection(question.number, [input.value]);
  });

  els.navigator.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-index]');
    if (!button) {
      return;
    }

    goToQuestion(Number(button.dataset.index));
  });

  els.prevBtn.addEventListener('click', () => moveQuestion(-1));
  els.nextBtn.addEventListener('click', () => moveQuestion(1));
  els.submitBtn.addEventListener('click', submitQuiz);
  els.restartBtn.addEventListener('click', resetQuiz);
  els.startBtn.addEventListener('click', focusCurrentQuestion);
  els.resetBtnTop.addEventListener('click', resetQuiz);
  els.clearBtn.addEventListener('click', () => {
    state.selected = {};
    state.submitted = false;
    persistAndRender();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      moveQuestion(-1);
    }

    if (event.key === 'ArrowRight') {
      moveQuestion(1);
    }
  });
}

function init() {
  if (!QUESTIONS.length) {
    els.questionHost.innerHTML = '<p>De vragenlijst kon niet worden geladen.</p>';
    return;
  }

  loadState();
  if (state.currentIndex >= QUESTIONS.length) {
    state.currentIndex = 0;
  }

  attachEvents();
  render();

  if (state.submitted) {
    els.results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

init();
