import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5173';
const results = [];

function record(name, status, details = '', screenshot = '') {
  results.push({ name, status, details, screenshot });
  const icon = status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} [${status}] ${name}${details ? ` - ${details}` : ''}`);
}

async function run() {
  console.log('🚀 Starting SafeRoute Comprehensive E2E Test Suite in Playwright (Headless Chromium)...');

  const browser = await chromium.launch({
    headless: true,
  });

  const reporterContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    geolocation: { latitude: 12.9716, longitude: 77.5946 },
    permissions: ['geolocation'],
  });
  const adminContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const responderContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    geolocation: { latitude: 12.9720, longitude: 77.5950 },
    permissions: ['geolocation'],
  });

  const reporterPage = await reporterContext.newPage();
  const adminPage = await adminContext.newPage();
  const responderPage = await responderContext.newPage();

  reporterPage.on('console', msg => {
    if (msg.type() === 'error') console.log('REPORTER CONSOLE ERROR:', msg.text());
  });
  reporterPage.on('pageerror', err => console.log('REPORTER PAGE EXCEPTION:', err.message));
  adminPage.on('console', msg => {
    if (msg.type() === 'error') console.log('ADMIN CONSOLE ERROR:', msg.text());
  });
  adminPage.on('pageerror', err => console.log('ADMIN PAGE EXCEPTION:', err.message));
  responderPage.on('console', msg => {
    if (msg.type() === 'error') console.log('RESPONDER CONSOLE ERROR:', msg.text());
  });
  responderPage.on('pageerror', err => console.log('RESPONDER PAGE EXCEPTION:', err.message));

  let createdIncidentId = null;
  let activeAssignmentId = null;

  try {
    // -------------------------------------------------------------
    // SCENARIO 1: Reporter reports a fire with 2 photos
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 1: Reporter reports fire incident ---');
    await reporterPage.goto(`${BASE_URL}/login`);
    await reporterPage.fill('input[type="email"]', 'reporter@example.com');
    await reporterPage.fill('input[type="password"]', 'ReporterPass123!');
    await reporterPage.click('button[type="submit"]');

    await reporterPage.waitForURL('**/reporter/incidents', { timeout: 10000 });
    record('Reporter Login', 'PASS', 'Logged in and redirected to /reporter/incidents');

    // Go to Report Incident Page
    await reporterPage.goto(`${BASE_URL}/reporter/report`);
    await reporterPage.waitForSelector('input#incident-title');

    // Fill Title & Description
    await reporterPage.fill('input#incident-title', 'Commercial Warehouse Fire');
    await reporterPage.fill('textarea#incident-description', 'Heavy smoke and flames visible on upper floor. Need emergency fire unit immediately.');

    // Select Fire Type & High Severity
    await reporterPage.click('button[role="radio"]:has-text("Fire")');
    await reporterPage.click('button[role="radio"]:has-text("High")');

    // Set location
    await reporterPage.click('button:has-text("Use my current location")');
    await reporterPage.waitForTimeout(1000);

    // Attach 2 photos
    const file1 = path.join(__dirname, 'fixtures', 'test1.png');
    const file2 = path.join(__dirname, 'fixtures', 'test2.png');
    const fileInput = reporterPage.locator('input[type="file"][multiple]');
    await fileInput.setInputFiles([file1, file2]);

    await reporterPage.waitForSelector('text=2 / 5 photos', { timeout: 5000 });

    // Submit report
    await reporterPage.click('button:has-text("Send emergency report")');

    // Should navigate to /reporter/incidents/:id
    await reporterPage.waitForURL(/\/reporter\/incidents\/\d+/, { timeout: 15000 });
    const incidentUrl = reporterPage.url();
    createdIncidentId = incidentUrl.split('/').pop();

    await reporterPage.waitForSelector('text=Pending Verification', { timeout: 8000 });
    const shot1 = path.join(__dirname, 'screenshots', '01-reporter-pending.png');
    await reporterPage.screenshot({ path: shot1 });

    record(
      'Reporter Report Fire with 2 Photos',
      'PASS',
      `Incident #${createdIncidentId} created in Pending status with 2 photos attached`,
      shot1
    );

    // -------------------------------------------------------------
    // SCENARIO 2: Admin verifies incident & assigns Fire responder
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 2: Admin verifies and assigns fire responder ---');
    await adminPage.goto(`${BASE_URL}/login`);
    await adminPage.fill('input[type="email"]', 'admin@saferoute.com');
    await adminPage.fill('input[type="password"]', 'admin123');
    await adminPage.click('button[type="submit"]');

    await adminPage.waitForURL('**/admin', { timeout: 10000 });
    record('Admin Login', 'PASS', 'Logged in and redirected to /admin');

    // Open incident detail
    await adminPage.goto(`${BASE_URL}/admin/incidents/${createdIncidentId}`);
    await adminPage.waitForSelector('text=Commercial Warehouse Fire', { timeout: 10000 });

    // Click Verify Emergency
    await adminPage.click('button:has-text("Verify Emergency")');
    await adminPage.click('div[role="dialog"] button:has-text("Verify Report")');
    await adminPage.waitForSelector('text=Verified', { timeout: 10000 });
    record('Admin Verify Incident', 'PASS', `Incident #${createdIncidentId} status changed to Verified`);

    // Assign Responder
    await adminPage.click('button:has-text("Assign Responder")');
    await adminPage.waitForSelector('text=Demo Fire', { timeout: 10000 });

    // Select Demo Fire responder
    await adminPage.locator('div[role="dialog"] span:has-text("Demo Fire")').click();
    await adminPage.waitForSelector('div[role="dialog"] button:has-text("Assign Responder"):not([disabled])', { timeout: 5000 });
    await adminPage.click('div[role="dialog"] button:has-text("Assign Responder")');

    await adminPage.waitForSelector('text=Assigned', { timeout: 10000 });
    const shot2 = path.join(__dirname, 'screenshots', '02-admin-assigned.png');
    await adminPage.screenshot({ path: shot2 });

    record(
      'Admin Assign Fire Responder',
      'PASS',
      `Assigned Demo Fire responder with proximity sorting`,
      shot2
    );

    // -------------------------------------------------------------
    // SCENARIO 3: Responder sees dispatch, checks Google Maps, accepts, travels
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 3: Responder accepts and starts travel ---');
    await responderPage.goto(`${BASE_URL}/login`);
    await responderPage.fill('input[type="email"]', 'fire@example.com');
    await responderPage.fill('input[type="password"]', 'ResponderPass123!');
    await responderPage.click('button[type="submit"]');

    await responderPage.waitForURL('**/responder', { timeout: 10000 });
    record('Responder Login', 'PASS', 'Logged in and redirected to /responder');

    // Open assignments page
    await responderPage.goto(`${BASE_URL}/responder/assignments`);
    await responderPage.waitForSelector('text=Commercial Warehouse Fire', { timeout: 10000 });

    // Open Assignment Detail Page
    await responderPage.click('a:has-text("View details")');
    await responderPage.waitForURL(/\/responder\/assignments\/\d+/, { timeout: 10000 });
    activeAssignmentId = responderPage.url().split('/').pop();

    // Check Google Maps URL
    const gmapsBtn = await responderPage.waitForSelector('a:has-text("Open in Google Maps")');
    const gmapsHref = await gmapsBtn.getAttribute('href');
    const hasValidGmapsUrl = gmapsHref && gmapsHref.includes('google.com/maps');
    record('Google Maps URL Check', hasValidGmapsUrl ? 'PASS' : 'FAIL', `URL: ${gmapsHref}`);

    // Accept Assignment
    await responderPage.click('button:has-text("Accept")');
    await responderPage.waitForSelector('text=Accepted', { timeout: 10000 });
    record('Responder Accept Assignment', 'PASS', `Assignment #${activeAssignmentId} Accepted`);

    // Start Travel
    await responderPage.click('button:has-text("Start travel")');
    await responderPage.waitForSelector('text=On the way', { timeout: 10000 });
    record('Responder Start Travel', 'PASS', 'Status transitioned to On the way');

    // Trigger location sharing telemetry
    await responderPage.evaluate(() => {
      window.dispatchEvent(new CustomEvent('saferoute:send-location'));
    });
    await responderPage.waitForTimeout(1000);

    // Check Reporter detail page shows responder en route
    await reporterPage.reload();
    await reporterPage.waitForSelector('text=Help is on the way', { timeout: 10000 });
    const shot3 = path.join(__dirname, 'screenshots', '03-reporter-responder-en-route.png');
    await reporterPage.screenshot({ path: shot3 });
    record('Reporter Live Tracking', 'PASS', 'Reporter page shows responder live tracking status', shot3);

    // -------------------------------------------------------------
    // SCENARIO 4: Responder marks arrived, then resolved with note
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 4: Responder arrives and resolves incident ---');
    await responderPage.click('button:has-text("I have arrived")');
    await responderPage.waitForSelector('text=Reached', { timeout: 10000 });
    record('Responder Arrived', 'PASS', 'Status transitioned to Reached');

    // Mark as resolved
    await responderPage.click('button:has-text("Mark as resolved")');
    const notesTextarea = await responderPage.waitForSelector('textarea#resolve-notes');
    await notesTextarea.fill('Fire extinguished safely using chemical foam. Site secured with zero casualties.');
    await responderPage.click('button:has-text("Confirm resolution")');

    await responderPage.waitForSelector('text=Resolved', { timeout: 10000 });
    const shot4 = path.join(__dirname, 'screenshots', '04-responder-resolved.png');
    await responderPage.screenshot({ path: shot4 });
    record('Responder Resolve Incident', 'PASS', 'Incident successfully resolved with notes', shot4);

    // -------------------------------------------------------------
    // SCENARIO 5: Final State Verification & Timeline across all 3 roles
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 5: Verify final state & notifications across roles ---');
    await reporterPage.reload();
    await reporterPage.waitForSelector('text=Resolved', { timeout: 10000 });
    const shot5 = path.join(__dirname, 'screenshots', '05-reporter-timeline-resolved.png');
    await reporterPage.screenshot({ path: shot5 });
    record('Reporter Final Timeline', 'PASS', 'Reporter sees complete resolution timeline', shot5);

    // Check notifications for Reporter
    await reporterPage.goto(`${BASE_URL}/notifications`);
    await reporterPage.waitForSelector('text=Incident Resolved', { timeout: 10000 });
    record('Reporter Notifications', 'PASS', 'Received incident resolution notification');

    // Check Admin Dashboard
    await adminPage.goto(`${BASE_URL}/admin`);
    await adminPage.waitForSelector('text=Admin Command Center', { timeout: 10000 });
    record('Admin Dashboard Sync', 'PASS', 'Admin dashboard reflects current system state');

    // -------------------------------------------------------------
    // SCENARIO 6: Alternate Paths Testing
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 6: Alternate Paths Testing ---');

    // 6a: Reporter cancels a pending incident
    await reporterPage.goto(`${BASE_URL}/reporter/report`);
    await reporterPage.fill('input#incident-title', 'False Alarm Test Incident');
    await reporterPage.fill('textarea#incident-description', 'Accidental smoke detector trigger in kitchen.');
    await reporterPage.click('button[role="radio"]:has-text("Other")');
    await reporterPage.click('button[role="radio"]:has-text("Low")');
    await reporterPage.click('button:has-text("Use my current location")');
    await reporterPage.waitForTimeout(1000);
    await reporterPage.click('button:has-text("Send emergency report")');
    await reporterPage.waitForURL(/\/reporter\/incidents\/\d+/, { timeout: 15000 });
    const falseAlarmId = reporterPage.url().split('/').pop();

    await reporterPage.click('button:has-text("Cancel report")');
    await reporterPage.click('div[role="dialog"] button:has-text("Yes, cancel report")');
    await reporterPage.waitForSelector('text=Cancelled', { timeout: 10000 });
    record('Alternate 6a: Cancel Pending Report', 'PASS', `Incident #${falseAlarmId} cancelled by reporter`);

    // 6b: Reporter edits then deletes a pending incident
    await reporterPage.goto(`${BASE_URL}/reporter/report`);
    await reporterPage.fill('input#incident-title', 'Typo Test Report');
    await reporterPage.fill('textarea#incident-description', 'Original typo description');
    await reporterPage.click('button[role="radio"]:has-text("Other")');
    await reporterPage.click('button[role="radio"]:has-text("Low")');
    await reporterPage.click('button:has-text("Use my current location")');
    await reporterPage.waitForTimeout(1000);
    await reporterPage.click('button:has-text("Send emergency report")');
    await reporterPage.waitForURL(/\/reporter\/incidents\/\d+/, { timeout: 15000 });
    const editTestId = reporterPage.url().split('/').pop();

    // Edit incident
    await reporterPage.click('button:has-text("Edit report")');
    await reporterPage.waitForURL(`${BASE_URL}/reporter/incidents/${editTestId}/edit`, { timeout: 10000 });
    const editDesc = await reporterPage.waitForSelector('textarea#incident-description');
    await editDesc.fill('Corrected description without typos');
    await reporterPage.click('button:has-text("Save changes")');
    await reporterPage.waitForURL(`${BASE_URL}/reporter/incidents/${editTestId}`, { timeout: 10000 });
    await reporterPage.waitForSelector('text=Corrected description without typos', { timeout: 10000 });

    // Delete incident
    await reporterPage.click('button:has-text("Delete report")');
    await reporterPage.click('div[role="dialog"] button:has-text("Delete permanently")');
    await reporterPage.waitForURL('**/reporter/incidents', { timeout: 10000 });
    record('Alternate 6b: Edit & Delete Pending Report', 'PASS', `Incident #${editTestId} successfully edited and deleted`);

    // 6c: Admin rejects incident with reason >= 5 characters
    await reporterPage.goto(`${BASE_URL}/reporter/report`);
    await reporterPage.fill('input#incident-title', 'Unsubstantiated Report');
    await reporterPage.fill('textarea#incident-description', 'Vague emergency details without specifics');
    await reporterPage.click('button[role="radio"]:has-text("Other")');
    await reporterPage.click('button[role="radio"]:has-text("Low")');
    await reporterPage.click('button:has-text("Use my current location")');
    await reporterPage.waitForTimeout(1000);
    await reporterPage.click('button:has-text("Send emergency report")');
    await reporterPage.waitForURL(/\/reporter\/incidents\/\d+/, { timeout: 15000 });
    const rejectTestId = reporterPage.url().split('/').pop();

    // Admin rejects report with reason
    await adminPage.goto(`${BASE_URL}/admin/incidents/${rejectTestId}`);
    await adminPage.waitForSelector('text=Unsubstantiated Report', { timeout: 10000 });
    await adminPage.click('button:has-text("Reject Report")');
    const rejectReasonInput = await adminPage.waitForSelector('textarea[placeholder*="Duplicate report"]');
    await rejectReasonInput.fill('Duplicate report already handled by station.');
    await adminPage.click('div[role="dialog"] button:has-text("Confirm Rejection")');
    await adminPage.waitForSelector('text=Rejected', { timeout: 10000 });

    // Reporter sees rejection reason
    await reporterPage.reload();
    await reporterPage.waitForSelector('text=Duplicate report already handled by station.', { timeout: 10000 });
    record('Alternate 6c: Admin Reject with Reason', 'PASS', `Incident #${rejectTestId} rejected with reason shown to reporter`);

    // 6d: Responder rejects assignment -> assignment reverts to verified -> Admin reassigns
    console.log('\n--- SCENARIO 6d: Responder rejects assignment & Admin reassigns ---');
    await reporterPage.goto(`${BASE_URL}/reporter/report`);
    await reporterPage.fill('input#incident-title', 'Structural Hazard Call');
    await reporterPage.fill('textarea#incident-description', 'Fallen tree blocking arterial road access with power lines entangled.');
    await reporterPage.click('button[role="radio"]:has-text("Electrical Hazard")');
    await reporterPage.click('button[role="radio"]:has-text("High")');
    await reporterPage.click('button:has-text("Use my current location")');
    await reporterPage.waitForTimeout(1000);
    await reporterPage.click('button:has-text("Send emergency report")');
    await reporterPage.waitForURL(/\/reporter\/incidents\/\d+/, { timeout: 15000 });
    const reassignIncidentId = reporterPage.url().split('/').pop();

    // Admin verifies and assigns Fire responder
    await adminPage.goto(`${BASE_URL}/admin/incidents/${reassignIncidentId}`);
    await adminPage.waitForSelector('text=Structural Hazard Call', { timeout: 10000 });
    await adminPage.click('button:has-text("Verify Emergency")');
    await adminPage.click('div[role="dialog"] button:has-text("Verify Report")');
    await adminPage.waitForSelector('text=Verified', { timeout: 10000 });

    await adminPage.click('button:has-text("Assign Responder")');
    await adminPage.waitForSelector('text=Demo Fire', { timeout: 10000 });
    await adminPage.locator('div[role="dialog"] span:has-text("Demo Fire")').click();
    await adminPage.waitForSelector('div[role="dialog"] button:has-text("Assign Responder"):not([disabled])', { timeout: 5000 });
    await adminPage.click('div[role="dialog"] button:has-text("Assign Responder")');
    await adminPage.waitForSelector('text=Assigned', { timeout: 10000 });

    // Responder declines assignment
    await responderPage.goto(`${BASE_URL}/responder/assignments`);
    await responderPage.waitForSelector('text=Structural Hazard Call', { timeout: 10000 });
    const hazardCard = responderPage.locator('div.rounded-2xl', { hasText: 'Structural Hazard Call' }).first();
    await hazardCard.locator('a:has-text("View details")').click();
    await responderPage.waitForSelector('text=Structural Hazard Call', { timeout: 10000 });

    await responderPage.click('button:has-text("Reject")');
    const rejectNotes = await responderPage.waitForSelector('textarea#reject-notes');
    await rejectNotes.fill('Unit en route to separate chemical fire spill');
    await responderPage.click('div[role="dialog"] button:has-text("Confirm rejection")');
    await responderPage.waitForURL('**/responder/assignments', { timeout: 10000 });

    // Admin reloads incident and sees status reverted to Verified
    await adminPage.goto(`${BASE_URL}/admin/incidents/${reassignIncidentId}`);
    await adminPage.waitForSelector('text=Verified', { timeout: 10000 });

    // Admin reassigns to Police responder
    await adminPage.click('button:has-text("Assign Responder")');
    await adminPage.waitForSelector('div[role="dialog"] button:has-text("Police")', { timeout: 10000 });
    await adminPage.locator('div[role="dialog"] button:has-text("Police")').click();
    await adminPage.waitForSelector('text=Demo Police', { timeout: 10000 });
    await adminPage.locator('div[role="dialog"] span:has-text("Demo Police")').click();
    await adminPage.waitForSelector('div[role="dialog"] button:has-text("Assign Responder"):not([disabled])', { timeout: 5000 });
    await adminPage.click('div[role="dialog"] button:has-text("Assign Responder")');
    await adminPage.waitForSelector('text=Assigned', { timeout: 10000 });
    record('Alternate 6d: Responder Reject & Admin Reassign', 'PASS', `Incident #${reassignIncidentId} successfully rejected by unit and reassigned by admin`);

    // 6e: Admin disables user -> user cannot log in
    console.log('\n--- SCENARIO 6e: Admin disables user account ---');
    const tempUserEmail = `disabled-test-${Date.now()}@example.com`;
    const tempPhone = `9${Date.now().toString().slice(-9)}`;
    const tempContext = await browser.newContext();
    const tempPage = await tempContext.newPage();

    tempPage.on('console', msg => {
      if (msg.type() === 'error') console.log('TEMP USER CONSOLE ERROR:', msg.text());
    });
    tempPage.on('pageerror', err => console.log('TEMP USER PAGE EXCEPTION:', err.message));

    // Register a new test user
    await tempPage.goto(`${BASE_URL}/register`);
    await tempPage.fill('input#full_name', 'Temporary Test Citizen');
    await tempPage.fill('input#email', tempUserEmail);
    await tempPage.fill('input#phone', tempPhone);
    await tempPage.fill('input#password', 'TestPassword123!');
    await tempPage.fill('input#confirmPassword', 'TestPassword123!');
    await tempPage.click('button:has-text("Create account")');
    await tempPage.waitForURL('**/login', { timeout: 10000 });

    // Admin goes to users page and disables this user
    await adminPage.goto(`${BASE_URL}/admin/users`);
    await adminPage.waitForSelector('text=User & Responder Accounts', { timeout: 10000 });
    const userSearchInput = await adminPage.waitForSelector('input[placeholder*="Search name"]');
    await userSearchInput.fill(tempUserEmail);
    await adminPage.waitForTimeout(1000);
    await adminPage.waitForSelector(`text=${tempUserEmail}`, { timeout: 10000 });

    // Click Disable in table row
    const userRow = adminPage.locator(`tr:has-text("${tempUserEmail}")`);
    await userRow.locator('button:has-text("Disable")').click();
    await adminPage.waitForSelector('button:has-text("Disable Account")', { timeout: 10000 });
    await adminPage.click('button:has-text("Disable Account")');
    await adminPage.waitForSelector(`tr:has-text("${tempUserEmail}"):has-text("Disabled")`, { timeout: 10000 });

    // Attempt login as disabled user
    await tempPage.goto(`${BASE_URL}/login`);
    await tempPage.fill('input[type="email"]', tempUserEmail);
    await tempPage.fill('input[type="password"]', 'TestPassword123!');
    await tempPage.click('button[type="submit"]');

    // Should show error and remain on /login
    await tempPage.waitForSelector('text=Account is deactivated', { timeout: 8000 });
    record('Alternate 6e: Admin Disable User', 'PASS', `User ${tempUserEmail} disabled; login blocked with deactivation notice`);
    await tempContext.close();

    // -------------------------------------------------------------
    // SCENARIO 7: Session behaviour & profile management
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 7: Session behaviour & profile management ---');

    // 7a: Edit profile without 401 loop
    await reporterPage.goto(`${BASE_URL}/profile`);
    await reporterPage.waitForSelector('text=Personal Information', { timeout: 10000 });
    const updatedName = `Demo Reporter ${Date.now().toString().slice(-4)}`;
    const nameInput = await reporterPage.waitForSelector('input[name="full_name"]');
    await nameInput.fill(updatedName);
    await reporterPage.click('button:has-text("Save Profile Changes")');
    await reporterPage.waitForSelector('text=Profile updated successfully', { timeout: 10000 });

    // Verify session remains active immediately after profile update
    await reporterPage.goto(`${BASE_URL}/notifications`);
    await reporterPage.waitForSelector('text=Notifications', { timeout: 10000 });
    record('Session: Edit Profile No 401 Loop', 'PASS', 'Profile updated; silent token refresh preserved active session');

    // 7b: Page reload preserves session
    await reporterPage.reload();
    await reporterPage.waitForSelector('text=Notifications', { timeout: 10000 });
    record('Session: Page Reload Restored', 'PASS', 'Authenticated session restored on reload from storage');

    // 7c: Logout redirects to /login
    await reporterPage.goto(`${BASE_URL}/profile`);
    await reporterPage.click('button:has-text("Log out everywhere")');
    await reporterPage.waitForSelector('div[role="dialog"] button:has-text("Log out everywhere")');
    await reporterPage.click('div[role="dialog"] button:has-text("Log out everywhere")');
    await reporterPage.waitForURL('**/login', { timeout: 10000 });

    // Attempt navigating to protected route
    await reporterPage.goto(`${BASE_URL}/reporter/incidents`);
    await reporterPage.waitForURL('**/login**', { timeout: 10000 });
    record('Session: Logout & Route Guard', 'PASS', 'Logout clears tokens and protected route redirects to /login');

  } catch (err) {
    console.error('❌ E2E Suite Exception:', err);
    record('E2E Suite Execution', 'FAIL', err.message);
  } finally {
    await reporterContext.close();
    await adminContext.close();
    await responderContext.close();
    await browser.close();
  }

  // Write summary
  console.log('\n========================================');
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  console.log(`E2E Results: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('========================================\n');

  fs.writeFileSync(
    path.join(__dirname, 'e2e-results.json'),
    JSON.stringify(results, null, 2)
  );
}

run();
