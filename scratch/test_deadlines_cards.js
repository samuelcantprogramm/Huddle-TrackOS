const fs = require('fs');
const assert = require('assert');

console.log('Testing Upcoming Deadlines Card Structure & Styling...');

const appJs = fs.readFileSync('app.js', 'utf8');
const frontendAppJs = fs.readFileSync('frontend/app.js', 'utf8');
const styleCss = fs.readFileSync('style.css', 'utf8');
const frontendStyleCss = fs.readFileSync('frontend/style.css', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const frontendIndexHtml = fs.readFileSync('frontend/index.html', 'utf8');

// Verify files in sync
assert.strictEqual(appJs, frontendAppJs);
assert.strictEqual(styleCss, frontendStyleCss);
assert.strictEqual(indexHtml, frontendIndexHtml);
console.log('✓ Dual-file sync verified for app.js, style.css, and index.html');

// Verify upcoming deadlines card elements
assert(appJs.includes('deadline-feed-card'), 'deadline-feed-card class is used in template');
assert(appJs.includes('feed-card-header'), 'feed-card-header is present');
assert(appJs.includes('feed-client-name'), 'feed-client-name is present');
assert(appJs.includes('feed-countdown-pill'), 'feed-countdown-pill is present');
assert(appJs.includes('feed-service-chip'), 'feed-service-chip is present');
assert(appJs.includes('feed-card-footer'), 'feed-card-footer is present');
assert(appJs.includes('feed-progress-bar'), 'feed-progress-bar is present');
assert(appJs.includes('feed-active-va'), 'feed-active-va is present');
console.log('✓ Card template structure verified in app.js');

// Verify name sanitization
assert(appJs.includes(".replace(/\\s+\\d{10,}$/, '').trim()"), 'Client name is sanitized to remove epoch timestamp');
console.log('✓ Name sanitization verified');

// Verify CSS styling
assert(styleCss.includes('.deadline-feed-card {'), 'Card styling defined');
assert(styleCss.includes('.deadline-feed-card::before {'), 'Card urgency left stripe defined');
assert(styleCss.includes('.deadline-feed-card.is-urgent::before {'), 'Urgent stripe defined');
assert(styleCss.includes('.deadline-feed-card.is-overdue::before {'), 'Overdue stripe defined');
assert(styleCss.includes('.feed-countdown-pill.pill-normal {'), 'Countdown pills defined');
assert(styleCss.includes('.feed-service-chip {'), 'Service chip defined');
assert(styleCss.includes('.feed-card-footer {'), 'Card footer defined');
console.log('✓ CSS hierarchy and card styling verified');

console.log('\nAll Upcoming Deadlines Card tests passed with flying colors!');
