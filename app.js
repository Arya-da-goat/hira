const chatWindow = document.getElementById('chat');
const composer = document.getElementById('composer');
const promptInput = document.getElementById('prompt');

const seedMessages = [];

function appendMessage(role, text, source = '') {
  const wrapper = document.createElement('div');
  wrapper.className = `message ${role}`;

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.textContent = text;

  if (source) {
    const link = document.createElement('a');
    link.href = source;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'source-link';
    link.textContent = 'Read source';
    bubble.appendChild(document.createElement('br'));
    bubble.appendChild(link);
  }

  const meta = document.createElement('div');
  meta.className = 'message-meta';
  meta.textContent = role === 'user' ? 'You' : 'Kira';

  wrapper.appendChild(bubble);
  wrapper.appendChild(meta);
  chatWindow.appendChild(wrapper);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function setLoading(loading) {
  const old = document.getElementById('kira-loading');
  if (old) old.remove();
  if (!loading) return;

  const wrapper = document.createElement('div');
  wrapper.id = 'kira-loading';
  wrapper.className = 'message bot';
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.textContent = 'Searching the web…';
  wrapper.appendChild(bubble);
  chatWindow.appendChild(wrapper);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function wikiSearch(query) {
  const url = 'https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' +
    encodeURIComponent(query) + '&srlimit=5&format=json&origin=*';
  const response = await fetch(url);
  if (!response.ok) throw new Error('Search request failed');
  const data = await response.json();
  return data.query?.search || [];
}

async function wikiSummary(title) {
  const url = 'https://en.wikipedia.org/api/rest_v1/page/summary/' +
    encodeURIComponent(title.replaceAll(' ', '_'));
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json();
  if (!data.extract) return null;
  return {
    title: data.title,
    extract: data.extract,
    source: data.content_urls?.desktop?.page ||
      `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(' ', '_'))}`
  };
}

function summarize(text, maxSentences = 4) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const sentences = cleaned.match(/[^.!?]+[.!?]+/g) || [cleaned];
  return sentences.slice(0, maxSentences).join(' ').trim();
}

async function webAnswer(query) {
  const results = await wikiSearch(query);
  if (!results.length) {
    return {
      text: 'I could not find a useful result on the web for that query.',
      source: ''
    };
  }

  for (const result of results) {
    const summary = await wikiSummary(result.title);
    if (summary) {
      return {
        text: summarize(summary.extract),
        source: summary.source
      };
    }
  }

  return {
    text: results[0].snippet.replace(/<[^>]*>/g, ''),
    source: `https://en.wikipedia.org/wiki/${encodeURIComponent(results[0].title.replaceAll(' ', '_'))}`
  };
}

async function sendMessage(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  appendMessage('user', trimmed);
  promptInput.value = '';
  promptInput.style.height = '54px';
  setLoading(true);

  try {
    const answer = await webAnswer(trimmed);
    setLoading(false);
    appendMessage('bot', answer.text, answer.source);
  } catch (error) {
    setLoading(false);
    appendMessage('bot', 'I could not reach the web right now. Please check your connection and try again.');
    console.error(error);
  }
}

composer.addEventListener('submit', (event) => {
  event.preventDefault();
  sendMessage(promptInput.value);
});

promptInput.addEventListener('input', () => {
  const lines = Math.max(1, Math.min(5, promptInput.value.split('\n').length));
  promptInput.rows = lines;
});

promptInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    composer.requestSubmit();
  }
});

// Sidebar/account interactions
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const mobileMenu = document.getElementById('mobileMenu');
const accountButton = document.getElementById('accountButton');
const accountMenu = document.getElementById('accountMenu');
const newChat = document.getElementById('newChat');
const newChatTop = document.getElementById('newChatTop');

function toggleSidebar(force) {
  const open = force ?? !sidebar.classList.contains('open');
  sidebar.classList.toggle('open', open);
}
sidebarToggle?.addEventListener('click', () => toggleSidebar(false));
mobileMenu?.addEventListener('click', () => toggleSidebar(true));
accountButton?.addEventListener('click', (e) => { e.stopPropagation(); accountMenu.classList.toggle('open'); });
document.addEventListener('click', () => accountMenu?.classList.remove('open'));

function clearChat() {
  chatWindow.innerHTML = '';
  document.querySelectorAll('.thread').forEach(t => t.classList.remove('active'));
  const first = document.querySelector('.thread');
  if (first) first.classList.add('active');
  promptInput.focus();
}
newChat?.addEventListener('click', clearChat);
newChatTop?.addEventListener('click', clearChat);

// Real file attachment picker
const fileInput = document.getElementById('fileInput');
const attachButton = document.getElementById('attachButton');
const attachmentList = document.getElementById('attachmentList');
let selectedFiles = [];

attachButton.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  selectedFiles = [...selectedFiles, ...Array.from(fileInput.files)];
  renderAttachments();
  fileInput.value = '';
});

function renderAttachments() {
  attachmentList.innerHTML = '';
  selectedFiles.forEach((file, index) => {
    const chip = document.createElement('div');
    chip.className = 'attachment-chip';
    const icon = document.createElement('i');
    icon.className = file.type.startsWith('image/') ? 'fa-regular fa-image' : 'fa-regular fa-file';
    const name = document.createElement('span');
    name.textContent = file.name;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    remove.title = 'Remove file';
    remove.addEventListener('click', () => {
      selectedFiles.splice(index, 1);
      renderAttachments();
    });
    chip.append(icon, name, remove);
    attachmentList.appendChild(chip);
  });
}

// Include attached text files in the web-search request. Other file types are
// attached to the outgoing message UI and can be expanded later with a parser.
const originalSendMessage = sendMessage;
sendMessage = async function(text) {
  if (!text.trim() && !selectedFiles.length) return;
  let outgoing = text.trim();
  if (selectedFiles.length) {
    const names = selectedFiles.map(f => f.name).join(', ');
    outgoing = outgoing ? `${outgoing}\n\nAttached: ${names}` : `Attached: ${names}`;
  }
  const filesToSend = [...selectedFiles];
  selectedFiles = [];
  renderAttachments();

  const textParts = [];
  for (const file of filesToSend) {
    if (file.type.startsWith('text/') || /\.(txt|md|csv|json|js|css|html|py|xml)$/i.test(file.name)) {
      try {
        const content = await file.text();
        textParts.push(`\nFile ${file.name}:\n${content.slice(0, 12000)}`);
      } catch {}
    }
  }
  if (textParts.length) outgoing += textParts.join('\n');
  return originalSendMessage(outgoing);
};
