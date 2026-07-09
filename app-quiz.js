// ============================================================
// Student quiz runner.
// Flow: name entry -> one question at a time -> click an option,
// its response (video/audio/text) plays inline -> Next -> ... ->
// review screen listing every choice -> optional submit to Firestore.
// ============================================================

const appEl = document.getElementById('app');
const tally = document.getElementById('tally');

let questions = [];
let currentIndex = 0;
let studentName = '';
let answers = []; // { questionId, questionText, optionId, optionLabel, type, content }

function litTally(on) {
  tally.classList.toggle('live', on);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderLoading() {
  appEl.innerHTML = `
    <div class="empty-state">
      <p class="eyebrow">Connecting</p>
      <p>Loading questions from Firestore...</p>
    </div>`;
}

function renderNoQuestions() {
  appEl.innerHTML = `
    <div class="empty-state">
      <p class="eyebrow">Nothing patched in yet</p>
      <p>No questions have been set up. Go to Build and add some first.</p>
    </div>`;
}

function renderNameEntry() {
  appEl.innerHTML = `
    <p class="eyebrow">Ch.02 — Run</p>
    <h1>Take the quiz</h1>
    <p class="subtitle">${questions.length} question${questions.length === 1 ? '' : 's'} ahead. Enter your name so your instructor can match this run to you.</p>
    <div class="panel">
      <label for="name-input">Your name</label>
      <input type="text" id="name-input" placeholder="e.g. Ada Lovelace">
      <div class="btn-row">
        <button class="btn-primary btn-block" id="start-btn">Start</button>
      </div>
      <p class="status-line" id="name-status"></p>
    </div>
  `;
  const nameInput = document.getElementById('name-input');
  const startBtn = document.getElementById('start-btn');
  const nameStatus = document.getElementById('name-status');

  nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') startBtn.click(); });

  startBtn.addEventListener('click', () => {
    const val = nameInput.value.trim();
    if (!val) {
      nameStatus.textContent = 'Enter your name to continue.';
      nameStatus.className = 'status-line error';
      return;
    }
    studentName = val;
    currentIndex = 0;
    answers = [];
    renderQuestion();
  });
}

function progressTrackHtml() {
  let segs = '';
  for (let i = 0; i < questions.length; i++) {
    let cls = '';
    if (i < currentIndex) cls = 'done';
    else if (i === currentIndex) cls = 'current';
    segs += `<div class="progress-seg ${cls}"></div>`;
  }
  return `<div class="progress-track">${segs}</div>`;
}

// <video src="..."> only understands direct links to a media file (.mp4,
// .webm, etc). A youtube.com/vimeo.com page URL is not a media file, so the
// tag fails silently. Detect those and switch to an <iframe> embed instead.
function embedUrlFor(url) {
  let m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  if (m) return `https://www.youtube.com/embed/${m[1]}?autoplay=1`;
  m = url.match(/vimeo\.com\/(\d+)/);
  if (m) return `https://player.vimeo.com/video/${m[1]}?autoplay=1`;
  return null;
}

function monitorHtml(option) {
  if (!option) return '';
  if (option.type === 'video') {
    const embed = embedUrlFor(option.content);
    if (embed) {
      return `
        <div class="monitor">
          <div class="monitor-label">Video response</div>
          <iframe src="${escapeHtml(embed)}" style="width:100%; aspect-ratio:16/9; border:0; border-radius:6px;" allow="autoplay; encrypted-media" allowfullscreen></iframe>
        </div>`;
    }
    return `
      <div class="monitor">
        <div class="monitor-label">Video response</div>
        <video src="${escapeHtml(option.content)}" controls autoplay muted playsinline
          onerror="this.closest('.monitor').innerHTML = '<div class=\\'monitor-label\\'>Video response</div><div class=\\'monitor-text\\'>Couldn\\'t load this video. Check the URL is a direct link to a media file (.mp4) or a YouTube/Vimeo link.</div>'"></video>
      </div>`;
  }
  if (option.type === 'audio') {
    return `
      <div class="monitor">
        <div class="monitor-label">Audio response</div>
        <audio src="${escapeHtml(option.content)}" controls autoplay
          onerror="this.closest('.monitor').innerHTML = '<div class=\\'monitor-label\\'>Audio response</div><div class=\\'monitor-text\\'>Couldn\\'t load this audio file. Check the URL is a direct link to an audio file.</div>'"></audio>
      </div>`;
  }
  if (option.type === 'image') {
    return `
      <div class="monitor">
        <div class="monitor-label">Image response</div>
        <img src="${escapeHtml(option.content)}" alt=""
          onerror="this.closest('.monitor').innerHTML = '<div class=\\'monitor-label\\'>Image response</div><div class=\\'monitor-text\\'>Couldn\\'t load this image. Check the URL is a direct link to an image file.</div>'">
      </div>`;
  }
  return `
    <div class="monitor">
      <div class="monitor-label">Response</div>
      <div class="monitor-text">${escapeHtml(option.content)}</div>
    </div>`;
}

function renderQuestion() {
  const q = questions[currentIndex];
  const existingAnswer = answers.find(a => a.questionId === q.id);
  const selectedOptionId = existingAnswer ? existingAnswer.optionId : null;

  const channelsHtml = (q.options || []).map(opt => {
    const selected = opt.id === selectedOptionId;
    return `
      <button class="channel-btn ${selected ? 'selected' : ''}" data-opt-id="${opt.id}">
        <span class="io-tag">${opt.type}</span>
        <span>${escapeHtml(opt.label)}</span>
      </button>`;
  }).join('');

  const selectedOption = (q.options || []).find(o => o.id === selectedOptionId);
  const isLast = currentIndex === questions.length - 1;

  appEl.innerHTML = `
    ${progressTrackHtml()}
    <p class="eyebrow">Question ${currentIndex + 1} of ${questions.length}</p>
    <h1>${escapeHtml(q.text)}</h1>
    <div class="channel-strip">${channelsHtml}</div>
    <div id="monitor-slot">${monitorHtml(selectedOption)}</div>
    <div class="btn-row">
      <button class="btn-secondary" id="back-btn" ${currentIndex === 0 ? 'disabled' : ''}>Back</button>
      <button class="btn-primary" id="next-btn" ${selectedOptionId ? '' : 'disabled'}>${isLast ? 'Review answers' : 'Next'}</button>
    </div>
  `;

  appEl.querySelectorAll('.channel-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const optId = btn.getAttribute('data-opt-id');
      const opt = q.options.find(o => o.id === optId);

      answers = answers.filter(a => a.questionId !== q.id);
      answers.push({
        questionId: q.id,
        questionText: q.text,
        optionId: opt.id,
        optionLabel: opt.label,
        type: opt.type,
        content: opt.content
      });

      litTally(true);
      renderQuestion();
    });
  });

  document.getElementById('back-btn').addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      renderQuestion();
    }
  });

  document.getElementById('next-btn').addEventListener('click', () => {
    litTally(false);
    if (isLast) {
      renderReview();
    } else {
      currentIndex++;
      renderQuestion();
    }
  });
}

