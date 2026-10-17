/**
 * Huddle TrackOS - Client & VA Pipeline Tracker with QA Review Workflow
 * Frontend-only prototype powered by LocalStorage & Interactive Timeline
 */

(function () {
  'use strict';

  // --- Constants & Storage Keys ---
  const STORAGE_KEY = 'va_trackos_clients_v7';
  const SIDEBAR_STATE_KEY = 'va_trackos_sidebar_collapsed';
  const USERS_STORAGE_KEY = 'va_trackos_users_v2';
  const SESSION_STORAGE_KEY = 'va_trackos_auth_session_v2';
  const AUDIT_STORAGE_KEY = 'va_trackos_audit_history_v1';
  const PINGS_STORAGE_KEY = 'va_trackos_pings_v1';

  // Default Seeded Workspace Accounts (Admins & Virtual Assistants)
  const DEFAULT_USERS = [
    {
      id: 'usr-admin',
      name: 'System Administrator',
      fullName: 'System Administrator',
      email: 'admin@vatrack.io',
      password: 'admin',
      role: 'admin'
    },
    {
      id: 'usr-canci',
      name: 'Canci Admin',
      fullName: 'Canci Admin',
      email: 'canci@vatrack.io',
      password: 'Password123!',
      role: 'admin'
    },
    {
      id: 'usr-elena',
      name: 'Elena Rostova',
      fullName: 'Elena Rostova',
      email: 'elena@vatrack.io',
      password: 'password123',
      role: 'va'
    },
    {
      id: 'usr-marcus',
      name: 'Marcus Chen',
      fullName: 'Marcus Chen',
      email: 'marcus@vatrack.io',
      password: 'password123',
      role: 'va'
    },
    {
      id: 'usr-sarah',
      name: 'Sarah Jenkins',
      fullName: 'Sarah Jenkins',
      email: 'sarah@vatrack.io',
      password: 'password123',
      role: 'va'
    },
    {
      id: 'usr-david',
      name: 'David Kim',
      fullName: 'David Kim',
      email: 'david@vatrack.io',
      password: 'password123',
      role: 'va'
    },
    {
      id: 'usr-aisha',
      name: 'Aisha Patel',
      fullName: 'Aisha Patel',
      email: 'aisha@vatrack.io',
      password: 'password123',
      role: 'va'
    }
  ];

  // Set of legacy mock demo client IDs to sanitize from persistent storage
  const DEMO_CLIENT_IDS = new Set([
    'cli-001', 'cli-002', 'cli-003', 'cli-004', 'cli-005',
    'cli-006', 'cli-007', 'cli-008', 'cli-009', 'cli-010'
  ]);
  const DEMO_AUDIT_IDS = new Set([
    'aud-101', 'aud-102', 'aud-103', 'aud-104', 'aud-105',
    'aud-106', 'aud-107', 'aud-108'
  ]);
  const DEMO_PING_IDS = new Set(['png-101', 'png-102']);
  const DEMO_USER_EMAILS = new Set();



  // --- State Variables ---
  let clients = [];
  let users = [];
  let currentUser = null;
  let currentRole = 'admin'; // 'admin' | 'va'
  let currentView = 'tracker'; // 'tracker' | 'calendar' | 'reviews' | 'va-portal' | 'history'
  let currentVaUser = '';

  // Audit Trail & Activity History State
  let auditLogs = [];
  let pings = [];
  let historySearchQuery = '';
  let historyFilterType = 'all';
  let historyFilterClient = 'all';
  let historyFilterVa = 'all';
  let historyCurrentPage = 1;
  let historyPageSize = 10;

  // Active Ping Modal State
  let activePingClient = null;
  let activePingStage = null;

  // Table pagination & filtering
  let currentPage = 1;
  let pageSize = 5;
  let searchQuery = '';
  let filterService = 'all';
  let filterVa = 'all';
  let filterStatus = 'all';
  let sortBy = 'date-desc';

  // Google Calendar State
  let calCurrentDate = new Date(); // Current real-time date
  let calCurrentMode = 'month'; // 'month' | 'week' | 'agenda'
  let calSelectedService = 'all';
  let calSelectedVa = 'all';
  let activeCalendarClientId = null;

  // Review Queue state (Search, Progress Filter, VA Filter, Status Tabs, Sorting & Pagination)
  let reviewSearchQuery = '';
  let reviewFilterProgress = 'all'; // 'all' | 'low' | 'mid' | 'high' | 'complete'
  let reviewFilterVa = 'all';
  let reviewFilterMode = 'pending'; // 'pending' | 'revision' | 'approved' | 'all'
  let reviewSortBy = 'newest';
  let reviewCurrentPage = 1;
  let reviewPageSize = 4;

  // Modal active IDs
  let activeReviewClient = null;
  let activeReviewStage = null;
  let currentUploadedFileData = null;

  // --- DOM Elements ---
  const authPortal = document.getElementById('auth-portal');
  const appLayout = document.getElementById('app-layout');
  const authTabLogin = document.getElementById('auth-tab-login');
  const authTabRegister = document.getElementById('auth-tab-register');
  const authLoginForm = document.getElementById('auth-login-form');
  const authRegisterForm = document.getElementById('auth-register-form');
  const loginEmailInput = document.getElementById('login-email');
  const loginPasswordInput = document.getElementById('login-password');
  const regNameInput = document.getElementById('reg-name');
  const regEmailInput = document.getElementById('reg-email');
  const regPasswordInput = document.getElementById('reg-password');
  const regPasswordConfirmInput = document.getElementById('reg-password-confirm');
  const topbarUserAvatar = document.getElementById('topbar-user-avatar');
  const topbarUserName = document.getElementById('topbar-user-name');
  const topbarUserRole = document.getElementById('topbar-user-role');
  const btnLogout = document.getElementById('btn-logout');

  const sidebar = document.getElementById('sidebar');
  const btnSidebarCollapse = document.getElementById('btn-sidebar-collapse');
  const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
  const sidebarScrim = document.getElementById('sidebar-scrim');
  const navTabTracker = document.getElementById('nav-tab-tracker');
  const navTabCalendar = document.getElementById('nav-tab-calendar');
  const navTabReviews = document.getElementById('nav-tab-reviews');
  const navTabVaPortal = document.getElementById('nav-tab-va-portal');
  const navTabHistory = document.getElementById('nav-tab-history');
  const navReviewBadge = document.getElementById('nav-review-badge');
  const navVaBadge = document.getElementById('nav-va-badge');
  const navCalendarBadge = document.getElementById('nav-calendar-badge');
  const navHistoryBadge = document.getElementById('nav-history-badge');
  const btnTopbarPings = document.getElementById('btn-topbar-pings');
  const topbarPingBadge = document.getElementById('topbar-ping-badge');
  const notificationsMenuWrapper = document.getElementById('notifications-menu-wrapper');
  const notificationsDropdownPopover = document.getElementById('notifications-dropdown-popover');
  const notificationsDropdownList = document.getElementById('notifications-dropdown-list');
  const notificationsUnreadPill = document.getElementById('notifications-unread-pill');
  const btnMarkAllNotificationsRead = document.getElementById('btn-mark-all-notifications-read');
  const btnViewAllNotifications = document.getElementById('btn-view-all-notifications');

  // Admin Topbar Controls
  const adminTopbarActions = document.getElementById('admin-topbar-actions');
  const pageHeadingTitle = document.getElementById('page-heading-title');
  const pageHeadingSubtitle = document.getElementById('page-heading-subtitle');

  // Views
  const viewTracker = document.getElementById('view-tracker');
  const viewCalendar = document.getElementById('view-calendar');
  const viewReviews = document.getElementById('view-reviews');
  const viewVaPortal = document.getElementById('view-va-portal');
  const viewHistory = document.getElementById('view-history');

  // Table elements
  const tableBody = document.getElementById('client-table-body');
  const emptyState = document.getElementById('empty-state');
  const searchInput = document.getElementById('search-input');
  const searchClearBtn = document.getElementById('search-clear-btn');
  const filterServiceSelect = document.getElementById('filter-service');
  const filterVaSelect = document.getElementById('filter-va');
  const filterStatusSelect = document.getElementById('filter-status');
  const sortSelect = document.getElementById('sort-select');
  const pageSizeSelect = document.getElementById('page-size-select');
  const pageStartIdx = document.getElementById('page-start-idx');
  const pageEndIdx = document.getElementById('page-end-idx');
  const totalClientsCount = document.getElementById('total-clients-count');
  const paginationPagesContainer = document.getElementById('pagination-pages-container');
  const btnPagePrev = document.getElementById('btn-page-prev');
  const btnPageNext = document.getElementById('btn-page-next');
  const btnClearFilters = document.getElementById('btn-clear-filters');
  const emptyStateTitle = document.getElementById('empty-state-title');
  const emptyStateDesc = document.getElementById('empty-state-desc');
  const btnEmptyAddClient = document.getElementById('btn-empty-add-client');
  const btnQuickExport = document.getElementById('btn-quick-export');
  const storageStatusText = document.getElementById('storage-status-text');
  const colActionsHeader = document.getElementById('col-actions-header');
  const navTrackerText = document.getElementById('nav-tracker-text');
  const clientTableResponsive = document.getElementById('client-table-responsive');
  const clientPaginationFooter = document.getElementById('client-pagination-footer');

  // Confirmation Modal Elements
  const confirmDeleteModal = document.getElementById('confirm-delete-modal');
  const confirmDeleteTitle = document.getElementById('confirm-delete-title');
  const confirmDeleteDesc = document.getElementById('confirm-delete-desc');
  const btnCancelConfirmDelete = document.getElementById('btn-cancel-confirm-delete');
  const btnExecuteConfirmDelete = document.getElementById('btn-execute-confirm-delete');
  let pendingDeleteClientId = null;

  // Calendar DOM Elements
  const calBtnToday = document.getElementById('cal-btn-today');
  const calBtnPrev = document.getElementById('cal-btn-prev');
  const calBtnNext = document.getElementById('cal-btn-next');
  const calTitle = document.getElementById('cal-title');
  const calFilterService = document.getElementById('cal-filter-service');
  const calFilterVa = document.getElementById('cal-filter-va');
  const calViewMonth = document.getElementById('cal-view-month');
  const calViewWeek = document.getElementById('cal-view-week');
  const calViewAgenda = document.getElementById('cal-view-agenda');
  const calBtnAddDeadline = document.getElementById('cal-btn-add-deadline');
  const miniCalendarWidget = document.getElementById('mini-calendar-widget');
  const deadlinesFeedList = document.getElementById('deadlines-feed-list');
  const upcomingDeadlinesCount = document.getElementById('upcoming-deadlines-count');
  const calMonthView = document.getElementById('cal-month-view');
  const calMonthGrid = document.getElementById('cal-month-grid');
  const calWeekView = document.getElementById('cal-week-view');
  const calAgendaView = document.getElementById('cal-agenda-view');

  // Calendar Event Modal
  const calendarEventModal = document.getElementById('calendar-event-modal');
  const calEventServiceBadge = document.getElementById('cal-event-service-badge');
  const calEventClientName = document.getElementById('cal-event-client-name');
  const calEventDeadlineDate = document.getElementById('cal-event-deadline-date');
  const calEventCountdown = document.getElementById('cal-event-countdown');
  const calEventProgress = document.getElementById('cal-event-progress');
  const calEventProgressBar = document.getElementById('cal-event-progress-bar');
  const calEventStagesList = document.getElementById('cal-event-stages-list');
  const calEventNotes = document.getElementById('cal-event-notes');
  const calEventNotesWrapper = document.getElementById('cal-event-notes-wrapper');
  const btnCloseEventModal = document.getElementById('btn-close-event-modal');
  const btnCloseEventFooter = document.getElementById('btn-close-event-footer');
  const btnCalJumpTracker = document.getElementById('btn-cal-jump-tracker');
  const btnCalEditClient = document.getElementById('btn-cal-edit-client');

  // KPIs
  const kpiTotalClients = document.getElementById('kpi-total-clients');
  const kpiVasInCharge = document.getElementById('kpi-vas-in-charge');
  const kpiPendingReviews = document.getElementById('kpi-pending-reviews');
  const kpiAvgProgress = document.getElementById('kpi-avg-progress');
  const cardKpiReviews = document.getElementById('card-kpi-reviews');

  // Review Queue DOM Elements
  const reviewCardsContainer = document.getElementById('review-cards-container');
  const countPendingTab = document.getElementById('count-pending-tab');
  const countRevisionTab = document.getElementById('count-revision-tab');
  const btnFilterReviewPending = document.getElementById('btn-filter-review-pending');
  const btnFilterReviewRevision = document.getElementById('btn-filter-review-revision');
  const btnFilterReviewApproved = document.getElementById('btn-filter-review-approved');
  const btnFilterReviewAll = document.getElementById('btn-filter-review-all');

  const reviewSearchInput = document.getElementById('review-search-input');
  const reviewSearchClearBtn = document.getElementById('review-search-clear-btn');
  const reviewFilterProgressSelect = document.getElementById('review-filter-progress');
  const reviewFilterVaSelect = document.getElementById('review-filter-va');
  const reviewSortSelect = document.getElementById('review-sort-select');
  const reviewEmptyState = document.getElementById('review-empty-state');
  const btnClearReviewFilters = document.getElementById('btn-clear-review-filters');

  const reviewPaginationFooter = document.getElementById('review-pagination-footer');
  const reviewPageStartIdx = document.getElementById('review-page-start-idx');
  const reviewPageEndIdx = document.getElementById('review-page-end-idx');
  const reviewTotalCount = document.getElementById('review-total-count');
  const reviewPageSizeSelect = document.getElementById('review-page-size-select');
  const btnReviewPagePrev = document.getElementById('btn-review-page-prev');
  const btnReviewPageNext = document.getElementById('btn-review-page-next');
  const reviewPaginationPagesContainer = document.getElementById('review-pagination-pages-container');

  // VA Portal elements
  const vaCurrentAvatar = document.getElementById('va-current-avatar');
  const vaPortalDisplayName = document.getElementById('va-portal-display-name');
  const vaIdentitySelect = document.getElementById('va-identity-select');
  const vaActiveTaskCount = document.getElementById('va-active-task-count');
  const vaTasksGrid = document.getElementById('va-tasks-grid');

  // Modals
  const clientModal = document.getElementById('client-modal');
  const clientForm = document.getElementById('client-form');
  const modalTitle = document.getElementById('modal-title');
  const formClientId = document.getElementById('form-client-id');
  const formClientName = document.getElementById('form-client-name');
  const formClientContact = document.getElementById('form-client-contact');
  const formClientService = document.getElementById('form-client-service');
  const formClientDeadline = document.getElementById('form-client-deadline');
  const vaStagesBuilder = document.getElementById('va-stages-builder');
  const btnAddVaStage = document.getElementById('btn-add-va-stage');
  const calcStageWeight = document.getElementById('calc-stage-weight');
  const calcCurrentProgress = document.getElementById('calc-current-progress');
  const calcProgressFill = document.getElementById('calc-progress-fill');
  const formClientNotes = document.getElementById('form-client-notes');
  const formClientNotesCounter = document.getElementById('form-client-notes-counter');
  const btnOpenAddModal = document.getElementById('btn-open-add-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnCancelModal = document.getElementById('btn-cancel-modal');

  // VA Submit Modal
  const vaSubmitModal = document.getElementById('va-submit-modal');
  const vaSubmitForm = document.getElementById('va-submit-form');
  const submitModalClientStage = document.getElementById('submit-modal-client-stage');
  const submitClientId = document.getElementById('submit-client-id');
  const submitStageId = document.getElementById('submit-stage-id');
  const submitLink = document.getElementById('submit-link');
  const submitReportNotes = document.getElementById('submit-report-notes');
  const fileDropzone = document.getElementById('file-dropzone');
  const submitFileInput = document.getElementById('submit-file-input');
  const dropzonePrompt = document.getElementById('dropzone-prompt');
  const uploadPreviewBox = document.getElementById('upload-preview-box');
  const uploadImgPreview = document.getElementById('upload-img-preview');
  const uploadFilename = document.getElementById('upload-filename');
  const uploadFilesize = document.getElementById('upload-filesize');
  const btnRemoveFile = document.getElementById('btn-remove-file');
  const btnCloseSubmitModal = document.getElementById('btn-close-submit-modal');
  const btnCancelSubmitModal = document.getElementById('btn-cancel-submit-modal');

  // Admin Review Modal
  const adminReviewModal = document.getElementById('admin-review-modal');
  const revModalSubtitle = document.getElementById('rev-modal-subtitle');
  const revVaName = document.getElementById('rev-va-name');
  const revStageRole = document.getElementById('rev-stage-role');
  const revTime = document.getElementById('rev-time');
  const revExternalLink = document.getElementById('rev-external-link');
  const revLinkContainer = document.getElementById('rev-link-container');
  const revReportText = document.getElementById('rev-report-text');
  const revMediaWrapper = document.getElementById('rev-media-wrapper');
  const revisionFeedbackBox = document.getElementById('revision-feedback-box');
  const revFeedbackInput = document.getElementById('rev-feedback-input');
  const btnTriggerRevisionMode = document.getElementById('btn-trigger-revision-mode');
  const btnCancelRevisionMode = document.getElementById('btn-cancel-revision-mode');
  const btnConfirmSendRevision = document.getElementById('btn-confirm-send-revision');
  const btnAcceptDeliverable = document.getElementById('btn-accept-deliverable');
  const btnCloseReviewModal = document.getElementById('btn-close-review-modal');
  const btnCloseReviewModalBtn = document.getElementById('btn-close-review-modal-btn');

  // Lightbox Modal
  const imageLightboxModal = document.getElementById('image-lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const btnCloseLightbox = document.getElementById('btn-close-lightbox');

  // History Tab DOM Elements
  const historySearchInput = document.getElementById('history-search-input');
  const historySearchClear = document.getElementById('history-search-clear');
  const historyFilterTypeSelect = document.getElementById('history-filter-type');
  const historyFilterClientSelect = document.getElementById('history-filter-client');
  const historyFilterVaSelect = document.getElementById('history-filter-va');
  const btnClearHistoryFilters = document.getElementById('btn-clear-history-filters');
  const btnExportHistoryJson = document.getElementById('btn-export-history-json');
  const btnResetHistoryFiltersEmpty = document.getElementById('btn-reset-history-filters-empty');
  const historyTimelineStream = document.getElementById('history-timeline-stream');
  const historyEmptyState = document.getElementById('history-empty-state');
  const historyPaginationFooter = document.getElementById('history-pagination-footer');
  const historyPageStartIdx = document.getElementById('history-page-start-idx');
  const historyPageEndIdx = document.getElementById('history-page-end-idx');
  const historyTotalCount = document.getElementById('history-total-count');
  const historyPageSizeSelect = document.getElementById('history-page-size-select');
  const btnHistoryPagePrev = document.getElementById('btn-history-page-prev');
  const btnHistoryPageNext = document.getElementById('btn-history-page-next');
  const historyPaginationPagesContainer = document.getElementById('history-pagination-pages-container');

  // Ping Modal DOM Elements
  const pingVaModal = document.getElementById('ping-va-modal');
  const pingVaForm = document.getElementById('ping-va-form');
  const btnClosePingModal = document.getElementById('btn-close-ping-modal');
  const btnCancelPingModal = document.getElementById('btn-cancel-ping-modal');
  const pingClientId = document.getElementById('ping-client-id');
  const pingVaName = document.getElementById('ping-va-name');
  const pingStageId = document.getElementById('ping-stage-id');
  const pingVaAvatar = document.getElementById('ping-va-avatar');
  const pingTargetVaName = document.getElementById('ping-target-va-name');
  const pingTargetClientName = document.getElementById('ping-target-client-name');
  const pingTargetStageName = document.getElementById('ping-target-stage-name');
  const pingCustomMessage = document.getElementById('ping-custom-message');
  const pingIsUrgent = document.getElementById('ping-is-urgent');
  const btnSendPing = document.getElementById('btn-send-ping');

  // VA Workstation Pings Box
  const vaRecentPingsBox = document.getElementById('va-recent-pings-box');

  // --- Storage Helper Functions ---
  const DEMO_CLIENT_NAMES = new Set([
    'HyperScale SaaS', 'Nordic Gear Co.', 'BluePeak Capital', 'PulseFitness App',
    'OmniHealth Labs', 'Horizon Legal Partners', 'Skyline Logistics',
    'Nexus CyberSec', 'Vanguard E-Commerce', 'Zenith Dynamics'
  ]);

  // --- REST API Integration Layer ---
  // In production or full-stack mode, use relative '/api/v1'. Only fallback to localhost:5000 when developing on port 3000.
  const API_BASE = (window.location.hostname === 'localhost' && window.location.port === '3000')
    ? 'http://localhost:5000/api/v1'
    : '/api/v1';
  const TOKEN_KEY = 'va_trackos_jwt_token';

  async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers = options.headers || {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (!options.isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    const config = {
      ...options,
      headers
    };
    if (options.body && !options.isFormData && typeof options.body !== 'string') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, config);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          clearSession();
          localStorage.removeItem(TOKEN_KEY);
          showAuthPortal();
        }
        const err = new Error(data.message || `API error ${res.status}`);
        err.status = res.status;
        err.data = data;
        throw err;
      }
      return data;
    } catch (e) {
      console.warn(`[API] ${endpoint}:`, e.message);
      throw e;
    }
  }

  async function refreshUsersFromServer() {
    try {
      const res = await apiFetch('/users');
      if (res && res.data && Array.isArray(res.data)) {
        users = res.data.map(u => ({
          id: u.id,
          name: (u.full_name || u.fullName || u.name || '').trim(),
          fullName: (u.full_name || u.fullName || u.name || '').trim(),
          email: (u.email || '').toLowerCase().trim(),
          role: u.role || 'va',
          avatarInitials: u.avatar_initials || getInitials(u.full_name || u.fullName || u.name || 'VA')
        }));
        saveUsers();
        populateAllVaDropdowns();
        populateHistoryFilters();
      }
    } catch (e) {
      console.warn('Using users cache:', e.message);
    }
  }

  async function refreshClientsFromServer() {
    try {
      const res = await apiFetch('/clients?pageSize=200');
      if (res && res.data) {
        clients = res.data;
      }
    } catch (e) {
      console.warn('Using client cache:', e.message);
    }
  }

  async function refreshDashboardMetrics() {
    try {
      const res = await apiFetch('/dashboard/metrics');
      const m = res.data;
      if (m) {
        if (kpiTotalClients) kpiTotalClients.textContent = m.totalClients;
        if (kpiVasInCharge) kpiVasInCharge.textContent = m.vasInCharge;
        if (kpiPendingReviews) kpiPendingReviews.textContent = m.pendingReviews;
        if (kpiAvgProgress) kpiAvgProgress.textContent = `${m.avgProgress}%`;
        if (vaActiveTaskCount) vaActiveTaskCount.textContent = m.myActiveTasks;
        if (countPendingTab) countPendingTab.textContent = m.pendingReviews;
        if (countRevisionTab) countRevisionTab.textContent = m.needsRevision;
      }
    } catch (e) {
      // fallback
    }
  }

  async function refreshAuditLogsFromServer() {
    try {
      const res = await apiFetch('/activity?limit=100');
      if (res && res.data) {
        auditLogs = res.data;
      }
    } catch (e) {
      console.warn('Using audit cache:', e.message);
    }
  }

  async function refreshPingsFromServer() {
    try {
      const res = await apiFetch('/pings');
      if (res && res.data) {
        pings = res.data;
        updatePingBadge();
      }
    } catch (e) {
      console.warn('Using pings cache:', e.message);
    }
  }

  async function refreshAllServerData() {
    await Promise.allSettled([
      refreshUsersFromServer(),
      refreshClientsFromServer(),
      refreshDashboardMetrics(),
      refreshAuditLogsFromServer(),
      refreshPingsFromServer()
    ]);
    populateAllVaDropdowns();
    populateHistoryFilters();
    renderAll();
  }

  function loadClientsFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const raw = JSON.parse(data);
        // Sanitize out any legacy mock demo records
        clients = Array.isArray(raw) ? raw.filter(c => !DEMO_CLIENT_IDS.has(c.id) && !DEMO_CLIENT_NAMES.has(c.name)) : [];
      } else {
        clients = [];
        saveClientsToStorage(false);
      }
    } catch (e) {
      console.error('Error loading localStorage', e);
      clients = [];
    }
  }

  function saveClientsToStorage(showNotice = true) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
      if (showNotice && storageStatusText) {
        storageStatusText.textContent = `Saved ${new Date().toLocaleTimeString()}`;
      }
    } catch (e) {
      console.error('Failed to write localStorage', e);
      showToast('Error saving data to localStorage', 'warning');
    }
  }

  function loadAuditLogsFromStorage() {
    try {
      const data = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (data) {
        const raw = JSON.parse(data);
        auditLogs = Array.isArray(raw) ? raw.filter(a => !DEMO_AUDIT_IDS.has(a.id) && !DEMO_CLIENT_IDS.has(a.clientId) && !DEMO_CLIENT_NAMES.has(a.clientName)) : [];
      } else {
        auditLogs = [];
        saveAuditLogsToStorage();
      }
    } catch (e) {
      console.error('Error loading audit logs', e);
      auditLogs = [];
    }
  }

  function saveAuditLogsToStorage() {
    try {
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(auditLogs));
    } catch (e) {
      console.error('Failed to save audit logs to storage', e);
    }
  }

  function loadPingsFromStorage() {
    try {
      const data = localStorage.getItem(PINGS_STORAGE_KEY);
      if (data) {
        const raw = JSON.parse(data);
        pings = Array.isArray(raw) ? raw.filter(p => !DEMO_PING_IDS.has(p.id) && !DEMO_CLIENT_IDS.has(p.clientId) && !DEMO_CLIENT_NAMES.has(p.clientName)) : [];
      } else {
        pings = [];
        savePingsToStorage();
      }
    } catch (e) {
      console.error('Error loading pings', e);
      pings = [];
    }
  }

  function savePingsToStorage() {
    try {
      localStorage.setItem(PINGS_STORAGE_KEY, JSON.stringify(pings));
    } catch (e) {
      console.error('Failed to save pings to storage', e);
    }
  }

  // --- Google Classroom-style Sidebar Navigation Drawer ---
  function isCompactScreen() {
    return window.innerWidth <= 1024;
  }

  function openSidebarDrawer() {
    if (!sidebar) return;
    if (isCompactScreen()) {
      sidebar.classList.add('drawer-open');
      if (sidebarScrim) sidebarScrim.classList.add('active');
      document.body.style.overflow = 'hidden';
    } else {
      sidebar.classList.remove('collapsed');
      localStorage.setItem(SIDEBAR_STATE_KEY, 'false');
    }
  }

  function closeSidebarDrawer() {
    if (!sidebar) return;
    if (isCompactScreen()) {
      sidebar.classList.remove('drawer-open');
      if (sidebarScrim) sidebarScrim.classList.remove('active');
      document.body.style.overflow = '';
    } else {
      sidebar.classList.add('collapsed');
      localStorage.setItem(SIDEBAR_STATE_KEY, 'true');
    }
  }

  function toggleSidebar() {
    if (!sidebar) return;
    if (isCompactScreen()) {
      if (sidebar.classList.contains('drawer-open')) {
        closeSidebarDrawer();
      } else {
        openSidebarDrawer();
      }
    } else {
      if (sidebar.classList.contains('collapsed')) {
        openSidebarDrawer();
      } else {
        closeSidebarDrawer();
      }
    }
  }

  function initSidebar() {
    const isCollapsed = localStorage.getItem(SIDEBAR_STATE_KEY) === 'true';
    if (!isCompactScreen() && isCollapsed && sidebar) {
      sidebar.classList.add('collapsed');
    }

    if (btnToggleSidebar) {
      btnToggleSidebar.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSidebar();
      });
    }

    if (btnSidebarCollapse) {
      btnSidebarCollapse.addEventListener('click', (e) => {
        e.stopPropagation();
        closeSidebarDrawer();
      });
    }

    if (sidebarScrim) {
      sidebarScrim.addEventListener('click', () => {
        closeSidebarDrawer();
      });
    }

    // Close drawer when pressing Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isCompactScreen() && sidebar && sidebar.classList.contains('drawer-open')) {
        closeSidebarDrawer();
      }
    });

    // Close drawer when clicking any navigation link on compact screens
    const navItems = sidebar ? sidebar.querySelectorAll('.nav-item') : [];
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        if (isCompactScreen()) {
          closeSidebarDrawer();
        }
      });
    });

    // Handle screen resize smoothly
    window.addEventListener('resize', () => {
      if (!isCompactScreen()) {
        sidebar.classList.remove('drawer-open');
        if (sidebarScrim) sidebarScrim.classList.remove('active');
        document.body.style.overflow = '';
        const savedCollapsed = localStorage.getItem(SIDEBAR_STATE_KEY) === 'true';
        if (savedCollapsed) {
          sidebar.classList.add('collapsed');
        } else {
          sidebar.classList.remove('collapsed');
        }
      }
    });
  }

  // --- Authentication System ---
  function loadUsers() {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) {
        const raw = JSON.parse(stored);
        users = Array.isArray(raw) ? raw.filter(u => !DEMO_USER_EMAILS.has(u.email)) : [];
        DEFAULT_USERS.forEach(def => {
          if (!users.some(u => (u.email || '').toLowerCase() === def.email.toLowerCase())) {
            users.push(def);
          }
        });
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      } else {
        users = JSON.parse(JSON.stringify(DEFAULT_USERS));
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      }
    } catch (e) {
      console.error('Error loading users from storage', e);
      users = JSON.parse(JSON.stringify(DEFAULT_USERS));
    }
  }

  function saveUsers() {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Error saving users to storage', e);
    }
  }

  function getActiveSession() {
    try {
      const sessionStr = localStorage.getItem(SESSION_STORAGE_KEY);
      if (sessionStr) {
        return JSON.parse(sessionStr);
      }
    } catch (e) {
      console.error('Error reading session from storage', e);
    }
    return null;
  }

  function setSession(user) {
    currentUser = user;
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Error setting session in storage', e);
    }
  }

  function clearSession() {
    currentUser = null;
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (e) {
      console.error('Error removing session from storage', e);
    }
  }

  function applyAuthUser(user, showNotice = false) {
    currentUser = user;
    currentRole = user.role; // Strictly bound to authenticated credentials
    if (authPortal) authPortal.style.display = 'none';
    if (appLayout) appLayout.style.display = 'flex';

    if (topbarUserAvatar) topbarUserAvatar.textContent = getInitials(user.name);
    if (topbarUserName) topbarUserName.textContent = user.name;
    if (topbarUserRole) {
      topbarUserRole.textContent = user.role === 'admin' ? 'ADMIN' : 'VA SPECIALIST';
      topbarUserRole.className = `user-role-badge ${user.role === 'admin' ? 'badge-admin' : 'badge-va'}`;
    }

    if (user.role === 'va') {
      currentVaUser = user.name;
      updateVaPortalHeader();
      setRole('va', true);
      switchView('va-portal');
    } else {
      setRole('admin', true);
      switchView('tracker');
    }

    if (showNotice) {
      showToast(`Welcome back, ${user.name}! (${user.role === 'admin' ? 'Admin' : 'VA Specialist'})`, 'success');
    }
  }

  function showAuthPortal() {
    if (appLayout) appLayout.style.display = 'none';
    if (authPortal) authPortal.style.display = 'flex';
    if (loginPasswordInput) loginPasswordInput.value = '';
    if (loginEmailInput) loginEmailInput.focus();
  }

  async function handleLoginSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const email = loginEmailInput.value.trim().toLowerCase();
    const password = loginPasswordInput.value;

    if (!email || !password) {
      showToast('Please enter both email and password', 'warning');
      return;
    }

    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: { email, password }
      });
      localStorage.setItem(TOKEN_KEY, res.data.token);
      const user = {
        id: res.data.user.id,
        name: res.data.user.fullName,
        email: res.data.user.email,
        role: res.data.user.role,
        avatarInitials: res.data.user.avatarInitials
      };
      setSession(user);
      applyAuthUser(user, true);
      await refreshAllServerData();
      return;
    } catch (err) {
      // Local fallback
      const found = users.find(u => u.email.toLowerCase() === email);
      if (found && found.password === password) {
        setSession(found);
        applyAuthUser(found, true);
        return;
      }
      showToast(err.message || 'Login failed', 'warning');
    }
  }

  async function handleRegisterSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const name = regNameInput.value.trim();
    const email = regEmailInput.value.trim().toLowerCase();
    const roleRadio = document.querySelector('input[name="reg-role"]:checked');
    const role = roleRadio ? roleRadio.value : 'admin';
    const password = regPasswordInput.value;
    const passwordConfirm = regPasswordConfirmInput.value;

    if (!name || !email || !password) {
      showToast('Please enter all required registration fields', 'warning');
      return;
    }

    if (password !== passwordConfirm) {
      showToast('Passwords do not match. Please re-enter.', 'warning');
      return;
    }

    try {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: { fullName: name, email, password, role }
      });
      localStorage.setItem(TOKEN_KEY, res.data.token);
      const user = {
        id: res.data.user.id,
        name: res.data.user.fullName,
        email: res.data.user.email,
        role: res.data.user.role,
        avatarInitials: res.data.user.avatarInitials
      };
      setSession(user);
      applyAuthUser(user, true);
      showToast(`Account created! Welcome to Huddle TrackOS, ${name}.`, 'success');
      await refreshAllServerData();
      return;
    } catch (err) {
      showToast(err.message || 'Registration failed', 'warning');
    }
  }

  async function handleLogout() {
    try {
      await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    } finally {
      clearSession();
      localStorage.removeItem(TOKEN_KEY);
      showAuthPortal();
      showToast('Signed out of workspace', 'info');
    }
  }

  // --- Initialization ---
  async function init() {
    loadUsers();
    loadClientsFromStorage();
    loadAuditLogsFromStorage();
    loadPingsFromStorage();
    initSidebar();
    unlockAudioOnUserGesture();
    setupRealtimePingBus();
    setupEventListeners();
    populateAllVaDropdowns();
    populateHistoryFilters();
    renderAll();
    if (pageHeadingTitle && currentView === 'tracker') {
      pageHeadingTitle.textContent = getGreetingWithUserName();
    }

    const session = getActiveSession();
    const token = localStorage.getItem(TOKEN_KEY);

    if (session && token) {
      applyAuthUser(session, false);

      try {
        await refreshAllServerData();
      } catch (err) {
        console.warn('Initial server sync:', err.message);
      }
    } else {
      showAuthPortal();
    }
  }

  // --- View & Role Management ---
  function setRole(role, silent = false) {
    // Role is strictly locked to the authenticated user's account role
    if (currentUser && currentUser.role && currentUser.role !== role) {
      console.warn('Unauthorized role change attempted. Session role is locked to:', currentUser.role);
      return;
    }
    currentRole = role;

    const btnTopbarSoundTest = document.getElementById('btn-topbar-sound-test');

    if (typeof closeUserDropdown === 'function') closeUserDropdown();
    if (role === 'admin') {
      if (adminTopbarActions) adminTopbarActions.style.display = 'flex';

      // Admin has no sound notifications; hide topbar sound test button
      if (btnTopbarSoundTest) btnTopbarSoundTest.style.display = 'none';

      // Clear any ping badges and animations on Admin topbar
      if (topbarPingBadge) {
        topbarPingBadge.style.display = 'none';
        topbarPingBadge.classList.remove('has-new-ping');
      }

      document.body.classList.remove('role-va-mode');
      document.body.classList.add('role-admin-mode');
      if (colActionsHeader) colActionsHeader.textContent = 'Actions';
      if (navTrackerText) navTrackerText.textContent = 'Client Tracker';
    } else {
      if (adminTopbarActions) adminTopbarActions.style.display = 'none';

      // VA Specialist workstation has sound notifications
      if (btnTopbarSoundTest) btnTopbarSoundTest.style.display = 'inline-flex';

      document.body.classList.remove('role-admin-mode');
      document.body.classList.add('role-va-mode');
      if (colActionsHeader) colActionsHeader.textContent = 'Actions';

      // Update VA's unread badge
      updatePingBadge();

      // Trigger audio & visual ping alert if this VA has unread pings
      setTimeout(() => {
        triggerPendingPingCheckForVa();
      }, 350);
    }
  }

  // Dynamic user greeting helper for topbar header
  function getUserGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  function getUserDisplayName() {
    let name = '';
    if (currentRole === 'va') {
      name = currentVaUser || (currentUser && currentUser.name) || 'Specialist';
    } else {
      name = (currentUser && currentUser.name) || 'Admin';
    }
    return (name || 'Admin').trim();
  }

  function getGreetingWithUserName() {
    const greeting = getUserGreeting();
    const name = getUserDisplayName();
    return `${greeting}, ${name}`;
  }

  function switchView(viewName) {
    if (currentRole === 'va' && (viewName === 'reviews' || viewName === 'tracker')) {
      showToast('Access Denied: Client Tracker and Review Queue are restricted to Admin accounts.', 'warning');
      return;
    }
    if (currentRole === 'admin' && viewName === 'va-portal') {
      showToast('Access Denied: VA Workstation is restricted to VA Specialist accounts.', 'warning');
      return;
    }

    currentView = viewName;

    navTabTracker.classList.remove('active');
    if (navTabCalendar) navTabCalendar.classList.remove('active');
    navTabReviews.classList.remove('active');
    navTabVaPortal.classList.remove('active');
    if (navTabHistory) navTabHistory.classList.remove('active');

    if (viewName === 'tracker') navTabTracker.classList.add('active');
    if (viewName === 'calendar' && navTabCalendar) navTabCalendar.classList.add('active');
    if (viewName === 'reviews') navTabReviews.classList.add('active');
    if (viewName === 'va-portal') navTabVaPortal.classList.add('active');
    if (viewName === 'history' && navTabHistory) navTabHistory.classList.add('active');

    viewTracker.style.display = viewName === 'tracker' ? 'block' : 'none';
    if (viewCalendar) viewCalendar.style.display = viewName === 'calendar' ? 'block' : 'none';
    viewReviews.style.display = viewName === 'reviews' ? 'block' : 'none';
    viewVaPortal.style.display = viewName === 'va-portal' ? 'block' : 'none';
    if (viewHistory) viewHistory.style.display = viewName === 'history' ? 'block' : 'none';

    if (isCompactScreen()) {
      closeSidebarDrawer();
    }

    if (viewName === 'tracker') {
      pageHeadingTitle.textContent = getGreetingWithUserName();
      if (pageHeadingSubtitle) {
        pageHeadingSubtitle.textContent = currentRole === 'va'
          ? `Tracking pipeline and deliverables for ${currentVaUser}.`
          : 'Monitor virtual assistant assignments, timeline handoffs, and work completion per client.';
      }
      if (colActionsHeader) colActionsHeader.textContent = 'Actions';
    } else if (viewName === 'calendar') {
      pageHeadingTitle.textContent = 'Project Deadlines & Schedule';
      if (pageHeadingSubtitle) {
        pageHeadingSubtitle.textContent = 'Google Calendar timeline showing deliverables, client milestones, and due dates.';
      }
    } else if (viewName === 'reviews') {
      pageHeadingTitle.textContent = 'Deliverable Quality Review Queue';
      if (pageHeadingSubtitle) {
        pageHeadingSubtitle.textContent = 'Inspect submitted proofs, filter by progress and client, and approve or request revisions.';
      }
    } else if (viewName === 'va-portal') {
      pageHeadingTitle.textContent = 'VA Task Workstation';
      if (pageHeadingSubtitle) {
        pageHeadingSubtitle.textContent = `Assigned tasks and deliverable handoffs for ${currentVaUser}.`;
      }
    } else if (viewName === 'history') {
      pageHeadingTitle.textContent = currentRole === 'va' ? 'Client Team Activity Trail' : 'Pipeline Activity & Audit Trail';
      if (pageHeadingSubtitle) {
        pageHeadingSubtitle.textContent = currentRole === 'va'
          ? `Activity trail and workflow milestones for ${currentVaUser}'s assigned client teams.`
          : 'Complete chronological audit log of VA submissions, Admin approvals, revisions, pings, and lifecycle milestones.';
      }
    }

    renderAll();
  }

  // --- Filtering & Sorting (Table) ---
  function getFilteredAndSortedClients() {
    let result = [...clients];

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(c => {
        const matchName = c.name.toLowerCase().includes(q);
        const matchService = (c.serviceType || '').toLowerCase().includes(q);
        const matchContact = (c.contact || '').toLowerCase().includes(q);
        const matchVA = c.stages && c.stages.some(stg => 
          stg.vaName.toLowerCase().includes(q) || (stg.role || '').toLowerCase().includes(q)
        );
        return matchName || matchService || matchContact || matchVA;
      });
    }

    if (filterService !== 'all') {
      result = result.filter(c => c.serviceType === filterService);
    }

    if (filterVa !== 'all') {
      result = result.filter(c => {
        const activeStage = c.stages ? c.stages.find(s => s.status === 'active' || s.status === 'in_review') : null;
        return activeStage && activeStage.vaName === filterVa;
      });
    }

    if (filterStatus === 'in_review') {
      result = result.filter(c => c.stages && c.stages.some(s => s.status === 'in_review'));
    } else if (filterStatus === 'revision') {
      result = result.filter(c => c.stages && c.stages.some(s => s.status === 'revision'));
    } else if (filterStatus === 'active') {
      result = result.filter(c => c.percentage < 100);
    } else if (filterStatus === 'completed') {
      result = result.filter(c => c.percentage >= 100);
    }

    result.sort((a, b) => {
      if (sortBy === 'deadline-asc') {
        const dA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const dB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return dA - dB;
      } else if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'progress-desc') {
        return b.percentage - a.percentage;
      } else if (sortBy === 'progress-asc') {
        return a.percentage - b.percentage;
      } else {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });

    return result;
  }

  // --- Render All ---
  function renderAll() {
    updateKPIs();
    updateCalendarBadge();
    updateHistoryBadge();
    updatePingBadge();
    if (currentView === 'tracker') {
      renderTable();
    } else if (currentView === 'calendar') {
      renderCalendar();
    } else if (currentView === 'reviews') {
      renderReviewQueue();
    } else if (currentView === 'va-portal') {
      renderVaPortal();
    } else if (currentView === 'history') {
      renderHistoryTab();
    }
  }

  function updateKPIs() {
    const total = clients.length;
    let totalProgress = 0;
    const inChargeVAs = new Set();
    let pendingReviewsCount = 0;
    let revisionCount = 0;
    let myActiveTasks = 0;
    let activeClientsCount = 0;

    clients.forEach(c => {
      const pct = Number(c.percentage) || 0;
      totalProgress += pct;
      if (pct < 100) {
        activeClientsCount++;
      }
      if (c.stages) {
        c.stages.forEach(s => {
          if (s.status === 'active' && s.vaName && s.vaName.trim()) {
            inChargeVAs.add(s.vaName.trim());
          }
          if (s.status === 'in_review') {
            pendingReviewsCount++;
          }
          if (s.status === 'revision') {
            revisionCount++;
          }
          if (s.vaName && s.vaName.trim() === currentVaUser && (s.status === 'active' || s.status === 'in_review' || s.status === 'revision')) {
            myActiveTasks++;
          }
        });
      }
    });

    const avg = total > 0 ? Math.round(totalProgress / total) : 0;

    kpiTotalClients.textContent = activeClientsCount;
    kpiVasInCharge.textContent = inChargeVAs.size;
    kpiPendingReviews.textContent = pendingReviewsCount;
    kpiAvgProgress.textContent = `${avg}%`;

    navReviewBadge.textContent = pendingReviewsCount;
    navReviewBadge.style.display = pendingReviewsCount > 0 ? 'inline-block' : 'none';
    navVaBadge.textContent = myActiveTasks;

    countPendingTab.textContent = pendingReviewsCount;
    countRevisionTab.textContent = revisionCount;
  }

  function populateAllVaDropdowns() {
    const vaSet = new Set();
    // Include all registered VA users
    if (users && users.length > 0) {
      users
        .filter(u => u.role === 'va')
        .forEach(u => {
          const name = (u.full_name || u.fullName || u.name || '').trim();
          if (name) vaSet.add(name);
        });
    }
    clients.forEach(c => {
      if (c.stages) {
        c.stages.forEach(s => {
          if (s.vaName) vaSet.add(s.vaName.trim());
        });
      }
    });

    const vaList = Array.from(vaSet).sort();

    // 1. Table filter
    const prevTableFilter = filterVaSelect.value;
    filterVaSelect.innerHTML = '<option value="all">All VAs</option>';
    vaList.forEach(va => {
      const opt = document.createElement('option');
      opt.value = va;
      opt.textContent = va;
      filterVaSelect.appendChild(opt);
    });
    filterVaSelect.value = prevTableFilter || 'all';

    // 2. Review filter
    if (reviewFilterVaSelect) {
      const prevReviewFilter = reviewFilterVaSelect.value;
      reviewFilterVaSelect.innerHTML = '<option value="all">All VAs</option>';
      vaList.forEach(va => {
        const opt = document.createElement('option');
        opt.value = va;
        opt.textContent = va;
        reviewFilterVaSelect.appendChild(opt);
      });
      reviewFilterVaSelect.value = prevReviewFilter || 'all';
    }

    // 3. Calendar VA Filter
    if (calFilterVa) {
      const prevCalFilter = calFilterVa.value;
      calFilterVa.innerHTML = '<option value="all">All VAs</option>';
      vaList.forEach(va => {
        const opt = document.createElement('option');
        opt.value = va;
        opt.textContent = va;
        calFilterVa.appendChild(opt);
      });
      calFilterVa.value = prevCalFilter || 'all';
    }

    // 4. VA Identity
    if (currentUser && currentUser.role === 'va') {
      currentVaUser = currentUser.name;
    } else if (!currentVaUser && vaList.length > 0) {
      currentVaUser = vaList[0];
    }

    if (vaIdentitySelect) {
      vaIdentitySelect.innerHTML = '';
      if (vaList.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'No VAs assigned yet';
        vaIdentitySelect.appendChild(opt);
      } else {
        vaList.forEach(va => {
          const opt = document.createElement('option');
          opt.value = va;
          opt.textContent = va;
          if (va === currentVaUser) opt.selected = true;
          vaIdentitySelect.appendChild(opt);
        });
      }
    }

    updateVaPortalHeader();
  }

  function updateVaPortalHeader() {
    vaPortalDisplayName.textContent = currentVaUser || 'VA Specialist';
    vaCurrentAvatar.textContent = getInitials(currentVaUser || 'VA');
  }

  // --- Render Table ---
  function renderTable() {
    const filtered = getFilteredAndSortedClients();
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, totalCount);
    const pageItems = filtered.slice(startIdx, endIdx);

    if (totalCount === 0) {
      tableBody.innerHTML = '';
      if (clientTableResponsive) clientTableResponsive.style.display = 'none';
      if (clientPaginationFooter) clientPaginationFooter.style.display = 'none';
      emptyState.style.display = 'flex';

      if (clients.length === 0) {
        if (emptyStateTitle) emptyStateTitle.textContent = 'No client pipelines yet';
        if (emptyStateDesc) emptyStateDesc.textContent = 'Your tracking dashboard is clean. Click below to add your first client pipeline and assign VA stages.';
        if (btnEmptyAddClient) btnEmptyAddClient.style.display = currentRole === 'admin' ? 'inline-flex' : 'none';
        if (btnClearFilters) btnClearFilters.style.display = 'none';
      } else {
        if (emptyStateTitle) emptyStateTitle.textContent = 'No matching clients found';
        if (emptyStateDesc) emptyStateDesc.textContent = 'No clients match your filter criteria. Try clearing search keywords or resetting filters to see all client timelines.';
        if (btnEmptyAddClient) btnEmptyAddClient.style.display = 'none';
        if (btnClearFilters) btnClearFilters.style.display = 'inline-flex';
      }
      return;
    }

    if (clientTableResponsive) clientTableResponsive.style.display = 'block';
    if (clientPaginationFooter) clientPaginationFooter.style.display = 'flex';
    emptyState.style.display = 'none';

    pageStartIdx.textContent = startIdx + 1;
    pageEndIdx.textContent = endIdx;
    totalClientsCount.textContent = totalCount;

    tableBody.innerHTML = pageItems.map(client => renderClientRow(client)).join('');
    renderPaginationControls(totalPages);
  }

  function formatRelativeDue(deadline) {
    if (!deadline) return { text: '—', cls: 'due-none', full: 'No target deadline' };
    const parts = deadline.split('-');
    if (parts.length !== 3) return { text: deadline, cls: 'due-normal', full: deadline };
    const target = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `Overdue by ${Math.abs(diffDays)}d`, cls: 'due-overdue', full: `Deadline passed: ${deadline}` };
    } else if (diffDays === 0) {
      return { text: 'Due today', cls: 'due-near', full: `Due today: ${deadline}` };
    } else if (diffDays === 1) {
      return { text: 'Due tomorrow', cls: 'due-near', full: `Due tomorrow: ${deadline}` };
    } else if (diffDays <= 7) {
      return { text: `In ${diffDays} days`, cls: 'due-near', full: `Target date: ${deadline}` };
    } else {
      return { text: `In ${diffDays} days`, cls: 'due-normal', full: `Target date: ${deadline}` };
    }
  }

  function renderClientRow(client) {
    const initials = getInitials(client.name);
    const dueInfo = formatRelativeDue(client.deadline);
    const timelineHtml = renderVaPipeline(client);

    const inReviewStage = client.stages ? client.stages.find(s => s.status === 'in_review') : null;
    const activeStageIdx = client.stages ? client.stages.findIndex(s => s.status === 'active') : -1;
    const hasNextStage = activeStageIdx !== -1 && activeStageIdx < client.stages.length - 1;

    let actionsCellHtml = '';

    if (currentRole === 'admin') {
      // ADMIN MODE: Review Work if submitted for review, Done badge if 100%, otherwise Ping VA + menu
      let primaryActionBtn = '';
      if (inReviewStage) {
        primaryActionBtn = `
          <button type="button" class="btn-action-ghost is-review" onclick="window.vaApp.openReviewModal('${client.id}', '${inReviewStage.id}')" title="Review submitted deliverable before approving">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line></svg>
            <span>Review Work</span>
          </button>
        `;
      } else if (client.percentage >= 100) {
        primaryActionBtn = `
          <span class="va-badge-soft badge-done" style="margin-right: 0.25rem;">Done ✓</span>
        `;
      }

      const pingBtn = `
        <button type="button" class="btn-action-ghost is-ping" onclick="window.vaApp.openPingModal('${client.id}')" title="Ping VA Specialist">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          <span>Ping VA</span>
        </button>
      `;

      const editBtn = `
        <button type="button" class="btn-action-ghost is-edit" onclick="window.vaApp.editClient('${client.id}')" title="Edit Client & Pipeline">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
          <span>Edit</span>
        </button>
      `;

      const deleteBtn = `
        <button type="button" class="btn-action-ghost is-delete text-danger" onclick="window.vaApp.deleteClient('${client.id}')" title="Delete Client">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          <span>Delete</span>
        </button>
      `;

      const overflowMenu = `
        <div class="row-menu-container">
          <button type="button" class="btn-icon-ghost row-menu-trigger" onclick="window.vaApp.toggleRowMenu(event, '${client.id}')" title="More options" aria-label="More options">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1.5"></circle><circle cx="19" cy="12" r="1.5"></circle><circle cx="5" cy="12" r="1.5"></circle></svg>
          </button>
          <div class="row-menu-popover" id="row-menu-${client.id}">
            <button type="button" class="row-menu-item" onclick="window.vaApp.openPingModal('${client.id}'); window.vaApp.closeAllRowMenus();">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              <span>Ping VA</span>
            </button>
            <button type="button" class="row-menu-item" onclick="window.vaApp.editClient('${client.id}'); window.vaApp.closeAllRowMenus();">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
              <span>Edit Client</span>
            </button>
            <div class="row-menu-divider"></div>
            <button type="button" class="row-menu-item text-danger" onclick="window.vaApp.deleteClient('${client.id}'); window.vaApp.closeAllRowMenus();">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              <span>Delete Client</span>
            </button>
          </div>
        </div>
      `;

      actionsCellHtml = `
        <div class="actions-cell-v2">
          <div class="actions-desktop-group">
            ${primaryActionBtn}
            ${pingBtn}
            ${editBtn}
            ${deleteBtn}
          </div>
          <div class="actions-mobile-group">
            ${primaryActionBtn}
            ${pingBtn}
            ${overflowMenu}
          </div>
        </div>
      `;
    } else {
      // VA USER MODE: ONLY SUBMIT DELIVERABLES FOR ASSIGNED STAGE
      const myAssignedStages = client.stages ? client.stages.filter(s => s.vaName === currentVaUser) : [];
      const activeOrRevisionStage = myAssignedStages.find(s => s.status === 'active' || s.status === 'revision');
      const inReviewStage = myAssignedStages.find(s => s.status === 'in_review');
      const completedStage = myAssignedStages.find(s => s.status === 'completed');

      if (activeOrRevisionStage) {
        actionsCellHtml = `
          <button type="button" class="btn-action-ghost is-accent" 
                  onclick="window.vaApp.openSubmitWorkModal('${client.id}', '${activeOrRevisionStage.id}')" 
                  title="Submit deliverable report & proof">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            <span>${activeOrRevisionStage.status === 'revision' ? 'Resubmit Proof' : 'Submit Proof'}</span>
          </button>
        `;
      } else if (inReviewStage) {
        actionsCellHtml = `<span class="va-badge-soft badge-in-review">In review</span>`;
      } else if (completedStage) {
        actionsCellHtml = `<span class="va-badge-soft badge-done">Done ✓</span>`;
      } else if (myAssignedStages.length > 0) {
        actionsCellHtml = `<span class="va-badge-soft badge-queued">Queued</span>`;
      } else {
        actionsCellHtml = `<span class="text-muted" style="font-size: 13px;">—</span>`;
      }
    }

    const subline = `${escapeHtml(client.serviceType || 'Standard')}${client.contact ? ' · ' + escapeHtml(client.contact) : ''}`;

    return `
      <tr data-client-id="${client.id}">
        <td class="col-client">
          <div class="client-cell-v2">
            <div class="client-avatar-square" title="${escapeHtml(client.name)}">${initials}</div>
            <div class="client-meta-box">
              <span class="client-name-title" title="${escapeHtml(client.name)}">${escapeHtml(client.name)}</span>
              <span class="client-subline-text" title="${subline}">${subline}</span>
            </div>
          </div>
        </td>

        <td class="col-due">
          <span class="due-text ${dueInfo.cls}" title="${escapeHtml(dueInfo.full)}">${dueInfo.text}</span>
        </td>

        <td class="col-va-section">
          ${timelineHtml}
        </td>

        <td class="col-progress">
          <div class="progress-cell-v2">
            <div class="progress-meta-v2">
              <span class="progress-label-v2">${client.percentage >= 100 ? 'Completed' : 'Deliverable'}</span>
              <span class="progress-percent-v2">${client.percentage}%</span>
            </div>
            <div class="progress-track-v2" title="${client.percentage}% Work Completed">
              <div class="progress-fill-v2" style="width: ${client.percentage}%;"></div>
            </div>
          </div>
        </td>

        <td class="col-actions">
          ${actionsCellHtml}
        </td>
      </tr>
    `;
  }

  function cleanDisplayName(name) {
    if (!name) return 'VA';
    return name.replace(/\s+\d{10,}$/, '').trim();
  }

  function renderVaPipeline(client) {
    if (!client.stages || client.stages.length === 0) {
      return `
        <div class="va-pipeline-rail-container">
          <div class="pipeline-flow-rail">
            <span class="rail-lead-line"></span>
            <span class="text-muted" style="font-size: 11.5px; font-style: italic; margin: 0 8px;">No VA assigned</span>
            <span class="rail-trail-line"></span>
          </div>
        </div>
      `;
    }

    const stages = client.stages;
    let currentIdx = stages.findIndex(s => s.status === 'active' || s.status === 'in_review' || s.status === 'revision');
    if (currentIdx === -1) {
      currentIdx = client.percentage >= 100 ? stages.length - 1 : 0;
    }

    // Build connected inline pipeline nodes: Client ----- VA(Onboarding) -------- VA2 ------
    const nodesHtml = stages.map((stg, i) => {
      const isCur = (i === currentIdx);
      const isDone = stg.status === 'completed';
      const isInReview = stg.status === 'in_review';
      const isRevision = stg.status === 'revision';
      const isActive = stg.status === 'active';

      let nodeStateClass = 'node-queued';
      let avatarClass = 'avatar-queued';
      let statusLabel = 'Queued';

      if (isDone) {
        nodeStateClass = 'node-completed';
        avatarClass = 'avatar-completed';
        statusLabel = 'Completed';
      } else if (isInReview) {
        nodeStateClass = 'node-in_review';
        avatarClass = 'avatar-in_review';
        statusLabel = 'In Review';
      } else if (isRevision) {
        nodeStateClass = 'node-revision';
        avatarClass = 'avatar-revision';
        statusLabel = 'Revision';
      } else if (isActive) {
        nodeStateClass = 'node-active';
        avatarClass = 'avatar-active';
        statusLabel = 'In Charge';
      }

      // Action click handler
      let stageClickAction = '';
      if (currentRole === 'admin') {
        stageClickAction = isInReview
          ? `window.vaApp.openReviewModal('${client.id}', '${stg.id}')`
          : `window.vaApp.openPingModal('${client.id}')`;
      } else {
        if (stg.vaName === currentVaUser && (isActive || isRevision)) {
          stageClickAction = `window.vaApp.openSubmitWorkModal('${client.id}', '${stg.id}')`;
        } else {
          stageClickAction = `window.vaApp.vaNodeNotice('${escapeHtml(stg.vaName)}')`;
        }
      }

      const cleanName = cleanDisplayName(stg.vaName);
      const deliverableTitle = stg.role ? escapeHtml(stg.role) : '';
      const tooltip = `Stage ${i + 1}/${stages.length}: ${escapeHtml(cleanName)}${stg.role ? ' • Deliverable: ' + escapeHtml(stg.role) : ''} • ${statusLabel}${stg.deadline ? ' • Due: ' + stg.deadline : ''}`;

      let badgeHtml = '';
      if (isActive) {
        badgeHtml = `<span class="va-badge-soft badge-in-charge">In charge</span>`;
      } else if (isInReview) {
        badgeHtml = `<span class="va-badge-soft badge-in-review">Review</span>`;
      } else if (isRevision) {
        badgeHtml = `<span class="va-badge-soft badge-revision">Revision</span>`;
      } else if (isDone) {
        badgeHtml = `<span class="va-badge-soft badge-done">Done</span>`;
      }

      const deliverablePopoverHtml = deliverableTitle ? `
        <div class="node-deliverable-popover" role="tooltip" onclick="event.stopPropagation()">
          <div class="node-popover-tag">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
            <span>Deliverable</span>
          </div>
          <div class="node-popover-role">${deliverableTitle}</div>
          <div class="node-popover-meta">
            <span class="node-popover-status ${avatarClass}">${statusLabel}</span>
            ${stg.deadline ? `<span class="node-popover-due">Target: ${escapeHtml(stg.deadline)}</span>` : ''}
          </div>
          <div class="node-popover-arrow"></div>
        </div>
      ` : '';

      const nodeHtml = `
        <div class="pipeline-node ${nodeStateClass} ${isCur ? 'is-current-active' : ''} ${deliverableTitle ? 'node-has-deliverable' : ''}" 
             onclick="${stageClickAction}" 
             title="${tooltip}">
          <div class="node-avatar ${avatarClass}">
            ${isDone ? '✓' : getInitials(cleanName)}
          </div>
          <div class="node-label-group">
            <span class="node-va-name">${escapeHtml(cleanName)}</span>
            ${badgeHtml}
          </div>
          ${deliverablePopoverHtml}
        </div>
      `;

      let connectorHtml = '';
      if (i < stages.length - 1) {
        let connClass = 'is-queued-flow';
        if (isDone) {
          connClass = 'is-done-flow';
        } else if (isActive) {
          connClass = 'is-active-flow';
        }
        connectorHtml = `<div class="rail-connector ${connClass}"></div>`;
      }

      return nodeHtml + connectorHtml;
    }).join('');

    const isAllDone = client.percentage >= 100;
    const isFirstActive = (stages[0].status === 'active' || stages[0].status === 'completed');

    return `
      <div class="va-pipeline-rail-container">
        <div class="pipeline-flow-rail">
          <div class="rail-lead-line ${isFirstActive ? 'is-active' : ''}"></div>
          ${nodesHtml}
          <div class="rail-trail-line ${isAllDone ? 'is-complete' : ''}"></div>
        </div>
      </div>
    `;
  }

  function renderPaginationControls(totalPages) {
    const safeTotalPages = Math.max(1, totalPages || 1);
    btnPagePrev.disabled = currentPage <= 1;
    btnPageNext.disabled = currentPage >= safeTotalPages;

    const paginationControls = document.querySelector('.pagination-controls');
    if (paginationControls) {
      paginationControls.style.display = 'flex';
    }

    let pagesHtml = '';
    for (let i = 1; i <= safeTotalPages; i++) {
      pagesHtml += `
        <button type="button" class="page-num-btn ${i === currentPage ? 'active' : ''}" 
                onclick="window.vaApp.goToPage(${i})" aria-label="Page ${i}">
          ${i}
        </button>
      `;
    }
    paginationPagesContainer.innerHTML = pagesHtml;
  }

  // ==========================================================================
  // GOOGLE CALENDAR VIEW & DEADLINE SCHEDULER
  // ==========================================================================
  function getServiceClass(service) {
    if (!service) return 'badge-service-social-starter';
    const s = service.toLowerCase().replace(/[\s&]+/g, '-');
    return `badge-service-${s}`;
  }

  function getChipServiceClass(service) {
    if (!service) return 'chip-social-starter';
    const s = service.toLowerCase().replace(/[\s&]+/g, '-');
    return `chip-${s}`;
  }

  function formatDateShort(dateStr) {
    if (!dateStr) return 'No Deadline';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  }

  function formatDateFull(dateStr) {
    if (!dateStr) return 'No Deadline Set';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }

  function getDeadlineStatus(deadlineStr) {
    if (!deadlineStr) return { text: 'No Deadline', isOverdue: false, isNear: false, daysDiff: 999 };
    const parts = deadlineStr.split('-');
    const target = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        text: `Overdue (${Math.abs(diffDays)}d ago)`,
        isOverdue: true,
        isNear: false,
        daysDiff: diffDays
      };
    } else if (diffDays === 0) {
      return {
        text: 'Due Today',
        isOverdue: false,
        isNear: true,
        daysDiff: 0
      };
    } else if (diffDays <= 3) {
      return {
        text: `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}`,
        isOverdue: false,
        isNear: true,
        daysDiff: diffDays
      };
    } else {
      return {
        text: `In ${diffDays} days`,
        isOverdue: false,
        isNear: false,
        daysDiff: diffDays
      };
    }
  }

  function updateCalendarBadge() {
    if (!navCalendarBadge) return;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let activeDeadlines = 0;
    clients.forEach(c => {
      if (c.deadline && c.percentage < 100) {
        const parts = c.deadline.split('-');
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diff >= 0 && diff <= 14) {
          activeDeadlines++;
        }
      }
    });
    navCalendarBadge.textContent = activeDeadlines;
    navCalendarBadge.style.display = activeDeadlines > 0 ? 'inline-block' : 'none';
  }

  function renderCalendar() {
    const year = calCurrentDate.getFullYear();
    const monthIndex = calCurrentDate.getMonth();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    if (calCurrentMode === 'month') {
      calTitle.textContent = `${monthNames[monthIndex]} ${year}`;
    } else if (calCurrentMode === 'week') {
      const startOfWeek = new Date(calCurrentDate);
      startOfWeek.setDate(calCurrentDate.getDate() - calCurrentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      calTitle.textContent = `${monthNames[startOfWeek.getMonth()].slice(0, 3)} ${startOfWeek.getDate()} – ${monthNames[endOfWeek.getMonth()].slice(0, 3)} ${endOfWeek.getDate()}, ${endOfWeek.getFullYear()}`;
    } else {
      calTitle.textContent = `Deadlines Agenda • ${monthNames[monthIndex]} ${year}`;
    }

    calViewMonth.classList.toggle('active', calCurrentMode === 'month');
    calViewWeek.classList.toggle('active', calCurrentMode === 'week');
    calViewAgenda.classList.toggle('active', calCurrentMode === 'agenda');

    calMonthView.style.display = calCurrentMode === 'month' ? 'block' : 'none';
    calWeekView.style.display = calCurrentMode === 'week' ? 'block' : 'none';
    calAgendaView.style.display = calCurrentMode === 'agenda' ? 'block' : 'none';

    if (calCurrentMode === 'month') {
      renderMonthView();
    } else if (calCurrentMode === 'week') {
      renderWeekView();
    } else if (calCurrentMode === 'agenda') {
      renderAgendaView();
    }

    renderMiniCalendar();
    renderUpcomingDeadlinesFeed();
  }

  function getFilteredCalendarClients() {
    return clients.filter(c => {
      if (!c.deadline) return false;
      if (calSelectedService !== 'all' && c.serviceType !== calSelectedService) {
        return false;
      }
      if (calSelectedVa !== 'all') {
        const hasVa = c.stages && c.stages.some(stg => stg.vaName === calSelectedVa);
        if (!hasVa) return false;
      }
      return true;
    });
  }

  function renderMonthView() {
    const year = calCurrentDate.getFullYear();
    const month = calCurrentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 Sun - 6 Sat
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const calClients = getFilteredCalendarClients();
    let gridHtml = '';

    // Previous month tail days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const dateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      gridHtml += renderDayCell(prevDate, dateStr, dayNum, true, calClients);
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const curDate = new Date(year, month, day);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      gridHtml += renderDayCell(curDate, dateStr, day, false, calClients);
    }

    // Next month lead days (complete 35 or 42 grid cells)
    const totalRendered = firstDayIndex + daysInMonth;
    const remainingCells = totalRendered <= 35 ? (35 - totalRendered) : (42 - totalRendered);
    for (let day = 1; day <= remainingCells; day++) {
      const nextDate = new Date(year, month + 1, day);
      const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      gridHtml += renderDayCell(nextDate, dateStr, day, true, calClients);
    }

    calMonthGrid.innerHTML = gridHtml;
  }

  function getStageStatusLabel(status) {
    if (status === 'active') return 'In charge';
    if (status === 'in_review') return 'In review';
    if (status === 'revision') return 'Revision';
    if (status === 'completed') return 'Done ✓';
    if (status === 'queued') return 'Queued';
    return 'Pending';
  }

  function renderDayCell(dateObj, dateStr, dayNum, isOtherMonth, calClients) {
    const now = new Date();
    const isToday = (dateObj.getFullYear() === now.getFullYear() && dateObj.getMonth() === now.getMonth() && dateObj.getDate() === now.getDate());

    const dayEvents = [];

    calClients.forEach(c => {
      // 1. Specific stage tasks due on dateStr
      let matchedStageOnDate = false;
      if (c.stages && c.stages.length > 0) {
        c.stages.forEach(stg => {
          if (stg.deadline === dateStr) {
            matchedStageOnDate = true;
            const taskRole = stg.role || `${c.serviceType || 'Workflow'} Task`;
            const vaName = stg.vaName || 'Unassigned';
            const statusKey = stg.status || 'active';
            dayEvents.push({
              id: c.id,
              clientName: c.name,
              taskTitle: taskRole,
              vaName: vaName,
              vaAvatar: getInitials(cleanDisplayName(vaName)),
              statusKey: statusKey,
              statusLabel: getStageStatusLabel(statusKey),
              serviceType: c.serviceType,
              percentage: c.percentage,
              isStageTask: true
            });
          }
        });
      }

      // 2. Client overall project deadline on dateStr
      if (c.deadline === dateStr && !matchedStageOnDate) {
        const inChargeStage = c.stages ? (c.stages.find(s => s.status === 'active' || s.status === 'in_review' || s.status === 'revision') || c.stages[c.stages.length - 1]) : null;
        const taskRole = inChargeStage && inChargeStage.role ? inChargeStage.role : (c.serviceType ? `${c.serviceType} Delivery` : 'Target Deliverable');
        const vaName = inChargeStage && inChargeStage.vaName ? inChargeStage.vaName : 'Team Lead';
        const statusKey = c.percentage >= 100 ? 'completed' : (inChargeStage ? inChargeStage.status : 'active');
        const statusLabel = c.percentage >= 100 ? 'Done ✓' : (inChargeStage ? getStageStatusLabel(inChargeStage.status) : 'Target Due');

        dayEvents.push({
          id: c.id,
          clientName: c.name,
          taskTitle: taskRole,
          vaName: vaName,
          vaAvatar: getInitials(cleanDisplayName(vaName)),
          statusKey: statusKey,
          statusLabel: statusLabel,
          serviceType: c.serviceType,
          percentage: c.percentage,
          isStageTask: false
        });
      }
    });

    let chipsHtml = '';
    const maxVisibleChips = 2;
    const visibleEvents = dayEvents.slice(0, maxVisibleChips);

    visibleEvents.forEach(ev => {
      const chipClass = getChipServiceClass(ev.serviceType);
      const isComplete = ev.percentage >= 100;
      const tooltip = `${ev.clientName} • Task: ${ev.taskTitle} • VA: ${ev.vaName} • Status: ${ev.statusLabel} • Progress: ${ev.percentage}%`;

      chipsHtml += `
        <div class="cal-event-card ${chipClass} status-${ev.statusKey} ${isComplete ? 'is-complete' : ''}" 
             onclick="event.stopPropagation(); window.vaApp.openCalendarEventModal('${ev.id}')"
             title="${escapeHtml(tooltip)}">
          <div class="cal-card-header">
            <div class="cal-card-client-wrap">
              <span class="cal-card-status-dot status-${ev.statusKey}"></span>
              <span class="cal-card-client">${escapeHtml(ev.clientName)}</span>
            </div>
            <span class="cal-card-pct">${ev.percentage}%</span>
          </div>
          <div class="cal-card-task">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
            <span class="cal-task-name">${escapeHtml(ev.taskTitle)}</span>
          </div>
          <div class="cal-card-footer">
            <span class="cal-card-va" title="Assigned VA: ${escapeHtml(ev.vaName)}">
              <span class="cal-va-avatar">${ev.vaAvatar}</span>
              <span class="cal-va-name">${escapeHtml(cleanDisplayName(ev.vaName))}</span>
            </span>
            <span class="cal-status-badge status-${ev.statusKey}">${ev.statusLabel}</span>
          </div>
        </div>
      `;
    });

    if (dayEvents.length > maxVisibleChips) {
      chipsHtml += `
        <div class="cal-more-events-link" onclick="event.stopPropagation(); window.vaApp.selectCalendarDate('${dateStr}')">
          +${dayEvents.length - maxVisibleChips} more
        </div>
      `;
    }

    return `
      <div class="cal-day-cell ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'is-today' : ''}" 
           data-date="${dateStr}"
           onclick="window.vaApp.selectCalendarDate('${dateStr}')">
        <div class="day-cell-top">
          <span class="day-number">${dayNum}</span>
          ${isToday ? '<span class="today-marker-text">TODAY</span>' : ''}
        </div>
        <div class="day-events-wrapper">
          ${chipsHtml}
        </div>
      </div>
    `;
  }

  function renderWeekView() {
    const startOfWeek = new Date(calCurrentDate);
    startOfWeek.setDate(calCurrentDate.getDate() - calCurrentDate.getDay()); // Sunday

    const calClients = getFilteredCalendarClients();
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    let columnsHtml = '';
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const now = new Date();
      const isToday = (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate());

      const dayClients = calClients.filter(c => c.deadline === dateStr);
      const stageMatches = [];
      calClients.forEach(c => {
        if (c.stages && c.deadline !== dateStr) {
          c.stages.forEach(stg => {
            if (stg.deadline === dateStr) {
              stageMatches.push({ client: c, stage: stg });
            }
          });
        }
      });

      let eventsHtml = '';
      if (dayClients.length === 0 && stageMatches.length === 0) {
        eventsHtml = `<div class="cal-week-empty-slot">No deadlines</div>`;
      } else {
        const clientCards = dayClients.map(c => {
          const chipClass = getChipServiceClass(c.serviceType);
          const activeStage = c.stages ? (c.stages.find(s => s.status === 'active' || s.status === 'in_review' || s.status === 'revision') || c.stages[0]) : null;
          const taskTitle = activeStage && activeStage.role ? activeStage.role : (c.serviceType || 'Project Final Delivery');
          const vaName = activeStage && activeStage.vaName ? activeStage.vaName : 'Team Lead';
          const statusKey = c.percentage >= 100 ? 'completed' : (activeStage ? activeStage.status : 'active');
          const statusLabel = c.percentage >= 100 ? 'Done ✓' : (activeStage ? getStageStatusLabel(activeStage.status) : 'Target Due');

          return `
            <div class="cal-week-card ${chipClass}" onclick="window.vaApp.openCalendarEventModal('${c.id}')">
              <div class="week-card-header">
                <span class="badge-tag ${getServiceClass(c.serviceType)}" style="font-size: 0.68rem; padding: 1px 6px;">${escapeHtml(c.serviceType || '')}</span>
                <span class="week-card-pct">${c.percentage}%</span>
              </div>
              <div class="week-card-title">${escapeHtml(c.name)}</div>
              <div class="week-card-task">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                <span>${escapeHtml(taskTitle)}</span>
              </div>
              <div class="week-card-footer">
                <div class="week-card-va" style="display: inline-flex; align-items: center; gap: 3.5px;">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  <span>${escapeHtml(cleanDisplayName(vaName))}</span>
                </div>
                <span class="cal-status-badge status-${statusKey}">${statusLabel}</span>
              </div>
            </div>
          `;
        }).join('');

        const stageCards = stageMatches.map(m => {
          const chipClass = getChipServiceClass(m.client.serviceType);
          const taskTitle = m.stage.role || 'Workflow Deliverable';
          const vaName = m.stage.vaName || 'Unassigned';
          const statusKey = m.stage.status || 'active';
          const statusLabel = getStageStatusLabel(statusKey);
          return `
            <div class="cal-week-card ${chipClass}" onclick="window.vaApp.openCalendarEventModal('${m.client.id}')">
              <div class="week-card-header">
                <span class="badge-tag" style="font-size: 0.68rem; padding: 1px 6px; color: var(--accent); border-color: var(--accent-border);">Task Due</span>
                <span class="week-card-pct">${m.client.percentage}%</span>
              </div>
              <div class="week-card-title">${escapeHtml(m.client.name)}</div>
              <div class="week-card-task">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                <span>${escapeHtml(taskTitle)}</span>
              </div>
              <div class="week-card-footer">
                <div class="week-card-va" style="display: inline-flex; align-items: center; gap: 3.5px;">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  <span>${escapeHtml(cleanDisplayName(vaName))}</span>
                </div>
                <span class="cal-status-badge status-${statusKey}">${statusLabel}</span>
              </div>
            </div>
          `;
        }).join('');

        eventsHtml = clientCards + stageCards;
      }

      columnsHtml += `
        <div class="cal-week-col ${isToday ? 'is-today' : ''}">
          <div class="cal-week-header ${isToday ? 'is-today' : ''}">
            <span class="week-day-name">${daysOfWeek[i]}</span>
            <span class="week-day-num">${d.getDate()}</span>
          </div>
          <div class="cal-week-events-list">
            ${eventsHtml}
          </div>
        </div>
      `;
    }

    calWeekView.innerHTML = `
      <div class="cal-week-grid">
        ${columnsHtml}
      </div>
    `;
  }

  function renderAgendaView() {
    const calClients = getFilteredCalendarClients();

    if (calClients.length === 0) {
      calAgendaView.innerHTML = `
        <div class="empty-state" style="padding: 3rem 1rem;">
          <div class="empty-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
          <h3>No deadlines match your current filters</h3>
          <p>Try resetting service or VA filters to view all scheduled deliverables.</p>
        </div>
      `;
      return;
    }

    const sorted = [...calClients].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    const groups = {};
    sorted.forEach(c => {
      if (!groups[c.deadline]) groups[c.deadline] = [];
      groups[c.deadline].push(c);
    });

    let agendaHtml = '';
    Object.keys(groups).forEach(dateStr => {
      const items = groups[dateStr];
      const status = getDeadlineStatus(dateStr);
      const fullDate = formatDateFull(dateStr);

      let cardsHtml = items.map(c => {
        const activeStage = c.stages ? (c.stages.find(s => s.status === 'active' || s.status === 'in_review' || s.status === 'revision') || c.stages[0]) : null;
        const taskTitle = activeStage && activeStage.role ? activeStage.role : (c.serviceType || 'Final Deliverable');
        const vaName = activeStage && activeStage.vaName ? activeStage.vaName : 'Team Lead';
        const statusKey = c.percentage >= 100 ? 'completed' : (activeStage ? activeStage.status : 'active');
        const statusLabel = c.percentage >= 100 ? 'Done ✓' : (activeStage ? getStageStatusLabel(activeStage.status) : 'Target Due');

        return `
          <div class="cal-agenda-card" onclick="window.vaApp.openCalendarEventModal('${c.id}')">
            <div class="agenda-card-left">
              <div class="agenda-header-tags">
                <span class="badge-tag ${getServiceClass(c.serviceType)}">${escapeHtml(c.serviceType || '')}</span>
                <span class="cal-status-badge status-${statusKey}">${statusLabel}</span>
              </div>
              <div class="agenda-client-name">${escapeHtml(c.name)}</div>
              <div class="agenda-task-role">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                <span><strong>Deliverable:</strong> ${escapeHtml(taskTitle)}</span>
              </div>
              <div class="agenda-meta">
                <span class="agenda-meta-item">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  <span><strong>VA:</strong> ${escapeHtml(cleanDisplayName(vaName))}</span>
                </span>
                ${c.contact ? `
                  <span class="agenda-meta-item">
                    <span class="agenda-meta-dot">•</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    <span><strong>Contact:</strong> ${escapeHtml(c.contact)}</span>
                  </span>
                ` : ''}
              </div>
            </div>
            <div class="agenda-card-right">
              <div class="agenda-progress-box">
                <span class="agenda-pct">${c.percentage}%</span>
                <div class="progress-bar-track" style="width: 80px; height: 6px;">
                  <div class="progress-bar-fill ${getProgressColorClass(c.percentage)}" style="width: ${c.percentage}%;"></div>
                </div>
              </div>
              <button class="btn btn-secondary btn-xs" onclick="event.stopPropagation(); window.vaApp.openCalendarEventModal('${c.id}')" style="display: inline-flex; align-items: center; gap: 4px;">
                <span>Details</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </button>
            </div>
          </div>
        `;
      }).join('');

      agendaHtml += `
        <div class="cal-agenda-group">
          <div class="cal-agenda-date-header">
            <span class="agenda-date-text">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>${fullDate}</span>
            </span>
            <span class="badge-tag badge-deadline ${status.isOverdue ? 'is-overdue' : (status.isNear ? 'is-near' : '')}">${status.text}</span>
          </div>
          <div class="cal-agenda-cards-list">
            ${cardsHtml}
          </div>
        </div>
      `;
    });

    calAgendaView.innerHTML = agendaHtml;
  }

  function renderMiniCalendar() {
    if (!miniCalendarWidget) return;
    const year = calCurrentDate.getFullYear();
    const month = calCurrentDate.getMonth();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const deadlineDates = new Set(clients.filter(c => c.deadline).map(c => c.deadline));

    let daysHtml = '';
    const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => `<div class="mini-day-hdr">${d}</div>`).join('');

    // Prev month tail
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      daysHtml += `<div class="mini-day other-month">${d}</div>`;
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const now = new Date();
      const isToday = (year === now.getFullYear() && month === now.getMonth() && d === now.getDate());
      const isSelected = (dateStr === `${calCurrentDate.getFullYear()}-${String(calCurrentDate.getMonth() + 1).padStart(2, '0')}-${String(calCurrentDate.getDate()).padStart(2, '0')}`);
      const hasDeadline = deadlineDates.has(dateStr);

      daysHtml += `
        <div class="mini-day ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''} ${hasDeadline ? 'has-event' : ''}" 
             onclick="window.vaApp.selectCalendarDate('${dateStr}')" 
             title="${dateStr}${hasDeadline ? ' (Has Deadlines)' : ''}">
          ${d}
        </div>
      `;
    }

    miniCalendarWidget.innerHTML = `
      <div class="mini-calendar-header">
        <span class="mini-cal-title">${monthNames[month].slice(0, 3)} ${year}</span>
        <div class="mini-cal-arrows">
          <button class="mini-arrow-btn" onclick="window.vaApp.shiftCalendarMonth(-1)">&lsaquo;</button>
          <button class="mini-arrow-btn" onclick="window.vaApp.shiftCalendarMonth(1)">&rsaquo;</button>
        </div>
      </div>
      <div class="mini-calendar-grid">
        ${dayHeaders}
        ${daysHtml}
      </div>
    `;
  }

  function renderUpcomingDeadlinesFeed() {
    if (!deadlinesFeedList) return;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const upcoming = clients
      .filter(c => c.deadline && c.percentage < 100)
      .map(c => {
        const parts = c.deadline.split('-');
        const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const diffDays = Math.ceil((dateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return { client: c, diffDays, status: getDeadlineStatus(c.deadline) };
      })
      .sort((a, b) => a.diffDays - b.diffDays)
      .slice(0, 6);

    if (upcomingDeadlinesCount) upcomingDeadlinesCount.textContent = upcoming.length;

    if (upcoming.length === 0) {
      deadlinesFeedList.innerHTML = `
        <div class="feed-empty-state">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          <span>No active upcoming deadlines</span>
        </div>
      `;
      return;
    }

    deadlinesFeedList.innerHTML = upcoming.map(item => {
      const c = item.client;
      const isUrgent = item.diffDays <= 3 && item.diffDays >= 0;
      const isOverdue = item.diffDays < 0;
      const cleanName = (c.name || 'Client').replace(/\s+\d{10,}$/, '').trim();
      const activeStage = c.stages ? c.stages.find(s => s.status === 'active' || s.status === 'in_review' || s.status === 'revision') : null;

      let urgencyClass = 'is-normal';
      let pillClass = 'pill-normal';
      if (isOverdue) {
        urgencyClass = 'is-overdue';
        pillClass = 'pill-overdue';
      } else if (isUrgent) {
        urgencyClass = 'is-urgent';
        pillClass = 'pill-urgent';
      }

      return `
        <div class="deadline-feed-card ${urgencyClass}" 
             onclick="window.vaApp.openCalendarEventModal('${c.id}')" 
             title="Click to view ${escapeHtml(cleanName)} timeline & deliverables">
          <div class="feed-card-header">
            <span class="feed-client-name" title="${escapeHtml(c.name)}">${escapeHtml(cleanName)}</span>
            <span class="feed-countdown-pill ${pillClass}">
              ${escapeHtml(item.status.text)}
            </span>
          </div>

          <div class="feed-card-meta">
            <span class="feed-service-chip" title="${escapeHtml(c.serviceType || 'Standard')}">
              <span class="service-chip-dot ${getServiceClass(c.serviceType)}"></span>
              <span class="service-chip-name">${escapeHtml(c.serviceType || 'Standard')}</span>
            </span>
            <span class="feed-date-text">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>${formatDateShort(c.deadline)}</span>
            </span>
          </div>

          <div class="feed-card-footer">
            <div class="feed-progress-box">
              <div class="feed-progress-track">
                <div class="feed-progress-bar" style="width: ${c.percentage}%"></div>
              </div>
              <span class="feed-progress-val">${c.percentage}%</span>
            </div>
            ${activeStage ? `
              <span class="feed-active-va" title="Current VA in charge: ${escapeHtml(activeStage.vaName)}">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <span>${escapeHtml(cleanDisplayName(activeStage.vaName))}</span>
              </span>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  function openCalendarEventModal(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    activeCalendarClientId = clientId;

    calEventServiceBadge.textContent = client.serviceType || 'Standard Service';
    calEventServiceBadge.className = `badge-tag ${getServiceClass(client.serviceType)}`;
    calEventClientName.textContent = client.name;

    calEventDeadlineDate.textContent = formatDateFull(client.deadline);
    const deadlineStatus = getDeadlineStatus(client.deadline);
    calEventCountdown.textContent = deadlineStatus.text;
    calEventCountdown.className = `meta-relative-badge ${deadlineStatus.isOverdue ? 'is-overdue' : (deadlineStatus.isNear ? 'is-near' : '')}`;

    calEventProgress.textContent = `${client.percentage}%`;
    calEventProgressBar.style.width = `${client.percentage}%`;
    calEventProgressBar.className = `progress-bar-fill ${getProgressColorClass(client.percentage)}`;

    if (client.stages && client.stages.length > 0) {
      calEventStagesList.innerHTML = client.stages.map((stg, i) => {
        let statusTag = '';
        if (stg.status === 'completed') statusTag = '<span class="stage-pill pill-done">Done ✓</span>';
        else if (stg.status === 'active') statusTag = '<span class="stage-pill pill-active"><span class="pulse-dot"></span>In Charge</span>';
        else if (stg.status === 'in_review') statusTag = '<span class="stage-pill pill-review">In Review ⏳</span>';
        else if (stg.status === 'revision') statusTag = '<span class="stage-pill pill-revision">Revision ↺</span>';
        else statusTag = '<span class="stage-pill pill-queued">Queued</span>';

        return `
          <div class="event-stage-item">
            <span class="event-stage-num">${i + 1}</span>
            <div class="event-stage-details">
              <strong>${escapeHtml(stg.vaName)}</strong>
              <span>${escapeHtml(stg.role || 'Workflow Task')}${stg.deadline ? ` · <span style="font-family: var(--font-mono); font-size: 11px;">📅 ${stg.deadline}</span>` : ''}</span>
            </div>
            ${statusTag}
          </div>
        `;
      }).join('');
    } else {
      calEventStagesList.innerHTML = '<span style="color: var(--text-muted); font-size: 0.85rem;">No stages assigned</span>';
    }

    if (client.notes) {
      calEventNotesWrapper.style.display = 'block';
      calEventNotes.textContent = client.notes;
    } else {
      calEventNotesWrapper.style.display = 'none';
    }

    calendarEventModal.style.display = 'flex';
  }

  function closeCalendarEventModal() {
    if (calendarEventModal) calendarEventModal.style.display = 'none';
    activeCalendarClientId = null;
  }

  function jumpToClient(clientId) {
    closeCalendarEventModal();
    switchView('tracker');
    searchQuery = '';
    searchInput.value = '';
    searchClearBtn.style.display = 'none';
    filterService = 'all';
    if (filterServiceSelect) filterServiceSelect.value = 'all';
    filterVa = 'all';
    filterVaSelect.value = 'all';
    filterStatus = 'all';
    filterStatusSelect.value = 'all';

    const allFiltered = getFilteredAndSortedClients();
    const idx = allFiltered.findIndex(c => c.id === clientId);
    if (idx !== -1) {
      currentPage = Math.floor(idx / pageSize) + 1;
    }
    renderTable();

    setTimeout(() => {
      const row = document.querySelector(`tr[data-client-id="${clientId}"]`);
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row.classList.add('row-highlight-flash');
        setTimeout(() => row.classList.remove('row-highlight-flash'), 2500);
      }
    }, 150);
  }

  function shiftCalendar(direction) {
    if (calCurrentMode === 'month' || calCurrentMode === 'agenda') {
      const curDay = calCurrentDate.getDate();
      calCurrentDate.setDate(1);
      calCurrentDate.setMonth(calCurrentDate.getMonth() + direction);
      const maxDays = new Date(calCurrentDate.getFullYear(), calCurrentDate.getMonth() + 1, 0).getDate();
      calCurrentDate.setDate(Math.min(curDay, maxDays));
    } else if (calCurrentMode === 'week') {
      calCurrentDate.setDate(calCurrentDate.getDate() + (direction * 7));
    }
    renderCalendar();
  }

  function shiftCalendarMonth(direction) {
    const curDay = calCurrentDate.getDate();
    calCurrentDate.setDate(1);
    calCurrentDate.setMonth(calCurrentDate.getMonth() + direction);
    const maxDays = new Date(calCurrentDate.getFullYear(), calCurrentDate.getMonth() + 1, 0).getDate();
    calCurrentDate.setDate(Math.min(curDay, maxDays));
    renderCalendar();
  }

  function selectCalendarDate(dateStr) {
    const parts = dateStr.split('-');
    calCurrentDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    calCurrentMode = 'agenda';
    renderCalendar();
  }

  // ==========================================================================
  // VIEW 2: Clean, Filterable & Paginated Review Queue
  // ==========================================================================
  function renderReviewQueue() {
    // 1. Gather all candidate submissions
    let allSubmissions = [];

    clients.forEach(c => {
      if (c.stages) {
        c.stages.forEach(stg => {
          if (stg.submission || stg.status === 'in_review' || stg.status === 'revision') {
            allSubmissions.push({ client: c, stage: stg });
          }
        });
      }
    });

    // 2. Filter by Review Tab (Pending, Revision, Approved, or All)
    let filtered = allSubmissions.filter(item => {
      const status = item.stage.status;
      if (reviewFilterMode === 'pending') return status === 'in_review';
      if (reviewFilterMode === 'revision') return status === 'revision';
      if (reviewFilterMode === 'approved') return status === 'completed' && item.stage.submission;
      return true; // 'all'
    });

    // 3. Filter by Search Query (Client Name, VA Name, Deliverable Text)
    if (reviewSearchQuery.trim() !== '') {
      const q = reviewSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => {
        const cName = (item.client.name || '').toLowerCase();
        const vaName = (item.stage.vaName || '').toLowerCase();
        const role = (item.stage.role || '').toLowerCase();
        const rep = (item.stage.submission && item.stage.submission.report || '').toLowerCase();
        const file = (item.stage.submission && item.stage.submission.fileName || '').toLowerCase();
        return cName.includes(q) || vaName.includes(q) || role.includes(q) || rep.includes(q) || file.includes(q);
      });
    }

    // 4. Filter by Work Progress
    if (reviewFilterProgress !== 'all') {
      filtered = filtered.filter(item => {
        const pct = Number(item.client.percentage) || 0;
        if (reviewFilterProgress === 'low') return pct >= 0 && pct <= 30;
        if (reviewFilterProgress === 'mid') return pct > 30 && pct <= 70;
        if (reviewFilterProgress === 'high') return pct > 70 && pct < 100;
        if (reviewFilterProgress === 'complete') return pct === 100;
        return true;
      });
    }

    // 5. Filter by Assigned VA
    if (reviewFilterVa !== 'all') {
      filtered = filtered.filter(item => item.stage.vaName === reviewFilterVa);
    }

    // 6. Sorting
    filtered.sort((a, b) => {
      if (reviewSortBy === 'name-asc') {
        return a.client.name.localeCompare(b.client.name);
      } else if (reviewSortBy === 'progress-desc') {
        return b.client.percentage - a.client.percentage;
      } else if (reviewSortBy === 'progress-asc') {
        return a.client.percentage - b.client.percentage;
      } else {
        // 'newest' default
        return new Date(b.client.createdAt || 0) - new Date(a.client.createdAt || 0);
      }
    });

    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / reviewPageSize) || 1;
    if (reviewCurrentPage > totalPages) reviewCurrentPage = totalPages;

    const startIdx = totalCount === 0 ? 0 : (reviewCurrentPage - 1) * reviewPageSize;
    const endIdx = Math.min(startIdx + reviewPageSize, totalCount);
    const pageItems = filtered.slice(startIdx, endIdx);

    // Handle Empty State
    if (totalCount === 0) {
      reviewCardsContainer.innerHTML = '';
      if (reviewEmptyState) reviewEmptyState.style.display = 'flex';
      if (reviewPaginationFooter) reviewPaginationFooter.style.display = 'none';
      return;
    }

    if (reviewEmptyState) reviewEmptyState.style.display = 'none';
    if (reviewPaginationFooter) reviewPaginationFooter.style.display = 'flex';

    // Update pagination counters
    if (reviewPageStartIdx) reviewPageStartIdx.textContent = startIdx + 1;
    if (reviewPageEndIdx) reviewPageEndIdx.textContent = endIdx;
    if (reviewTotalCount) reviewTotalCount.textContent = totalCount;

    // 7. Render Clean Review Cards
    reviewCardsContainer.innerHTML = pageItems.map(item => {
      const { client, stage } = item;
      const sub = stage.submission || {};
      const statusClass = `card-${stage.status}`;
      const initials = getInitials(stage.vaName);

      let statusBadge = '<span class="rc-status-pill rc-status-pending">Pending Review</span>';
      if (stage.status === 'revision') statusBadge = '<span class="rc-status-pill rc-status-revision">Revision Requested</span>';
      if (stage.status === 'completed') statusBadge = '<span class="rc-status-pill rc-status-approved">Approved ✓</span>';

      // Clean proof attachment representation
      let proofHtml = '';
      if (sub.fileUrl) {
        proofHtml = `
          <div class="rc-proof-box">
            <div class="rc-proof-left" onclick="window.vaApp.openLightboxByStage('${client.id}', '${stage.id}')" title="Click to view full picture proof">
              <div class="rc-media-thumb-box">
                <img src="${sub.fileUrl}" class="rc-media-thumb-img" alt="Proof thumbnail">
              </div>
              <div class="rc-proof-info">
                <span class="rc-proof-filename">${escapeHtml(sub.fileName || 'Attached Picture Proof')}</span>
                <span class="rc-proof-action-hint">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  Click to inspect full screenshot
                </span>
              </div>
            </div>
            ${sub.link ? `<a href="${escapeHtml(sub.link)}" target="_blank" class="rc-link-pill">Open Link ↗</a>` : ''}
          </div>
        `;
      } else if (sub.fileName) {
        proofHtml = `
          <div class="rc-proof-box">
            <div class="rc-proof-left">
              <div class="rc-media-thumb-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
              </div>
              <div class="rc-proof-info">
                <span class="rc-proof-filename">${escapeHtml(sub.fileName)}</span>
                <span class="rc-proof-action-hint" style="color: var(--text-muted);">Document Attached</span>
              </div>
            </div>
            ${sub.link ? `<a href="${escapeHtml(sub.link)}" target="_blank" class="rc-link-pill">Open Link ↗</a>` : ''}
          </div>
        `;
      }

      return `
        <div class="review-card ${statusClass}">
          <!-- Header with Client Name and Work Progress -->
          <div class="rc-header">
            <div class="rc-client-info">
              <div class="rc-client-title-row">
                <span class="rc-client-name">${escapeHtml(client.name)}</span>
                <span class="rc-progress-badge">${client.percentage}% Work Done</span>
              </div>
              <div class="rc-progress-bar-mini">
                <div class="rc-progress-bar-fill" style="width: ${client.percentage}%;"></div>
              </div>
            </div>
            ${statusBadge}
          </div>

          <!-- VA Submitter Bar -->
          <div class="rc-va-submitter-row">
            <div class="rc-va-profile">
              <div class="rc-va-avatar">${initials}</div>
              <div class="rc-va-details">
                <span class="rc-va-name">${escapeHtml(stage.vaName)}</span>
                <span class="rc-va-role">${escapeHtml(stage.role)}</span>
              </div>
            </div>
            <span class="rc-time-tag">${escapeHtml(sub.submittedAt || 'Recent')}</span>
          </div>

          <!-- Report Message -->
          <div class="rc-report-box">
            <div class="rc-report-label">VA Completion Report:</div>
            <div class="rc-report-excerpt">${escapeHtml(sub.report || 'Deliverables prepared and awaiting QA check.')}</div>
          </div>

          <!-- Attached Proof -->
          ${proofHtml}

          <!-- Footer Actions -->
          <div class="rc-footer">
            ${
              stage.status === 'in_review'
                ? `
                  <button class="btn btn-secondary btn-xs btn-revision" onclick="window.vaApp.openReviewModal('${client.id}', '${stage.id}', true)">Request Revision ↺</button>
                  <button class="btn btn-primary btn-xs btn-accept" onclick="window.vaApp.acceptDeliverable('${client.id}', '${stage.id}')">Accept & Advance ✓</button>
                `
                : `
                  <button class="btn btn-secondary btn-xs" onclick="window.vaApp.openReviewModal('${client.id}', '${stage.id}')">Full QA Report 🔍</button>
                `
            }
          </div>
        </div>
      `;
    }).join('');

    renderReviewPaginationControls(totalPages);
  }

  function renderReviewPaginationControls(totalPages) {
    if (!btnReviewPagePrev || !btnReviewPageNext || !reviewPaginationPagesContainer) return;

    btnReviewPagePrev.disabled = reviewCurrentPage <= 1;
    btnReviewPageNext.disabled = reviewCurrentPage >= totalPages;

    let pagesHtml = '';
    for (let i = 1; i <= totalPages; i++) {
      pagesHtml += `
        <button class="page-num-btn ${i === reviewCurrentPage ? 'active' : ''}" 
                onclick="window.vaApp.goToReviewPage(${i})">
          ${i}
        </button>
      `;
    }
    reviewPaginationPagesContainer.innerHTML = pagesHtml;
  }

  // --- Render VIEW 3: VA User Portal ---
  function renderVaPortal() {
    updateVaPortalHeader();
    renderVaPings();
    const myTasks = [];

    clients.forEach(c => {
      if (c.stages) {
        c.stages.forEach(stg => {
          if (stg.vaName === currentVaUser) {
            myTasks.push({ client: c, stage: stg });
          }
        });
      }
    });

    vaActiveTaskCount.textContent = `${myTasks.length} Assigned Tasks`;

    if (myTasks.length === 0) {
      vaTasksGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; padding: 3.5rem 1rem; text-align: center;">
          <div class="empty-icon">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
          </div>
          <h3>${currentVaUser ? `No active tasks assigned to ${escapeHtml(currentVaUser)}` : 'No active deliverables assigned'}</h3>
          <p style="font-size: 0.85rem; margin-top: 0.35rem; color: var(--text-muted);">When client pipelines are created and stages are assigned to your account, tasks will appear here.</p>
        </div>
      `;
      return;
    }

    vaTasksGrid.innerHTML = myTasks.map(item => {
      const { client, stage } = item;
      const status = stage.status || 'queued';
      const sub = stage.submission || {};

      let statusBadge = '<span class="badge-tag">Queued Next</span>';
      if (status === 'completed') statusBadge = '<span class="badge-tag" style="color: var(--emerald); border-color: var(--emerald);">Done ✓</span>';
      if (status === 'active') statusBadge = '<span class="badge-tag badge-tier-growth">● In Charge (Active)</span>';
      if (status === 'in_review') statusBadge = '<span class="badge-tag" style="color: var(--amber); border-color: var(--amber);">⏳ Awaiting Admin Review</span>';
      if (status === 'revision') statusBadge = '<span class="badge-tag" style="color: var(--rose); border-color: var(--rose);">↺ Revision Requested</span>';

      const revisionAlert = (status === 'revision' && sub.feedback)
        ? `
          <div class="va-revision-alert">
            <div class="va-revision-alert-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              Admin Revision Instructions:
            </div>
            <div class="va-revision-feedback-text">${escapeHtml(sub.feedback)}</div>
          </div>
        `
        : '';

      let actionBtn = '';
      if (status === 'active' || status === 'revision') {
        actionBtn = `
          <button class="btn btn-primary btn-sm" onclick="window.vaApp.openSubmitWorkModal('${client.id}', '${stage.id}')">
            ${status === 'revision' ? 'Resubmit Fixed Work ↺' : 'Submit Work & Report 📤'}
          </button>
        `;
      } else if (status === 'in_review') {
        actionBtn = `
          <button class="btn btn-secondary btn-sm" disabled style="opacity: 0.8;">
            Sent & Under Review ⏳
          </button>
        `;
      } else {
        actionBtn = `
          <span style="font-size: 0.78rem; color: var(--text-muted);">${status === 'completed' ? 'Completed & Handed Off ✓' : 'Awaiting Prior VA Stage'}</span>
        `;
      }

      return `
        <div class="va-task-card">
          <div class="va-task-header">
            <div>
              <div class="va-task-role">${escapeHtml(stage.role)}</div>
              <div class="va-task-client">${escapeHtml(client.name)}</div>
            </div>
            ${statusBadge}
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.82rem; color: var(--text-secondary); margin: 0.45rem 0 0.25rem; padding: 0.4rem 0.65rem; background: var(--bg-surface-active); border-radius: 6px;">
            <span>Task Target Deadline:</span>
            <strong style="color: var(--text-primary); font-family: var(--font-mono); font-size: 11.5px;">📅 ${escapeHtml(stage.deadline || client.deadline || '1 Month')}</strong>
          </div>

          ${revisionAlert}

          <div class="va-task-actions">
            ${actionBtn}
          </div>
        </div>
      `;
    }).join('');
  }

  // --- VA Submit Deliverable Modal ---
  function openSubmitWorkModal(clientId, stageId) {
    if (currentRole === 'admin') {
      showToast('Submit Proof is reserved for assigned Virtual Assistants.', 'info');
      return;
    }
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    const stage = client.stages ? client.stages.find(s => s.id === stageId) : null;
    if (!stage) return;

    submitClientId.value = client.id;
    submitStageId.value = stage.id;
    submitModalClientStage.textContent = `${client.name} — ${stage.role} (${stage.vaName})`;

    submitLink.value = (stage.submission && stage.submission.link) ? stage.submission.link : '';
    submitReportNotes.value = (stage.submission && stage.submission.report) ? stage.submission.report : '';
    currentUploadedFileData = null;
    dropzonePrompt.style.display = 'flex';
    uploadPreviewBox.style.display = 'none';

    vaSubmitModal.style.display = 'flex';
    submitReportNotes.focus();
  }

  function closeSubmitModal() {
    vaSubmitModal.style.display = 'none';
  }

  function handleFileSelected(file) {
    if (!file) return;

    const reader = new FileReader();
    const isImage = file.type.startsWith('image/');

    reader.onload = function (e) {
      currentUploadedFileData = {
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: isImage ? 'image' : 'doc',
        dataUrl: e.target.result
      };

      dropzonePrompt.style.display = 'none';
      uploadPreviewBox.style.display = 'flex';
      uploadFilename.textContent = file.name;
      uploadFilesize.textContent = currentUploadedFileData.size;

      if (isImage) {
        uploadImgPreview.src = e.target.result;
        uploadImgPreview.style.display = 'block';
      } else {
        uploadImgPreview.style.display = 'none';
      }
    };

    reader.readAsDataURL(file);
  }

  async function handleSendSubmission(e) {
    e.preventDefault();

    const clientId = submitClientId.value;
    const stageId = submitStageId.value;
    const reportText = submitReportNotes.value.trim();

    if (!reportText) {
      showToast('Please provide a description report for the admin', 'warning');
      return;
    }

    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    const stage = client.stages ? client.stages.find(s => s.id === stageId) : null;
    if (!stage) return;

    try {
      const formData = new FormData();
      formData.append('stageId', stage.id);
      formData.append('reportText', reportText);
      if (submitLink && submitLink.value.trim()) {
        formData.append('externalLink', submitLink.value.trim());
      }
      if (submitFileInput && submitFileInput.files && submitFileInput.files[0]) {
        formData.append('proofFile', submitFileInput.files[0]);
      }

      await apiFetch('/deliverables/submit', {
        method: 'POST',
        isFormData: true,
        body: formData
      });

      showToast(`Deliverable sent to Admin for review on "${client.name}"!`, 'success');
      closeSubmitModal();
      await refreshAllServerData();
      return;
    } catch (err) {
      console.warn('API submission failed, using local fallback:', err.message);
    }

    stage.status = 'in_review';
    stage.submission = {
      fileName: currentUploadedFileData ? currentUploadedFileData.name : '',
      fileUrl: currentUploadedFileData ? currentUploadedFileData.dataUrl : '',
      fileType: currentUploadedFileData ? currentUploadedFileData.type : '',
      link: submitLink ? submitLink.value.trim() : '',
      report: reportText,
      submittedAt: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    };

    saveClientsToStorage();
    renderAll();
    closeSubmitModal();
    showToast(`Deliverable sent to Admin for review on "${client.name}"!`, 'success');
  }

  // --- Admin Review Modal Actions ---
  function openReviewModal(clientId, stageId, autoOpenRevision = false) {
    if (currentRole !== 'admin') {
      showToast('Permission denied: Only Admins can inspect review queue & issue revision requests.', 'warning');
      return;
    }

    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    const stage = client.stages ? client.stages.find(s => s.id === stageId) : null;
    if (!stage) return;

    activeReviewClient = client;
    activeReviewStage = stage;

    revModalSubtitle.textContent = `${client.name} — Stage Quality Check`;
    revVaName.textContent = stage.vaName;
    revStageRole.textContent = stage.role;

    const sub = stage.submission || {};
    revTime.textContent = sub.submittedAt || 'Recently';
    revReportText.textContent = sub.report || 'No detailed notes provided.';

    if (sub.link) {
      revLinkContainer.style.display = 'flex';
      revExternalLink.href = sub.link;
    } else {
      revLinkContainer.style.display = 'none';
    }

    if (sub.fileUrl) {
      revMediaWrapper.innerHTML = `
        <img src="${sub.fileUrl}" class="rev-media-full" alt="Deliverable proof" onclick="window.vaApp.openLightboxByStage('${client.id}', '${stage.id}')">
        <span style="font-size: 0.76rem; color: #7c3aed; font-weight: 600;">(Click picture to view full size)</span>
      `;
    } else {
      revMediaWrapper.innerHTML = `
        <div style="font-size: 0.85rem; color: var(--text-muted); font-style: italic;">
          ${sub.fileName ? `Document attached: ${sub.fileName}` : 'No image file uploaded.'}
        </div>
      `;
    }

    revisionFeedbackBox.style.display = autoOpenRevision ? 'flex' : 'none';
    revFeedbackInput.value = '';

    adminReviewModal.style.display = 'flex';
  }

  function closeReviewModal() {
    adminReviewModal.style.display = 'none';
    activeReviewClient = null;
    activeReviewStage = null;
  }

  async function acceptDeliverable(clientId, stageId) {
    if (currentRole !== 'admin') {
      showToast('Permission denied: Only Admins can approve deliverables and advance the pipeline.', 'warning');
      return;
    }

    const client = clients.find(c => c.id === clientId);
    if (!client || !client.stages) return;

    const currentStage = client.stages.find(s => s.id === stageId);
    if (!currentStage) return;

    try {
      const deliverableId = currentStage.submission ? currentStage.submission.id : null;
      if (deliverableId) {
        await apiFetch('/reviews', {
          method: 'POST',
          body: {
            deliverableId,
            decision: 'approved',
            feedback: 'Deliverable approved by Administrator.'
          }
        });
        showToast(`Deliverable approved for ${client.name}!`, 'success');
        closeReviewModal();
        await refreshAllServerData();
        return;
      }
    } catch (err) {
      console.warn('API review failed, using local update:', err.message);
    }

    const stageIdx = client.stages.findIndex(s => s.id === stageId);
    currentStage.status = 'completed';
    client.percentage = calculatePipelinePercentage(client.stages);

    if (stageIdx < client.stages.length - 1) {
      const nextStage = client.stages[stageIdx + 1];
      nextStage.status = 'active';
      showToast(`Approved! Handed over to ${nextStage.vaName} on ${client.name}`, 'success');
    } else {
      showToast(`Approved! Pipeline fully finished & delivered for ${client.name}!`, 'success');
    }

    saveClientsToStorage();
    renderAll();
    closeReviewModal();
  }

  async function sendRevisionRequest() {
    if (currentRole !== 'admin') {
      showToast('Permission denied: Only Admins can issue revision requests.', 'warning');
      return;
    }

    if (!activeReviewClient || !activeReviewStage) return;

    const feedback = revFeedbackInput.value.trim();
    if (!feedback) {
      showToast('Please provide revision instructions for the VA', 'warning');
      return;
    }

    try {
      const deliverableId = activeReviewStage.submission ? activeReviewStage.submission.id : null;
      if (deliverableId) {
        await apiFetch('/reviews', {
          method: 'POST',
          body: {
            deliverableId,
            decision: 'revision_requested',
            feedback
          }
        });
        showToast(`Revision request sent to ${activeReviewStage.vaName}`, 'info');
        closeReviewModal();
        await refreshAllServerData();
        return;
      }
    } catch (err) {
      console.warn('API revision request failed, using local update:', err.message);
    }

    activeReviewStage.status = 'revision';
    if (!activeReviewStage.submission) activeReviewStage.submission = {};
    activeReviewStage.submission.feedback = feedback;

    showToast(`Revision request sent to ${activeReviewStage.vaName}`, 'info');
    saveClientsToStorage();
    renderAll();
    closeReviewModal();
  }

  // Safe Lightbox opener referencing client and stage IDs
  function openLightboxByStage(clientId, stageId) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    const stage = client.stages ? client.stages.find(s => s.id === stageId) : null;
    if (!stage || !stage.submission || !stage.submission.fileUrl) return;
    lightboxImg.src = stage.submission.fileUrl;
    imageLightboxModal.style.display = 'flex';
  }

  function closeLightbox() {
    imageLightboxModal.style.display = 'none';
  }

  // --- Automated Work Percentage Calculation (100% Divided Equally Across VAs) ---
  function calculatePipelinePercentage(stages) {
    if (!stages || stages.length === 0) return 0;
    const completedCount = stages.filter(s => s.status === 'completed').length;
    return Math.round((completedCount / stages.length) * 100);
  }

  function updateModalPipelineCalculation() {
    if (!vaStagesBuilder) return { totalStages: 0, completedStages: 0, percentage: 0 };
    const rows = vaStagesBuilder.querySelectorAll('.stage-builder-row');
    const totalStages = rows.length;

    if (totalStages === 0) {
      if (calcStageWeight) calcStageWeight.textContent = '0% per VA';
      if (calcCurrentProgress) calcCurrentProgress.textContent = '0% Done';
      if (calcProgressFill) {
        calcProgressFill.style.width = '0%';
        calcProgressFill.className = 'progress-bar-fill fill-low';
      }
      return { totalStages: 0, completedStages: 0, percentage: 0 };
    }

    let completedStages = 0;
    rows.forEach(row => {
      const select = row.querySelector('.stage-status-select');
      if (select && select.value === 'completed') {
        completedStages++;
      }
    });

    const weightPerVa = 100 / totalStages;
    const weightText = totalStages === 1 
      ? '100% (1 VA)' 
      : `${weightPerVa % 1 === 0 ? weightPerVa : weightPerVa.toFixed(1)}% per VA (${totalStages} VAs)`;
    const percentage = Math.round((completedStages / totalStages) * 100);

    if (calcStageWeight) {
      calcStageWeight.textContent = weightText;
    }
    if (calcCurrentProgress) {
      calcCurrentProgress.textContent = `${percentage}% Done (${completedStages}/${totalStages})`;
    }
    if (calcProgressFill) {
      calcProgressFill.style.width = `${percentage}%`;
      let fillClass = 'fill-low';
      if (percentage >= 100) fillClass = 'fill-complete';
      else if (percentage >= 70) fillClass = 'fill-high';
      else if (percentage >= 40) fillClass = 'fill-mid';
      calcProgressFill.className = `progress-bar-fill ${fillClass}`;
    }

    return { totalStages, completedStages, percentage };
  }

  // --- Add / Edit Client Modal ---
  function getDefaultOneMonthDeadline() {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function updateNotesCounter() {
    if (!formClientNotesCounter || !formClientNotes) return;
    const len = (formClientNotes.value || '').length;
    formClientNotesCounter.textContent = `${len} / 400`;
    if (len >= 400) {
      formClientNotesCounter.style.color = 'var(--status-needs-revision-text)';
      formClientNotesCounter.style.fontWeight = '600';
    } else {
      formClientNotesCounter.style.color = 'var(--text-muted)';
      formClientNotesCounter.style.fontWeight = 'normal';
    }
  }

  function openAddModal() {
    if (currentRole !== 'admin') {
      showToast('Permission denied: Only Admins can add new clients to the tracking center.', 'warning');
      return;
    }

    modalTitle.textContent = 'Add New Client Account';
    clientForm.reset();
    formClientId.value = '';
    const autoDeadline = getDefaultOneMonthDeadline();
    if (formClientService) formClientService.value = 'Social Growth';
    if (formClientDeadline) formClientDeadline.value = autoDeadline;
    buildDefaultStageRows();
    updateModalPipelineCalculation();
    updateNotesCounter();
    clientModal.style.display = 'flex';
    const modalBox = clientModal.querySelector('.modal-box');
    if (modalBox) {
      modalBox.scrollTop = 0;
      modalBox.scrollLeft = 0;
    }
    formClientName.focus();
  }

  function editClient(clientId) {
    if (currentRole !== 'admin') {
      showToast('Permission denied: VA accounts cannot edit client configurations.', 'warning');
      return;
    }

    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    modalTitle.textContent = 'Edit Client & VA Pipeline';
    formClientId.value = client.id;
    formClientName.value = client.name;
    formClientContact.value = client.contact || '';
    if (formClientService) formClientService.value = client.serviceType || 'Social Growth';
    if (formClientDeadline) formClientDeadline.value = client.deadline || getDefaultOneMonthDeadline();
    formClientNotes.value = client.notes || '';

    vaStagesBuilder.innerHTML = '';
    if (client.stages && client.stages.length > 0) {
      client.stages.forEach((stg, i) => {
        addStageRow(i + 1, stg.vaName, stg.role, stg.status, stg.deadline);
      });
    } else {
      buildDefaultStageRows();
    }

    updateModalPipelineCalculation();
    updateNotesCounter();
    clientModal.style.display = 'flex';
    const editModalBox = clientModal.querySelector('.modal-box');
    if (editModalBox) {
      editModalBox.scrollTop = 0;
      editModalBox.scrollLeft = 0;
    }
  }

  function closeModal() {
    clientModal.style.display = 'none';
  }

  function getRegisteredVas() {
    if (!users || users.length === 0) return [];
    return users
      .filter(u => u.role === 'va')
      .map(u => ({
        id: u.id,
        name: (u.full_name || u.fullName || u.name || '').trim(),
        email: (u.email || '').trim()
      }))
      .filter(u => u.name.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  function buildVaOptionsHtml(selectedValue = '') {
    const vaUsers = getRegisteredVas();
    let html = '';

    if (vaUsers.length === 0) {
      if (selectedValue && selectedValue.trim()) {
        html += `<option value="${escapeHtml(selectedValue.trim())}" selected>${escapeHtml(selectedValue.trim())}</option>`;
      } else {
        html += `<option value="" disabled selected>No registered VAs found</option>`;
      }
      return html;
    }

    const selectedTrimmed = (selectedValue || '').trim();
    const hasMatch = vaUsers.some(u => u.name.toLowerCase() === selectedTrimmed.toLowerCase());

    if (!selectedTrimmed) {
      html += `<option value="" disabled selected>-- Select Registered VA Specialist --</option>`;
    } else if (!hasMatch && selectedTrimmed) {
      html += `<option value="${escapeHtml(selectedTrimmed)}" selected>${escapeHtml(selectedTrimmed)} (Assigned)</option>`;
    }

    vaUsers.forEach(u => {
      const isSelected = selectedTrimmed && u.name.toLowerCase() === selectedTrimmed.toLowerCase();
      const label = u.email ? `${u.name} (${u.email})` : u.name;
      html += `<option value="${escapeHtml(u.name)}" ${isSelected ? 'selected' : ''}>${escapeHtml(label)}</option>`;
    });

    return html;
  }

  function buildDefaultStageRows() {
    vaStagesBuilder.innerHTML = '';
    const vaUsers = getRegisteredVas();
    const firstVa = vaUsers.length > 0 ? vaUsers[0].name : '';
    const defaultDl = (formClientDeadline && formClientDeadline.value) ? formClientDeadline.value : getDefaultOneMonthDeadline();
    addStageRow(1, firstVa, '', 'active', defaultDl);
  }

  function addStageRow(stepNum, defaultVa = '', defaultRole = '', defaultStatus = 'queued', defaultDeadline = '') {
    const row = document.createElement('div');
    row.className = 'stage-builder-row';
    const step = stepNum || (vaStagesBuilder.children.length + 1);
    const clientDl = (formClientDeadline && formClientDeadline.value) ? formClientDeadline.value : getDefaultOneMonthDeadline();
    const assignedDeadline = defaultDeadline || clientDl;

    row.innerHTML = `
      <div class="stage-step-num">${step}</div>
      <select class="stage-va-name" required title="Select Registered VA Specialist">
        ${buildVaOptionsHtml(defaultVa)}
      </select>
      <input type="text" class="stage-role-name" placeholder="Role / Deliverable Task" value="${escapeHtml(defaultRole)}" required>
      <input type="date" class="stage-deadline-input" value="${escapeHtml(assignedDeadline)}" required title="Target Deadline for this VA Stage">
      <select class="stage-status-select">
        <option value="completed" ${defaultStatus === 'completed' ? 'selected' : ''}>Done ✓</option>
        <option value="active" ${defaultStatus === 'active' ? 'selected' : ''}>In Charge (Active)</option>
        <option value="in_review" ${defaultStatus === 'in_review' ? 'selected' : ''}>In Review ⏳</option>
        <option value="revision" ${defaultStatus === 'revision' ? 'selected' : ''}>Revision ↺</option>
        <option value="queued" ${defaultStatus === 'queued' ? 'selected' : ''}>Queued Next</option>
      </select>
      <button type="button" class="stage-delete-btn" title="Remove stage">&times;</button>
    `;

    // Dynamic pipeline calculation on status change
    const statusSelect = row.querySelector('.stage-status-select');
    if (statusSelect) {
      statusSelect.addEventListener('change', () => {
        updateModalPipelineCalculation();
      });
    }

    row.querySelector('.stage-delete-btn').addEventListener('click', () => {
      if (vaStagesBuilder.children.length <= 1) {
        showToast('At least one VA stage is required', 'warning');
        return;
      }
      row.remove();
      renumberStageRows();
      updateModalPipelineCalculation();
    });

    vaStagesBuilder.appendChild(row);
    updateModalPipelineCalculation();
  }

  function renumberStageRows() {
    Array.from(vaStagesBuilder.children).forEach((row, idx) => {
      const numBadge = row.querySelector('.stage-step-num');
      if (numBadge) numBadge.textContent = idx + 1;
    });
  }

  async function handleSaveClient(e) {
    e.preventDefault();
    if (currentRole !== 'admin') {
      showToast('Permission denied: VA accounts cannot modify client configurations.', 'warning');
      return;
    }

    const name = formClientName.value.trim();
    if (!name) return;

    const stageRows = Array.from(vaStagesBuilder.querySelectorAll('.stage-builder-row'));
    if (stageRows.length === 0) {
      showToast('Please add at least one VA stage', 'warning');
      return;
    }

    for (let i = 0; i < stageRows.length; i++) {
      const row = stageRows[i];
      const vaVal = (row.querySelector('.stage-va-name')?.value || '').trim();
      const roleVal = (row.querySelector('.stage-role-name')?.value || '').trim();
      if (!vaVal) {
        showToast(`Please select a registered VA specialist for Stage #${i + 1}`, 'warning');
        row.querySelector('.stage-va-name')?.focus();
        return;
      }
      if (!roleVal) {
        showToast(`Please enter a deliverable / role for Stage #${i + 1}`, 'warning');
        row.querySelector('.stage-role-name')?.focus();
        return;
      }
    }

    const stages = stageRows.map((row, idx) => {
      const vaSelect = row.querySelector('.stage-va-name');
      const vaName = (vaSelect ? vaSelect.value : '').trim() || `VA_${idx + 1}`;
      const role = row.querySelector('.stage-role-name').value.trim() || 'Workflow Specialist';
      const deadline = row.querySelector('.stage-deadline-input')?.value || '';
      const status = row.querySelector('.stage-status-select').value;
      return { vaName, role, deadline, status };
    });

    const calculatedPercentage = calculatePipelinePercentage(stages);
    const clientId = formClientId.value;
    const isNew = !clientId;
    const serviceType = formClientService ? formClientService.value : 'Social Growth';
    const deadline = formClientDeadline ? formClientDeadline.value : '';
    const contact = formClientContact ? formClientContact.value.trim() : '';
    const notes = formClientNotes ? formClientNotes.value.trim() : '';

    const payload = {
      name,
      contact,
      serviceType,
      deadline,
      notes,
      stages
    };

    try {
      if (isNew) {
        await apiFetch('/clients', {
          method: 'POST',
          body: payload
        });
        showToast(`Added client "${name}"`, 'success');
      } else {
        await apiFetch(`/clients/${clientId}`, {
          method: 'PATCH',
          body: payload
        });
        showToast(`Updated client "${name}"`, 'success');
      }
      closeModal();
      await refreshAllServerData();
      return;
    } catch (err) {
      console.warn('API client save failed, using local fallback:', err.message);
    }

    if (isNew) {
      const newClient = {
        id: `cli-${Date.now()}`,
        name: name,
        contact: contact,
        serviceType: serviceType,
        deadline: deadline,
        percentage: calculatedPercentage,
        notes: notes,
        createdAt: new Date().toISOString().split('T')[0],
        stages: stages.map((s, idx) => ({ ...s, id: `stg-${Date.now()}-${idx}` }))
      };
      clients.unshift(newClient);
      showToast(`Added client "${name}" (${calculatedPercentage}% complete)`, 'success');
    } else {
      const idx = clients.findIndex(c => c.id === clientId);
      if (idx !== -1) {
        clients[idx] = {
          ...clients[idx],
          name: name,
          contact: contact,
          serviceType: serviceType,
          deadline: deadline,
          percentage: calculatedPercentage,
          notes: notes,
          stages: stages.map((s, idx) => ({ ...s, id: `stg-${Date.now()}-${idx}` }))
        };
        showToast(`Updated client "${name}" (${calculatedPercentage}% complete)`, 'success');
      }
    }

    saveClientsToStorage();
    populateAllVaDropdowns();
    populateHistoryFilters();
    renderAll();
    closeModal();
  }

  function openConfirmDeleteModal(clientId) {
    if (currentRole !== 'admin') {
      showToast('Permission denied: Only Admins can delete client accounts.', 'warning');
      return;
    }

    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    pendingDeleteClientId = clientId;
    if (confirmDeleteTitle) confirmDeleteTitle.textContent = `Delete ${client.name}?`;
    if (confirmDeleteDesc) {
      confirmDeleteDesc.textContent = `Are you sure you want to delete "${client.name}"? All pipeline assignments, stages, reviews, and deadline schedules will be permanently removed. This action cannot be undone.`;
    }
    if (confirmDeleteModal) confirmDeleteModal.style.display = 'flex';
  }

  function closeConfirmDeleteModal() {
    if (confirmDeleteModal) confirmDeleteModal.style.display = 'none';
    pendingDeleteClientId = null;
  }

  async function executeDeleteClient() {
    if (!pendingDeleteClientId) return;
    const clientId = pendingDeleteClientId;
    const client = clients.find(c => c.id === clientId);
    const clientName = client ? client.name : 'Client';

    try {
      await apiFetch(`/clients/${clientId}`, { method: 'DELETE' });
      showToast(`Deleted "${clientName}"`, 'info');
      closeConfirmDeleteModal();
      await refreshAllServerData();
      return;
    } catch (err) {
      console.warn('API delete failed, using local update:', err.message);
    }

    clients = clients.filter(c => c.id !== clientId);
    saveClientsToStorage();
    populateAllVaDropdowns();
    populateHistoryFilters();
    renderAll();
    closeConfirmDeleteModal();
    showToast(`Deleted "${clientName}"`, 'info');
  }

  function deleteClient(clientId) {
    openConfirmDeleteModal(clientId);
  }

  // Notice when a VA clicks an unassigned node
  function vaNodeNotice(vaName) {
    if (vaName === currentVaUser) {
      showToast('Stage is currently queued or completed.', 'info');
    } else {
      showToast(`Assigned to ${vaName}.`, 'info');
    }
  }

  function exportData() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(clients, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `va_tracker_clients_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported dataset to JSON', 'info');
  }

  // --- PIPELINE ACTIVITY HISTORY & AUDIT TRAIL FUNCTIONS ---
  function logAuditEvent(eventData) {
    const now = new Date();
    const timeFormatted = `Today at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const newEvent = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: now.toISOString(),
      dateCategory: 'Today',
      timeFormatted: timeFormatted,
      type: eventData.type || 'lifecycle',
      actor: eventData.actor || {
        name: currentUser ? currentUser.name : (currentRole === 'admin' ? (currentUser ? currentUser.name : (currentRole === 'admin' ? 'Admin' : currentVaUser)) : currentVaUser),
        role: currentRole === 'admin' ? 'Pipeline Admin' : 'VA Specialist',
        avatar: getInitials(currentUser ? currentUser.name : (currentRole === 'admin' ? (currentUser ? currentUser.name : (currentRole === 'admin' ? 'Admin' : currentVaUser)) : currentVaUser))
      },
      clientId: eventData.clientId || '',
      clientName: eventData.clientName || 'General Pipeline',
      stageName: eventData.stageName || 'Pipeline',
      targetVa: eventData.targetVa || '',
      title: eventData.title || 'Pipeline Update',
      summary: eventData.summary || '',
      details: eventData.details || '',
      meta: eventData.meta || {}
    };

    auditLogs.unshift(newEvent);
    saveAuditLogsToStorage();
    updateHistoryBadge();
    if (currentView === 'history') {
      renderHistoryTab();
    }
  }

  function getVaAssignedClients(vaName) {
    const targetName = (vaName || currentVaUser || (currentUser ? currentUser.name : '') || '').toLowerCase().trim();
    if (!targetName) return [];
    return (clients || []).filter(c => {
      return (c.stages || []).some(s => {
        const sVa = (s.vaName || '').toLowerCase().trim();
        return sVa && (sVa === targetName || targetName.includes(sVa) || sVa.includes(targetName));
      });
    });
  }

  function getVaTeamAuditLogs() {
    if (currentRole !== 'va') return auditLogs;
    const myClients = getVaAssignedClients(currentVaUser);
    const myClientNames = new Set(myClients.map(c => (c.name || '').toLowerCase().trim()));
    const myClientIds = new Set(myClients.map(c => String(c.id)));
    const myVaName = (currentVaUser || (currentUser ? currentUser.name : '') || '').toLowerCase().trim();

    return (auditLogs || []).filter(item => {
      const itemClientName = (item.clientName || '').toLowerCase().trim();
      const itemClientId = item.clientId ? String(item.clientId) : '';
      const isClientInTeam = (itemClientId && myClientIds.has(itemClientId)) || (itemClientName && myClientNames.has(itemClientName));
      const isDirectTarget = (item.targetVa || '').toLowerCase().trim() === myVaName;
      const isActor = item.actor && item.actor.name && item.actor.name.toLowerCase().trim() === myVaName;
      return isClientInTeam || isDirectTarget || isActor;
    });
  }

  function updateHistoryBadge() {
    if (!navHistoryBadge) return;
    const logs = getVaTeamAuditLogs();
    const todayCount = logs.filter(e => e.dateCategory === 'Today').length;
    navHistoryBadge.textContent = todayCount;
    navHistoryBadge.style.display = todayCount > 0 ? 'inline-block' : 'none';
  }

  // ==========================================================================
  // Topbar Notifications Popover & Stream
  // ==========================================================================
  function formatNotificationTime(timestamp) {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return String(timestamp);
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function getReadNotificationIds() {
    try {
      const stored = localStorage.getItem('trackos_read_notifications');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (e) {
      return new Set();
    }
  }

  function saveReadNotificationIds(set) {
    try {
      const arr = Array.from(set).slice(-150);
      localStorage.setItem('trackos_read_notifications', JSON.stringify(arr));
    } catch (e) {}
  }

  function getRecentNotifications() {
    const notifs = [];
    const readIds = getReadNotificationIds();

    if (currentRole === 'va') {
      const myName = (currentVaUser || (currentUser ? currentUser.name : '') || '').toLowerCase().trim();

      // 1. Pings for this VA Specialist
      (pings || []).forEach(p => {
        const target = (p.targetVa || '').toLowerCase().trim();
        const matches = !target || target === myName || myName.includes(target) || target.includes(myName);
        if (matches) {
          const notifId = `ping-${p.id}`;
          const isUnread = p.status === 'unread' && !readIds.has(notifId);
          notifs.push({
            id: notifId,
            rawId: p.id,
            category: 'ping',
            type: p.isUrgent ? 'urgent_ping' : 'ping',
            title: p.isUrgent ? '🚨 Urgent Ping from Admin' : '🔔 Alert from Admin',
            desc: p.message || `Priority update regarding ${p.clientName || 'task'}`,
            meta: p.clientName ? `${p.clientName}${p.stageName ? ` · ${p.stageName}` : ''}` : '',
            timestamp: p.timestamp || p.createdAt || Date.now(),
            isUrgent: Boolean(p.isUrgent),
            isUnread: isUnread,
            action: () => {
              acknowledgePing(p.id);
              readIds.add(notifId);
              saveReadNotificationIds(readIds);
              closeNotificationsDropdown();
              switchView('va-portal');
              if (vaRecentPingsBox) vaRecentPingsBox.scrollIntoView({ behavior: 'smooth' });
            }
          });
        }
      });

      // 2. Deliverable approvals & revisions from client team auditLogs
      getVaTeamAuditLogs().forEach(log => {
        const notifId = `audit-${log.id}`;
        if (log.type === 'approval') {
          notifs.push({
            id: notifId,
            category: 'approval',
            type: 'approval',
            title: '✅ Deliverable Approved',
            desc: `${log.clientName || 'Client'}: ${log.stageName || 'Deliverable'} passed QA review.`,
            meta: log.clientName || '',
            timestamp: log.timestamp || Date.now(),
            isUrgent: false,
            isUnread: !readIds.has(notifId),
            action: () => {
              readIds.add(notifId);
              saveReadNotificationIds(readIds);
              closeNotificationsDropdown();
              switchView('va-portal');
            }
          });
        } else if (log.type === 'revision') {
          notifs.push({
            id: notifId,
            category: 'revision',
            type: 'revision',
            title: '↺ Revision Requested',
            desc: log.details || `${log.clientName || 'Client'}: Review feedback requires updates.`,
            meta: log.clientName || '',
            timestamp: log.timestamp || Date.now(),
            isUrgent: true,
            isUnread: !readIds.has(notifId),
            action: () => {
              readIds.add(notifId);
              saveReadNotificationIds(readIds);
              closeNotificationsDropdown();
              switchView('va-portal');
            }
          });
        }
      });
    } else {
      // ADMIN
      // 1. Pending Deliverables awaiting Admin QA review
      (clients || []).forEach(c => {
        (c.stages || []).forEach((stg, idx) => {
          if (stg.status === 'in_review') {
            const notifId = `pending-review-${c.id}-${idx}`;
            notifs.push({
              id: notifId,
              category: 'review',
              type: 'review_pending',
              title: '⏳ Deliverable Awaiting QA Review',
              desc: `${stg.vaName || 'Specialist'} submitted proof for ${c.name} (${stg.role || `Stage ${idx + 1}`})`,
              meta: c.name,
              timestamp: stg.submittedAt || c.updatedAt || Date.now(),
              isUrgent: false,
              isUnread: !readIds.has(notifId),
              action: () => {
                readIds.add(notifId);
                saveReadNotificationIds(readIds);
                closeNotificationsDropdown();
                switchView('reviews');
              }
            });
          }
        });
      });

      // 2. Recent team activity and submissions from auditLogs
      (auditLogs || []).slice(0, 15).forEach(log => {
        const notifId = `audit-${log.id}`;
        let title = 'Pipeline Activity';
        let isUrgent = false;
        let notifType = log.type || 'activity';

        if (log.type === 'submission') {
          title = '📋 Deliverable Submitted';
          notifType = 'submission';
        } else if (log.type === 'approval') {
          title = '✅ Stage Approved';
          notifType = 'approval';
        } else if (log.type === 'revision') {
          title = '↺ Revision Requested';
          notifType = 'revision';
        } else if (log.type === 'ping') {
          title = `🔔 Ping Sent to ${log.targetVa || 'VA'}`;
          notifType = 'ping';
          isUrgent = Boolean(log.meta && log.meta.isUrgent);
        } else if (log.type === 'client') {
          title = '🏢 Client Created';
          notifType = 'client';
        }

        notifs.push({
          id: notifId,
          category: log.type || 'activity',
          type: notifType,
          title: title,
          desc: log.summary || log.details || (log.clientName ? `Client: ${log.clientName}` : 'Activity update'),
          meta: log.clientName ? `${log.clientName}${log.stageName ? ` · ${log.stageName}` : ''}` : '',
          timestamp: log.timestamp || Date.now(),
          isUrgent: isUrgent,
          isUnread: !readIds.has(notifId),
          action: () => {
            readIds.add(notifId);
            saveReadNotificationIds(readIds);
            closeNotificationsDropdown();
            if (log.clientId) {
              jumpToClient(log.clientId);
            } else {
              switchView('history');
            }
          }
        });
      });
    }

    // Sort by timestamp descending
    notifs.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime() || 0;
      const timeB = new Date(b.timestamp).getTime() || 0;
      return timeB - timeA;
    });

    return notifs;
  }

  let activeRecentNotifications = [];

  function renderNotificationsDropdown() {
    if (!notificationsDropdownList) return;
    activeRecentNotifications = getRecentNotifications();
    const unreadCount = activeRecentNotifications.filter(n => n.isUnread).length;

    if (notificationsUnreadPill) {
      notificationsUnreadPill.textContent = `${unreadCount} new`;
      notificationsUnreadPill.style.display = unreadCount > 0 ? 'inline-block' : 'none';
    }

    if (activeRecentNotifications.length === 0) {
      notificationsDropdownList.innerHTML = `
        <div class="notifications-empty-state">
          <div class="notifications-empty-icon">🔔</div>
          <div class="notifications-empty-title">All caught up!</div>
          <div class="notifications-empty-subtitle">No notifications or recent activity right now.</div>
        </div>
      `;
      return;
    }

    notificationsDropdownList.innerHTML = activeRecentNotifications.map((item, idx) => {
      let iconClass = 'notif-icon-circle';
      let iconChar = '⚡';

      if (item.type === 'urgent_ping') {
        iconClass += ' notif-icon-urgent';
        iconChar = '🚨';
      } else if (item.type === 'ping') {
        iconClass += ' notif-icon-ping';
        iconChar = '🔔';
      } else if (item.type === 'review_pending') {
        iconClass += ' notif-icon-review';
        iconChar = '⏳';
      } else if (item.type === 'approval') {
        iconClass += ' notif-icon-approval';
        iconChar = '✅';
      } else if (item.type === 'revision') {
        iconClass += ' notif-icon-revision';
        iconChar = '↺';
      } else if (item.type === 'submission') {
        iconClass += ' notif-icon-submission';
        iconChar = '📋';
      } else if (item.type === 'client') {
        iconClass += ' notif-icon-submission';
        iconChar = '🏢';
      }

      return `
        <div class="notification-item ${item.isUnread ? 'is-unread' : ''}" data-notif-idx="${idx}">
          <div class="notification-icon-wrap">
            <span class="${iconClass}">${iconChar}</span>
          </div>
          <div class="notification-item-body">
            <div class="notif-title-row">
              <span class="notif-title">${escapeHtml(item.title)}</span>
              <span class="notif-time">${formatNotificationTime(item.timestamp)}</span>
            </div>
            <div class="notif-desc">${escapeHtml(item.desc)}</div>
            ${item.meta ? `<div class="notif-meta">${escapeHtml(item.meta)}</div>` : ''}
          </div>
          ${item.isUnread ? '<span class="notif-unread-dot" title="Unread"></span>' : ''}
        </div>
      `;
    }).join('');

    // Attach click events to notification items
    const renderedItems = notificationsDropdownList.querySelectorAll('.notification-item');
    renderedItems.forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.getAttribute('data-notif-idx'), 10);
        const notif = activeRecentNotifications[idx];
        if (notif && typeof notif.action === 'function') {
          notif.action();
        }
      });
    });
  }

  function toggleNotificationsDropdown() {
    if (!notificationsDropdownPopover) return;
    closeUserDropdown();
    const willOpen = !notificationsDropdownPopover.classList.contains('active');
    if (willOpen) {
      renderNotificationsDropdown();
      notificationsDropdownPopover.classList.add('active');
      if (btnTopbarPings) btnTopbarPings.setAttribute('aria-expanded', 'true');
    } else {
      closeNotificationsDropdown();
    }
  }

  function closeNotificationsDropdown() {
    if (!notificationsDropdownPopover) return;
    notificationsDropdownPopover.classList.remove('active');
    if (btnTopbarPings) btnTopbarPings.setAttribute('aria-expanded', 'false');
  }

  function markAllNotificationsRead() {
    const notifs = getRecentNotifications();
    const readIds = getReadNotificationIds();
    notifs.forEach(n => {
      readIds.add(n.id);
      if (n.category === 'ping' && n.rawId) {
        acknowledgePing(n.rawId);
      }
    });
    saveReadNotificationIds(readIds);
    updatePingBadge();
    renderNotificationsDropdown();
    showToast('All notifications marked as read', 'info');
  }

  function updatePingBadge() {
    if (!topbarPingBadge) return;
    const notifs = getRecentNotifications();
    const unreadCount = notifs.filter(n => n.isUnread).length;

    topbarPingBadge.textContent = String(unreadCount);
    topbarPingBadge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
    if (unreadCount > 0) {
      topbarPingBadge.classList.add('has-new-ping');
    } else {
      topbarPingBadge.classList.remove('has-new-ping');
    }

    if (notificationsUnreadPill) {
      notificationsUnreadPill.textContent = `${unreadCount} new`;
      notificationsUnreadPill.style.display = unreadCount > 0 ? 'inline-block' : 'none';
    }
  }

  function populateHistoryFilters() {
    if (!historyFilterClientSelect || !historyFilterVaSelect) return;

    // Filter available clients based on role
    const availableClients = currentRole === 'va' ? getVaAssignedClients(currentVaUser) : clients;

    // Clients
    const currentClientVal = historyFilterClientSelect.value || 'all';
    historyFilterClientSelect.innerHTML = '<option value="all">All Clients</option>';
    const clientNames = Array.from(new Set(availableClients.map(c => c.name))).filter(Boolean).sort();
    clientNames.forEach(cName => {
      const opt = document.createElement('option');
      opt.value = cName;
      opt.textContent = cName;
      historyFilterClientSelect.appendChild(opt);
    });
    historyFilterClientSelect.value = clientNames.includes(currentClientVal) ? currentClientVal : 'all';

    // VAs (Teammates on these client pipelines)
    const currentVaVal = historyFilterVaSelect.value || 'all';
    historyFilterVaSelect.innerHTML = '<option value="all">All VAs</option>';
    const vaSet = new Set();
    
    availableClients.forEach(c => {
      if (c.stages) {
        c.stages.forEach(s => {
          if (s.vaName && s.vaName.trim()) vaSet.add(s.vaName.trim());
        });
      }
    });

    if (currentRole === 'admin') {
      if (users && users.length > 0) {
        users
          .filter(u => u.role === 'va')
          .forEach(u => {
            const name = (u.full_name || u.fullName || u.name || '').trim();
            if (name) vaSet.add(name);
          });
      }
    }

    const availableVas = Array.from(vaSet).sort();
    availableVas.forEach(va => {
      const opt = document.createElement('option');
      opt.value = va;
      opt.textContent = va;
      historyFilterVaSelect.appendChild(opt);
    });
    historyFilterVaSelect.value = availableVas.includes(currentVaVal) ? currentVaVal : 'all';
  }

  function renderHistoryTab() {
    if (!historyTimelineStream) return;

    let filtered = currentRole === 'va' ? [...getVaTeamAuditLogs()] : [...auditLogs];

    // Filter by search query
    if (historySearchQuery.trim()) {
      const q = historySearchQuery.trim().toLowerCase();
      filtered = filtered.filter(item => {
        const titleMatch = (item.title || '').toLowerCase().includes(q);
        const summaryMatch = (item.summary || '').toLowerCase().includes(q);
        const detailsMatch = (item.details || '').toLowerCase().includes(q);
        const clientMatch = (item.clientName || '').toLowerCase().includes(q);
        const stageMatch = (item.stageName || '').toLowerCase().includes(q);
        const actorMatch = (item.actor && item.actor.name ? item.actor.name : '').toLowerCase().includes(q);
        const targetMatch = (item.targetVa || '').toLowerCase().includes(q);
        const fileMatch = (item.meta && item.meta.fileName ? item.meta.fileName : '').toLowerCase().includes(q);
        return titleMatch || summaryMatch || detailsMatch || clientMatch || stageMatch || actorMatch || targetMatch || fileMatch;
      });
    }

    // Filter by action type
    if (historyFilterType !== 'all') {
      filtered = filtered.filter(item => item.type === historyFilterType);
    }

    // Filter by client
    if (historyFilterClient !== 'all') {
      filtered = filtered.filter(item => item.clientName === historyFilterClient);
    }

    // Filter by VA Specialist
    if (historyFilterVa !== 'all') {
      filtered = filtered.filter(item => {
        return (item.targetVa && item.targetVa === historyFilterVa) ||
               (item.actor && item.actor.name === historyFilterVa);
      });
    }

    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / historyPageSize) || 1;
    if (historyCurrentPage > totalPages) historyCurrentPage = totalPages;
    if (historyCurrentPage < 1) historyCurrentPage = 1;

    if (totalCount === 0) {
      historyTimelineStream.innerHTML = '';
      if (historyEmptyState) {
        historyEmptyState.style.display = 'flex';
        const h3 = historyEmptyState.querySelector('h3');
        const p = historyEmptyState.querySelector('p');
        const teamLogs = currentRole === 'va' ? getVaTeamAuditLogs() : auditLogs;
        if (teamLogs.length === 0) {
          if (h3) h3.textContent = currentRole === 'va' ? 'No client team activity recorded yet' : 'No audit trail events recorded yet';
          if (p) p.textContent = currentRole === 'va'
            ? 'Workflow handoffs, deliverables, reviews, and pings for your assigned client teams will appear here.'
            : 'Pipeline activity, deliverable submissions, admin reviews, and VA pings will appear here as work progresses.';
        } else {
          if (h3) h3.textContent = 'No audit trail events match your filters';
          if (p) p.textContent = 'Try clearing your search terms or filter selections to view your client team history.';
        }
      }
      if (historyPaginationFooter) historyPaginationFooter.style.display = 'none';
      return;
    }

    if (historyEmptyState) historyEmptyState.style.display = 'none';
    if (historyPaginationFooter) historyPaginationFooter.style.display = 'flex';

    const startIdx = (historyCurrentPage - 1) * historyPageSize;
    const endIdx = Math.min(startIdx + historyPageSize, totalCount);
    const pageItems = filtered.slice(startIdx, endIdx);

    // Update pagination counters
    if (historyPageStartIdx) historyPageStartIdx.textContent = startIdx + 1;
    if (historyPageEndIdx) historyPageEndIdx.textContent = endIdx;
    if (historyTotalCount) historyTotalCount.textContent = totalCount;

    // Group by Date Category (Today, Yesterday, Earlier)
    const groups = {};
    pageItems.forEach(item => {
      const cat = item.dateCategory || 'Today';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });

    const categoryOrder = ['Today', 'Yesterday', 'Earlier'];
    let html = '';

    categoryOrder.forEach(cat => {
      const items = groups[cat];
      if (!items || items.length === 0) return;

      html += `
        <div class="audit-date-group">
          <div class="audit-date-divider">
            <span class="audit-date-title">📅 ${cat}</span>
            <span class="audit-date-count">${items.length} ${items.length === 1 ? 'event' : 'events'}</span>
          </div>
          <div class="audit-group-cards">
            ${items.map(event => renderAuditCard(event)).join('')}
          </div>
        </div>
      `;
    });

    historyTimelineStream.innerHTML = html;
    renderHistoryPaginationControls(totalPages);
  }

  function renderHistoryPaginationControls(totalPages) {
    if (!btnHistoryPagePrev || !btnHistoryPageNext || !historyPaginationPagesContainer) return;

    btnHistoryPagePrev.disabled = historyCurrentPage <= 1;
    btnHistoryPageNext.disabled = historyCurrentPage >= totalPages;

    let pagesHtml = '';
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pagesHtml += `
          <button type="button" class="page-num-btn ${i === historyCurrentPage ? 'active' : ''}" 
                  onclick="window.vaApp.goToHistoryPage(${i})" aria-label="Page ${i}">
            ${i}
          </button>
        `;
      }
    } else {
      const pageNumbers = [];
      pageNumbers.push(1);
      const left = Math.max(2, historyCurrentPage - 1);
      const right = Math.min(totalPages - 1, historyCurrentPage + 1);

      if (left > 2) pageNumbers.push('...');
      for (let i = left; i <= right; i++) {
        pageNumbers.push(i);
      }
      if (right < totalPages - 1) pageNumbers.push('...');
      pageNumbers.push(totalPages);

      pageNumbers.forEach(p => {
        if (p === '...') {
          pagesHtml += `<span class="page-ellipsis" style="padding: 0 4px; color: var(--text-muted); font-size: 12px; display: inline-flex; align-items: center; justify-content: center; min-width: 20px;">...</span>`;
        } else {
          pagesHtml += `
            <button type="button" class="page-num-btn ${p === historyCurrentPage ? 'active' : ''}" 
                    onclick="window.vaApp.goToHistoryPage(${p})" aria-label="Page ${p}">
              ${p}
            </button>
          `;
        }
      });
    }
    historyPaginationPagesContainer.innerHTML = pagesHtml;
  }

  function renderAuditCard(event) {
    const actorName = event.actor ? event.actor.name : 'System';
    const actorRole = event.actor ? event.actor.role : 'Pipeline';
    const actorAvatar = event.actor && event.actor.avatar ? event.actor.avatar : getInitials(actorName);
    const meta = event.meta || {};

    let detailsHtml = '';
    if (event.details) {
      if (event.type === 'ping') {
        detailsHtml = `
          <div class="audit-ping-quote-box">
            <div class="audit-quote-label">🔔 Ping Notification Message:</div>
            <div class="audit-quote-content">${escapeHtml(event.details)}</div>
          </div>
        `;
      } else if (event.type === 'revision') {
        detailsHtml = `
          <div class="audit-quote-box" style="border-left-color: var(--amber);">
            <div class="audit-quote-label" style="color: var(--amber-dark);">↺ Revision Instructions Issued by Admin:</div>
            <div class="audit-quote-content">${escapeHtml(event.details)}</div>
          </div>
        `;
      } else {
        detailsHtml = `
          <div class="audit-quote-box">
            <div class="audit-quote-label">📋 Report Notes:</div>
            <div class="audit-quote-content">${escapeHtml(event.details)}</div>
          </div>
        `;
      }
    }

    let attachmentHtml = '';
    if (meta.fileName || meta.fileUrl || meta.link) {
      attachmentHtml = `
        <div class="audit-file-preview-row">
          ${meta.fileUrl ? `
            <div class="audit-thumb-wrap" onclick="window.vaApp.openLightboxUrl('${meta.fileUrl}')" title="Click to inspect picture proof">
              <img src="${meta.fileUrl}" class="audit-thumb-img" alt="Deliverable proof">
            </div>
          ` : `
            <div class="audit-thumb-wrap" style="display:flex; align-items:center; justify-content:center; background:#f8fafc;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            </div>
          `}
          <div class="audit-file-meta">
            <span class="audit-file-name">📎 ${escapeHtml(meta.fileName || 'Attached Deliverable File')}</span>
            ${meta.link ? `<a href="${escapeHtml(meta.link)}" target="_blank" class="audit-link-btn">Open Link ↗</a>` : ''}
          </div>
        </div>
      `;
    }

    return `
      <div class="audit-card audit-type-${event.type}">
        <div class="audit-card-node">
          <div class="audit-node-icon icon-${event.type}">
            ${getEventIconSvg(event.type)}
          </div>
        </div>
        <div class="audit-card-body">
          <div class="audit-card-header">
            <div class="audit-actor-info">
              <span class="audit-avatar">${escapeHtml(actorAvatar)}</span>
              <span class="audit-actor-name">${escapeHtml(actorName)}</span>
              <span class="audit-actor-role">${escapeHtml(actorRole)}</span>
            </div>
            <div class="audit-header-right">
              <span class="audit-badge audit-badge-${event.type}">${getEventBadgeLabel(event.type)}</span>
              <span class="audit-timestamp">${escapeHtml(event.timeFormatted || 'Recently')}</span>
            </div>
          </div>

          <div class="audit-title-row">
            <h4 class="audit-event-title">${escapeHtml(event.title)}</h4>
            <div class="audit-tags-row">
              ${event.clientName ? `<span class="badge-tag audit-tag-client">🏢 ${escapeHtml(event.clientName)}</span>` : ''}
              ${event.stageName ? `<span class="badge-tag audit-tag-stage">⚡ ${escapeHtml(event.stageName)}</span>` : ''}
              ${meta.isUrgent ? `<span class="badge-tag audit-tag-urgent">🚨 URGENT</span>` : ''}
            </div>
          </div>

          <div class="audit-summary-text">${escapeHtml(event.summary)}</div>

          ${detailsHtml}
          ${attachmentHtml}
        </div>
      </div>
    `;
  }

  function getEventIconSvg(type) {
    if (type === 'submission') {
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="16 16 12 12 8 16"></polyline><line x1="12" y1="12" x2="12" y2="21"></line><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path></svg>`;
    } else if (type === 'approval') {
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'revision') {
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>`;
    } else if (type === 'ping') {
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`;
    } else {
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;
    }
  }

  function getEventBadgeLabel(type) {
    if (type === 'submission') return 'Deliverable Submitted 📤';
    if (type === 'approval') return 'Approved ✓';
    if (type === 'revision') return 'Revision Requested ↺';
    if (type === 'ping') return 'VA Ping 🔔';
    return 'Pipeline Lifecycle ⚙️';
  }

  function exportHistoryJson() {
    const toExport = currentRole === 'va' ? getVaTeamAuditLogs() : auditLogs;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(toExport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    const filename = currentRole === 'va'
      ? `va_trackos_team_activity_${new Date().toISOString().slice(0, 10)}.json`
      : `va_trackos_audit_trail_${new Date().toISOString().slice(0, 10)}.json`;
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(currentRole === 'va' ? 'Exported client team activity JSON!' : 'Exported audit trail history JSON!', 'success');
  }

  function openLightboxUrl(url) {
    if (!url || !imageLightboxModal || !lightboxImg) return;
    lightboxImg.src = url;
    imageLightboxModal.style.display = 'flex';
  }

  // --- DIRECT PING VA MODAL & WORKSTATION ACTIONS ---
  let activePingMode = 'active'; // 'active' | 'next'
  let pingStagesByMode = { active: null, next: null };

  function openPingModal(clientId) {
    if (currentRole !== 'admin') {
      showToast('Permission denied: Only Admins can ping VAs.', 'warning');
      return;
    }

    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    if (!client.stages || client.stages.length === 0) {
      showToast('No Virtual Assistants are assigned to this client yet.', 'warning');
      return;
    }

    const stages = client.stages;
    let activeIdx = stages.findIndex(s => s.status === 'active' || s.status === 'in_review' || s.status === 'revision');
    if (activeIdx === -1) {
      activeIdx = 0;
    }
    const activeStage = stages[activeIdx];
    const nextStage = (activeIdx < stages.length - 1) ? stages[activeIdx + 1] : null;

    const myAdminName = (currentUser ? (currentUser.fullName || currentUser.name) : '').toLowerCase().trim();
    if (activeStage && activeStage.vaName && myAdminName && activeStage.vaName.toLowerCase().trim() === myAdminName) {
      showToast('Administrators cannot ping themselves. Pings are for Virtual Assistants.', 'warning');
      return;
    }

    activePingClient = client;
    pingStagesByMode = {
      active: activeStage,
      next: nextStage
    };

    const btnNext = document.getElementById('btn-ping-mode-next');
    if (btnNext) {
      if (!nextStage) {
        btnNext.disabled = true;
        btnNext.title = 'No upcoming VA in queue (Final stage of pipeline)';
        btnNext.style.opacity = '0.45';
        btnNext.style.cursor = 'not-allowed';
      } else {
        btnNext.disabled = false;
        btnNext.title = `Ping next VA in queue: ${nextStage.vaName} (${nextStage.role})`;
        btnNext.style.opacity = '1';
        btnNext.style.cursor = 'pointer';
      }
    }

    setPingMode('active');

    if (pingIsUrgent) {
      pingIsUrgent.checked = false;
    }

    if (pingVaModal) {
      pingVaModal.style.display = 'flex';
    }
    if (pingCustomMessage) {
      setTimeout(() => pingCustomMessage.focus(), 100);
    }
  }

  function setPingMode(mode) {
    activePingMode = mode;
    const stage = pingStagesByMode[mode] || pingStagesByMode.active;
    if (!stage || !activePingClient) return;

    activePingStage = stage;

    const btnActive = document.getElementById('btn-ping-mode-active');
    const btnNext = document.getElementById('btn-ping-mode-next');
    if (btnActive) btnActive.classList.toggle('active', mode === 'active');
    if (btnNext) btnNext.classList.toggle('active', mode === 'next');

    const modeInput = document.getElementById('ping-mode-value');
    if (modeInput) modeInput.value = mode;

    if (pingClientId) pingClientId.value = activePingClient.id;
    if (pingVaName) pingVaName.value = stage.vaName;
    if (pingStageId) pingStageId.value = stage.id;

    if (pingVaAvatar) pingVaAvatar.textContent = getInitials(stage.vaName);
    if (pingTargetVaName) pingTargetVaName.textContent = stage.vaName;
    if (pingTargetClientName) pingTargetClientName.textContent = activePingClient.name;
    if (pingTargetStageName) pingTargetStageName.textContent = stage.role || 'VA Specialist';

    const deadlineWrap = document.getElementById('ping-target-deadline-wrap');
    const deadlineVal = document.getElementById('ping-target-deadline-val');
    if (deadlineWrap && deadlineVal) {
      if (stage.deadline) {
        deadlineVal.textContent = stage.deadline;
        deadlineWrap.style.display = 'inline';
      } else {
        deadlineWrap.style.display = 'none';
      }
    }

    const modeBadge = document.getElementById('ping-target-mode-badge');
    if (modeBadge) {
      if (mode === 'next') {
        modeBadge.textContent = 'Next VA in Queue (Upcoming Task)';
        modeBadge.className = 'badge-tag';
        modeBadge.style.color = 'var(--accent)';
        modeBadge.style.borderColor = 'var(--accent-border)';
      } else {
        modeBadge.textContent = 'Active VA in Task';
        modeBadge.className = 'badge-tag badge-tier-growth';
        modeBadge.style.color = '';
        modeBadge.style.borderColor = '';
      }
    }

    renderPingPresets(mode, stage);
  }

  function renderPingPresets(mode, stage) {
    const grid = document.getElementById('ping-presets-grid');
    if (!grid) return;

    let presets = [];
    if (mode === 'next') {
      presets = [
        { label: '🚀 Handoff Heads-Up', msg: `Heads-up! You are next in queue for "${stage.role}". Please prepare for task handoff.` },
        { label: '📅 Kickoff Notice', msg: `Upcoming task kickoff notice: Previous stage is nearing completion for "${activePingClient.name}".` },
        { label: '📂 Asset Readiness', msg: `Resource check: Confirm you have access to client guidelines & creative assets for "${stage.role}".` },
        { label: '⏱ Schedule Alignment', msg: `Schedule alignment: Expected task start soon. Please confirm readiness to take over.` }
      ];
    } else {
      presets = [
        { label: '⚡ Friendly Check-in', msg: 'Friendly status check-in! How is the current task progressing?' },
        { label: '⏳ Deadline Reminder', msg: `Target deadline reminder${stage.deadline ? ' (' + stage.deadline + ')' : ''}. Please submit your deliverable proof soon!` },
        { label: '📋 Review Queue Update', msg: 'New feedback provided. Please check the Review Queue for instructions on latest deliverable.' },
        { label: '🔥 High Priority Nudge', msg: 'Priority task nudge: Client requested immediate status update on this deliverable.' }
      ];
    }

    grid.innerHTML = presets.map((p, idx) => `
      <button type="button" class="ping-preset-pill ${idx === 0 ? 'active' : ''}" data-msg="${escapeHtml(p.msg)}">
        ${p.label}
      </button>
    `).join('');

    if (pingCustomMessage && presets[0]) {
      pingCustomMessage.value = presets[0].msg;
    }

    grid.querySelectorAll('.ping-preset-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        grid.querySelectorAll('.ping-preset-pill').forEach(pl => pl.classList.remove('active'));
        pill.classList.add('active');
        if (pingCustomMessage) {
          pingCustomMessage.value = pill.getAttribute('data-msg') || '';
        }
      });
    });
  }

  function closePingModal() {
    if (pingVaModal) pingVaModal.style.display = 'none';
    activePingClient = null;
    activePingStage = null;
  }

  // ==========================================
  // REAL-TIME AUDIO SYNTHESIZER & REAL-TIME BUS
  // ==========================================
  const tabSessionId = 'tab_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
  let audioContext = null;
  const realtimePingChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('va_trackos_realtime_pings') : null;
  let activeIncomingPingId = null;
  let titleFlashInterval = null;
  const originalDocTitle = document.title || 'Huddle TrackOS – Executive Workspace';
  let lastHandledPingId = null;
  let knownPingIds = new Set();
  let pendingUnheardPing = null;
  let audioUnlocked = false;

  // Pre-synthesized PCM WAV Audio Data URIs for maximum browser compatibility (including background tabs)
  function generatePcmWavDataUri(isUrgent) {
    try {
      const sampleRate = 22050;
      const duration = isUrgent ? 0.9 : 0.8;
      const numSamples = Math.floor(sampleRate * duration);
      const buffer = new ArrayBuffer(44 + numSamples * 2);
      const view = new DataView(buffer);

      view.setUint32(0, 0x52494646, false); // 'RIFF'
      view.setUint32(4, 36 + numSamples * 2, true);
      view.setUint32(8, 0x57415645, false); // 'WAVE'
      view.setUint32(12, 0x666d7420, false); // 'fmt '
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM format
      view.setUint16(22, 1, true); // 1 channel (mono)
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      view.setUint32(36, 0x64617461, false); // 'data'
      view.setUint32(40, numSamples * 2, true);

      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        let s = 0;
        if (isUrgent) {
          if (t < 0.25) s += Math.sin(2 * Math.PI * 784 * t) * Math.exp(-t * 8) * 0.45;
          if (t >= 0.08 && t < 0.35) s += Math.sin(2 * Math.PI * 1046.5 * (t - 0.08)) * Math.exp(-(t - 0.08) * 7) * 0.55;
          if (t >= 0.16 && t < 0.5) s += Math.sin(2 * Math.PI * 1318.5 * (t - 0.16)) * Math.exp(-(t - 0.16) * 6) * 0.65;
          if (t >= 0.24) s += Math.sin(2 * Math.PI * 1568 * (t - 0.24)) * Math.exp(-(t - 0.24) * 4.5) * 0.75;
        } else {
          if (t < 0.5) {
            const d1 = Math.exp(-t * 8.5);
            s += Math.sin(2 * Math.PI * 880 * t) * d1 * 0.45;
            s += Math.sin(2 * Math.PI * 1760 * t) * d1 * 0.15;
          }
          if (t >= 0.1) {
            const d2 = Math.exp(-(t - 0.1) * 5.5);
            s += Math.sin(2 * Math.PI * 1318.5 * (t - 0.1)) * d2 * 0.65;
            s += Math.sin(2 * Math.PI * 2637 * (t - 0.1)) * d2 * 0.2;
          }
        }
        const val = Math.max(-1, Math.min(1, s));
        view.setInt16(44 + i * 2, val < 0 ? val * 0x8000 : val * 0x7FFF, true);
      }

      const bytes = new Uint8Array(buffer);
      let binary = '';
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return 'data:audio/wav;base64,' + btoa(binary);
    } catch (err) {
      console.warn('WAV synthesis error:', err);
      return '';
    }
  }

  let standardPingWavUri = '';
  let urgentPingWavUri = '';
  let standardAudioElem = null;
  let urgentAudioElem = null;

  function initAudioElements() {
    try {
      if (!standardPingWavUri) standardPingWavUri = generatePcmWavDataUri(false);
      if (!urgentPingWavUri) urgentPingWavUri = generatePcmWavDataUri(true);

      if (!standardAudioElem && standardPingWavUri) {
        standardAudioElem = new Audio(standardPingWavUri);
        standardAudioElem.volume = 1.0;
        standardAudioElem.preload = 'auto';
      }
      if (!urgentAudioElem && urgentPingWavUri) {
        urgentAudioElem = new Audio(urgentPingWavUri);
        urgentAudioElem.volume = 1.0;
        urgentAudioElem.preload = 'auto';
      }
    } catch (e) {
      console.warn('Audio element setup warning:', e);
    }
  }

  function getAudioContext() {
    try {
      if (!audioContext) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          audioContext = new AudioCtx();
        }
      }
      return audioContext;
    } catch (e) {
      console.warn('AudioContext unavailable:', e);
      return null;
    }
  }

  /**
   * Permanently unlock Web Audio & HTML5 Audio in Google Chrome on user gesture.
   * Plays a 1-sample silent Web Audio buffer and primes HTML5 audio elements.
   */
  function ensureAudioUnlocked() {
    if (currentRole === 'admin' || (currentUser && currentUser.role === 'admin')) {
      return; // Strictly no audio unlocking on Admin side
    }
    if (audioUnlocked) return;
    try {
      const ctx = getAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        // Play 1-sample silent buffer to unlock AudioContext permanently in Chrome
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      }

      initAudioElements();

      // Prime HTML5 Audio elements ONLY for VA workstation
      if (currentRole === 'va') {
        if (standardAudioElem) {
          standardAudioElem.play().then(() => {
            standardAudioElem.pause();
            standardAudioElem.currentTime = 0;
          }).catch(() => {});
        }
        if (urgentAudioElem) {
          urgentAudioElem.play().then(() => {
            urgentAudioElem.pause();
            urgentAudioElem.currentTime = 0;
          }).catch(() => {});
        }
      }

      audioUnlocked = true;
      console.log('🔊 [VA TrackOS] Audio pipeline permanently unlocked for tab:', tabSessionId);
    } catch (e) {
      console.warn('Audio unlock warning:', e);
    }
  }

  function unlockAudioOnUserGesture() {
    ['click', 'pointerdown', 'keydown', 'touchstart'].forEach(evt => {
      document.addEventListener(evt, () => {
        if (currentRole === 'va') {
          ensureAudioUnlocked();
        }
      }, { passive: true });
    });
  }

  /**
   * Dual-Pipeline Audio Chime:
   * 1. Direct HTML5 Audio playback (resilient in background tabs)
   * 2. Web Audio API synthesized multi-harmonic crystal bell with GainNode master
   */
  async function playVaNotificationPingSound(isUrgent = false) {
    // Strictly mute ping sound on Admin side
    if (currentRole === 'admin' || (currentUser && currentUser.role === 'admin')) {
      console.log('🔇 [VA TrackOS] Admin role active: Ping sound is strictly muted on Admin side.');
      return;
    }

    console.log('🔊 [VA TrackOS] Triggering VA ping sound alert. Urgent:', isUrgent);

    // If tab is in background/not focused, remember to replay immediately upon focus!
    if (document.hidden || !document.hasFocus()) {
      pendingUnheardPing = { isUrgent: Boolean(isUrgent), timestamp: Date.now() };
    }

    // Pipeline 1: Native HTML5 Audio
    try {
      initAudioElements();
      const audio = isUrgent ? urgentAudioElem : standardAudioElem;
      if (audio) {
        audio.currentTime = 0;
        audio.volume = 1.0;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn('[VA TrackOS] HTML5 Audio autoplay policy prevented immediate sound:', err.message);
            pendingUnheardPing = { isUrgent: Boolean(isUrgent), timestamp: Date.now() };
          });
        }
      }
    } catch (e) {
      console.warn('[VA TrackOS] Audio element error:', e);
    }

    // Pipeline 2: Web Audio API Oscillator synthesis
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContext) {
        audioContext = new AudioCtx();
      }

      if (audioContext.state === 'suspended') {
        try {
          await audioContext.resume();
        } catch (e) {
          console.warn('[VA TrackOS] AudioContext suspended and resume blocked:', e.message);
          pendingUnheardPing = { isUrgent: Boolean(isUrgent), timestamp: Date.now() };
          return;
        }
      }

      const ctx = audioContext;
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.9, now);
      masterGain.connect(ctx.destination);

      if (isUrgent) {
        // High-Priority Urgent Chime: Vibrant ascending 4-note chord alert
        const notes = [
          { freq: 784, time: now, duration: 0.22, vol: 0.5 },            // G5
          { freq: 1046.5, time: now + 0.09, duration: 0.24, vol: 0.6 },  // C6
          { freq: 1318.5, time: now + 0.18, duration: 0.28, vol: 0.7 },  // E6
          { freq: 1568, time: now + 0.27, duration: 0.65, vol: 0.8 }     // G6
        ];

        notes.forEach(n => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(n.freq, n.time);
          osc.frequency.exponentialRampToValueAtTime(n.freq * 1.01, n.time + n.duration);

          gain.gain.setValueAtTime(0.001, n.time);
          gain.gain.linearRampToValueAtTime(n.vol, n.time + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, n.time + n.duration);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(n.time);
          osc.stop(n.time + n.duration);
        });
      } else {
        // Standard Crystal Notification Chime (Slack / Apple Style Harmonic Bell)
        // Note 1: A5 (880 Hz) -> Note 2: E6 (1318.5 Hz)
        const notes = [
          { freq: 880, time: now, duration: 0.32, vol: 0.65, type: 'sine' },
          { freq: 1760, time: now, duration: 0.25, vol: 0.25, type: 'triangle' },
          { freq: 1318.5, time: now + 0.12, duration: 0.65, vol: 0.75, type: 'sine' },
          { freq: 2637, time: now + 0.12, duration: 0.4, vol: 0.3, type: 'triangle' }
        ];

        notes.forEach(n => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = n.type;
          osc.frequency.setValueAtTime(n.freq, n.time);

          gain.gain.setValueAtTime(0.001, n.time);
          gain.gain.linearRampToValueAtTime(n.vol, n.time + 0.018);
          gain.gain.exponentialRampToValueAtTime(0.0001, n.time + n.duration);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(n.time);
          osc.stop(n.time + n.duration);
        });
      }
    } catch (err) {
      console.warn('[VA TrackOS] Audio play error:', err);
    }
  }

  function playAdminPingSentSound() {
    // Admin is the sender and should NEVER hear ping sounds or notification chimes!
    return;
  }

  function previewPingSound() {
    if (currentRole === 'admin' || (currentUser && currentUser.role === 'admin')) {
      console.log('🔇 [VA TrackOS] Admin role active: Ping sound is strictly disabled on Admin side.');
      return;
    }
    ensureAudioUnlocked();
    const isUrgent = pingIsUrgent ? pingIsUrgent.checked : false;
    playVaNotificationPingSound(isUrgent);
    showToast(`🔊 Playing ${isUrgent ? 'Urgent Alert 🚨' : 'Crystal Bell 🔔'} Ping Chime`, 'info');
  }

  function startTitleNotification(text) {
    stopTitleNotification();
    let toggle = false;
    titleFlashInterval = setInterval(() => {
      document.title = toggle ? text : originalDocTitle;
      toggle = !toggle;
    }, 1000);
  }

  function stopTitleNotification() {
    if (titleFlashInterval) {
      clearInterval(titleFlashInterval);
      titleFlashInterval = null;
    }
    document.title = originalDocTitle;
  }

  function showIncomingPingOverlay(ping) {
    if (!ping) return;
    activeIncomingPingId = ping.id;
    const overlay = document.getElementById('incoming-ping-overlay');
    const card = document.getElementById('incoming-ping-card');
    const senderElem = document.getElementById('incoming-ping-sender-name');
    const pillElem = document.getElementById('incoming-ping-type-pill');
    const timeElem = document.getElementById('incoming-ping-timestamp');
    const clientElem = document.getElementById('incoming-ping-client-name');
    const stageElem = document.getElementById('incoming-ping-stage-name');
    const msgElem = document.getElementById('incoming-ping-message-text');

    if (senderElem) senderElem.textContent = ping.sender || 'Admin';
    if (pillElem) {
      pillElem.textContent = ping.isUrgent ? '🚨 URGENT PING' : 'PRIORITY PING';
    }
    if (card) {
      if (ping.isUrgent) {
        card.classList.add('is-urgent-card');
      } else {
        card.classList.remove('is-urgent-card');
      }
    }
    if (timeElem) timeElem.textContent = ping.timeFormatted || 'Just now';
    if (clientElem) clientElem.textContent = ping.clientName || 'General Client';
    if (stageElem) stageElem.textContent = ping.stageName ? `• ${ping.stageName}` : (ping.targetVa ? `• To: ${ping.targetVa}` : '');
    if (msgElem) msgElem.textContent = `"${ping.message}"`;

    if (overlay) {
      overlay.style.display = 'block';
    }

    if (topbarPingBadge) {
      topbarPingBadge.classList.add('has-new-ping');
    }

    startTitleNotification(`🔔 (1) Ping from ${ping.sender || 'Admin'}!`);
  }

  function dismissIncomingPing() {
    const overlay = document.getElementById('incoming-ping-overlay');
    if (overlay) overlay.style.display = 'none';
    stopTitleNotification();
  }

  async function ackIncomingPingFromCard() {
    if (!activeIncomingPingId) {
      dismissIncomingPing();
      return;
    }
    await acknowledgePing(activeIncomingPingId);
    dismissIncomingPing();
    if (topbarPingBadge) {
      topbarPingBadge.classList.remove('has-new-ping');
    }
  }

  function broadcastPingEvent(pingPayload) {
    if (!pingPayload) return;

    if (realtimePingChannel) {
      try {
        realtimePingChannel.postMessage({ type: 'NEW_PING', payload: pingPayload });
      } catch (err) {
        console.warn('BroadcastChannel error:', err);
      }
    }

    try {
      localStorage.setItem('va_trackos_last_ping_event', JSON.stringify({
        ...pingPayload,
        _nonce: Date.now()
      }));
    } catch (e) {}
  }

  function handleIncomingPingEvent(ping) {
    if (!ping) return;

    // RULE 1: Admin is the sender/overseer and should NEVER receive pings, never hear ping sounds,
    // and never receive ping overlays or notification badges!
    if (currentRole === 'admin') {
      return;
    }

    // RULE 2: Do NOT ring or display overlay in the tab or user that sent the ping
    if (ping.senderTabId && ping.senderTabId === tabSessionId) {
      return;
    }
    if (currentUser && ping.sender) {
      const mySenderName = (currentUser.fullName || currentUser.name || '').toLowerCase().trim();
      const pingSender = (ping.sender || '').toLowerCase().trim();
      if (mySenderName && pingSender && mySenderName === pingSender) {
        return;
      }
    }

    // RULE 3: Deduplicate identical ping IDs
    if (ping.id && ping.id === lastHandledPingId) return;
    lastHandledPingId = ping.id;

    console.log('🔔 [VA TrackOS] Incoming ping received for VA workstation:', ping, 'currentVaUser=' + currentVaUser);

    // RULE 4: For VA workstations, check if this VA is the recipient
    const myName = (currentVaUser || (currentUser ? currentUser.name : '') || '').toLowerCase().trim();
    const targetName = (ping.targetVa || '').toLowerCase().trim();

    if (targetName && myName && targetName !== myName && !myName.includes(targetName) && !targetName.includes(myName)) {
      // Intended for a different Virtual Assistant
      return;
    }

    // This is the assigned VA workstation: trigger crystal bell chime and visual overlay
    playVaNotificationPingSound(Boolean(ping.isUrgent));
    showIncomingPingOverlay(ping);
    updatePingBadge();
    if (topbarPingBadge) {
      topbarPingBadge.classList.add('has-new-ping');
    }
    renderVaPings();
  }

  function triggerPendingPingCheckForVa() {
    if (currentRole !== 'va') return;
    const latestUnread = pings.find(p => p.status === 'unread');
    if (latestUnread) {
      handleIncomingPingEvent(latestUnread);
    }
  }

  function setupRealtimePingBus() {
    initAudioElements();
    unlockAudioOnUserGesture();

    // Replay pending unheard pings immediately when this tab is clicked or focused (VA side only)
    window.addEventListener('focus', () => {
      if (currentRole !== 'va') {
        pendingUnheardPing = null;
        return;
      }
      ensureAudioUnlocked();
      if (pendingUnheardPing) {
        const p = pendingUnheardPing;
        pendingUnheardPing = null;
        console.log('🔊 [VA TrackOS] VA tab focused! Replaying pending unheard ping sound now.');
        playVaNotificationPingSound(Boolean(p.isUrgent));
        showToast('🔔 Incoming ping chime received from Admin!', 'info');
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (currentRole !== 'va') {
          pendingUnheardPing = null;
          return;
        }
        ensureAudioUnlocked();
        if (pendingUnheardPing) {
          const p = pendingUnheardPing;
          pendingUnheardPing = null;
          console.log('🔊 [VA TrackOS] VA tab became visible! Replaying pending unheard ping sound now.');
          playVaNotificationPingSound(Boolean(p.isUrgent));
          showToast('🔔 Incoming ping chime received from Admin!', 'info');
        }
      }
    });

    if (realtimePingChannel) {
      realtimePingChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'NEW_PING') {
          handleIncomingPingEvent(event.data.payload);
        }
      };
    }

    window.addEventListener('storage', (event) => {
      if (event.key === 'va_trackos_last_ping_event' && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          handleIncomingPingEvent(data);
        } catch (e) {}
      }
    });

    // Background polling for server pings (every 3.5s - VA side only)
    setInterval(checkIncomingPingsForVa, 3500);
  }

  async function checkIncomingPingsForVa() {
    if (currentRole !== 'va') return;
    try {
      const res = await apiFetch('/pings');
      if (res && res.data && Array.isArray(res.data)) {
        const myUnread = res.data.filter(p => (p.status === 'unread' || p.status === 'sent'));

        for (const p of myUnread) {
          const pId = String(p.id);
          if (!knownPingIds.has(pId)) {
            knownPingIds.add(pId);
            handleIncomingPingEvent({
              id: p.id,
              clientName: p.clientName,
              stageName: p.stageName,
              targetVa: p.targetVaName || p.targetVa,
              sender: p.senderName || 'Admin',
              message: p.message,
              isUrgent: Boolean(p.isUrgent),
              timeFormatted: 'Just now'
            });
            break;
          }
        }
      }
    } catch (e) {}
  }

  async function handleSendPing(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!activePingClient || !activePingStage) return;

    const message = pingCustomMessage ? pingCustomMessage.value.trim() : '';
    if (!message) {
      showToast('Please type a notification message for the VA', 'warning');
      return;
    }

    const targetVaName = activePingStage.vaName || 'VA Specialist';

    // Prevent Admin from pinging an administrator account
    const myAdminName = (currentUser ? (currentUser.fullName || currentUser.name) : '').toLowerCase().trim();
    if (targetVaName && myAdminName && targetVaName.toLowerCase().trim() === myAdminName) {
      showToast('Administrators cannot ping themselves. Pings are for Virtual Assistants.', 'warning');
      return;
    }

    // Capture all metadata BEFORE closePingModal clears activePingClient and activePingStage!
    const clientName = activePingClient.name || 'Client';
    const clientId = activePingClient.id;
    const stageId = activePingStage.id;
    const stageRole = activePingStage.role || 'Deliverable Task';
    const isUrgent = pingIsUrgent ? pingIsUrgent.checked : false;
    const mode = activePingMode || 'active';
    const now = new Date();
    const timeFormatted = `Today at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    let pingRecord = null;

    try {
      const res = await apiFetch('/pings', {
        method: 'POST',
        body: {
          clientId,
          stageId,
          targetVaName,
          message,
          isUrgent,
          mode
        }
      });
      pingRecord = (res && res.data) ? res.data : null;
      // Admin side: SILENT dispatch, no chime sound on admin!
      showToast(`Ping dispatched to ${targetVaName}! (Alert delivered to VA workstation 🔔)`, 'success');
      closePingModal();
      await refreshAllServerData();
    } catch (err) {
      console.warn('API ping send failed, using local update:', err.message);
    }

    if (!pingRecord) {
      pingRecord = {
        id: `png-${Date.now()}`,
        clientId: clientId,
        clientName: clientName,
        stageId: stageId,
        stageName: stageRole,
        sender: currentUser ? (currentUser.fullName || currentUser.name) : 'Admin',
        targetVa: targetVaName,
        message: message,
        isUrgent: isUrgent,
        mode: mode,
        timestamp: now.toISOString(),
        timeFormatted: timeFormatted,
        status: 'unread'
      };
      pings.unshift(pingRecord);
      savePingsToStorage();
      updatePingBadge();
      // Admin side: SILENT dispatch, no chime sound on admin!
      closePingModal();
      showToast(`Ping dispatched to ${targetVaName}! (Alert delivered to VA workstation 🔔)`, 'success');
    }

    // Broadcast real-time event across tabs & windows with senderTabId so VA side immediately hears and sees the ping
    const broadcastPayload = {
      id: pingRecord.id || `png-${Date.now()}`,
      clientName: clientName,
      stageName: stageRole,
      targetVa: targetVaName,
      sender: currentUser ? (currentUser.fullName || currentUser.name) : 'Admin',
      message: message,
      isUrgent: isUrgent,
      timeFormatted: timeFormatted,
      timestamp: Date.now(),
      senderTabId: tabSessionId
    };

    broadcastPingEvent(broadcastPayload);
  }

  // --- ADMIN REGISTER NEW TEAM MEMBER ---
  function openRegisterUserModal() {
    if (currentRole !== 'admin') {
      showToast('Permission denied: Only Admins can register new users.', 'warning');
      return;
    }
    const modal = document.getElementById('register-user-modal');
    const form = document.getElementById('admin-register-user-form');
    if (form) form.reset();
    const cardVa = document.getElementById('card-role-va');
    const cardAdmin = document.getElementById('card-role-admin');
    if (cardVa && cardAdmin) {
      cardVa.classList.add('is-selected');
      cardAdmin.classList.remove('is-selected');
      const radio = cardVa.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    }
    if (modal) modal.style.display = 'flex';
    const nameInput = document.getElementById('admin-reg-name');
    if (nameInput) setTimeout(() => nameInput.focus(), 100);
  }

  function closeRegisterUserModal() {
    const modal = document.getElementById('register-user-modal');
    if (modal) modal.style.display = 'none';
  }

  async function handleAdminRegisterUser(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (currentRole !== 'admin') {
      showToast('Permission denied: Only Admins can register new users.', 'warning');
      return;
    }

    const nameInput = document.getElementById('admin-reg-name');
    const emailInput = document.getElementById('admin-reg-email');
    const passwordInput = document.getElementById('admin-reg-password');
    const confirmInput = document.getElementById('admin-reg-confirm');
    const roleRadio = document.querySelector('input[name="admin-reg-role"]:checked');

    const fullName = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
    const password = passwordInput ? passwordInput.value : '';
    const confirm = confirmInput ? confirmInput.value : '';
    const role = roleRadio ? roleRadio.value : 'va';

    if (!fullName || !email || !password) {
      showToast('Please fill out all required fields', 'warning');
      return;
    }

    if (password.length < 4) {
      showToast('Password must be at least 4 characters long', 'warning');
      return;
    }

    if (password !== confirm) {
      showToast('Passwords do not match. Please re-enter.', 'warning');
      return;
    }

    try {
      await apiFetch('/users', {
        method: 'POST',
        body: { fullName, email, password, role }
      });
      showToast(`Registered new user "${fullName}" (${role === 'admin' ? 'Administrator' : 'VA Specialist'})!`, 'success');
      closeRegisterUserModal();
      await refreshAllServerData();
      return;
    } catch (err) {
      console.warn('API user registration failed, using local update:', err.message);
      if (err.message && err.message.includes('already exists')) {
        showToast(`An account with email ${email} already exists`, 'warning');
        return;
      }
    }

    // LocalStorage fallback if server is offline
    const newUser = {
      id: `usr-${Date.now()}`,
      name: fullName,
      fullName: fullName,
      email: email,
      password: password,
      role: role
    };
    users.push(newUser);
    saveUsersToStorage();
    populateAllVaDropdowns();
    renderAll();
    closeRegisterUserModal();
    showToast(`Registered new user "${fullName}" (${role === 'admin' ? 'Administrator' : 'VA Specialist'})!`, 'success');
  }

  async function acknowledgePing(pingId) {
    try {
      await apiFetch(`/pings/${pingId}/read`, { method: 'PATCH' });
      showToast('Ping acknowledged! Receipt logged in history.', 'success');
      await refreshAllServerData();
      return;
    } catch (err) {
      console.warn('API acknowledge ping failed, using local update:', err.message);
    }

    const ping = pings.find(p => p.id === pingId);
    if (!ping) return;
    ping.status = 'acknowledged';
    savePingsToStorage();
    updatePingBadge();
    renderVaPings();
    showToast('Ping acknowledged! Receipt logged in history.', 'success');
  }

  function renderVaPings() {
    if (!vaRecentPingsBox) return;
    const myPings = pings.filter(p => p.targetVa === currentVaUser);

    if (myPings.length === 0) {
      vaRecentPingsBox.style.display = 'none';
      vaRecentPingsBox.innerHTML = '';
      return;
    }

    vaRecentPingsBox.style.display = 'block';
    vaRecentPingsBox.innerHTML = `
      <div class="va-pings-header">
        <div class="va-pings-title">
          <span class="ping-bell-pulse">🔔</span>
          <strong>Admin Pings & Priority Check-ins (${myPings.length})</strong>
        </div>
        <span class="badge-tag" style="background: #faf5ff; color: #7c3aed; font-weight: 600;">Direct Messages from Admin</span>
      </div>
      <div class="va-pings-list">
        ${myPings.map(p => `
          <div class="va-ping-item ${p.isUrgent ? 'is-urgent' : ''} ${p.status === 'acknowledged' ? 'is-ack' : ''}">
            <div class="va-ping-item-header">
              <div class="va-ping-sender">
                <span class="va-ping-sender-avatar">AM</span>
                <strong>${escapeHtml(p.sender || 'Admin')}</strong>
                <span class="badge-tag" style="font-size: 0.72rem;">🏢 ${escapeHtml(p.clientName)}</span>
                ${p.stageName ? `<span class="badge-tag" style="font-size: 0.72rem;">⚡ ${escapeHtml(p.stageName)}</span>` : ''}
                ${p.isUrgent ? `<span class="badge-tag" style="background:#fef2f2; color:#dc2626; font-size: 0.72rem; font-weight: 700;">🚨 URGENT</span>` : ''}
              </div>
              <span class="va-ping-time">${escapeHtml(p.timeFormatted)}</span>
            </div>
            <div class="va-ping-body">${escapeHtml(p.message)}</div>
            <div class="va-ping-actions">
              ${p.status === 'acknowledged' ? `
                <span class="badge-tag" style="color: var(--emerald); border-color: var(--emerald); font-weight:600;">✓ Acknowledged</span>
              ` : `
                <button type="button" class="btn-ack-ping" onclick="window.vaApp.acknowledgePing('${p.id}')">
                  Acknowledge & Confirm Receipt ✓
                </button>
              `}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // Auth Form Submissions (Sign In only; Registration handled inside Admin panel)
    if (authLoginForm) authLoginForm.addEventListener('submit', handleLoginSubmit);

    // Logout
    if (btnLogout) btnLogout.addEventListener('click', handleLogout);

    // Navigation Tabs
    navTabTracker.addEventListener('click', (e) => { e.preventDefault(); switchView('tracker'); });
    if (navTabCalendar) {
      navTabCalendar.addEventListener('click', (e) => { e.preventDefault(); switchView('calendar'); });
    }
    navTabReviews.addEventListener('click', (e) => { e.preventDefault(); switchView('reviews'); });
    navTabVaPortal.addEventListener('click', (e) => { e.preventDefault(); switchView('va-portal'); });
    if (navTabHistory) {
      navTabHistory.addEventListener('click', (e) => { e.preventDefault(); switchView('history'); });
    }
    if (btnTopbarPings) {
      btnTopbarPings.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleNotificationsDropdown();
      });
    }

    if (btnMarkAllNotificationsRead) {
      btnMarkAllNotificationsRead.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        markAllNotificationsRead();
      });
    }

    if (btnViewAllNotifications) {
      btnViewAllNotifications.addEventListener('click', (e) => {
        e.preventDefault();
        closeNotificationsDropdown();
        switchView('history');
      });
    }
    cardKpiReviews.addEventListener('click', () => {
      if (currentRole === 'admin') {
        switchView('reviews');
      } else {
        switchView('va-portal');
        showToast(`As a VA (${currentVaUser}), you cannot review others' work. View your assigned deliverables here.`, 'info');
      }
    });

    // Review Status Tabs
    btnFilterReviewPending.addEventListener('click', () => {
      reviewFilterMode = 'pending';
      setReviewTabActive(btnFilterReviewPending);
      reviewCurrentPage = 1;
      renderReviewQueue();
    });

    btnFilterReviewRevision.addEventListener('click', () => {
      reviewFilterMode = 'revision';
      setReviewTabActive(btnFilterReviewRevision);
      reviewCurrentPage = 1;
      renderReviewQueue();
    });

    btnFilterReviewApproved.addEventListener('click', () => {
      reviewFilterMode = 'approved';
      setReviewTabActive(btnFilterReviewApproved);
      reviewCurrentPage = 1;
      renderReviewQueue();
    });

    if (btnFilterReviewAll) {
      btnFilterReviewAll.addEventListener('click', () => {
        reviewFilterMode = 'all';
        setReviewTabActive(btnFilterReviewAll);
        reviewCurrentPage = 1;
        renderReviewQueue();
      });
    }

    function setReviewTabActive(activeBtn) {
      [btnFilterReviewPending, btnFilterReviewRevision, btnFilterReviewApproved, btnFilterReviewAll].forEach(b => {
        if (b) b.classList.remove('active');
      });
      activeBtn.classList.add('active');
    }

    // Review Controls: Search
    if (reviewSearchInput) {
      reviewSearchInput.addEventListener('input', (e) => {
        reviewSearchQuery = e.target.value;
        if (reviewSearchClearBtn) reviewSearchClearBtn.style.display = reviewSearchQuery ? 'block' : 'none';
        reviewCurrentPage = 1;
        renderReviewQueue();
      });
    }

    if (reviewSearchClearBtn) {
      reviewSearchClearBtn.addEventListener('click', () => {
        reviewSearchInput.value = '';
        reviewSearchQuery = '';
        reviewSearchClearBtn.style.display = 'none';
        reviewCurrentPage = 1;
        renderReviewQueue();
      });
    }

    // Review Controls: Filter by Progress
    if (reviewFilterProgressSelect) {
      reviewFilterProgressSelect.addEventListener('change', (e) => {
        reviewFilterProgress = e.target.value;
        reviewCurrentPage = 1;
        renderReviewQueue();
      });
    }

    // Review Controls: Filter by VA
    if (reviewFilterVaSelect) {
      reviewFilterVaSelect.addEventListener('change', (e) => {
        reviewFilterVa = e.target.value;
        reviewCurrentPage = 1;
        renderReviewQueue();
      });
    }

    // Review Controls: Sorting
    if (reviewSortSelect) {
      reviewSortSelect.addEventListener('change', (e) => {
        reviewSortBy = e.target.value;
        renderReviewQueue();
      });
    }

    // Review Controls: Page Size
    if (reviewPageSizeSelect) {
      reviewPageSizeSelect.addEventListener('change', (e) => {
        reviewPageSize = parseInt(e.target.value, 10);
        reviewCurrentPage = 1;
        renderReviewQueue();
      });
    }

    // Review Pagination Prev / Next
    if (btnReviewPagePrev) {
      btnReviewPagePrev.addEventListener('click', () => {
        if (reviewCurrentPage > 1) {
          reviewCurrentPage--;
          renderReviewQueue();
        }
      });
    }

    if (btnReviewPageNext) {
      btnReviewPageNext.addEventListener('click', () => {
        reviewCurrentPage++;
        renderReviewQueue();
      });
    }

    // Clear Review Filters Button
    if (btnClearReviewFilters) {
      btnClearReviewFilters.addEventListener('click', () => {
        reviewSearchQuery = '';
        if (reviewSearchInput) reviewSearchInput.value = '';
        if (reviewSearchClearBtn) reviewSearchClearBtn.style.display = 'none';
        reviewFilterProgress = 'all';
        if (reviewFilterProgressSelect) reviewFilterProgressSelect.value = 'all';
        reviewFilterVa = 'all';
        if (reviewFilterVaSelect) reviewFilterVaSelect.value = 'all';
        reviewFilterMode = 'pending';
        setReviewTabActive(btnFilterReviewPending);
        reviewCurrentPage = 1;
        renderReviewQueue();
      });
    }

    // VA Identity Switcher
    if (vaIdentitySelect) {
      vaIdentitySelect.addEventListener('change', (e) => {
        if (currentUser && currentUser.role === 'va') return; // Cannot switch away from authenticated VA account
        currentVaUser = e.target.value;
        if (currentView === 'tracker' && pageHeadingTitle) {
          pageHeadingTitle.textContent = getGreetingWithUserName();
        }
        updateVaPortalHeader();
        renderAll();
      });
    }

    // Main Table Search & Filter
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      searchClearBtn.style.display = searchQuery ? 'block' : 'none';
      currentPage = 1;
      renderTable();
    });

    searchClearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      searchClearBtn.style.display = 'none';
      currentPage = 1;
      renderTable();
    });

    if (filterServiceSelect) {
      filterServiceSelect.addEventListener('change', (e) => {
        filterService = e.target.value;
        currentPage = 1;
        renderTable();
      });
    }

    filterVaSelect.addEventListener('change', (e) => {
      filterVa = e.target.value;
      currentPage = 1;
      renderTable();
    });

    filterStatusSelect.addEventListener('change', (e) => {
      filterStatus = e.target.value;
      currentPage = 1;
      renderTable();
    });

    sortSelect.addEventListener('change', (e) => {
      sortBy = e.target.value;
      renderTable();
    });

    pageSizeSelect.addEventListener('change', (e) => {
      pageSize = parseInt(e.target.value, 10);
      currentPage = 1;
      renderTable();
    });

    btnClearFilters.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      searchClearBtn.style.display = 'none';
      filterService = 'all';
      if (filterServiceSelect) filterServiceSelect.value = 'all';
      filterVaSelect.value = 'all';
      filterVa = 'all';
      filterStatusSelect.value = 'all';
      filterStatus = 'all';
      currentPage = 1;
      renderTable();
    });

    // Calendar Navigation & Controls
    if (calBtnToday) {
      calBtnToday.addEventListener('click', () => {
        calCurrentDate = new Date();
        renderCalendar();
      });
    }

    if (calBtnPrev) {
      calBtnPrev.addEventListener('click', () => shiftCalendar(-1));
    }

    if (calBtnNext) {
      calBtnNext.addEventListener('click', () => shiftCalendar(1));
    }

    if (calViewMonth) {
      calViewMonth.addEventListener('click', () => {
        calCurrentMode = 'month';
        renderCalendar();
      });
    }

    if (calViewWeek) {
      calViewWeek.addEventListener('click', () => {
        calCurrentMode = 'week';
        renderCalendar();
      });
    }

    if (calViewAgenda) {
      calViewAgenda.addEventListener('click', () => {
        calCurrentMode = 'agenda';
        renderCalendar();
      });
    }

    if (calFilterService) {
      calFilterService.addEventListener('change', (e) => {
        calSelectedService = e.target.value;
        renderCalendar();
      });
    }

    if (calFilterVa) {
      calFilterVa.addEventListener('change', (e) => {
        calSelectedVa = e.target.value;
        renderCalendar();
      });
    }

    if (calBtnAddDeadline) {
      calBtnAddDeadline.addEventListener('click', () => {
        openAddModal();
        if (formClientDeadline && calCurrentDate) {
          const y = calCurrentDate.getFullYear();
          const m = String(calCurrentDate.getMonth() + 1).padStart(2, '0');
          const d = String(calCurrentDate.getDate()).padStart(2, '0');
          formClientDeadline.value = `${y}-${m}-${d}`;
        }
      });
    }

    // Legend items interactive filter
    document.querySelectorAll('.legend-color-item').forEach(item => {
      item.addEventListener('click', () => {
        const svc = item.getAttribute('data-service');
        if (calFilterService) {
          calFilterService.value = (calSelectedService === svc) ? 'all' : svc;
          calSelectedService = calFilterService.value;
          renderCalendar();
        }
      });
    });

    // Calendar Event Modal Handlers
    if (btnCloseEventModal) btnCloseEventModal.addEventListener('click', closeCalendarEventModal);
    if (btnCloseEventFooter) btnCloseEventFooter.addEventListener('click', closeCalendarEventModal);
    if (calendarEventModal) {
      calendarEventModal.addEventListener('click', (e) => {
        if (e.target === calendarEventModal) closeCalendarEventModal();
      });
    }

    if (btnCalJumpTracker) {
      btnCalJumpTracker.addEventListener('click', () => {
        if (activeCalendarClientId) jumpToClient(activeCalendarClientId);
      });
    }

    if (btnCalEditClient) {
      btnCalEditClient.addEventListener('click', () => {
        if (activeCalendarClientId) {
          const id = activeCalendarClientId;
          closeCalendarEventModal();
          editClient(id);
        }
      });
    }

    // Main Table Pagination
    btnPagePrev.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderTable();
      }
    });

    btnPageNext.addEventListener('click', () => {
      const filtered = getFilteredAndSortedClients();
      const totalPages = Math.ceil(filtered.length / pageSize) || 1;
      if (currentPage < totalPages) {
        currentPage++;
        renderTable();
      }
    });

    // Client Modal
    btnOpenAddModal.addEventListener('click', openAddModal);
    btnCloseModal.addEventListener('click', closeModal);
    btnCancelModal.addEventListener('click', closeModal);
    if (clientModal) {
      clientModal.addEventListener('click', (e) => {
        if (e.target === clientModal) closeModal();
      });
    }
    btnAddVaStage.addEventListener('click', () => {
      addStageRow();
    });
    clientForm.addEventListener('submit', handleSaveClient);
    if (formClientNotes) {
      formClientNotes.addEventListener('input', updateNotesCounter);
    }

    // VA File Upload Handling
    fileDropzone.addEventListener('click', (e) => {
      if (e.target !== btnRemoveFile) {
        submitFileInput.click();
      }
    });

    fileDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileDropzone.style.borderColor = 'var(--primary)';
    });

    fileDropzone.addEventListener('dragleave', () => {
      fileDropzone.style.borderColor = 'var(--border-medium)';
    });

    fileDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      fileDropzone.style.borderColor = 'var(--border-medium)';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelected(e.dataTransfer.files[0]);
      }
    });

    submitFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelected(e.target.files[0]);
      }
    });

    btnRemoveFile.addEventListener('click', (e) => {
      e.stopPropagation();
      currentUploadedFileData = null;
      submitFileInput.value = '';
      dropzonePrompt.style.display = 'flex';
      uploadPreviewBox.style.display = 'none';
    });

    // Submit Work Modal
    btnCloseSubmitModal.addEventListener('click', closeSubmitModal);
    btnCancelSubmitModal.addEventListener('click', closeSubmitModal);
    if (vaSubmitModal) {
      vaSubmitModal.addEventListener('click', (e) => {
        if (e.target === vaSubmitModal) closeSubmitModal();
      });
    }
    vaSubmitForm.addEventListener('submit', handleSendSubmission);

    // Review Modal Actions
    btnCloseReviewModal.addEventListener('click', closeReviewModal);
    btnCloseReviewModalBtn.addEventListener('click', closeReviewModal);
    if (adminReviewModal) {
      adminReviewModal.addEventListener('click', (e) => {
        if (e.target === adminReviewModal) closeReviewModal();
      });
    }

    btnTriggerRevisionMode.addEventListener('click', () => {
      revisionFeedbackBox.style.display = 'flex';
      revFeedbackInput.focus();
    });

    btnCancelRevisionMode.addEventListener('click', () => {
      revisionFeedbackBox.style.display = 'none';
    });

    btnConfirmSendRevision.addEventListener('click', sendRevisionRequest);

    btnAcceptDeliverable.addEventListener('click', () => {
      if (activeReviewClient && activeReviewStage) {
        acceptDeliverable(activeReviewClient.id, activeReviewStage.id);
      }
    });

    // Lightbox
    btnCloseLightbox.addEventListener('click', closeLightbox);
    imageLightboxModal.addEventListener('click', (e) => {
      if (e.target === imageLightboxModal) closeLightbox();
    });

    // Reset & Export
    if (btnEmptyAddClient) btnEmptyAddClient.addEventListener('click', openAddModal);
    btnQuickExport.addEventListener('click', () => {
      closeUserDropdown();
      exportData();
    });

    // History Tab Controls & Filter Handlers
    if (historySearchInput) {
      historySearchInput.addEventListener('input', (e) => {
        historySearchQuery = e.target.value;
        if (historySearchClear) historySearchClear.style.display = historySearchQuery ? 'block' : 'none';
        historyCurrentPage = 1;
        renderHistoryTab();
      });
    }

    if (historySearchClear) {
      historySearchClear.addEventListener('click', () => {
        historySearchInput.value = '';
        historySearchQuery = '';
        historySearchClear.style.display = 'none';
        historyCurrentPage = 1;
        renderHistoryTab();
      });
    }

    if (historyFilterTypeSelect) {
      historyFilterTypeSelect.addEventListener('change', (e) => {
        historyFilterType = e.target.value;
        historyCurrentPage = 1;
        renderHistoryTab();
      });
    }

    if (historyFilterClientSelect) {
      historyFilterClientSelect.addEventListener('change', (e) => {
        historyFilterClient = e.target.value;
        historyCurrentPage = 1;
        renderHistoryTab();
      });
    }

    if (historyFilterVaSelect) {
      historyFilterVaSelect.addEventListener('change', (e) => {
        historyFilterVa = e.target.value;
        historyCurrentPage = 1;
        renderHistoryTab();
      });
    }

    if (btnClearHistoryFilters) {
      btnClearHistoryFilters.addEventListener('click', () => {
        historySearchQuery = '';
        if (historySearchInput) historySearchInput.value = '';
        if (historySearchClear) historySearchClear.style.display = 'none';
        historyFilterType = 'all';
        if (historyFilterTypeSelect) historyFilterTypeSelect.value = 'all';
        historyFilterClient = 'all';
        if (historyFilterClientSelect) historyFilterClientSelect.value = 'all';
        historyFilterVa = 'all';
        if (historyFilterVaSelect) historyFilterVaSelect.value = 'all';
        historyCurrentPage = 1;
        renderHistoryTab();
      });
    }

    if (btnResetHistoryFiltersEmpty) {
      btnResetHistoryFiltersEmpty.addEventListener('click', () => {
        historySearchQuery = '';
        if (historySearchInput) historySearchInput.value = '';
        if (historySearchClear) historySearchClear.style.display = 'none';
        historyFilterType = 'all';
        if (historyFilterTypeSelect) historyFilterTypeSelect.value = 'all';
        historyFilterClient = 'all';
        if (historyFilterClientSelect) historyFilterClientSelect.value = 'all';
        historyFilterVa = 'all';
        if (historyFilterVaSelect) historyFilterVaSelect.value = 'all';
        historyCurrentPage = 1;
        renderHistoryTab();
      });
    }

    // History Pagination Handlers
    if (historyPageSizeSelect) {
      historyPageSizeSelect.addEventListener('change', (e) => {
        historyPageSize = parseInt(e.target.value, 10);
        historyCurrentPage = 1;
        renderHistoryTab();
      });
    }

    if (btnHistoryPagePrev) {
      btnHistoryPagePrev.addEventListener('click', () => {
        if (historyCurrentPage > 1) {
          historyCurrentPage--;
          renderHistoryTab();
        }
      });
    }

    if (btnHistoryPageNext) {
      btnHistoryPageNext.addEventListener('click', () => {
        historyCurrentPage++;
        renderHistoryTab();
      });
    }

    if (btnExportHistoryJson) {
      btnExportHistoryJson.addEventListener('click', exportHistoryJson);
    }

    // Ping Modal Actions
    if (btnClosePingModal) btnClosePingModal.addEventListener('click', closePingModal);
    if (btnCancelPingModal) btnCancelPingModal.addEventListener('click', closePingModal);
    if (pingVaModal) {
      pingVaModal.addEventListener('click', (e) => {
        if (e.target === pingVaModal) closePingModal();
      });
    }

    const btnPingActive = document.getElementById('btn-ping-mode-active');
    const btnPingNext = document.getElementById('btn-ping-mode-next');
    if (btnPingActive) btnPingActive.addEventListener('click', () => setPingMode('active'));
    if (btnPingNext) btnPingNext.addEventListener('click', () => setPingMode('next'));

    if (pingVaForm) {
      pingVaForm.addEventListener('submit', handleSendPing);
    }

    // Admin Register Team Member Modal
    const btnTopbarReg = document.getElementById('btn-topbar-register-user');
    const btnDropdownReg = document.getElementById('btn-dropdown-register-user');
    const modalReg = document.getElementById('register-user-modal');
    const btnCloseReg = document.getElementById('btn-close-register-modal');
    const btnCancelReg = document.getElementById('btn-cancel-register-modal');
    const formAdminReg = document.getElementById('admin-register-user-form');

    if (btnTopbarReg) btnTopbarReg.addEventListener('click', openRegisterUserModal);
    if (btnDropdownReg) btnDropdownReg.addEventListener('click', () => {
      closeUserDropdown();
      openRegisterUserModal();
    });
    if (btnCloseReg) btnCloseReg.addEventListener('click', closeRegisterUserModal);
    if (btnCancelReg) btnCancelReg.addEventListener('click', closeRegisterUserModal);
    if (modalReg) {
      modalReg.addEventListener('click', (e) => {
        if (e.target === modalReg) closeRegisterUserModal();
      });
    }
    if (formAdminReg) formAdminReg.addEventListener('submit', handleAdminRegisterUser);

    // Admin Register Role Cards Toggle
    const cardVa = document.getElementById('card-role-va');
    const cardAdmin = document.getElementById('card-role-admin');
    if (cardVa && cardAdmin) {
      cardVa.addEventListener('click', () => {
        cardVa.classList.add('is-selected');
        cardAdmin.classList.remove('is-selected');
        const radio = cardVa.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
      });
      cardAdmin.addEventListener('click', () => {
        cardAdmin.classList.add('is-selected');
        cardVa.classList.remove('is-selected');
        const radio = cardAdmin.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
      });
    }

    // Confirm Delete Destructive Modal Handlers
    if (btnCancelConfirmDelete) btnCancelConfirmDelete.addEventListener('click', closeConfirmDeleteModal);
    if (btnExecuteConfirmDelete) btnExecuteConfirmDelete.addEventListener('click', executeDeleteClient);
    if (confirmDeleteModal) {
      confirmDeleteModal.addEventListener('click', (e) => {
        if (e.target === confirmDeleteModal) closeConfirmDeleteModal();
      });
    }

    // Topbar User Avatar Popover Dropdown
    const btnUserAvatar = document.getElementById('btn-user-avatar');
    const userDropdownPopover = document.getElementById('user-dropdown-popover');
    const topbarSearchTrigger = document.getElementById('topbar-search-trigger');

    if (btnUserAvatar && userDropdownPopover) {
      btnUserAvatar.addEventListener('click', (e) => {
        e.stopPropagation();
        closeNotificationsDropdown();
        closeAllRowMenus();
        userDropdownPopover.classList.toggle('active');
        const isOpen = userDropdownPopover.classList.contains('active');
        btnUserAvatar.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    }

    if (topbarSearchTrigger && searchInput) {
      topbarSearchTrigger.addEventListener('click', () => {
        if (currentView !== 'tracker') {
          switchView('tracker');
        }
        searchInput.focus();
        searchInput.select();
      });
    }

    // Quick Command / Search Shortcut (⌘K or Ctrl+K)
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (currentView !== 'tracker') {
          switchView('tracker');
        }
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    });

    // Close floating popovers when clicking outside
    document.addEventListener('click', (e) => {
      if (userDropdownPopover && !e.target.closest('#user-menu-wrapper')) {
        closeUserDropdown();
      }
      if (notificationsDropdownPopover && !e.target.closest('#notifications-menu-wrapper')) {
        closeNotificationsDropdown();
      }
      if (!e.target.closest('.row-menu-container')) {
        closeAllRowMenus();
      }
    });

    // Escape Key - Close active modals and popovers
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeUserDropdown();
        closeNotificationsDropdown();
        closeAllRowMenus();
        closeModal();
        closeSubmitModal();
        closeReviewModal();
        closeLightbox();
        closePingModal();
        closeCalendarEventModal();
        closeConfirmDeleteModal();
      }
    });
  }

  // --- Popover and Dropdown Helpers ---
  function toggleRowMenu(event, clientId) {
    if (event) {
      event.stopPropagation();
    }
    const targetMenu = document.getElementById(`row-menu-${clientId}`);
    const isCurrentlyOpen = targetMenu && targetMenu.classList.contains('active');
    closeAllRowMenus();
    closeUserDropdown();
    if (targetMenu && !isCurrentlyOpen) {
      targetMenu.classList.add('active');
    }
  }

  function closeAllRowMenus() {
    document.querySelectorAll('.row-menu-popover.active').forEach(menu => {
      menu.classList.remove('active');
    });
  }

  function toggleUserDropdown(event) {
    if (event) event.stopPropagation();
    const userDropdownPopover = document.getElementById('user-dropdown-popover');
    const btnUserAvatar = document.getElementById('btn-user-avatar');
    if (userDropdownPopover) {
      closeAllRowMenus();
      userDropdownPopover.classList.toggle('active');
      const isOpen = userDropdownPopover.classList.contains('active');
      if (btnUserAvatar) btnUserAvatar.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }
  }

  function closeUserDropdown() {
    const userDropdownPopover = document.getElementById('user-dropdown-popover');
    const btnUserAvatar = document.getElementById('btn-user-avatar');
    if (userDropdownPopover) userDropdownPopover.classList.remove('active');
    if (btnUserAvatar) btnUserAvatar.setAttribute('aria-expanded', 'false');
  }

  // --- Utility Functions ---
  function getInitials(name) {
    if (!name) return 'VA';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function getProgressColorClass(percentage) {
    const val = Number(percentage);
    if (val >= 100) return 'fill-complete';
    if (val >= 70) return 'fill-high';
    if (val >= 40) return 'fill-mid';
    return 'fill-low';
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'warning') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // --- Public API for HTML Event Attributes ---
  window.vaApp = {
    goToPage: function (page) {
      currentPage = page;
      renderTable();
    },
    goToReviewPage: function (page) {
      reviewCurrentPage = page;
      renderReviewQueue();
    },
    goToHistoryPage: function (page) {
      historyCurrentPage = page;
      renderHistoryTab();
    },
    toggleRowMenu: toggleRowMenu,
    closeAllRowMenus: closeAllRowMenus,
    toggleUserDropdown: toggleUserDropdown,
    closeUserDropdown: closeUserDropdown,
    openAddModal: openAddModal,
    closeModal: closeModal,
    editClient: editClient,
    deleteClient: deleteClient,
    openConfirmDeleteModal: openConfirmDeleteModal,
    closeConfirmDeleteModal: closeConfirmDeleteModal,
    executeDeleteClient: executeDeleteClient,
    openSubmitWorkModal: openSubmitWorkModal,
    openReviewModal: openReviewModal,
    acceptDeliverable: acceptDeliverable,
    openLightboxByStage: openLightboxByStage,
    openLightboxUrl: openLightboxUrl,
    openPingModal: openPingModal,
    closePingModal: closePingModal,
    setPingMode: setPingMode,
    openRegisterUserModal: openRegisterUserModal,
    closeRegisterUserModal: closeRegisterUserModal,
    acknowledgePing: acknowledgePing,
    exportHistoryJson: exportHistoryJson,
    vaNodeNotice: vaNodeNotice,
    openCalendarEventModal: openCalendarEventModal,
    closeCalendarEventModal: closeCalendarEventModal,
    selectCalendarDate: selectCalendarDate,
    shiftCalendarMonth: shiftCalendarMonth,
    jumpToClient: jumpToClient,
    previewPingSound: previewPingSound,
    toggleNotificationsDropdown: toggleNotificationsDropdown,
    closeNotificationsDropdown: closeNotificationsDropdown,
    markAllNotificationsRead: markAllNotificationsRead,
    dismissIncomingPing: dismissIncomingPing,
    ackIncomingPingFromCard: ackIncomingPingFromCard,
    playVaNotificationPingSound: playVaNotificationPingSound,
    ensureAudioUnlocked: ensureAudioUnlocked,
    switchToVaWorkstation: function (targetVaName) {
      if (currentRole !== 'va') {
        showToast('Access Denied: Please sign in with a Virtual Assistant account.', 'warning');
        return;
      }
      if (targetVaName) {
        currentVaUser = targetVaName;
        updateVaPortalHeader();
      }
      ensureAudioUnlocked();
    },
    getGreetingWithUserName: getGreetingWithUserName,
    getUserGreeting: getUserGreeting,
    getUserDisplayName: getUserDisplayName,
    logout: handleLogout
  };

  // Launch on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
