const QUESTION_BANK = window.PSPO_QUESTIONS || [];
const EXAM_QUESTION_COUNT = 80;
const EXAM_DURATION_SECONDS = 60 * 60;
const PASS_PERCENT = 85;

const questionById = new Map(QUESTION_BANK.map((question) => [question.id, question]));

const state = {
  currentIndex: 0,
  selected: {},
  submitted: false,
  startedAt: null,
  finishedAt: null,
  questionIds: [],
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
  timerLabel: document.getElementById('timerLabel'),
  passLabel: document.getElementById('passLabel'),
  results: document.getElementById('results'),
  scoreBadge: document.getElementById('scoreBadge'),
  resultsSummary: document.getElementById('resultsSummary'),
  reviewList: document.getElementById('reviewList'),
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function formatTime(totalSeconds) {
  const seconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function persistState() {
  // Intentionally no-op: the exam should reset on every refresh.
}

function getCurrentExamQuestions() {
  return state.questionIds
    .map((id) => questionById.get(id))
    .filter(Boolean);
}

function getQuestionAt(index) {
  return getCurrentExamQuestions()[index];
}

function getQuestionSelection(questionId) {
  const value = state.selected[questionId];
  return Array.isArray(value) ? value.map(String) : [];
}

function setQuestionSelection(questionId, selection) {
  state.selected[questionId] = Array.from(new Set(selection.map(String)));
  persistState();
  render();
}

function isQuestionAnswered(questionId) {
  return getQuestionSelection(questionId).length > 0;
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
  return getCurrentExamQuestions().reduce((count, question) => {
    const selection = getQuestionSelection(question.id);
    return count + (hasQuestionCorrectAnswer(question, selection) ? 1 : 0);
  }, 0);
}

function getAnsweredCount() {
  return getCurrentExamQuestions().reduce(
    (count, question) => count + (isQuestionAnswered(question.id) ? 1 : 0),
    0,
  );
}

function getRemainingSeconds() {
  if (!state.startedAt) {
    return EXAM_DURATION_SECONDS;
  }

  if (state.submitted && state.finishedAt) {
    const elapsed = Math.floor((state.finishedAt - state.startedAt) / 1000);
    return Math.max(0, EXAM_DURATION_SECONDS - elapsed);
  }

  const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
  return Math.max(0, EXAM_DURATION_SECONDS - elapsed);
}

function getFeedback(question) {
  if (typeof question.feedback === 'string' && question.feedback.trim()) {
    return question.feedback.trim();
  }

  const correctText = formatAnswerText(question, question.answer);
  return question.chooseAll
    ? `De juiste keuzes zijn ${correctText}.`
    : `De juiste keuze is ${correctText}.`;
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

function createNewExam() {
  const questionIds = shuffle(QUESTION_BANK.map((question) => question.id)).slice(0, EXAM_QUESTION_COUNT);
  state.currentIndex = 0;
  state.selected = {};
  state.submitted = false;
  state.startedAt = Date.now();
  state.finishedAt = null;
  state.questionIds = questionIds;
  persistState();
  render();
  els.questionHost.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resumeOrStartExam() {
  if (!state.questionIds.length || state.submitted) {
    createNewExam();
    return;
  }

  if (!state.startedAt) {
    state.startedAt = Date.now();
    persistState();
  }

  render();
  els.questionHost.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function submitExam() {
  const question = getQuestionAt(state.currentIndex);
  if (question) {
    const inputs = Array.from(els.questionHost.querySelectorAll('input'));
    const selected = inputs.filter((input) => input.checked).map((input) => input.value);
    setQuestionSelection(question.id, selected);
  }

  state.submitted = true;
  state.finishedAt = Date.now();
  persistState();
  render();
  els.results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function autoSubmitIfExpired() {
  if (!state.submitted && state.startedAt && getRemainingSeconds() <= 0) {
    submitExam();
  }
}

function renderQuestion() {
  const question = getQuestionAt(state.currentIndex);
  if (!question) {
    els.quizTitle.textContent = state.questionIds.length ? 'Vraag niet gevonden' : 'Nog niet gestart';
    els.questionHost.innerHTML = state.questionIds.length
      ? '<p>De vraag kon niet worden geladen.</p>'
      : '<div class="start-placeholder"><h3>Klik op "Start examen" om te beginnen.</h3><p>Je krijgt 80 willekeurige vragen en 60 minuten om het examen af te ronden.</p></div>';
    return;
  }

  const selection = getQuestionSelection(question.id);
  const inputType = question.chooseAll ? 'checkbox' : 'radio';

  els.quizTitle.textContent = `Vraag ${state.currentIndex + 1}`;
  els.questionMode.textContent = question.chooseAll ? 'Meerdere antwoorden' : 'Een antwoord';
  els.questionCounter.textContent = `${state.currentIndex + 1} van ${EXAM_QUESTION_COUNT}`;

  els.questionHost.innerHTML = `
    <article class="question-card">
      <h3>${escapeHtml(question.prompt)}</h3>
      <p class="question-help">${question.chooseAll ? 'Kies alle opties die kloppen.' : 'Kies het beste antwoord.'}</p>
      <div class="options">
        ${question.options.map((option) => {
          const checked = selection.includes(option.id) ? 'checked' : '';
          const selectedClass = selection.includes(option.id) ? 'selected' : '';
          return `
            <label class="option ${selectedClass}">
              <input
                type="${inputType}"
                name="question-${question.id}"
                value="${escapeHtml(option.id)}"
                ${checked}
              />
              <span class="option-id">${escapeHtml(option.id)}</span>
              <span class="option-text">${escapeHtml(option.text)}</span>
            </label>
          `;
        }).join('')}
      </div>
    </article>
  `;
}

function renderNavigator() {
  const questions = getCurrentExamQuestions();

  els.navigator.innerHTML = questions.map((question, index) => {
    const selection = getQuestionSelection(question.id);
    const answered = selection.length > 0;
    const correct = state.submitted && hasQuestionCorrectAnswer(question, selection);
    const wrong = state.submitted && answered && !correct;

    const classes = [
      index === state.currentIndex ? 'current' : '',
      answered ? 'answered' : '',
      correct ? 'correct' : '',
      wrong ? 'wrong' : '',
    ].filter(Boolean).join(' ');

    return `
      <button type="button" class="${classes}" data-index="${index}" aria-label="Ga naar vraag ${index + 1}">
        ${index + 1}
      </button>
    `;
  }).join('');
}

function renderStats() {
  const questions = getCurrentExamQuestions();
  const answeredCount = getAnsweredCount();
  const correctCount = getCorrectCount();
  const progress = questions.length ? (answeredCount / questions.length) * 100 : 0;
  const remainingSeconds = getRemainingSeconds();

  els.answeredCount.textContent = `${answeredCount}/${EXAM_QUESTION_COUNT}`;
  els.progressFill.style.width = `${progress}%`;
  els.timerLabel.textContent = formatTime(remainingSeconds);

  if (state.questionIds.length === 0) {
    els.scoreCount.textContent = '-';
  } else if (state.submitted) {
    els.scoreCount.textContent = `${correctCount}/${EXAM_QUESTION_COUNT}`;
  } else {
    els.scoreCount.textContent = '-';
  }
}

function renderButtons() {
  const hasExam = state.questionIds.length > 0;
  els.prevBtn.disabled = !hasExam || state.currentIndex === 0;
  els.nextBtn.disabled = !hasExam || state.currentIndex >= EXAM_QUESTION_COUNT - 1;
  els.submitBtn.disabled = !hasExam;
  els.submitBtn.textContent = state.submitted ? 'Ingeleverd' : 'Inleveren';
  els.startBtn.textContent = hasExam && !state.submitted ? 'Ga verder' : 'Start examen';
  els.resetBtnTop.textContent = 'Nieuw examen';
}

function renderReview() {
  const questions = getCurrentExamQuestions();
  const answeredCount = getAnsweredCount();
  const correctCount = getCorrectCount();
  const incorrectCount = answeredCount - correctCount;
  const unansweredCount = questions.length - answeredCount;
  const percentage = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;
  const passingCount = Math.ceil(EXAM_QUESTION_COUNT * PASS_PERCENT / 100);
  const passed = state.submitted && correctCount >= passingCount;

  els.results.classList.toggle('hidden', !state.submitted);

  if (!state.submitted) {
    els.resultsSummary.innerHTML = '';
    els.reviewList.innerHTML = '';
    els.scoreBadge.textContent = '-';
    return;
  }

  els.scoreBadge.textContent = passed ? 'Geslaagd' : 'Niet geslaagd';
  els.resultsSummary.innerHTML = `
    <div class="results-metrics">
      <div class="metric">
        <strong>${correctCount}</strong>
        <span>correcte antwoorden</span>
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
      Je eindscore is <strong>${percentage}%</strong>. Voor slagen heb je minstens <strong>${PASS_PERCENT}%</strong>
      nodig, dus minimaal <strong>${passingCount}/${EXAM_QUESTION_COUNT}</strong> juiste antwoorden.
      ${passed ? 'Je bent geslaagd.' : 'Je bent niet geslaagd.'}
    </p>
  `;

  els.reviewList.innerHTML = questions.map((question, index) => {
    const selection = getQuestionSelection(question.id);
    const correct = hasQuestionCorrectAnswer(question, selection);
    const answered = selection.length > 0;
    const statusLabel = correct ? 'Goed' : answered ? 'Nog eens bekijken' : 'Niet beantwoord';
    const statusClass = correct ? 'good' : answered ? 'bad' : 'neutral';

    return `
      <article class="review-item ${correct ? 'correct' : 'wrong'}">
        <div class="review-top">
          <p class="review-title">Vraag ${index + 1}</p>
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
          <div class="feedback-box">
            <strong>Feedback:</strong>
            <p>${escapeHtml(getFeedback(question))}</p>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function renderStartPlaceholder() {
  if (state.questionIds.length) {
    return;
  }

  els.questionHost.innerHTML = `
    <div class="start-placeholder">
      <h3>Klik op "Start examen" om te beginnen.</h3>
      <p>Je krijgt 80 willekeurige vragen en 60 minuten om het examen af te ronden.</p>
    </div>
  `;
}

function render() {
  if (!state.questionIds.length) {
    els.quizTitle.textContent = 'Nog niet gestart';
    els.questionMode.textContent = 'Examen';
    els.questionCounter.textContent = `0 van ${EXAM_QUESTION_COUNT}`;
    els.progressFill.style.width = '0%';
    els.answeredCount.textContent = `0/${EXAM_QUESTION_COUNT}`;
    els.scoreCount.textContent = '-';
    els.timerLabel.textContent = formatTime(EXAM_DURATION_SECONDS);
    els.results.classList.add('hidden');
    renderStartPlaceholder();
    renderButtons();
    els.navigator.innerHTML = '';
    els.resultsSummary.innerHTML = '';
    els.reviewList.innerHTML = '';
    els.scoreBadge.textContent = '-';
    return;
  }

  renderQuestion();
  renderNavigator();
  renderStats();
  renderButtons();
  renderReview();
}

function moveQuestion(delta) {
  state.currentIndex = Math.max(0, Math.min(EXAM_QUESTION_COUNT - 1, state.currentIndex + delta));
  persistState();
  render();
  els.questionHost.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function attachEvents() {
  els.questionHost.addEventListener('change', (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    const question = getQuestionAt(state.currentIndex);
    if (!question) {
      return;
    }

    if (question.chooseAll) {
      const selection = Array.from(
        els.questionHost.querySelectorAll('input:checked'),
        (checked) => checked.value,
      );
      setQuestionSelection(question.id, selection);
      return;
    }

    setQuestionSelection(question.id, [input.value]);
  });

  els.navigator.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-index]');
    if (!button) {
      return;
    }

    state.currentIndex = Number(button.dataset.index);
    persistState();
    render();
  });

  els.prevBtn.addEventListener('click', () => moveQuestion(-1));
  els.nextBtn.addEventListener('click', () => moveQuestion(1));
  els.submitBtn.addEventListener('click', submitExam);
  els.restartBtn.addEventListener('click', createNewExam);
  els.startBtn.addEventListener('click', resumeOrStartExam);
  els.resetBtnTop.addEventListener('click', createNewExam);
  els.clearBtn.addEventListener('click', () => {
    state.selected = {};
    persistState();
    render();
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
  if (!QUESTION_BANK.length) {
    els.questionHost.innerHTML = '<p>De vragenbank kon niet worden geladen.</p>';
    return;
  }

  state.currentIndex = 0;
  state.selected = {};
  state.submitted = false;
  state.startedAt = null;
  state.finishedAt = null;
  state.questionIds = [];
  render();

  setInterval(() => {
    if (state.questionIds.length && !state.submitted) {
      renderStats();
      autoSubmitIfExpired();
    }
  }, 1000);
}

attachEvents();
init();
