const configForm = document.getElementById('config-form');
const formStatus = document.getElementById('form-status');
const screenConfig = document.getElementById('screen-config');
const screenCountdown = document.getElementById('screen-countdown');
const screenComplete = document.getElementById('screen-complete');
const countdownTitle = document.getElementById('countdown-title');
const countdownState = document.getElementById('countdown-state');
const restartButton = document.getElementById('restart-button');
const configureButton = document.getElementById('configure-button');

const state = {
  config: null,
  currentTime: 0,
  phase: 'normal',
  timerId: null,
};

function parseTimeInput(value) {
  const trimmedValue = value.trim();
  const match = /^([0-9]{1,2}):([0-9]{2})$/.exec(trimmedValue);

  if (!match) {
    throw new Error('Please enter a time in MM:SS format.');
  }

  const minutes = Number(match[1]);
  const seconds = Number(match[2]);

  if (seconds >= 60) {
    throw new Error('Seconds must be between 00 and 59.');
  }

  return minutes * 60 + seconds;
}

function formatTime(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function showScreen(screenName) {
  screenConfig.classList.toggle('hidden', screenName !== 'config');
  screenCountdown.classList.toggle('hidden', screenName !== 'countdown');
  screenComplete.classList.toggle('hidden', screenName !== 'complete');
}

function updateCountdownView() {
  countdownTitle.textContent = formatTime(state.currentTime);

  if (state.phase === 'warning') {
    screenCountdown.classList.add('warning');
    countdownState.textContent = 'State: Warning';
  } else {
    screenCountdown.classList.remove('warning');
    countdownState.textContent = 'State: Normal';
  }
}

function clearTimer() {
  if (state.timerId) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
}

function startCountdown() {
  clearTimer();
  state.currentTime = state.config.startTimeSeconds;
  state.phase = 'normal';
  updateCountdownView();
  showScreen('countdown');

  state.timerId = window.setInterval(() => {
    state.currentTime -= 1;

    if (state.currentTime <= state.config.warningStartSeconds && state.phase === 'normal') {
      state.phase = 'warning';
    }

    if (state.currentTime <= 0) {
      state.currentTime = 0;
      clearTimer();
      showScreen('complete');
      return;
    }

    updateCountdownView();
  }, 1000);
}

configForm.addEventListener('submit', (event) => {
  event.preventDefault();
  formStatus.textContent = '';

  try {
    const startTimeSeconds = parseTimeInput(document.getElementById('start-time').value);
    const warningStartSeconds = parseTimeInput(document.getElementById('warning-time').value);

    if (warningStartSeconds >= startTimeSeconds) {
      throw new Error('Warning time must be earlier than the start time.');
    }

    state.config = {
      startTimeSeconds,
      warningStartSeconds,
    };

    startCountdown();
  } catch (error) {
    formStatus.textContent = error.message;
  }
});

restartButton.addEventListener('click', () => {
  startCountdown();
});

configureButton.addEventListener('click', () => {
  clearTimer();
  showScreen('config');
  formStatus.textContent = '';
});

showScreen('config');
updateCountdownView();
