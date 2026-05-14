/**
 * SoundNest Sleep Timer Module
 * Handles countdown and volume fade-out before stopping playback.
 */
document.addEventListener('DOMContentLoaded', function() {
  let timerInterval = null;
  let remainingSeconds = 0;
  let originalVolume = 1.0;
  let isFading = false;
  let clockTimeline = null;

  const audio = document.getElementById('audio-player');
  const countdownEl = document.getElementById('sleep-timer-countdown');
  const labelEl = document.getElementById('sleep-timer-label');
  const btnOpen = document.getElementById('open-sleep-timer-btn');
  const btnStop = document.getElementById('stop-timer-btn');
  const customInput = document.getElementById('custom-timer-input');
  const setCustomBtn = document.getElementById('set-custom-timer-btn');

  if (!audio || !btnOpen) return;

  // ── Event Listeners ──────────────────────────────────────────

  btnOpen.addEventListener('click', () => {
    if (typeof window.openModal === 'function') {
      window.openModal('modal-sleep-timer-overlay');
      if (customInput) setTimeout(() => customInput.focus(), 100);
    }
  });

  // Timer option buttons (5, 10, 30, 60)
  document.querySelectorAll('.timer-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const mins = parseInt(btn.dataset.mins);
      if (mins > 0) {
        startTimer(mins);
        if (typeof window.closeModal === 'function') {
          window.closeModal('modal-sleep-timer-overlay');
        }
      }
    });
  });

  // Custom timer set
  if (setCustomBtn && customInput) {
    setCustomBtn.addEventListener('click', () => {
      const mins = parseInt(customInput.value);
      if (mins > 0) {
        startTimer(mins);
        if (typeof window.closeModal === 'function') {
          window.closeModal('modal-sleep-timer-overlay');
        }
        customInput.value = '';
      }
    });

    customInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        setCustomBtn.click();
      }
    });
  }

  // Stop timer button in modal
  if (btnStop) {
    btnStop.addEventListener('click', () => {
      stopTimer();
      if (typeof window.closeModal === 'function') {
        window.closeModal('modal-sleep-timer-overlay');
      }
    });
  }

  // Escape key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('modal-sleep-timer-overlay');
      if (modal && modal.classList.contains('open')) {
        window.closeModal('modal-sleep-timer-overlay');
      }
    }
  });
  
  function initClockAnimation() {
    if (clockTimeline) return;
    
    // We select elements specifically within the button
    const container = document.querySelector('.clockwork-timer-ui');
    if (!container) return;

    clockTimeline = gsap.timeline({ repeat: -1, paused: true });
    
    // The "Runs like clockwork" sequence
    clockTimeline
      .to('.clockwork-timer-ui .tick', {
        y: '-=2', // Subtle tick pop
        opacity: 1,
        duration: 0.05,
        stagger: {
          each: 0.08,
          from: "start"
        },
        ease: "power2.out"
      })
      .to('.clockwork-timer-ui .tick', {
        y: '0',
        opacity: 0.5,
        duration: 0.1,
        stagger: {
          each: 0.08,
          from: "start"
        },
        ease: "power2.in"
      }, 0.1)
      .to('.clockwork-timer-ui .ticker', {
        rotate: 360,
        duration: 2, // Close to 1920ms
        ease: "none"
      }, 0);
  }

  // ── Core Logic ───────────────────────────────────────────────
  function startTimer(minutes) {
    remainingSeconds = minutes * 60;
    localStorage.setItem('sn_sleep_timer_remaining', remainingSeconds);
    localStorage.setItem('sn_sleep_timer_original_vol', audio.volume);
    
    startTimerLogic();
    
    if (typeof window.showToast === 'function') {
      window.showToast(`Sleep Timer set for ${minutes} minutes.`);
    }
  }

  function startTimerLogic() {
    if (timerInterval) clearInterval(timerInterval);
    
    originalVolume = parseFloat(localStorage.getItem('sn_sleep_timer_original_vol')) || audio.volume;
    isFading = false;
    
    updateUI();
    
    btnOpen.classList.add('active');
    countdownEl.style.display = 'block';
    if (btnStop) btnStop.style.display = 'block';

    initClockAnimation();
    if (clockTimeline) clockTimeline.play();

    timerInterval = setInterval(() => {
      if (audio.paused) return; 

      remainingSeconds--;
      localStorage.setItem('sn_sleep_timer_remaining', remainingSeconds);
      
      if (remainingSeconds <= 0) {
        finishTimer();
        return;
      }

      if (remainingSeconds <= 30) {
        isFading = true;
        const fadeStep = originalVolume / 30;
        audio.volume = Math.max(0, audio.volume - fadeStep);
      }

      updateUI();
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    
    if (isFading) {
      audio.volume = originalVolume;
    }
    
    remainingSeconds = 0;
    isFading = false;
    
    localStorage.removeItem('sn_sleep_timer_remaining');
    localStorage.removeItem('sn_sleep_timer_original_vol');
    
    btnOpen.classList.remove('active');
    countdownEl.style.display = 'none';
    if (btnStop) btnStop.style.display = 'none';
    labelEl.textContent = 'Sleep Timer';
    
    if (clockTimeline) {
      clockTimeline.pause();
      // Reset hand rotation and ticks
      gsap.set('.clockwork-timer-ui .ticker', { rotate: 0 });
      gsap.set('.clockwork-timer-ui .tick', { y: 0, opacity: 0.3 });
    }
  }

  function finishTimer() {
    audio.pause();
    const finalOriginalVolume = originalVolume;
    stopTimer();
    audio.volume = finalOriginalVolume;
    
    if (typeof window.showToast === 'function') {
      window.showToast('Sleep Timer finished. Music stopped.');
    }
  }

  function updateUI() {
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    
    countdownEl.textContent = timeStr;
    labelEl.textContent = 'Timer Active';
  }

  // ── Restore State ────────────────────────────────────────────
  const savedRemaining = parseInt(localStorage.getItem('sn_sleep_timer_remaining'));
  if (savedRemaining > 0) {
    remainingSeconds = savedRemaining;
    startTimerLogic();
  }
});
