/**
 * BetterView AI — Landing Page Client Logic
 */

(function () {
  'use strict';

  // --- 1. Interactive Demo Tab Switcher ---
  const tabButtons = document.querySelectorAll('.demo-tab-btn');
  const panels = {
    quiz: document.getElementById('panel-quiz'),
    flow: document.getElementById('panel-flow'),
    stats: document.getElementById('panel-stats'),
    compare: document.getElementById('panel-compare'),
  };

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      if (!tab || !panels[tab]) return;

      tabButtons.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      Object.values(panels).forEach(panel => {
        if (panel) panel.style.display = 'none';
      });
      panels[tab].style.display = 'block';
    });
  });

  // --- 2. Playable Quiz Simulator ---
  const quizOptionsContainer = document.getElementById('quiz-options-container');
  const quizExplainBox = document.getElementById('quiz-explain-box');
  const quizExplainText = document.getElementById('quiz-explain-text');
  const quizScoreBadge = document.getElementById('quiz-score-badge');
  const quizResetBtn = document.getElementById('quiz-reset-btn');

  let quizAnswered = false;

  if (quizOptionsContainer) {
    quizOptionsContainer.addEventListener('click', (e) => {
      const optBtn = e.target.closest('.sim-quiz-opt');
      if (!optBtn || quizAnswered) return;

      quizAnswered = true;
      const isCorrect = optBtn.dataset.correct === 'true';
      const allOptions = quizOptionsContainer.querySelectorAll('.sim-quiz-opt');

      // Highlight options
      allOptions.forEach(opt => {
        opt.setAttribute('disabled', 'true');
        if (opt.dataset.correct === 'true') {
          opt.classList.add('is-correct');
        }
      });

      if (!isCorrect) {
        optBtn.classList.add('is-incorrect');
        if (quizScoreBadge) quizScoreBadge.textContent = 'Score: 0 / 1';
        if (quizExplainText) {
          quizExplainText.innerHTML = '<strong>Incorrect.</strong> The Twitter Snowflake algorithm generates 64-bit k-ordered unique IDs with a timestamp (41b), worker ID (10b), and sequence number (12b) with no centralized database bottleneck.';
        }
      } else {
        if (quizScoreBadge) quizScoreBadge.textContent = 'Score: 1 / 1 (100%)';
        if (quizExplainText) {
          quizExplainText.innerHTML = '<strong>Correct!</strong> Twitter Snowflake generates up to 4,096 IDs per millisecond per worker without database coordination, guaranteeing k-sorted order by creation timestamp.';
        }
      }

      if (quizExplainBox) {
        quizExplainBox.style.display = 'flex';
      }
    });
  }

  if (quizResetBtn) {
    quizResetBtn.addEventListener('click', () => {
      quizAnswered = false;
      const allOptions = quizOptionsContainer ? quizOptionsContainer.querySelectorAll('.sim-quiz-opt') : [];
      allOptions.forEach(opt => {
        opt.removeAttribute('disabled');
        opt.classList.remove('is-correct', 'is-incorrect');
      });
      if (quizExplainBox) quizExplainBox.style.display = 'none';
      if (quizScoreBadge) quizScoreBadge.textContent = 'Score: 0 / 1';
    });
  }

  // --- 3. Support Me Modal ---
  const supportModal = document.getElementById('support-modal');
  const openSupportButtons = document.querySelectorAll('.open-support-btn');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  function openModal() {
    if (supportModal) {
      supportModal.classList.add('is-open');
      supportModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal() {
    if (supportModal) {
      supportModal.classList.remove('is-open');
      supportModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  openSupportButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  });

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeModal);
  }

  if (supportModal) {
    supportModal.addEventListener('click', (e) => {
      if (e.target === supportModal) {
        closeModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && supportModal && supportModal.classList.contains('is-open')) {
      closeModal();
    }
  });

})();
