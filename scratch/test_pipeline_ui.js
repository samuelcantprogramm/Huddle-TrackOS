const fs = require('fs');
const assert = require('assert');

console.log('Running verification for Pipeline Table Layout & Hover Deliverable Popover...');

const appJs = fs.readFileSync('app.js', 'utf8');
const frontendAppJs = fs.readFileSync('frontend/app.js', 'utf8');
const styleCss = fs.readFileSync('style.css', 'utf8');
const frontendStyleCss = fs.readFileSync('frontend/style.css', 'utf8');

// 1. Dual-file sync verification
assert.strictEqual(appJs, frontendAppJs, 'app.js and frontend/app.js must be identical');
assert.strictEqual(styleCss, frontendStyleCss, 'style.css and frontend/style.css must be identical');
console.log('✓ Dual-file sync: Root and frontend/ files are identical');

// 2. Deliverable removed from inline capsule
assert(appJs.includes('<span class="node-va-name">${escapeHtml(cleanName)}</span>'), 'VA name is rendered in capsule');
assert(!appJs.includes('<span class="node-va-role">'), 'Old inline node-va-role is removed from capsule');
console.log('✓ Inline deliverable text removed from default capsule display');

// 3. Hover popover present
assert(appJs.includes('node-deliverable-popover'), 'Hover popover container is present');
assert(appJs.includes('node-popover-tag'), 'Popover header tag is present');
assert(appJs.includes('node-popover-role'), 'Popover role is present');
assert(appJs.includes('node-popover-arrow'), 'Popover indicator arrow is present');
console.log('✓ Hover deliverable popover HTML structure is verified');

// 4. CSS styling
assert(styleCss.includes('.node-deliverable-popover {'), 'Popover CSS rule is defined');
assert(styleCss.includes('.pipeline-node:hover .node-deliverable-popover {'), 'Popover hover trigger is defined');
assert(styleCss.includes('.node-has-deliverable .node-va-name {'), 'Dotted underline hint for deliverable is defined');
assert(styleCss.includes('.pipeline-flow-rail {\n  display: flex;\n  align-items: center;\n  width: 100%;\n  min-width: 0;'), 'pipeline-flow-rail has min-width: 0 to prevent table overflow');
assert(styleCss.includes('@media (min-width: 1024px) {\n  .table-responsive {\n    overflow: visible;'), 'table-responsive has overflow: visible on desktop to eliminate horizontal scroll and prevent popover clipping');
console.log('✓ CSS layout and responsiveness rules verified');

console.log('\nAll verification checks passed successfully!');
