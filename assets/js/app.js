/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const STORAGE_KEY = "madrasati-arabic-metaphorical-question-v1";

const QUESTIONS = window.QUESTIONS;

// Initial state structure
let state = {
  currentScreen: "home", // "home", "practice", "results"
  currentIndex: 0,
  answers: {},
  shownAnswers: {},
  ratings: {},
  mastery: {},
  expandedCards: { "p54-q01": true }, // First question open by default
  theme: "light",
  filter: "all"
};

// Academic label generator based on self-evaluation score
function getAcademicLabel(score) {
  if (score === undefined || score === null) return "غير مقيّم";
  const num = parseInt(score);
  if (isNaN(num)) return "غير مقيّم";
  if (num === 0) return "بحاجة لتركيز أكبر وتأسيس كامل ❌";
  if (num <= 2) return "تحتاج جهد إضافي ومراجعة دقيقة ⚠️";
  if (num <= 4) return "مقبول — تحتاج سد بعض الثغرات 👍";
  if (num <= 6) return "جيد — أداء مرضي ومتماسك ✨";
  if (num <= 8) return "جيد جداً — اقتربت من الإتقان الكامل 🌟";
  if (num <= 9) return "ممتاز — فهم عميق ومتميز 🏆";
  return "أداء عبقري ودرجة كاملة! 👑";
}

// Load saved state from localStorage
function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Merge with default state to prevent key issues on schema changes
      state = { ...state, ...parsed };
    } catch (e) {
      console.error("Error parsing saved state:", e);
    }
  }
}

// Save state to localStorage
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  applyTheme();
  renderApp();
  setupGlobalEvents();
});

// Setup modal behaviors & general screen elements
function setupGlobalEvents() {
  // Theme Toggle Button
  const themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", toggleTheme);
  }

  // Home logo click to return to home safely
  const brand = document.getElementById("nav-brand");
  if (brand) {
    brand.addEventListener("click", (e) => {
      e.preventDefault();
      navigateTo("home");
    });
  }

  // Confirm reset modal actions
  const btnCancelReset = document.getElementById("modal-cancel");
  const btnConfirmReset = document.getElementById("modal-confirm");
  const resetModal = document.getElementById("reset-modal");

  if (btnCancelReset && resetModal) {
    btnCancelReset.addEventListener("click", () => {
      resetModal.style.display = "none";
    });
  }

  if (btnConfirmReset && resetModal) {
    btnConfirmReset.addEventListener("click", () => {
      resetModal.style.display = "none";
      performReset();
    });
  }

  // Close modal clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === resetModal) {
      resetModal.style.display = "none";
    }
  });
}

// Switch Themes between Light & Dark
function applyTheme() {
  const html = document.documentElement;
  html.setAttribute("data-theme", state.theme);
  
  const themeIcon = document.getElementById("theme-icon");
  if (themeIcon) {
    // Lucide Sun/Moon dynamic SVG inside vanilla JS
    if (state.theme === "dark") {
      themeIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
      `;
    } else {
      themeIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
      `;
    }
  }
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  applyTheme();
  saveState();
}

