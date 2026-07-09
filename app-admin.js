// ============================================================
// Admin builder logic.
// Firestore shape:
//   collection "questions"
//     doc: { order: number, text: string, options: [
//       { id, label, type: 'video'|'audio'|'image'|'text', content }
//     ]}
// ============================================================

const optionsListEl = document.getElementById('options-list');
const addOptionBtn = document.getElementById('add-option-btn');
const saveBtn = document.getElementById('save-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const formStatus = document.getElementById('form-status');
const formHeading = document.getElementById('form-heading');
const editingIdInput = document.getElementById('editing-id');
const qTextInput = document.getElementById('q-text');
const questionListEl = document.getElementById('question-list');
const optionRowTemplate = document.getElementById('option-row-template');
const tally = document.getElementById('tally');

let optionRowCount = 0;

function contentLabelFor(type) {
  if (type === 'video') return 'Video URL';
  if (type === 'audio') return 'Audio URL';
  if (type === 'image') return 'Image URL';
  return 'Response text';
}

function contentPlaceholderFor(type) {
  if (type === 'video') return 'https://... .mp4 (or a YouTube/Vimeo link)';
  if (type === 'audio') return 'https://... .mp3';
  if (type === 'image') return 'https://... .jpg / .png / .webp';
  return 'What the student sees when they click this option';
}

function addOptionRow(data) {
  data = data || { label: '', type: 'text', content: '' };
  const node = optionRowTemplate.content.cloneNode(true);
  const row = node.querySelector('[data-opt-row]');
  const labelInput = row.querySelector('[data-field="label"]');
  const typeSelect = row.querySelector('[data-field="type"]');
  const contentInput = row.querySelector('[data-field="content"]');
  const contentLabel = row.querySelector('[data-content-label]');
  const removeBtn = row.querySelector('[data-remove-opt]');

  labelInput.value = data.label;
  typeSelect.value = data.type;
  contentInput.value = data.content;
  contentLabel.textContent = contentLabelFor(data.type);
  contentInput.placeholder = contentPlaceholderFor(data.type);

  typeSelect.addEventListener('change', () => {
    contentLabel.textContent = contentLabelFor(typeSelect.value);
    contentInput.placeholder = contentPlaceholderFor(typeSelect.value);
  });

  removeBtn.addEventListener('click', () => row.remove());

  optionsListEl.appendChild(row);
  optionRowCount++;
}

addOptionBtn.addEventListener('click', () => addOptionRow());

function readOptionsFromForm() {
  const rows = optionsListEl.querySelectorAll('[data-opt-row]');
  const options = [];
  rows.forEach((row, idx) => {
    const label = row.querySelector('[data-field="label"]').value.trim();
    const type = row.querySelector('[data-field="type"]').value;
    const content = row.querySelector('[data-field="content"]').value.trim();
    if (label) {
      options.push({ id: 'opt' + idx + '_' + Date.now(), label, type, content });
    }
  });
  return options;
}

function resetForm() {
  qTextInput.value = '';
  optionsListEl.innerHTML = '';
  editingIdInput.value = '';
  formHeading.textContent = 'New question';
  cancelEditBtn.style.display = 'none';
  formStatus.textContent = '';
  formStatus.className = 'status-line';
  addOptionRow();
  addOptionRow();
}

cancelEditBtn.addEventListener('click', resetForm);

saveBtn.addEventListener('click', async () => {
  const text = qTextInput.value.trim();
  const options = readOptionsFromForm();

  if (!text) {
    formStatus.textContent = 'Add the question text first.';
    formStatus.className = 'status-line error';
    return;
  }
  if (options.length < 2) {
    formStatus.textContent = 'Add at least two options.';
    formStatus.className = 'status-line error';
    return;
  }

  saveBtn.disabled = true;
  formStatus.textContent = 'Saving...';
  formStatus.className = 'status-line';

  try {
    const editingId = editingIdInput.value;
    if (editingId) {
      await db.collection('questions').doc(editingId).update({ text, options });
    } else {
      const snapshot = await db.collection('questions').get();
      const order = snapshot.size;
      await db.collection('questions').add({ text, options, order });
    }
    formStatus.textContent = 'Saved.';
    formStatus.className = 'status-line ok';
    resetForm();
  } catch (err) {
    console.error(err);
    formStatus.textContent = 'Could not save — check your Firebase config and Firestore rules.';
    formStatus.className = 'status-line error';
  } finally {
    saveBtn.disabled = false;
  }
});

function startEditing(id, data) {
  editingIdInput.value = id;
  qTextInput.value = data.text;
  optionsListEl.innerHTML = '';
  (data.options || []).forEach(opt => addOptionRow(opt));
  formHeading.textContent = 'Edit question';
  cancelEditBtn.style.display = 'inline-block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteQuestion(id) {
  if (!confirm('Delete this question? This cannot be undone.')) return;
  try {
    await db.collection('questions').doc(id).delete();
  } catch (err) {
    console.error(err);
    alert('Could not delete — check your Firestore rules.');
  }
}

function renderQuestionList(docs) {
  questionListEl.innerHTML = '';

  if (docs.length === 0) {
    questionListEl.innerHTML = `
      <div class="empty-state">
        <p class="eyebrow">No questions yet</p>
        <p>Add your first question above to wire up its options.</p>
      </div>`;
    return;
  }

  docs.forEach((docSnap, i) => {
    const data = docSnap.data();
    const card = document.createElement('div');
    card.className = 'q-card';

    const optsHtml = (data.options || []).map(opt =>
      `<span class="io-tag">${opt.type}</span> ${escapeHtml(opt.label)}`
    ).join('<br>');

    card.innerHTML = `
      <div class="chan-label">Question ${i + 1}</div>
      <h3>${escapeHtml(data.text)}</h3>
      <p class="subtitle" style="margin-bottom:12px;">${optsHtml}</p>
      <div class="btn-row" style="margin-top:0;">
        <button class="btn-secondary" data-edit>Edit</button>
        <button class="btn-danger" data-delete>Delete</button>
      </div>
    `;

    card.querySelector('[data-edit]').addEventListener('click', () => startEditing(docSnap.id, data));
    card.querySelector('[data-delete]').addEventListener('click', () => deleteQuestion(docSnap.id));

    questionListEl.appendChild(card);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

db.collection('questions').orderBy('order').onSnapshot(
  (snapshot) => {
    tally.classList.add('live');
    setTimeout(() => tally.classList.remove('live'), 300);
    renderQuestionList(snapshot.docs);
  },
  (err) => {
    console.error(err);
    questionListEl.innerHTML = `
      <div class="empty-state">
        <p class="eyebrow">Connection issue</p>
        <p>check your internet</p>
      </div>`;
  }
);

resetForm();
