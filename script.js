// Experiment interaction logic with progressive difficulty phases
(function () {
  const experimentStart = Date.now();
  const phase2Texts = [
    'Notice',
    'System check',
    'Heads up'
  ];
  const phase3Texts = [
    "Don't leave me!",
    'Why are you ignoring me?',
    "Please don't go..."
  ];

  let schedulerId = null;

  function getElapsedSeconds() {
    return (Date.now() - experimentStart) / 1000;
  }

  function getPhase() {
    const t = getElapsedSeconds();
    if (t < 5) return 'grace';
    if (t < 25) return 'easy';
    return 'hard';
  }

  function randBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  function createModal(phase) {
    const wrapper = document.createElement('div');
    wrapper.className = 'modal overlay ' + (phase === 'easy' ? 'phase-easy' : 'phase-hard');
    wrapper.setAttribute('role', 'dialog');
    wrapper.setAttribute('aria-modal', 'true');

    const box = document.createElement('div');
    box.className = 'modal-box';

    const title = document.createElement('h2');
    title.className = 'modal-title';
    const texts = phase === 'easy' ? phase2Texts : phase3Texts;
    title.textContent = texts[Math.floor(Math.random() * texts.length)];

    const body = document.createElement('p');
    body.className = 'modal-body';
    body.textContent = 'An issue has occurred. Please respond.';

    box.appendChild(title);
    box.appendChild(body);

    // Large dismiss button for easy mode
    if (phase === 'easy') {
      const btn = document.createElement('button');
      btn.className = 'dismiss-btn';
      btn.textContent = 'Dismiss';
      btn.addEventListener('click', () => {
        document.body.removeChild(wrapper);
      });
      box.appendChild(btn);
    }

    // Small close X for hard mode (top-right)
    const closeX = document.createElement('button');
    closeX.className = 'close-x';
    closeX.setAttribute('aria-label', 'Close');
    closeX.innerHTML = '&times;';
    closeX.addEventListener('click', (e) => {
      // stop propagation so the click doesn't do anything else
      e.stopPropagation();
      if (wrapper.parentNode) document.body.removeChild(wrapper);
    });
    box.appendChild(closeX);

    // Prevent overlay click from closing modal - require explicit control
    wrapper.addEventListener('click', (e) => {
      // Only clicks directly on the overlay (not the box) should do nothing
      // so we stop propagation on the box
    });
    box.addEventListener('click', (e) => e.stopPropagation());

    wrapper.appendChild(box);
    document.body.appendChild(wrapper);

    // Focus management: focus the most obvious control for the current phase
    setTimeout(() => {
      if (phase === 'easy') {
        const btn = box.querySelector('.dismiss-btn');
        if (btn) btn.focus();
      } else {
        const x = box.querySelector('.close-x');
        if (x) x.focus();
      }
    }, 50);
  }

  function maybeSpawn() {
    const phase = getPhase();
    if (phase === 'grace') return; // do nothing during grace
    createModal(phase);
  }

  function scheduleNextSpawn() {
    // Clear any existing scheduler
    if (schedulerId) clearTimeout(schedulerId);

    const phase = getPhase();
    let delayMs;
    if (phase === 'grace') {
      // Re-check soon until we leave the grace period
      delayMs = 1000;
    } else if (phase === 'easy') {
      // 6-8 seconds
      delayMs = randBetween(6000, 8000);
    } else {
      // hard: 2-3 seconds
      delayMs = randBetween(2000, 3000);
    }

    schedulerId = setTimeout(() => {
      // Only spawn if we are not in grace
      if (getPhase() !== 'grace') maybeSpawn();
      // Immediately schedule the next one based on current time/phase
      scheduleNextSpawn();
    }, delayMs);
  }

  // Start the scheduler when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      scheduleNextSpawn();
    });
  } else {
    scheduleNextSpawn();
  }

  // Expose for debugging (optional)
  window.__experiment = {
    getElapsedSeconds,
    getPhase,
    scheduleNextSpawn,
    createModal
  };
})();
