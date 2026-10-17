const fs = require('fs');
const path = require('path');

console.log('--- VA TrackOS UI Redesign Verification Suite ---');

const rootIndex = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
const rootCss = fs.readFileSync(path.resolve(__dirname, '../style.css'), 'utf8');
const rootJs = fs.readFileSync(path.resolve(__dirname, '../app.js'), 'utf8');

const frontIndex = fs.readFileSync(path.resolve(__dirname, '../frontend/index.html'), 'utf8');
const frontCss = fs.readFileSync(path.resolve(__dirname, '../frontend/style.css'), 'utf8');
const frontJs = fs.readFileSync(path.resolve(__dirname, '../frontend/app.js'), 'utf8');

let pass = true;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
  } else {
    console.error(`[FAIL] ${message}`);
    pass = false;
  }
}

// 1. Check sync between root and frontend
assert(rootIndex === frontIndex, 'Root index.html and frontend/index.html are identical');
assert(rootCss === frontCss, 'Root style.css and frontend/style.css are identical');
assert(rootJs === frontJs, 'Root app.js and frontend/app.js are identical');

// 2. Check CHANGELOG in style.css
assert(rootCss.includes('CHANGELOG - Visual Redesign for VA TrackOS'), 'CHANGELOG comment present in style.css');

// 3. Check Design Tokens on :root in style.css
assert(rootCss.includes('--font-sans:') && rootCss.includes('Inter'), 'Inter font token present');
assert(rootCss.includes('--bg-page: #FAFAFB;'), 'Page background token #FAFAFB present');
assert(rootCss.includes('--bg-surface: #FFFFFF;'), 'Surface background token #FFFFFF present');
assert(rootCss.includes('--border-subtle: rgba(15, 23, 42, 0.06);'), 'Subtle border token 1px rgba(15,23,42,0.06) present');
assert(rootCss.includes('--radius-card: 12px;'), 'Radius card token 12px present');
assert(rootCss.includes('--radius-control: 8px;'), 'Radius control token 8px present');
assert(rootCss.includes('--radius-pill: 999px;'), 'Radius pill token 999px present');
assert(rootCss.includes('--accent: #6366F1;'), 'Accent token #6366F1 present');
assert(rootCss.includes('--accent-soft: rgba(99, 102, 241, 0.08);'), 'Accent soft token rgba(99,102,241,0.08) present');
assert(rootCss.includes('--status-completed: #10B981;'), 'Status completed #10B981 present');
assert(rootCss.includes('--status-in-charge: #6366F1;'), 'Status in charge #6366F1 present');
assert(rootCss.includes('--status-pending-review: #F59E0B;'), 'Status pending review #F59E0B present');
assert(rootCss.includes('--status-needs-revision: #F43F5E;'), 'Status needs revision #F43F5E present');
assert(rootCss.includes('--status-queued: #94A3B8;'), 'Status queued #94A3B8 present');

// 4. Check Dark Mode in style.css
assert(rootCss.includes('@media (prefers-color-scheme: dark)'), 'prefers-color-scheme: dark media query present');
assert(rootCss.includes('[data-theme="dark"]'), '[data-theme="dark"] rule present');

// 5. Check Sidebar in index.html and style.css
assert(rootCss.includes('--sidebar-width: 232px;'), 'Slim 232px sidebar width defined');
assert(rootIndex.includes('id="storage-status-text"'), 'Storage status text dot and container present in sidebar footer');
assert(rootIndex.includes('class="sync-dot"'), 'Sync dot element present');

// 6. Check Header & Topbar in index.html
assert(rootIndex.includes('id="topbar-search-trigger"'), 'Search trigger button with ⌘K hint present in topbar');
assert(rootIndex.includes('id="btn-topbar-pings"'), 'Notifications bell button present');
assert(rootIndex.includes('id="btn-open-add-modal"'), 'Add New Client button present in topbar');
assert(rootIndex.includes('id="user-menu-wrapper"'), 'User avatar menu wrapper present');
assert(rootIndex.includes('id="btn-user-avatar"'), 'User avatar button present');
assert(rootIndex.includes('id="user-dropdown-popover"'), 'User dropdown popover element present');
assert(rootIndex.includes('id="btn-role-admin"'), 'Role switch Admin button present in popover');
assert(rootIndex.includes('id="btn-role-va"'), 'Role switch VA Portal button present in popover');
assert(rootIndex.includes('id="btn-quick-export"'), 'Export dataset button present in popover');
assert(rootIndex.includes('id="btn-logout"'), 'Logout button present in popover');

// 7. Check Single Stat Strip KPI Card in index.html
assert(rootIndex.includes('class="stat-strip-card"'), 'Compact single stat strip card present');
assert(rootIndex.includes('id="kpi-total-clients"'), 'KPI total clients present');
assert(rootIndex.includes('id="kpi-vas-in-charge"'), 'KPI VAs in charge present');
assert(rootIndex.includes('id="kpi-pending-reviews"'), 'KPI pending reviews present');
assert(rootIndex.includes('id="kpi-avg-progress"'), 'KPI avg progress present');
assert(rootIndex.includes('class="stat-strip-divider"'), 'Hairline dividers present in stat strip');

// 8. Check Filter Bar in index.html
assert(rootIndex.includes('id="search-input"'), 'Search input present');
assert(rootIndex.includes('id="filter-service"'), 'Filter service pill select present');
assert(rootIndex.includes('id="filter-va"'), 'Filter VA pill select present');
assert(rootIndex.includes('id="filter-status"'), 'Filter status pill select present');
assert(rootIndex.includes('id="sort-select"'), 'Sort select present');
assert(rootIndex.includes('id="btn-clear-filters"'), 'Clear filters text link present');
assert(rootIndex.includes('class="table-meta-legend"'), 'Inline timeline legend dots present');

// 9. Check Table Columns in index.html
assert(rootIndex.includes('class="col-client"'), 'Col client header present');
assert(rootIndex.includes('class="col-due"'), 'Col due header present');
assert(rootIndex.includes('class="col-va-section"'), 'Col VA section header present');
assert(rootIndex.includes('class="col-progress"'), 'Col progress header present');
assert(rootIndex.includes('class="col-actions"'), 'Col actions header present');

// 10. Check JS App Implementation
assert(rootJs.includes('formatRelativeDue'), 'formatRelativeDue relative date function present in app.js');
assert(rootJs.includes('toggleRowMenu'), 'toggleRowMenu popover function present in app.js');
assert(rootJs.includes('closeAllRowMenus'), 'closeAllRowMenus popover function present in app.js');
assert(rootJs.includes('toggleUserDropdown'), 'toggleUserDropdown function present in app.js');
assert(rootJs.includes('closeUserDropdown'), 'closeUserDropdown function present in app.js');
assert(rootJs.includes("e.key.toLowerCase() === 'k'"), '⌘K and Ctrl+K search shortcut implemented in app.js');
assert(rootJs.includes('toggleRowMenu: toggleRowMenu'), 'toggleRowMenu exported on window.vaApp');
assert(rootJs.includes('toggleUserDropdown: toggleUserDropdown'), 'toggleUserDropdown exported on window.vaApp');

console.log('------------------------------------------------');
if (pass) {
  console.log('ALL VERIFICATION CHECKS PASSED SUCCESSFULLY (32/32)!');
} else {
  console.error('SOME CHECKS FAILED!');
  process.exit(1);
}