// Screen Routing
function navigateTo(screen) {
  state.currentScreen = screen;
  saveState();
  renderApp();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Perform full state reset
function performReset() {
  state.answers = {};
  state.shownAnswers = {};
  state.ratings = {};
  state.mastery = {};
  state.currentIndex = 0;
  state.filter = "all";
  // Set question 1 open by default
  state.expandedCards = {};
  if (QUESTIONS && QUESTIONS.length > 0) {
    state.expandedCards[QUESTIONS[0].id] = true;
  }
  saveState();
  navigateTo("practice");
}

function promptReset() {
  const resetModal = document.getElementById("reset-modal");
  if (resetModal) {
    resetModal.style.display = "flex";
  } else {
    // Fallback if modal DOM isn't ready
    if (confirm("هل أنت متأكد من رغبتك في حذف جميع إجاباتك وبدء محاولة جديدة؟")) {
      performReset();
    }
  }
}

// Render dynamic elements according to active screen state
function renderApp() {
  const mainContent = document.getElementById("main-content");
  if (!mainContent) return;

  // Toggle Navbar back-to-home button visibility
  const navHomeBtn = document.getElementById("nav-home-btn");
  if (navHomeBtn) {
    if (state.currentScreen === "home") {
      navHomeBtn.style.display = "none";
    } else {
      navHomeBtn.style.display = "inline-flex";
    }
  }

  // Clear container
  mainContent.innerHTML = "";

  if (state.currentScreen === "home") {
    renderHomeScreen(mainContent);
  } else if (state.currentScreen === "practice") {
    renderPracticeScreen(mainContent);
  } else if (state.currentScreen === "results") {
    renderResultsScreen(mainContent);
  }
}

// 1. Home Screen Layout
function renderHomeScreen(container) {
  const answeredCount = Object.keys(state.answers).filter(q => state.answers[q].trim().length > 0).length;
  const totalQuestions = QUESTIONS.length;
  const hasHistory = answeredCount > 0;

  const homeHTML = `
    <div class="home-screen" id="home-screen">
      <h1 class="home-title">منصة مدرسي</h1>
      <p class="home-subtitle">الأسئلة الوزارية حول الاستفهام المجازي لقواعد اللغة العربية للصف السادس الإعدادي</p>
      
      <div class="home-steps-card">
        <h3 class="home-steps-title">طريقة العمل المختصرة في المنصة:</h3>
        <ul class="home-steps-list">
          <li>
            <span class="home-steps-num">١</span>
            <span>اكتب جوابك الشخصي كاملاً وبكل أمانة في الحقل المخصص.</span>
          </li>
          <li>
            <span class="home-steps-num">٢</span>
            <span>اضغط على زر (أظهر الجواب النموذجي) للمقارنة الدقيقة مع المصدر.</span>
          </li>
          <li>
            <span class="home-steps-num">٣</span>
            <span>قيّم جوابك يا بطل بموضوعية واختر الدرجة المناسبة من (0 إلى 10).</span>
          </li>
          <li>
            <span class="home-steps-num">٤</span>
            <span>حدّد مستوى تمكنك من السؤال لمراجعة نقاط ضعفك لاحقاً بكل سهولة.</span>
          </li>
        </ul>
      </div>

      <div class="home-stats-preview">
        عدد الأسئلة الكلي في هذا التدريب: ${totalQuestions} سؤالاً وزارياً.
        ${hasHistory ? `<br><span style="color:var(--color-primary);">لقد أجبت على ${answeredCount} من أصل ${totalQuestions} سؤالاً سابقاً.</span>` : ""}
      </div>

      <div class="home-actions">
        ${hasHistory ? `
          <button class="btn btn-primary" id="btn-continue">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play"><polygon points="6 3 20 12 6 21 6 3"/></svg>
            متابعة التدريب الحالي
          </button>
          <button class="btn btn-secondary" id="btn-new-attempt">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rotate-ccw"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            بدء محاولة جديدة تماماً
          </button>
        ` : `
          <button class="btn btn-primary" id="btn-start">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-graduation-cap"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M6 18.8 6 12"/><path d="M18 12v6.8a2 2 0 0 1-1.332 1.888L12 22"/></svg>
            ابدأ التدريب الآن
          </button>
        `}
      </div>
    </div>
  `;

  container.innerHTML = homeHTML;

  // Event Listeners for actions
  const btnStart = document.getElementById("btn-start");
  const btnContinue = document.getElementById("btn-continue");
  const btnNewAttempt = document.getElementById("btn-new-attempt");

  if (btnStart) {
    btnStart.addEventListener("click", () => navigateTo("practice"));
  }
  if (btnContinue) {
    btnContinue.addEventListener("click", () => navigateTo("practice"));
  }
  if (btnNewAttempt) {
    btnNewAttempt.addEventListener("click", () => {
      promptReset();
    });
  }
}

// Filter helper functions
function getFilteredQuestions() {
  const currentFilter = state.filter || "all";
  return QUESTIONS.filter(q => {
    const isAnswered = !!state.answers[q.id] && state.answers[q.id].trim().length > 0;
    const hasRating = state.ratings[q.id] !== undefined;
    const masteryStatus = state.mastery[q.id];

    if (currentFilter === "unanswered") {
      return !isAnswered;
    }
    if (currentFilter === "unrated") {
      return !hasRating;
    }
    if (currentFilter === "needs_review") {
      return masteryStatus === "mid";
    }
    if (currentFilter === "not_mastered") {
      return masteryStatus === "low";
    }
    if (currentFilter === "mastered") {
      return masteryStatus === "high";
    }
    return true; // "all"
  });
}

function getFilteredIndex() {
  const filtered = getFilteredQuestions();
  const currentQ = QUESTIONS[state.currentIndex];
  if (!currentQ) return -1;
  return filtered.findIndex(q => q.id === currentQ.id);
}

function ensureValidFilterSelection() {
  const filtered = getFilteredQuestions();
  if (filtered.length === 0) return;
  const idx = getFilteredIndex();
  if (idx === -1) {
    // Current question is not in the filtered list, set current index to the first filtered question
    const targetQ = filtered[0];
    const origIndex = QUESTIONS.findIndex(q => q.id === targetQ.id);
    if (origIndex !== -1) {
      state.currentIndex = origIndex;
      // Expand this card
      state.expandedCards = {};
      state.expandedCards[targetQ.id] = true;
      saveState();
    }
  }
}

window.setFilter = function(newFilter) {
  state.filter = newFilter;
  ensureValidFilterSelection();
  saveState();
  renderApp();
};

// 2. Practice Screen Layout
function renderPracticeScreen(container) {
  const totalQuestions = QUESTIONS.length;
  
  // Make sure we have a valid selection for the current filter
  ensureValidFilterSelection();
  
  const filtered = getFilteredQuestions();
  const filteredIdx = getFilteredIndex();
  
  // Calculate general progress
  const answeredCount = QUESTIONS.filter(q => (state.answers[q.id] || "").trim().length > 0).length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  const ratedCount = QUESTIONS.filter(q => state.ratings[q.id] !== undefined).length;
  const ratedPercent = Math.round((ratedCount / totalQuestions) * 100);

  const practiceHTML = `
    <div class="practice-header">
      <div class="progress-container" style="margin-bottom: 0.4rem;">
        <span class="progress-label" style="font-size: 0.85rem; color: var(--color-text-muted); display: flex; align-items: center; gap: 0.25rem;">
          <span style="width: 8px; height: 8px; border-radius: 50%; background-color: var(--madrasati-medium-purple); display: inline-block;"></span>
          تقدمك في الحل: ${answeredCount} من ${totalQuestions} أسئلة
        </span>
        <span class="progress-label" style="font-size: 0.85rem; color: var(--madrasati-medium-purple); font-weight: 600;">${progressPercent}%</span>
      </div>
      <div class="progress-bar-outer" style="height: 6px; margin-bottom: 0.75rem;">
        <div class="progress-bar-inner" style="width: ${progressPercent}%; background-color: var(--madrasati-medium-purple);"></div>
      </div>

      <div class="progress-container" style="margin-bottom: 0.4rem;">
        <span class="progress-label" style="font-size: 0.9rem; color: var(--color-text-main); font-weight: 700; display: flex; align-items: center; gap: 0.25rem;">
          <span style="width: 8px; height: 8px; border-radius: 50%; background-color: var(--color-primary); display: inline-block;"></span>
          نسبة الأسئلة المقيمة: ${ratedCount} من ${totalQuestions}
        </span>
        <span class="progress-label" style="font-size: 0.9rem; color: var(--color-primary); font-weight: 700;">${ratedPercent}%</span>
      </div>
      <div class="progress-bar-outer" style="height: 8px; margin-bottom: 1.5rem;">
        <div class="progress-bar-inner" style="width: ${ratedPercent}%; background-color: var(--color-primary);"></div>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <span class="filter-label">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-filter"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          تصفية الأسئلة:
        </span>
        <div class="filter-options">
          <button class="filter-btn ${state.filter === 'all' ? 'active' : ''}" onclick="setFilter('all')">الكل</button>
          <button class="filter-btn ${state.filter === 'unanswered' ? 'active' : ''}" onclick="setFilter('unanswered')">غير المحلولة</button>
          <button class="filter-btn ${state.filter === 'unrated' ? 'active' : ''}" onclick="setFilter('unrated')">لم يتم التقييم</button>
          <button class="filter-btn ${state.filter === 'needs_review' ? 'active' : ''}" onclick="setFilter('needs_review')">تحتاج مراجعة</button>
          <button class="filter-btn ${state.filter === 'not_mastered' ? 'active' : ''}" onclick="setFilter('not_mastered')">غير متمكن</button>
          <button class="filter-btn ${state.filter === 'mastered' ? 'active' : ''}" onclick="setFilter('mastered')">متمكن</button>
        </div>
      </div>
      
      <!-- Horizontal navigation rail of filtered questions -->
      <div class="question-navigator" id="nav-rail"></div>
    </div>

    <div class="questions-list" id="accordion-container"></div>

    <!-- Bottom Pagination Quick Navigation -->
    <div class="bottom-pagination-container">
      <div class="pagination-header">
        <span class="pagination-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layout-grid"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
          الوصول السريع للأسئلة:
        </span>
        <div class="pagination-legend">
          <span class="legend-item"><span class="legend-dot unanswered"></span>غير مُجاب</span>
          <span class="legend-item"><span class="legend-dot answered"></span>مُجاب</span>
          <span class="legend-item"><span class="legend-dot active"></span>السؤال الحالي</span>
        </div>
      </div>
      <div class="pagination-list" id="bottom-pagination-list"></div>
    </div>

    <div class="bottom-nav">
      <button class="btn btn-secondary" id="btn-prev-q">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        السؤال السابق
      </button>

      <button class="btn btn-primary" id="btn-finish-practice">
        إنهاء التدريب وعرض النتيجة
      </button>

      <button class="btn btn-secondary" id="btn-next-q">
        السؤال التالي
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-left"><path d="m12 19 7-7-7-7"/><path d="M5 12h14"/></svg>
      </button>
    </div>
  `;

  container.innerHTML = practiceHTML;

  // Render the horizontal navigation dots/cards
  renderNavigationRail();

  // Render the bottom pagination panel
  renderBottomPagination();

  // Render the single accordion cards
  renderAccordionCards();

  // Button Action handlers
  const btnPrev = document.getElementById("btn-prev-q");
  const btnNext = document.getElementById("btn-next-q");
  const btnFinish = document.getElementById("btn-finish-practice");

  if (btnPrev) {
    btnPrev.disabled = filtered.length === 0 || filteredIdx <= 0;
    btnPrev.addEventListener("click", () => {
      if (filteredIdx > 0) {
        const targetQ = filtered[filteredIdx - 1];
        const origIndex = QUESTIONS.findIndex(q => q.id === targetQ.id);
        if (origIndex !== -1) {
          setFocusedIndex(origIndex);
        }
      }
    });
  }

  if (btnNext) {
    btnNext.disabled = filtered.length === 0 || filteredIdx === -1 || filteredIdx >= filtered.length - 1;
    btnNext.addEventListener("click", () => {
      if (filteredIdx < filtered.length - 1) {
        const targetQ = filtered[filteredIdx + 1];
        const origIndex = QUESTIONS.findIndex(q => q.id === targetQ.id);
        if (origIndex !== -1) {
          setFocusedIndex(origIndex);
        }
      }
    });
  }

  if (btnFinish) {
    btnFinish.addEventListener("click", () => {
      navigateTo("results");
    });
  }
}

// Render the horizontal navigator dots
function renderNavigationRail() {
  const rail = document.getElementById("nav-rail");
  if (!rail) return;

  const filtered = getFilteredQuestions();

  filtered.forEach((q, idx) => {
    const dot = document.createElement("div");
    const originalNum = QUESTIONS.findIndex(item => item.id === q.id) + 1;
    const isDotActive = state.currentIndex === QUESTIONS.findIndex(item => item.id === q.id);

    dot.className = `nav-dot ${isDotActive ? 'active' : ''} ${state.answers[q.id] ? 'answered' : ''}`;
    dot.dataset.qId = q.id;
    dot.textContent = originalNum;
    dot.title = `سؤال ${originalNum}`;
    
    dot.addEventListener("click", () => {
      const origIndex = QUESTIONS.findIndex(item => item.id === q.id);
      if (origIndex !== -1) {
        setFocusedIndex(origIndex);
      }
    });

    rail.appendChild(dot);
  });

  // Scroll active dot into view inside the horizontal rail
  const activeDot = rail.querySelector(".nav-dot.active");
  if (activeDot) {
    activeDot.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }
}

// Render the bottom pagination panel containing status-informed fast-jump buttons
function renderBottomPagination() {
  const list = document.getElementById("bottom-pagination-list");
  if (!list) return;

  list.innerHTML = ""; // Clear existing

  const filtered = getFilteredQuestions();

  filtered.forEach((q) => {
    const originalIdx = QUESTIONS.findIndex(item => item.id === q.id);
    const originalNum = originalIdx + 1;
    const isCurrent = state.currentIndex === originalIdx;
    const isAnswered = !!state.answers[q.id] && state.answers[q.id].trim().length > 0;

    const btn = document.createElement("button");
    btn.className = `pagination-item-btn ${isCurrent ? 'active' : ''} ${isAnswered ? 'answered' : 'unanswered'}`;
    btn.dataset.qId = q.id;
    
    // Create inner structure: number and custom checkmark indicator if answered
    let indicatorHTML = "";
    if (isAnswered) {
      indicatorHTML = `
        <span class="status-indicator-badge answered-badge">
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>
        </span>
      `;
    } else {
      indicatorHTML = `<span class="status-indicator-badge unanswered-badge"></span>`;
    }

    btn.innerHTML = `
      <span class="btn-num">${originalNum}</span>
      ${indicatorHTML}
    `;
    btn.title = `سؤال ${originalNum}: ${isAnswered ? 'مُجاب' : 'غير مُجاب'}`;

    btn.addEventListener("click", () => {
      setFocusedIndex(originalIdx);
    });

    list.appendChild(btn);
  });

  // Ensure active button is in view if list is scrollable on small screens
  const activeBtn = list.querySelector(".pagination-item-btn.active");
  if (activeBtn) {
    activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }
}

// Changes active question, collapses others, expands target, saves state
function setFocusedIndex(idx) {
  state.currentIndex = idx;
  
  // Collapse all questions first
  state.expandedCards = {};
  
  // Expand the active question card
  const targetQ = QUESTIONS[idx];
  state.expandedCards[targetQ.id] = true;

  saveState();
  renderApp();

  // Smoothly scroll active card into viewport
  setTimeout(() => {
    const activeCard = document.getElementById(`card-${targetQ.id}`);
    if (activeCard) {
      activeCard.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, 50);
}

// Render the Accordion list of all questions (modified to show exactly one question to prevent distraction)
function renderAccordionCards() {
  const container = document.getElementById("accordion-container");
  if (!container) return;

  const filtered = getFilteredQuestions();
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-filter-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-filter-x"><path d="M13.013 3H21v2l-7.381 7.381a1 1 0 0 0-.262.535l-.757 3.533-3.411-3.411M3 3l18 18M9 3h1.243a1 1 0 0 1 .707.293L13.01 5.36M9 9.172 4.381 4.552A1 1 0 0 0 3 5v2l6 6v6l3 3v-7"/></svg>
        <h3>لا توجد أسئلة تطابق التصفية الحالية</h3>
        <p>جرب اختيار تصنيف تصفية آخر أو عرض جميع الأسئلة للحل والتقييم.</p>
        <button class="btn btn-primary" onclick="setFilter('all')">عرض جميع الأسئلة</button>
      </div>
    `;
    return;
  }

  const filteredIdx = getFilteredIndex();
  if (filteredIdx === -1) {
    return;
  }

  const q = filtered[filteredIdx];
  const originalIdx = QUESTIONS.findIndex(item => item.id === q.id);
  const originalNum = originalIdx + 1;

  const isAnswered = !!state.answers[q.id] && state.answers[q.id].trim().length > 0;
  const isShown = !!state.shownAnswers[q.id];
  const hasRating = state.ratings[q.id] !== undefined;
  const masteryStatus = state.mastery[q.id];

  // Build Status Badge text & CSS
  let statusText = "لم تتم الإجابة";
  let statusClass = "status-unanswered";

  if (hasRating) {
    statusText = "تم التقييم";
    statusClass = "status-rated";
  } else if (isShown) {
    statusText = "تم عرض الجواب";
    statusClass = "status-viewed";
  } else if (isAnswered) {
    statusText = "تمت الإجابة";
    statusClass = "status-answered";
  }

  // Mastery Badge on Header
  let masteryBadgeHTML = "";
  if (masteryStatus) {
    let mText = "";
    let mClass = "";
    if (masteryStatus === "high") {
      mText = "متمكن";
      mClass = "mastery-high";
    } else if (masteryStatus === "mid") {
      mText = "يحتاج مراجعة";
      mClass = "mastery-mid";
    } else if (masteryStatus === "low") {
      mText = "غير متمكن";
      mClass = "mastery-low";
    }
    masteryBadgeHTML = `<span class="mastery-badge ${mClass}">${mText}</span>`;
  }

  const card = document.createElement("div");
  card.id = `card-${q.id}`;
  card.className = `accordion-card active`;

  const questionSnippet = q.question.substring(0, 45).replace(/\n/g, " ") + (q.question.length > 45 ? "..." : "");

  // Structured Quran and Poetry content rendering
  let quranHTML = "";
  if (q.quranVerse) {
    quranHTML = `
      <div class="quran-container">
        <div class="quran-verse" dir="rtl" lang="ar">${q.quranVerse}</div>
      </div>
    `;
  }

  let poetryHTML = "";
  if (q.poetry) {
    const poetIntro = "قال الشاعر:";
    
    let poetryCore = "";
    if (q.poetry.layout === "two-halves") {
      poetryCore = `
        <div class="poetry-verse poetry-two-halves" dir="rtl" lang="ar">
          <span class="poetry-hemistich poetry-sadr">${q.poetry.sadr}</span>
          ${q.poetry.ajuz ? `<span class="poetry-separator">—</span><span class="poetry-hemistich poetry-ajuz">${q.poetry.ajuz}</span>` : ""}
        </div>
      `;
    } else if (q.poetry.layout === "two-lines") {
      poetryCore = `
        <div class="poetry-verse" dir="rtl" lang="ar">
          ${q.poetry.lines.map(line => `<div class="poetry-line">${line}</div>`).join('')}
        </div>
      `;
    }
    
    poetryHTML = `
      <div class="poetry-wrapper" style="margin-bottom: 1.25rem;">
        <div class="poetry-intro-text" style="font-family: 'Cairo', sans-serif; font-size: 0.95rem; font-weight: 600; color: var(--color-text-muted); margin-bottom: 0.5rem; text-align: right;">${poetIntro}</div>
        ${poetryCore}
      </div>
    `;
  }

  // Accordion Card DOM layout
  card.innerHTML = `
    <div class="card-header" style="cursor: default;">
      <div class="card-header-left">
        <span class="question-num-badge">${originalNum}</span>
        <span class="question-preview-text">${questionSnippet}</span>
      </div>
      <div class="card-header-right">
        ${masteryBadgeHTML}
        <span class="status-badge ${statusClass}">${statusText}</span>
      </div>
    </div>

    <div class="card-body" style="display: block;">
      <div class="badges-row">
        ${q.years ? `<span class="year-badge">${q.years}</span>` : ''}
      </div>

      ${quranHTML}
      ${poetryHTML}

      <h3 class="question-text">${q.question}</h3>

      <div class="answer-input-container">
        <label class="answer-label" for="textarea-${q.id}">إجابتك الشخصية يا بطل:</label>
        <textarea 
          class="answer-textarea" 
          id="textarea-${q.id}" 
          placeholder="اكتب هنا إجابتك النحوية الكاملة قبل عرض الإجابة النموذجية..."
          ${isShown ? 'disabled' : ''}
        >${state.answers[q.id] || ""}</textarea>
      </div>

      <div class="submit-action-row">
        <button 
          class="btn btn-primary" 
          id="btn-show-${q.id}" 
          onclick="revealModelAnswer('${q.id}')"
          ${(!state.answers[q.id] || state.answers[q.id].trim().length === 0 || isShown) ? 'disabled' : ''}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>
          تمت الإجابة — أظهر الجواب النموذجي
        </button>
      </div>

      <!-- Hidden Model Answer Section -->
      <div class="model-answer-section" id="model-${q.id}" style="${isShown ? 'display:block;' : 'display:none;'}">
        <h4 class="model-answer-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle-2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
          الجواب النموذجي من المصدر:
        </h4>
        <p class="model-answer-text">${q.modelAnswer}</p>
      </div>

      <!-- Hidden Self-Assessment Section -->
      <div class="evaluation-section" id="eval-${q.id}" style="${isShown ? 'display:block;' : 'display:none;'}">
        <h4 class="eval-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-award"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
          ميزان التقييم الذاتي الأكاديمي (0 - 10 درجات)
        </h4>
        <p class="eval-subtitle">قارن إجابتك بالحل النموذجي أعلاه بدقة، ثم اختر الدرجة التي تستحقها على هذا التدريج الأكاديمي:</p>
        
        <div class="academic-slider-wrapper">
          <div class="academic-badge-container">
            <span class="academic-score-title">التقدير الأكاديمي:</span>
            <div class="academic-score-badge" id="score-badge-${q.id}">
              ${state.ratings[q.id] !== undefined ? `${state.ratings[q.id]} / 10 — ${getAcademicLabel(state.ratings[q.id])}` : 'يرجى اختيار درجة التقييم'}
            </div>
          </div>

          <div class="academic-slider-container">
            <!-- Active progress fill line -->
            <div class="academic-slider-track">
              <div class="academic-slider-fill" id="slider-fill-${q.id}" style="width: ${state.ratings[q.id] !== undefined ? (state.ratings[q.id] * 10) : 0}%;"></div>
            </div>

            <!-- Clickable step nodes 0 to 10 -->
            <div class="academic-slider-steps">
              ${Array.from({length: 11}).map((_, i) => {
                const isSelected = state.ratings[q.id] === i;
                // Left position is percentage from 0 to 100
                const leftPos = i * 10;
                return `
                  <button 
                    class="step-node ${isSelected ? 'selected' : ''}" 
                    style="left: ${leftPos}%;" 
                    onclick="rateQuestion('${q.id}', ${i})"
                    title="تقييم بـ ${i} درجات"
                  >
                    <span class="step-dot"></span>
                    <span class="step-number">${i}</span>
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Descriptive milestones -->
          <div class="academic-milestones">
            <span class="milestone milestone-low">تأسيس وتركيز مكثف (0-2)</span>
            <span class="milestone milestone-mid">مقبول إلى جيد (3-6)</span>
            <span class="milestone milestone-high">ممتاز ومتمكن (7-10)</span>
          </div>
        </div>

        <!-- Mastery Section -->
        <div class="mastery-section">
          <h4 class="mastery-title">تصنيف مستوى تمكنك من مهارة السؤال:</h4>
          <div class="mastery-buttons">
            <button 
              class="btn-mastery ${state.mastery[q.id] === 'high' ? 'selected-high' : ''}" 
              onclick="setMasteryStatus('${q.id}', 'high')"
            >
              متمكن من السؤال
            </button>
            <button 
              class="btn-mastery ${state.mastery[q.id] === 'mid' ? 'selected-mid' : ''}" 
              onclick="setMasteryStatus('${q.id}', 'mid')"
            >
              أحتاج إلى مراجعة الموضوع
            </button>
            <button 
              class="btn-mastery ${state.mastery[q.id] === 'low' ? 'selected-low' : ''}" 
              onclick="setMasteryStatus('${q.id}', 'low')"
            >
              غير متمكن
            </button>
          </div>
        </div>

      </div>
    </div>
  `;

  container.appendChild(card);

  // Setup Textarea typing event listener
  const textarea = card.querySelector(`.answer-textarea`);
  const btnShow = card.querySelector(`#btn-show-${q.id}`);

  if (textarea && btnShow) {
    textarea.addEventListener("input", (e) => {
      const val = e.target.value;
      state.answers[q.id] = val;
      saveState();

      const hasText = val.trim().length > 0;

      // Dynamic update of top nav dot
      const dot = document.querySelector(`.nav-dot[data-q-id="${q.id}"]`);
      if (dot) {
        if (hasText) {
          dot.classList.add("answered");
        } else {
          dot.classList.remove("answered");
        }
      }

      // Dynamic update of bottom pagination button
      const pBtn = document.querySelector(`.pagination-item-btn[data-q-id="${q.id}"]`);
      if (pBtn) {
        if (hasText) {
          pBtn.classList.add("answered");
          pBtn.classList.remove("unanswered");
          if (!pBtn.querySelector(".check-icon") && !pBtn.querySelector(".answered-badge")) {
            const dotIcon = pBtn.querySelector(".unanswered-badge");
            if (dotIcon) {
              dotIcon.outerHTML = `
                <span class="status-indicator-badge answered-badge">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>
                </span>
              `;
            }
          }
        } else {
          pBtn.classList.remove("answered");
          pBtn.classList.add("unanswered");
          const checkIcon = pBtn.querySelector(".answered-badge");
          if (checkIcon) {
            checkIcon.outerHTML = `<span class="status-indicator-badge unanswered-badge"></span>`;
          }
        }
      }

      // Enable or disable show model answer button
      if (hasText && !state.shownAnswers[q.id]) {
        btnShow.disabled = false;
      } else {
        btnShow.disabled = true;
      }
    });
  }
}

// Collapses / Expands Accordion cards manually
window.toggleCardCollapse = function(qId, idx) {
  const wasExpanded = !!state.expandedCards[qId];
  
  if (wasExpanded) {
    delete state.expandedCards[qId];
  } else {
    state.expandedCards[qId] = true;
    state.currentIndex = idx; // update navigator focus index to this card
  }
  saveState();
  
  // Re-render only navbar dot focus and accordion classes instead of whole page rebuild to preserve scrolling position
  const allCards = document.querySelectorAll(".accordion-card");
  allCards.forEach(c => {
    const cid = c.id.replace("card-", "");
    if (state.expandedCards[cid]) {
      c.classList.add("active");
      c.querySelector(".card-body").style.display = "block";
    } else {
      c.classList.remove("active");
      c.querySelector(".card-body").style.display = "none";
    }
  });

  // Re-render navigation rail highlights
  const rail = document.getElementById("nav-rail");
  if (rail) {
    const dots = rail.querySelectorAll(".nav-dot");
    dots.forEach((dot) => {
      if (dot.dataset.qId === qId && !wasExpanded) {
        dot.classList.add("active");
        dot.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      } else {
        dot.classList.remove("active");
      }
    });
  }

  // Re-render bottom pagination highlights
  const pList = document.getElementById("bottom-pagination-list");
  if (pList) {
    const pBtns = pList.querySelectorAll(".pagination-item-btn");
    pBtns.forEach((btn) => {
      if (btn.dataset.qId === qId && !wasExpanded) {
        btn.classList.add("active");
        btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      } else {
        btn.classList.remove("active");
      }
    });
  }
};

// Reveal Model Answer
window.revealModelAnswer = function(qId) {
  state.shownAnswers[qId] = true;
  saveState();

  // Disable text area input to lock response
  const textarea = document.getElementById(`textarea-${qId}`);
  if (textarea) {
    textarea.disabled = true;
  }

  // Hide the reveal button container
  const btnShow = document.getElementById(`btn-show-${qId}`);
  if (btnShow) {
    btnShow.disabled = true;
    btnShow.style.display = "none";
  }

  // Slide down model answer and evaluation panels
  const modelSection = document.getElementById(`model-${qId}`);
  const evalSection = document.getElementById(`eval-${qId}`);

  if (modelSection) modelSection.style.display = "block";
  if (evalSection) evalSection.style.display = "block";

  // Re-render header status badge to "تم عرض الجواب"
  const cardHeader = document.getElementById(`card-${qId}`);
  if (cardHeader) {
    const badge = cardHeader.querySelector(".status-badge");
    if (badge) {
      badge.textContent = "تم عرض الجواب";
      badge.className = "status-badge status-viewed";
    }
  }

  // Update progress numbers
  renderPracticeScreenProgressOnly();
};

// Rate Question (0 to 10 marks on the premium academic slider)
window.rateQuestion = function(qId, score) {
  state.ratings[qId] = score;
  saveState();

  // Re-highlight evaluated interactive elements
  const evalSec = document.getElementById(`eval-${qId}`);
  if (evalSec) {
    // 1. Highlight selected node and clear others
    const nodes = evalSec.querySelectorAll(".step-node");
    nodes.forEach((node, i) => {
      if (i === score) {
        node.classList.add("selected");
      } else {
        node.classList.remove("selected");
      }
    });

    // 2. Adjust slider active track fill
    const fill = document.getElementById(`slider-fill-${qId}`);
    if (fill) {
      fill.style.width = `${score * 10}%`;
    }

    // 3. Update dynamic academic descriptor badge
    const badge = document.getElementById(`score-badge-${qId}`);
    if (badge) {
      badge.textContent = `${score} / 10 — ${getAcademicLabel(score)}`;
      // Add a brief subtle pulse animation for pleasant interaction feedback
      badge.classList.remove("badge-pulse");
      void badge.offsetWidth; // Force CSS reflow
      badge.classList.add("badge-pulse");
    }
  }

  // Update header badge
  const cardHeader = document.getElementById(`card-${qId}`);
  if (cardHeader) {
    const badge = cardHeader.querySelector(".status-badge");
    if (badge) {
      badge.textContent = "تم التقييم";
      badge.className = "status-badge status-rated";
    }
  }
};

// Set mastery status
window.setMasteryStatus = function(qId, status) {
  state.mastery[qId] = status;
  saveState();

  // Re-highlight mastery buttons in active accordion card
  const evalSec = document.getElementById(`eval-${qId}`);
  if (evalSec) {
    const btns = evalSec.querySelectorAll(".btn-mastery");
    btns.forEach((btn, idx) => {
      btn.className = "btn-mastery"; // reset
      if (idx === 0 && status === "high") btn.classList.add("selected-high");
      if (idx === 1 && status === "mid") btn.classList.add("selected-mid");
      if (idx === 2 && status === "low") btn.classList.add("selected-low");
    });
  }

  // Re-render mastery badge in header
  const cardHeader = document.getElementById(`card-${qId}`);
  if (cardHeader) {
    let badgeContainer = cardHeader.querySelector(".mastery-badge");
    if (!badgeContainer) {
      badgeContainer = document.createElement("span");
      const statusBadge = cardHeader.querySelector(".status-badge");
      cardHeader.querySelector(".card-header-right").insertBefore(badgeContainer, statusBadge);
    }

    badgeContainer.className = "mastery-badge";
    if (status === "high") {
      badgeContainer.textContent = "متمكن";
      badgeContainer.classList.add("mastery-high");
    } else if (status === "mid") {
      badgeContainer.textContent = "يحتاج مراجعة";
      badgeContainer.classList.add("mastery-mid");
    } else if (status === "low") {
      badgeContainer.textContent = "غير متمكن";
      badgeContainer.classList.add("mastery-low");
    }
  }
};

// Tiny helper to update progress bar without full re-render (smooth performance)
function renderPracticeScreenProgressOnly() {
  const totalQuestions = QUESTIONS.length;
  const answeredCount = QUESTIONS.filter(q => (state.answers[q.id] || "").trim().length > 0).length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  const labels = document.querySelectorAll(".progress-label");
  if (labels.length >= 2) {
    labels[0].textContent = `تقدمك في الحل: ${answeredCount} من ${totalQuestions} أسئلة`;
    labels[1].textContent = `${progressPercent}%`;
  }
  const bar = document.querySelector(".progress-bar-inner");
  if (bar) {
    bar.style.width = `${progressPercent}%`;
  }

  // Update navigation rail dots statuses
  const rail = document.getElementById("nav-rail");
  if (rail) {
    const dots = rail.querySelectorAll(".nav-dot");
    QUESTIONS.forEach((q, idx) => {
      if (state.answers[q.id]) {
        dots[idx].classList.add("answered");
      } else {
        dots[idx].classList.remove("answered");
      }
    });
  }
}

// Function to generate interactive Recharts-style mastery chart SVG
function generateMasteryChartSVG(high, mid, low) {
  const maxVal = Math.max(high, mid, low, 4);
  const scaleVal = 140 / maxVal;
  
  const hHigh = high * scaleVal;
  const hMid = mid * scaleVal;
  const hLow = low * scaleVal;
  
  const yHigh = 190 - hHigh;
  const yMid = 190 - hMid;
  const yLow = 190 - hLow;

  const yTicks = [
    { y: 190, val: 0 },
    { y: 143, val: Math.round(maxVal * 0.33) },
    { y: 96, val: Math.round(maxVal * 0.67) },
    { y: 50, val: maxVal }
  ];

  return `
    <div class="recharts-wrapper" style="direction: ltr; position: relative; width: 100%; max-width: 480px; margin: 1.5rem auto; padding: 1.25rem; background: var(--color-card-bg); border: 2px solid var(--color-border); border-radius: 20px; box-shadow: var(--shadow-md);">
      <h4 style="text-align: right; font-family: var(--font-sans); font-size: 1rem; font-weight: 800; color: var(--color-text-main); margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; direction: rtl;">
        <span>📊 توزيع مستويات التمكن الأكاديمي</span>
        <span style="font-size: 0.8rem; color: var(--color-text-muted); font-weight: normal;">(تقييم تفاعلي)</span>
      </h4>
      
      <svg viewBox="0 0 450 250" width="100%" height="100%" style="overflow: visible;">
        <defs>
          <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stop-color="#10B981" stop-opacity="0.9"/>
            <stop offset="95%" stop-color="#047857" stop-opacity="0.9"/>
          </linearGradient>
          <linearGradient id="colorMid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stop-color="#F59E0B" stop-opacity="0.9"/>
            <stop offset="95%" stop-color="#B45309" stop-opacity="0.9"/>
          </linearGradient>
          <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stop-color="#EF4444" stop-opacity="0.9"/>
            <stop offset="95%" stop-color="#B91C1C" stop-opacity="0.9"/>
          </linearGradient>
          <filter id="shadow-glow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#5B2596" flood-opacity="0.1"/>
          </filter>
        </defs>

        <!-- Y-Axis Grid Lines -->
        ${yTicks.map(tick => `
          <line x1="50" y1="${tick.y}" x2="400" y2="${tick.y}" stroke="var(--color-border)" stroke-dasharray="3 3" opacity="0.5" />
          <text x="35" y="${tick.y + 4}" fill="var(--color-text-muted)" font-family="var(--font-sans)" font-size="11" text-anchor="end" font-weight="600">${tick.val}</text>
        `).join("")}

        <!-- X-Axis Line -->
        <line x1="50" y1="190" x2="400" y2="190" stroke="var(--color-border)" stroke-width="1.5" />

        <!-- High Mastery Bar Group -->
        <g class="chart-bar-group" style="cursor: pointer;">
          <rect class="chart-bar" x="90" y="${yHigh}" width="45" height="${hHigh || 2}" rx="6" ry="6" fill="url(#colorHigh)" filter="url(#shadow-glow)" style="transition: all 0.5s ease-out;">
            <animate attributeName="height" from="0" to="${hHigh || 2}" dur="0.8s" fill="freeze" />
            <animate attributeName="y" from="190" to="${yHigh}" dur="0.8s" fill="freeze" />
          </rect>
          <!-- Text Value on top of the bar -->
          <text x="112.5" y="${yHigh - 8}" fill="#10B981" font-family="var(--font-sans)" font-size="12" font-weight="800" text-anchor="middle">${high}</text>
          <!-- Tooltip -->
          <g class="chart-tooltip" style="pointer-events: none;">
            <rect x="72.5" y="${yHigh - 45}" width="80" height="30" rx="6" fill="var(--madrasati-dark-ink)" opacity="0.95" />
            <text x="112.5" y="${yHigh - 26}" fill="white" font-family="var(--font-sans)" font-size="11" font-weight="bold" text-anchor="middle">متمكن: ${high}</text>
          </g>
        </g>

        <!-- Mid Mastery Bar Group -->
        <g class="chart-bar-group" style="cursor: pointer;">
          <rect class="chart-bar" x="202.5" y="${yMid}" width="45" height="${hMid || 2}" rx="6" ry="6" fill="url(#colorMid)" filter="url(#shadow-glow)" style="transition: all 0.5s ease-out;">
            <animate attributeName="height" from="0" to="${hMid || 2}" dur="0.8s" fill="freeze" />
            <animate attributeName="y" from="190" to="${yMid}" dur="0.8s" fill="freeze" />
          </rect>
          <!-- Text Value on top of the bar -->
          <text x="225" y="${yMid - 8}" fill="#F59E0B" font-family="var(--font-sans)" font-size="12" font-weight="800" text-anchor="middle">${mid}</text>
          <!-- Tooltip -->
          <g class="chart-tooltip" style="pointer-events: none;">
            <rect x="180" y="${yMid - 45}" width="90" height="30" rx="6" fill="var(--madrasati-dark-ink)" opacity="0.95" />
            <text x="225" y="${yMid - 26}" fill="white" font-family="var(--font-sans)" font-size="10" font-weight="bold" text-anchor="middle">مراجعة: ${mid}</text>
          </g>
        </g>

        <!-- Low Mastery Bar Group -->
        <g class="chart-bar-group" style="cursor: pointer;">
          <rect class="chart-bar" x="315" y="${yLow}" width="45" height="${hLow || 2}" rx="6" ry="6" fill="url(#colorLow)" filter="url(#shadow-glow)" style="transition: all 0.5s ease-out;">
            <animate attributeName="height" from="0" to="${hLow || 2}" dur="0.8s" fill="freeze" />
            <animate attributeName="y" from="190" to="${yLow}" dur="0.8s" fill="freeze" />
          </rect>
          <!-- Text Value on top of the bar -->
          <text x="337.5" y="${yLow - 8}" fill="#EF4444" font-family="var(--font-sans)" font-size="12" font-weight="800" text-anchor="middle">${low}</text>
          <!-- Tooltip -->
          <g class="chart-tooltip" style="pointer-events: none;">
            <rect x="292.5" y="${yLow - 45}" width="90" height="30" rx="6" fill="var(--madrasati-dark-ink)" opacity="0.95" />
            <text x="337.5" y="${yLow - 26}" fill="white" font-family="var(--font-sans)" font-size="10" font-weight="bold" text-anchor="middle">غير متمكن: ${low}</text>
          </g>
        </g>

        <!-- X-Axis Labels -->
        <text x="112.5" y="212" fill="var(--color-text-main)" font-family="var(--font-sans)" font-size="11" font-weight="bold" text-anchor="middle">متمكن</text>
        <text x="225" y="212" fill="var(--color-text-main)" font-family="var(--font-sans)" font-size="11" font-weight="bold" text-anchor="middle">يحتاج مراجعة</text>
        <text x="337.5" y="212" fill="var(--color-text-main)" font-family="var(--font-sans)" font-size="11" font-weight="bold" text-anchor="middle">غير متمكن</text>
      </svg>

      <!-- Legend (Recharts Style) -->
      <div style="display: flex; justify-content: center; gap: 1rem; margin-top: 1rem; font-family: var(--font-sans); font-size: 0.8rem; direction: rtl; font-weight: 700;">
        <span style="display: flex; align-items: center; gap: 0.25rem;">
          <span style="width: 10px; height: 10px; border-radius: 2px; background: linear-gradient(#10B981, #047857); display: inline-block;"></span>
          متمكن
        </span>
        <span style="display: flex; align-items: center; gap: 0.25rem;">
          <span style="width: 10px; height: 10px; border-radius: 2px; background: linear-gradient(#F59E0B, #B45309); display: inline-block;"></span>
          أحتاج مراجعة
        </span>
        <span style="display: flex; align-items: center; gap: 0.25rem;">
          <span style="width: 10px; height: 10px; border-radius: 2px; background: linear-gradient(#EF4444, #B91C1C); display: inline-block;"></span>
          غير متمكن
        </span>
      </div>
    </div>
  `;
}

// 3. Results Screen Layout
function renderResultsScreen(container) {
  const totalQuestions = QUESTIONS.length;
  
  // Calculate numbers
  const answeredCount = QUESTIONS.filter(q => (state.answers[q.id] || "").trim().length > 0).length;
  const shownCount = QUESTIONS.filter(q => state.shownAnswers[q.id]).length;
  const ratedCount = QUESTIONS.filter(q => state.ratings[q.id] !== undefined).length;
  
  // Max possible score is count of all questions * 10
  const maxScore = totalQuestions * 10;
  
  // Total sum of all self ratings
  let totalScore = 0;
  QUESTIONS.forEach(q => {
    if (state.ratings[q.id] !== undefined) {
      totalScore += state.ratings[q.id];
    }
  });

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  // Calculate Mastery Counters
  let masteryHigh = 0;
  let masteryMid = 0;
  let masteryLow = 0;

  QUESTIONS.forEach(q => {
    const m = state.mastery[q.id];
    if (m === "high") masteryHigh++;
    else if (m === "mid") masteryMid++;
    else if (m === "low") masteryLow++;
  });

  // Collect unrated question indices
  const unratedQuestions = [];
  QUESTIONS.forEach((q, idx) => {
    // A question is unrated if answered or shown but no score was selected yet
    if (state.shownAnswers[q.id] && state.ratings[q.id] === undefined) {
      unratedQuestions.push({ num: idx + 1, id: q.id });
    }
  });

  // Calculate Badge Tier
  let badgeHTML = "";
  if (answeredCount === totalQuestions) {
    let badgeImg = "";
    let badgeTitle = "";
    let badgeColorClass = "";
    let badgeDesc = "";

    if (percentage >= 90) {
      badgeImg = "brand/madrasati-logo.jpg";
      badgeTitle = "وسام التميز الأكاديمي الذهبي";
      badgeColorClass = "badge-gold";
      badgeDesc = "ألف مبروك! لقد أتممت حل جميع الأسئلة وحققت مستوى تمكن استثنائي باهر (90% فما فوق). أنت بطل حقيقي وقائد متميز في قواعد اللغة العربية!";
    } else if (percentage >= 70) {
      badgeImg = "brand/madrasati-logo.jpg";
      badgeTitle = "وسام الإبداع اللغوي الفضي";
      badgeColorClass = "badge-silver";
      badgeDesc = "أداء ممتاز جداً! أتممت حل جميع الأسئلة بمهارة عالية ودقة ممتازة (70% - 89%). واصل هذا التميز اللغوي الرائع لتعتلي الصدارة دائماً!";
    } else {
      badgeImg = "brand/madrasati-logo.jpg";
      badgeTitle = "وسام المثابرة والاجتهاد البرونزي";
      badgeColorClass = "badge-bronze";
      badgeDesc = "أحسنت صنعاً! لقد أثبتّ التزامك التام وحللت جميع أسئلة الوحدة بجد واجتهاد. استمر في المراجعة والتدرب لتطوير نقاط تمكنك وستصل للذهبي قريباً!";
    }

    badgeHTML = `
      <div class="achievement-badge-card ${badgeColorClass}">
        <div class="badge-ribbon">وسام الإنجاز والتمكن</div>
        <div class="badge-image-container">
          <img src="${badgeImg}" alt="${badgeTitle}" class="badge-glowing-image" referrerPolicy="no-referrer">
        </div>
        <h3 class="badge-card-title">${badgeTitle}</h3>
        <p class="badge-card-desc">${badgeDesc}</p>
      </div>
    `;
  } else {
    badgeHTML = `
      <div class="achievement-badge-card badge-locked">
        <div class="badge-image-container">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-lock" style="color: var(--color-text-muted);"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h3 class="badge-card-title">أوسمة التمكن مغلقة</h3>
        <p class="badge-card-desc">أكمل حل جميع الأسئلة (${answeredCount} من أصل ${totalQuestions}) لتفتح وسام التمكن والتميز وتزين به سجل إنجازاتك في اللغة العربية!</p>
      </div>
    `;
  }

  const resultsHTML = `
    <div class="results-screen">
      <h2 class="results-title">تقرير الأداء والتقييم الذاتي</h2>
      
      <div class="score-circle-container">
        <div class="score-circle">
          <span class="score-value">${totalScore}/${maxScore}</span>
          <span class="score-label">النسبة المئوية: ${percentage}%</span>
        </div>
      </div>

      ${badgeHTML}

      ${generateMasteryChartSVG(masteryHigh, masteryMid, masteryLow)}

      <div class="results-grid">
        <div class="stat-item">
          <span class="stat-label">عدد الأسئلة الكلي:</span>
          <span class="stat-val">${totalQuestions}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">الأسئلة التي تمت إجابتها:</span>
          <span class="stat-val">${answeredCount}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">الإجابات النموذجية المعروضة:</span>
          <span class="stat-val">${shownCount}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">الأسئلة التي تم تقييمها:</span>
          <span class="stat-val">${ratedCount}</span>
        </div>
      </div>

      <div class="mastery-summary">
        <h3 class="mastery-summary-title">ملخص مستوى التمكن:</h3>
        <div class="mastery-summary-grid">
          <div class="mastery-sum-card high">
            <span class="mastery-sum-count">${masteryHigh}</span>
            <span class="mastery-sum-label">متمكن من السؤال</span>
          </div>
          <div class="mastery-sum-card mid">
            <span class="mastery-sum-count">${masteryMid}</span>
            <span class="mastery-sum-label">أحتاج إلى مراجعة الموضوع</span>
          </div>
          <div class="mastery-sum-card low">
            <span class="mastery-sum-count">${masteryLow}</span>
            <span class="mastery-sum-label">غير متمكن</span>
          </div>
        </div>
      </div>

      ${unratedQuestions.length > 0 ? `
        <div class="unrated-list">
          <div class="unrated-title">تنبيه: لديك أسئلة تم عرض إجابتها النموذجية ولكن لم تقيمها بعد:</div>
          <div class="unrated-items">
            ${unratedQuestions.map(q => `
              <span class="unrated-link" onclick="jumpToQuestion(${QUESTIONS.findIndex(item => item.id === q.id)})">
                سؤال ${q.num}
              </span>
            `).join("")}
          </div>
        </div>
      ` : ""}

      <div class="results-actions">
        <button class="btn btn-primary" id="btn-return-practice">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-edit-3"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          العودة لتعديل التقييمات
        </button>
        <button class="btn btn-secondary" id="btn-results-reset">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rotate-ccw"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          بدء محاولة جديدة تماماً
        </button>
      </div>
    </div>
  `;

  container.innerHTML = resultsHTML;

  // Event handlers
  const btnReturn = document.getElementById("btn-return-practice");
  const btnReset = document.getElementById("btn-results-reset");

  if (btnReturn) {
    btnReturn.addEventListener("click", () => navigateTo("practice"));
  }

  if (btnReset) {
    btnReset.addEventListener("click", () => promptReset());
  }
}

// Result list click to jump to specific question index
window.jumpToQuestion = function(idx) {
  navigateTo("practice");
  setFocusedIndex(idx);
};

// Bind remaining modular functions to window scope for inline HTML handlers
window.navigateTo = navigateTo;
window.getAcademicLabel = getAcademicLabel;
window.loadState = loadState;
window.saveState = saveState;
window.setupGlobalEvents = setupGlobalEvents;
window.applyTheme = applyTheme;
window.toggleTheme = toggleTheme;
window.performReset = performReset;
window.promptReset = promptReset;
window.renderApp = renderApp;
window.renderHomeScreen = renderHomeScreen;
window.getFilteredQuestions = getFilteredQuestions;
window.getFilteredIndex = getFilteredIndex;
window.ensureValidFilterSelection = ensureValidFilterSelection;
window.renderPracticeScreen = renderPracticeScreen;
window.renderNavigationRail = renderNavigationRail;
window.renderBottomPagination = renderBottomPagination;
window.setFocusedIndex = setFocusedIndex;
window.renderAccordionCards = renderAccordionCards;
window.renderPracticeScreenProgressOnly = renderPracticeScreenProgressOnly;
window.renderResultsScreen = renderResultsScreen;
