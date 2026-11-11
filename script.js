(() => {
  'use strict';

  const PHASES = {
    focus: { name: 'focus', duration: 25 * 60 },
    short: { name: 'short break', duration: 5 * 60 },
    long: { name: 'long break', duration: 15 * 60 }
  };

  const SEQUENCE = ['focus', 'short', 'focus', 'short', 'focus', 'short', 'focus', 'long'];
  const CIRCLE = 2 * Math.PI * 90;

  const state = {
    phase: 'focus',
    remaining: PHASES.focus.duration,
    running: false,
    index: 0,
    expectedEnding: null
  };

  let interval = null;
  let audioCtx = null;

  // ---------- elements ----------
  const $ = (id) => document.getElementById(id);
  const el = {
    phase: $('phase'),
    time: $('time'),
    ring: $('ring-progress'),
    cyclo: $('cyclo'),
    dots: document.querySelectorAll('#cyclo span'),
    start: $('btn-start'),
    restart: $('btn-restart'),
    skip: $('btn-skip')
  };

  // ---------- rendering (single place that touches the DOM) ----------
  function formatTime(seconds) {
    const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    return `${minutes}:${secs}`;
  }

  function render() {
    const phase = PHASES[state.phase];
    const time = formatTime(state.remaining);

    document.body.dataset.phase = state.phase;
    document.body.dataset.running = String(state.running);

    el.phase.textContent = phase.name;
    el.time.textContent = time;
    el.start.textContent = state.running ? 'Pause' : 'Start';

    const fraction = state.remaining / phase.duration;
    el.ring.style.strokeDashoffset = String(CIRCLE * (1 - fraction));

    el.dots.forEach((dot, i) => {
      dot.classList.toggle('done', i < state.index);
      dot.classList.toggle('current', i === state.index);
    });
    el.cyclo.setAttribute('aria-label', `Step ${state.index + 1} of ${SEQUENCE.length}: ${phase.name}`);

    document.title = `${time} · ${phase.name}`;
  }

  // ---------- sound (Web Audio, no files) ----------
  function prepareAudio() {
    try {
      if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (Ctx) audioCtx = new Ctx();
      }
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    } catch (_) { /* no audio: continue silently */ }
  }

  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        Notification.requestPermission().catch((error) => {
          console.warn('Could not request notification permission:', error);
        });
      } catch (error) {
        console.warn('Could not request notification permission:', error);
      }
    }
  }

  function notifyPhaseFinished(phase) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Pomodoro', { body: `${PHASES[phase].name} finished.` });
      } catch (error) {
        console.warn('Could not show phase notification:', error);
      }
    }
  }

  function playWarning() {
    if (!audioCtx) return;
    const notes = [523.25, 659.25, 783.99]; // C, E, G
    notes.forEach((freq, i) => {
      const t0 = audioCtx.currentTime + i * 0.28;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.9);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t0);
      osc.stop(t0 + 1);
    });
  }

  // ---------- timer ----------
  function updateRemaining() {
    state.remaining = Math.max(0, Math.ceil((state.expectedEnding - Date.now()) / 1000));
  }

  function tick() {
    updateRemaining();
    if (state.remaining <= 0) {
      finishPhase();
    } else {
      render();
    }
  }

  function start() {
    if (state.running) return;
    prepareAudio();
    requestNotificationPermission();
    state.running = true;
    state.expectedEnding = Date.now() + state.remaining * 1000;
    interval = setInterval(tick, 250);
    render();
  }

  function pause() {
    if (!state.running) return;
    updateRemaining();
    state.running = false;
    clearInterval(interval);
    interval = null;
    render();
  }

  function toggle() {
    state.running ? pause() : start();
  }

  function restart() {
    pause();
    state.remaining = PHASES[state.phase].duration;
    // goToStage(0);
    render();
  }

  // ---------- phases ----------
  function goToStage(index) {
    pause();
    state.index = index % SEQUENCE.length;
    state.phase = SEQUENCE[state.index];
    state.remaining = PHASES[state.phase].duration;
    render();
  }

  function nextPhase() {
    goToStage(state.index + 1);
  }

  function finishPhase() {
    notifyPhaseFinished(state.phase);
    playWarning();
    nextPhase();
  }

  function skip() {
    nextPhase();
  }

  // ---------- events ----------
  el.start.addEventListener('click', toggle);
  el.restart.addEventListener('click', restart);
  el.skip.addEventListener('click', skip);

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    switch (e.key.toLowerCase()) {
      case ' ':
        e.preventDefault();
        toggle();
        break;
      case 'r': restart(); break;
      case 's': skip(); break;
    }
  });
  document.addEventListener('keyup', (e) => {
    if (e.key === ' ') e.preventDefault();
  });

  // when returning to the tab, sync immediately
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && state.running) tick();
  });

  render();
})();