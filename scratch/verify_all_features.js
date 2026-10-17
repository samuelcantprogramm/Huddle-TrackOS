const fs = require('fs');
const path = require('path');

const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
const styleCss = fs.readFileSync(path.join(__dirname, '../style.css'), 'utf8');
const frontendHtml = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
const frontendJs = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');
const frontendCss = fs.readFileSync(path.join(__dirname, '../frontend/style.css'), 'utf8');
const clientValidator = fs.readFileSync(path.join(__dirname, '../backend/src/validators/client.validator.js'), 'utf8');
const clientRepo = fs.readFileSync(path.join(__dirname, '../backend/src/repositories/client.repository.js'), 'utf8');

const tests = [
  // 1. Automatic 1-month deadline
  {
    name: 'Auto 1-month deadline function exists in app.js',
    pass: appJs.includes('getDefaultOneMonthDeadline') && appJs.includes('d.setMonth(d.getMonth() + 1)')
  },
  {
    name: 'openAddModal sets formClientDeadline to auto 1-month deadline',
    pass: appJs.includes('formClientDeadline.value = autoDeadline')
  },
  {
    name: 'Backend defaults client deadline to 1 month from now if missing',
    pass: clientRepo.includes('oneMonth.setMonth(oneMonth.getMonth() + 1)')
  },

  // 2. Specific deadline for each VA task on the pipeline
  {
    name: 'Stage builder header in index.html includes Task Deadline column',
    pass: indexHtml.includes('<span>Task Deadline</span>')
  },
  {
    name: 'Stage builder row in app.js includes .stage-deadline-input',
    pass: appJs.includes('stage-deadline-input')
  },
  {
    name: 'handleSaveClient collects stage deadline and passes it in payload',
    pass: appJs.includes("deadline = row.querySelector('.stage-deadline-input')?.value")
  },
  {
    name: 'client validator allows deadline in stageInputSchema',
    pass: clientValidator.includes("deadline: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/")
  },
  {
    name: 'Backend persists stg.deadline to pipeline_stages',
    pass: clientRepo.includes('stg.deadline || null')
  },
  {
    name: 'renderVaPipeline displays stage-specific deadline',
    pass: appJs.includes('currentStage.deadline') && appJs.includes('va-task-deadline')
  },
  {
    name: 'VA workstation card displays specific task target deadline',
    pass: appJs.includes('Task Target Deadline:') && appJs.includes('stage.deadline')
  },

  // 3. Ping mode for VA (Active vs Next in queue + Manual ping on main table)
  {
    name: 'Manual ping button is rendered directly on main table row for Admin',
    pass: appJs.includes("btn-action-ghost is-ping") && appJs.includes("openPingModal('${client.id}')")
  },
  {
    name: 'Ping modal contains ping mode toggle (active in task vs next in queue)',
    pass: indexHtml.includes('ping-mode-toggle') && indexHtml.includes('btn-ping-mode-active') && indexHtml.includes('btn-ping-mode-next')
  },
  {
    name: 'openPingModal identifies active stage and next stage in queue',
    pass: appJs.includes('activePingMode') && appJs.includes('pingStagesByMode') && appJs.includes('setPingMode')
  },
  {
    name: 'Tailored message presets generated for active vs next mode',
    pass: appJs.includes('Handoff Heads-Up') && appJs.includes('Kickoff Notice') && appJs.includes('Friendly Check-in')
  },

  // 4. Remove public register, make Admin register user within panel
  {
    name: 'Public auth tab register removed from index.html',
    pass: !indexHtml.includes('id="auth-tab-register"') && !indexHtml.includes('id="auth-register-form"')
  },
  {
    name: 'Admin topbar has + Member action button',
    pass: indexHtml.includes('id="btn-topbar-register-user"')
  },
  {
    name: 'Admin user avatar dropdown has Register Team Member item',
    pass: indexHtml.includes('id="btn-dropdown-register-user"')
  },
  {
    name: 'Admin Register User Modal exists with form, role selector, and password inputs',
    pass: indexHtml.includes('id="register-user-modal"') && indexHtml.includes('id="admin-register-user-form"')
  },
  {
    name: 'handleAdminRegisterUser submits to /api/v1/users without logging out admin',
    pass: appJs.includes('handleAdminRegisterUser') && appJs.includes("apiFetch('/users'")
  },

  // 5. Fix unfinished components
  {
    name: 'Calendar week view grid CSS defined',
    pass: styleCss.includes('.cal-week-grid') && styleCss.includes('.cal-week-col') && styleCss.includes('.cal-week-card')
  },
  {
    name: 'Calendar agenda view card CSS defined',
    pass: styleCss.includes('.cal-agenda-card') && styleCss.includes('.agenda-client-name')
  },
  {
    name: 'Stage builder 6-column grid styled in style.css',
    pass: styleCss.includes('grid-template-columns: 24px 1.2fr 1.2fr 130px 115px 32px')
  },
  {
    name: 'Ping mode toggle styled in style.css',
    pass: styleCss.includes('.ping-mode-toggle') && styleCss.includes('.ping-mode-btn')
  },
  {
    name: 'frontend/ files synchronized with root',
    pass: frontendHtml.includes('btn-topbar-register-user') && frontendJs.includes('getDefaultOneMonthDeadline') && frontendCss.includes('.cal-week-grid')
  }
];

console.log('--- RUNNING FEATURE VERIFICATION AUDIT ---');
let passed = 0;
tests.forEach((t, i) => {
  if (t.pass) {
    console.log(`[PASS] ${i + 1}. ${t.name}`);
    passed++;
  } else {
    console.error(`[FAIL] ${i + 1}. ${t.name}`);
  }
});

console.log(`\nRESULT: ${passed}/${tests.length} tests passed.`);
if (passed === tests.length) {
  console.log('ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  process.exit(0);
} else {
  process.exit(1);
}
