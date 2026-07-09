// ============================================================
// Submissions viewer.
// Reads the "submissions" collection and renders each student's
// run: name, submitted time, and their answer to every question.
//
// NOTE: this will show "Permission denied" until you update your
// Firestore rules to allow reading the submissions collection.
// The starter rules in README.md deliberately lock this down
// (allow read: if false) since submissions are student data.
// See the note this script renders on a permission error for the
// exact rule change needed.
// ============================================================

const submissionListEl = document.getElementById('submission-list');
const filterRow = document.getElementById('filter-row');
const filterInput = document.getElementById('student-filter');
const tally = document.getElementById('tally');

let allSubmissions = [];

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function formatTimestamp(ts) {
  if (!ts || !ts.toDate) return 'Just now';
  return ts.toDate().toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function renderSubmission(sub) {
  const rows = (sub.answers || []).map((a, i) => `
    <div class="log-row">
      <div class="log-num">${String(i + 1).padStart(2, '0')}</div>
      <div>
        <div class="log-q">${escapeHtml(a.questionText)}</div>
        <div class="log-a"><span class="io-tag">${escapeHtml(a.type)}</span>${escapeHtml(a.optionLabel)}</div>
      </div>
    </div>
  `).join('');

  return `
    <div class="q-card">
      <div class="chan-label">${formatTimestamp(sub.submittedAt)}</div>
      <h3>${escapeHtml(sub.studentName)}</h3>
      <div style="margin-top:10px;">${rows || '<p class="subtitle" style="margin:8px 0 0;">No answers recorded.</p>'}</div>
    </div>
  `;
}

function renderList() {
  const filter = filterInput.value.trim().toLowerCase();
  const visible = filter
    ? allSubmissions.filter(s => (s.studentName || '').toLowerCase().includes(filter))
    : allSubmissions;

  if (visible.length === 0) {
    submissionListEl.innerHTML = `
      <div class="empty-state">
        <p class="eyebrow">${filter ? 'No matches' : 'No submissions yet'}</p>
        <p>${filter ? 'No student name matches that filter.' : 'Once students submit the quiz, their runs will show up here.'}</p>
      </div>`;
    return;
  }

  submissionListEl.innerHTML = visible.map(renderSubmission).join('');
}

filterInput.addEventListener('input', renderList);

db.collection('submissions').orderBy('submittedAt', 'desc').onSnapshot(
  (snapshot) => {
    tally.classList.add('live');
    setTimeout(() => tally.classList.remove('live'), 300);
    allSubmissions = snapshot.docs.map(d => d.data());
    filterRow.style.display = allSubmissions.length ? 'block' : 'none';
    renderList();
  },
  (err) => {
    console.error(err);
    filterRow.style.display = 'none';
    if (err.code === 'permission-denied') {
      submissionListEl.innerHTML = `
        <div class="empty-state">
          <p class="eyebrow">Permission denied</p>
          <p>Your Firestore rules are currently blocking reads on the
          <code>submissions</code> collection (that's the default —
          submissions are private until you open them up).</p>
          <p>In the Firebase console, go to <strong>Firestore &gt; Rules</strong>
          and change the <code>submissions</code> match block's
          <code>allow read</code> line to <code>allow read: if true;</code>
          — or better, restrict it to your own signed-in account once you've
          added Firebase Authentication.</p>
        </div>`;
      return;
    }
    submissionListEl.innerHTML = `
      <div class="empty-state">
        <p class="eyebrow">Connection issue</p>
        <p>Could not read from Firestore. Double check firebase-config.js and that Firestore is enabled for this project.</p>
      </div>`;
  }
);
