/**
 * app.js
 * TypeFlow — Main application logic
 *
 * Responsibilities:
 *  - Story selection & rendering
 *  - Character-by-character state tracking
 *  - Keyboard input & backspace handling
 *  - Pause / Resume
 *  - Timer management
 *  - WPM / accuracy calculations
 *  - Progress bar updates
 *  - Test completion + performance badge
 *  - Restart / new story functionality
 *  - Live UI updates
 */

/* ─────────────────────────────────────────
   STATE
───────────────────────────────────────── */
const state = {
  story: null,               // { id, title, text }
  chars: [],                 // array of { char, state }
  currentIndex: 0,           // next character index to type
  totalTyped: 0,             // total keypresses (including mistakes)

  started:  false,
  paused:   false,
  finished: false,

  startTime:      null,
  pausedAt:       null,      // timestamp when paused
  totalPausedMs:  0,         // cumulative paused milliseconds
  timerInterval:  null,
  elapsedSeconds: 0,
};

/* ─────────────────────────────────────────
   DOM — populated inside init()
───────────────────────────────────────── */
const DOM = {};

/* ─────────────────────────────────────────
   STORY MANAGEMENT
───────────────────────────────────────── */

/** Pick a random story, optionally excluding the current one */
function pickRandomStory(excludeId = null) {
  const pool = excludeId !== null
    ? STORIES.filter(s => s.id !== excludeId)
    : STORIES;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Build per-character state objects from story text */
function buildCharState(text) {
  return text.split('').map(ch => ({
    char: ch,
    state: 'untyped', // 'untyped' | 'correct' | 'incorrect' | 'current'
  }));
}

/* ─────────────────────────────────────────
   RENDERING
───────────────────────────────────────── */

/** Render all character spans into the text display */
function renderText() {
  DOM.textDisplay.innerHTML = '';

  state.chars.forEach((c, i) => {
    const span = document.createElement('span');
    span.dataset.index = i;
    span.className = 'char ' + c.state;
    span.innerHTML = c.char === ' ' ? '&nbsp;' : c.char;
    DOM.textDisplay.appendChild(span);
  });

  scrollToCurrent();
  updateProgressBar();
}

/** Efficiently update only the class of one span */
function updateCharSpan(index) {
  const span = DOM.textDisplay.querySelector(`[data-index="${index}"]`);
  if (!span) return;
  span.className = 'char ' + state.chars[index].state;
}

/** Scroll the current character into view */
function scrollToCurrent() {
  const span = DOM.textDisplay.querySelector('.current');
  if (span) span.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

/** Set a character's state and update its span */
function setCharState(index, charState) {
  if (index < 0 || index >= state.chars.length) return;
  state.chars[index].state = charState;
  updateCharSpan(index);
}

/** Update the progress bar and character count label */
function updateProgressBar() {
  const total = state.chars.length;
  const done  = state.currentIndex;
  const pct   = total > 0 ? (done / total) * 100 : 0;

  DOM.progressFill.style.width = pct + '%';
  DOM.progressBarWrap.setAttribute('aria-valuenow', Math.round(pct));
  DOM.storyProgressLabel.textContent = `${done} / ${total}`;
}

/* ─────────────────────────────────────────
   TIMER
───────────────────────────────────────── */

function startTimer() {
  state.startTime    = Date.now();
  state.totalPausedMs = 0;
  state.timerInterval = setInterval(tickTimer, 100);
}

function tickTimer() {
  const rawMs = Date.now() - state.startTime - state.totalPausedMs;
  state.elapsedSeconds = rawMs / 1000;
  updateStats();
}

function stopTimer() {
  clearInterval(state.timerInterval);
  state.timerInterval = null;
}

function resetTimer() {
  stopTimer();
  state.elapsedSeconds = 0;
  state.startTime      = null;
  state.pausedAt       = null;
  state.totalPausedMs  = 0;
}

/* ─────────────────────────────────────────
   PAUSE / RESUME
───────────────────────────────────────── */

function pauseTest() {
  if (!state.started || state.finished || state.paused) return;

  state.paused  = true;
  state.pausedAt = Date.now();

  // Stop the timer interval but keep elapsed time
  clearInterval(state.timerInterval);
  state.timerInterval = null;

  // UI
  DOM.typingCard.classList.add('is-paused');
  DOM.pauseOverlay.classList.remove('hidden');
  DOM.pauseBtn.classList.add('is-paused');

  // Swap pause button icon to "play" and update label
  DOM.pauseIconSvg.innerHTML = `
    <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none"/>
  `;
  DOM.pauseBtnLabel.textContent = 'Resume';
}

function resumeTest() {
  if (!state.paused) return;

  // Accumulate the time spent paused
  state.totalPausedMs += Date.now() - state.pausedAt;
  state.pausedAt = null;
  state.paused   = false;

  // Restart the interval
  state.timerInterval = setInterval(tickTimer, 100);

  // UI
  DOM.typingCard.classList.remove('is-paused');
  DOM.pauseOverlay.classList.add('hidden');
  DOM.pauseBtn.classList.remove('is-paused');

  // Swap back to pause icon
  DOM.pauseIconSvg.innerHTML = `
    <rect x="6" y="4" width="4" height="16"/>
    <rect x="14" y="4" width="4" height="16"/>
  `;
  DOM.pauseBtnLabel.textContent = 'Pause';
}

function togglePause() {
  if (state.paused) resumeTest();
  else              pauseTest();
}

/* ─────────────────────────────────────────
   STATISTICS CALCULATIONS
───────────────────────────────────────── */

function getElapsedMinutes() {
  return state.elapsedSeconds > 0.01
    ? state.elapsedSeconds / 60
    : 0.0001; // avoid division by zero
}

/** Net WPM = (correct chars / 5) / elapsed minutes */
function calcNetWPM() {
  const correct = state.chars.filter(c => c.state === 'correct').length;
  return Math.round(correct / 5 / getElapsedMinutes());
}

/** Raw WPM = (total keypresses / 5) / elapsed minutes */
function calcRawWPM() {
  return Math.round(state.totalTyped / 5 / getElapsedMinutes());
}

/** Accuracy = (correct chars in display / total keypresses) × 100 */
function calcAccuracy() {
  if (state.totalTyped === 0) return 100;
  const correct = state.chars.filter(c => c.state === 'correct').length;
  return Math.round((correct / state.totalTyped) * 100);
}

/** Push updated values to the live stats bar */
function updateStats() {
  const wpm  = state.started ? calcNetWPM()   : 0;
  const acc  = state.started ? calcAccuracy() : 100;
  const time = Math.floor(state.elapsedSeconds);
  const correctChars   = state.chars.filter(c => c.state === 'correct').length;
  const incorrectChars = state.chars.filter(c => c.state === 'incorrect').length;

  DOM.wpmStat.textContent      = wpm;
  DOM.accStat.textContent      = acc + '%';
  DOM.timeStat.textContent     = time + 's';
  DOM.charsStat.textContent    = state.totalTyped;
  DOM.correctStat.textContent  = correctChars;
  DOM.incorrectStat.textContent = incorrectChars;
}

/* ─────────────────────────────────────────
   KEYBOARD INPUT ENGINE
───────────────────────────────────────── */

function handleKeydown(e) {
  // If finished, ignore everything
  if (state.finished) return;

  // Escape = toggle pause (once started)
  if (e.key === 'Escape') {
    e.preventDefault();
    if (state.started) togglePause();
    return;
  }

  // Tab = restart — but ONLY when test is not actively running
  // (not mid-session; prevents accidental restart while typing)
  if (e.key === 'Tab') {
    e.preventDefault();
    if (!state.started || state.finished) restartTest();
    // silently ignore Tab during an active test
    return;
  }

  // Enter = new story (only when idle or finished)
  if (e.key === 'Enter') {
    e.preventDefault();
    if (!state.started || state.finished) loadNewStory();
    return;
  }

  // Block all input while paused
  if (state.paused) return;

  // Ignore modifier-only keys
  if (
    e.ctrlKey || e.altKey || e.metaKey ||
    ['Shift', 'Control', 'Alt', 'Meta',
     'CapsLock', 'F1','F2','F3','F4','F5',
     'F6','F7','F8','F9','F10','F11','F12',
     'ArrowLeft','ArrowRight','ArrowUp','ArrowDown',
     'Home','End','PageUp','PageDown','Insert','Delete'].includes(e.key)
  ) return;

  // Block paste
  if (e.key === 'v' && e.ctrlKey) { e.preventDefault(); return; }

  e.preventDefault();

  if (e.key === 'Backspace') {
    handleBackspace();
    return;
  }

  // Only single printable characters beyond this point
  if (e.key.length !== 1) return;

  // Don't type past the end
  if (state.currentIndex >= state.chars.length) return;

  // Start timer on first valid keypress
  if (!state.started) {
    state.started = true;
    startTimer();
    DOM.focusHint.style.display  = 'none';
    DOM.pauseBtn.disabled        = false;   // enable pause button
  }

  const typedChar    = e.key;
  const expectedChar = state.chars[state.currentIndex].char;

  // Clear 'current' from this position, then apply result
  setCharState(state.currentIndex, typedChar === expectedChar ? 'correct' : 'incorrect');

  state.totalTyped++;
  state.currentIndex++;

  // Mark next char as cursor position
  if (state.currentIndex < state.chars.length) {
    setCharState(state.currentIndex, 'current');
    scrollToCurrent();
  }

  // Update live stats and progress
  updateStats();
  updateProgressBar();

  // Check for completion
  if (state.currentIndex >= state.chars.length) {
    finishTest();
  }
}

function handleBackspace() {
  if (state.currentIndex === 0) return;

  // Clear 'current' from current position (only if not at very end)
  if (state.currentIndex < state.chars.length) {
    setCharState(state.currentIndex, 'untyped');
  }

  state.currentIndex--;
  state.totalTyped = Math.max(0, state.totalTyped - 1);

  // Move cursor back
  setCharState(state.currentIndex, 'current');

  updateStats();
  updateProgressBar();
  scrollToCurrent();
}

/* ─────────────────────────────────────────
   TEST LIFECYCLE
───────────────────────────────────────── */

/** Load a story and initialize all state */
function loadStory(story) {
  state.story        = story;
  state.chars        = buildCharState(story.text);
  state.currentIndex = 0;
  state.totalTyped   = 0;
  state.started      = false;
  state.paused       = false;
  state.finished     = false;

  resetTimer();

  // Mark first char as cursor
  if (state.chars.length > 0) state.chars[0].state = 'current';

  // Render
  DOM.storyTitle.textContent = story.title;
  renderText();

  // Reset stat display
  DOM.wpmStat.textContent       = '0';
  DOM.accStat.textContent       = '100%';
  DOM.timeStat.textContent      = '0s';
  DOM.charsStat.textContent     = '0';
  DOM.correctStat.textContent   = '0';
  DOM.incorrectStat.textContent = '0';

  // Show focus hint
  DOM.focusHint.style.display = 'flex';

  // Ensure pause overlay is hidden
  DOM.pauseOverlay.classList.add('hidden');
  DOM.typingCard.classList.remove('is-paused');

  // Reset pause button
  DOM.pauseBtn.disabled = true;
  DOM.pauseBtn.classList.remove('is-paused');
  DOM.pauseIconSvg.innerHTML = `
    <rect x="6" y="4" width="4" height="16"/>
    <rect x="14" y="4" width="4" height="16"/>
  `;
  DOM.pauseBtnLabel.textContent = 'Pause';

  hideModal();
}

/** Called when the user completes the passage */
function finishTest() {
  state.finished = true;
  stopTimer();

  // Precise final elapsed
  state.elapsedSeconds = (Date.now() - state.startTime - state.totalPausedMs) / 1000;

  // Fill progress bar to 100%
  DOM.progressFill.style.width = '100%';
  DOM.storyProgressLabel.textContent = `${state.chars.length} / ${state.chars.length}`;

  updateStats();
  showResults();
}

/** Populate and show the results modal */
function showResults() {
  const correctChars   = state.chars.filter(c => c.state === 'correct').length;
  const incorrectChars = state.chars.filter(c => c.state === 'incorrect').length;
  const totalChars     = state.chars.length;
  const netWpm  = calcNetWPM();
  const rawWpm  = calcRawWPM();
  const acc     = calcAccuracy();
  const time    = state.elapsedSeconds.toFixed(1);

  DOM.resWpm.textContent       = netWpm;
  DOM.resRawWpm.textContent    = rawWpm;
  DOM.resAcc.textContent       = acc + '%';
  DOM.resTime.textContent      = time + 's';
  DOM.resCorrect.textContent   = correctChars;
  DOM.resIncorrect.textContent = incorrectChars;
  DOM.resTotal.textContent     = totalChars;
  DOM.resStory.textContent     = state.story.title;

  // Performance badge
  renderPerfBadge(netWpm, acc);

  DOM.modal.classList.add('visible');
}

/** Render a contextual performance badge based on WPM */
function renderPerfBadge(wpm, acc) {
  let emoji, label, colorClass;

  if (wpm >= 100 && acc >= 95) {
    emoji = '🚀'; label = 'Speed Demon'; colorClass = 'color: #a590ff; background: rgba(124,106,245,0.12); border-color: rgba(124,106,245,0.3);';
  } else if (wpm >= 70 && acc >= 90) {
    emoji = '⚡'; label = 'Fast Fingers'; colorClass = 'color: #4dd98a; background: rgba(77,217,138,0.12); border-color: rgba(77,217,138,0.3);';
  } else if (wpm >= 50 && acc >= 85) {
    emoji = '🎯'; label = 'Solid Typist'; colorClass = 'color: #5bbcf5; background: rgba(91,188,245,0.12); border-color: rgba(91,188,245,0.3);';
  } else if (wpm >= 35) {
    emoji = '📈'; label = 'Getting There'; colorClass = 'color: #f5a938; background: rgba(245,169,56,0.12); border-color: rgba(245,169,56,0.3);';
  } else {
    emoji = '💪'; label = 'Keep Practicing'; colorClass = 'color: #7e879e; background: rgba(126,135,158,0.1); border-color: rgba(126,135,158,0.2);';
  }

  DOM.perfBadge.innerHTML = `
    <span class="perf-badge-pill" style="${colorClass}">
      ${emoji} ${label}
    </span>
  `;
}

function hideModal() {
  DOM.modal.classList.remove('visible');
}

/* ─────────────────────────────────────────
   BUTTON HANDLERS
───────────────────────────────────────── */

function restartTest() {
  loadStory(state.story);
}

function loadNewStory() {
  const newStory = pickRandomStory(state.story ? state.story.id : null);
  loadStory(newStory);
}

/* ─────────────────────────────────────────
   THEME MANAGEMENT
───────────────────────────────────────── */

/** Apply saved theme on page load (reads localStorage) */
function initTheme() {
  const saved = localStorage.getItem('typeflow-theme');
  const prefer = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  const theme = saved || prefer;
  applyTheme(theme);
}

/** Switch between dark and light and persist the choice */
function toggleTheme() {
  const current = document.documentElement.dataset.theme || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

/** Apply a theme by setting data-theme on <html> and syncing the icon */
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('typeflow-theme', theme);
  if (DOM.themeToggleIcon) {
    DOM.themeToggleIcon.textContent = theme === 'light' ? '☀️' : '🌙';
  }
}

/* ─────────────────────────────────────────
   FOCUS MANAGEMENT
───────────────────────────────────────── */

function setupFocusManagement() {
  // Click on the text display area to dismiss focus hint
  DOM.textDisplay.addEventListener('click', () => {
    if (!state.started) DOM.focusHint.style.display = 'none';
    if (state.paused) resumeTest();
  });

  // Click on pause overlay to resume
  DOM.pauseOverlay.addEventListener('click', () => resumeTest());
}

/* ─────────────────────────────────────────
   INITIALIZATION
───────────────────────────────────────── */

function init() {
  // ── Resolve DOM references after DOMContentLoaded ──
  const $ = id => document.getElementById(id);

  DOM.storyTitle         = $('story-title');
  DOM.storyProgressLabel = $('story-progress-label');
  DOM.textDisplay        = $('text-display');
  DOM.progressFill       = $('progress-fill');
  DOM.progressBarWrap    = $('progress-bar-wrap');
  DOM.focusHint          = $('focus-hint');
  DOM.pauseOverlay       = $('pause-overlay');
  DOM.typingCard         = $('typing-card');

  DOM.wpmStat            = $('stat-wpm');
  DOM.accStat            = $('stat-acc');
  DOM.timeStat           = $('stat-time');
  DOM.charsStat          = $('stat-chars');
  DOM.correctStat        = $('stat-correct');
  DOM.incorrectStat      = $('stat-incorrect');

  DOM.btnRestart         = $('btn-restart');
  DOM.pauseBtn           = $('btn-pause');
  DOM.pauseIconSvg       = $('pause-icon-svg');
  DOM.pauseBtnLabel      = $('pause-btn-label');
  DOM.btnNewStory        = $('btn-new-story');
  DOM.btnThemeToggle     = $('btn-theme-toggle');
  DOM.themeToggleIcon    = $('theme-toggle-icon');

  DOM.modal              = $('result-modal');
  DOM.resWpm             = $('res-wpm');
  DOM.resRawWpm          = $('res-raw-wpm');
  DOM.resAcc             = $('res-acc');
  DOM.resTime            = $('res-time');
  DOM.resCorrect         = $('res-correct');
  DOM.resIncorrect       = $('res-incorrect');
  DOM.resTotal           = $('res-total');
  DOM.resStory           = $('res-story');
  DOM.perfBadge          = $('perf-badge');
  DOM.btnTryAgain        = $('btn-try-again');
  DOM.btnNewStoryModal   = $('btn-new-story-modal');

  // ── Theme toggle ──
  initTheme();
  DOM.btnThemeToggle.addEventListener('click', toggleTheme);

  // ── Keyboard events ──
  document.addEventListener('keydown', handleKeydown);

  // ── Button bindings ──
  DOM.btnRestart.addEventListener('click', restartTest);

  DOM.pauseBtn.addEventListener('click', togglePause);

  DOM.btnNewStory.addEventListener('click', loadNewStory);

  DOM.btnTryAgain.addEventListener('click', () => {
    hideModal();
    restartTest();
  });

  DOM.btnNewStoryModal.addEventListener('click', () => {
    hideModal();
    loadNewStory();
  });

  // ── Focus / click setup ──
  setupFocusManagement();

  // ── Load initial story ──
  const firstStory = pickRandomStory();
  loadStory(firstStory);
}

// Boot when DOM is ready
document.addEventListener('DOMContentLoaded', init);