function renderReview() {
  const rows = answers.map((a, i) => `
    <div class="log-row">
      <div class="log-num">${String(i + 1).padStart(2, '0')}</div>
      <div>
        <div class="log-q">${escapeHtml(a.questionText)}</div>
        <div class="log-a"><span class="io-tag">${a.type}</span>${escapeHtml(a.optionLabel)}</div>
      </div>
    </div>
  `).join('');

  appEl.innerHTML = `
    <p class="eyebrow">Review</p>
    <h1>Here's what ${escapeHtml(studentName)} picked</h1>
    <p class="subtitle">Check it over. You can go back and change anything before submitting.</p>
    <div class="panel">${rows}</div>
    <div class="btn-row">
      <button class="btn-secondary" id="edit-btn">Go back and edit</button>
      <button class="btn-primary" id="submit-btn">Submit</button>
    </div>
    <p class="status-line" id="submit-status"></p>
  `;

  document.getElementById('edit-btn').addEventListener('click', () => {
    currentIndex = questions.length - 1;
    renderQuestion();
  });

  document.getElementById('submit-btn').addEventListener('click', async () => {
    const submitBtn = document.getElementById('submit-btn');
    const submitStatus = document.getElementById('submit-status');
    submitBtn.disabled = true;
    submitStatus.textContent = 'Submitting...';
    submitStatus.className = 'status-line';
    try {
      await db.collection('submissions').add({
        studentName,
        answers,
        submittedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      renderDone();
    } catch (err) {
      console.error(err);
      submitStatus.textContent = 'Could not submit — check your Firebase config and Firestore rules.';
      submitStatus.className = 'status-line error';
      submitBtn.disabled = false;
    }
  });
}

function renderDone() {
  appEl.innerHTML = `
    <div class="empty-state">
      <p class="eyebrow">Submitted</p>
      <h2>Thanks, ${escapeHtml(studentName)}.</h2>
      <p>Your answers have been recorded.</p>
    </div>
  `;
}

renderLoading();

db.collection('questions').orderBy('order').get().then((snapshot) => {
  questions = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  if (questions.length === 0) {
    renderNoQuestions();
  } else {
    renderNameEntry();
  }
}).catch((err) => {
  console.error(err);
  appEl.innerHTML = `
    <div class="empty-state">
      <p class="eyebrow">Connection issue</p>
      <p>Could not read from Firestore. Double check firebase-config.js and that Firestore is enabled for this project.</p>
    </div>`;
});
