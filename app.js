const chatWindow = document.getElementById('chat');
const composer = document.getElementById('composer');
const promptInput = document.getElementById('prompt');

const seedMessages = [];

function appendMessage(role, text = '', source = '', files = []) {
  const wrapper = document.createElement('div');
  wrapper.className = `message ${role}`;

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';

  if (text) {
    const textEl = document.createElement('div');
    textEl.className = 'message-text';
    textEl.textContent = text;
    bubble.appendChild(textEl);
  }

  if (files.length) {
    const filesBox = document.createElement('div');
    filesBox.className = 'message-files';

    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const figure = document.createElement('div');
        figure.className = 'message-image';
        const img = document.createElement('img');
        img.alt = file.name;
        img.loading = 'lazy';
        img.src = URL.createObjectURL(file);
        img.addEventListener('load', () => URL.revokeObjectURL(img.src), { once: true });
        figure.appendChild(img);
        const caption = document.createElement('div');
        caption.textContent = file.name;
        figure.appendChild(caption);
        filesBox.appendChild(figure);
      } else {
        const card = document.createElement('div');
        card.className = 'message-file-card';
        const icon = document.createElement('i');
        icon.className = file.type === 'application/pdf' ? 'fa-regular fa-file-pdf' : 'fa-regular fa-file-lines';
        const info = document.createElement('div');
        info.className = 'message-file-info';
        const name = document.createElement('strong');
        name.textContent = file.name;
        const size = document.createElement('small');
        size.textContent = formatFileSize(file.size);
        info.append(name, size);
        card.append(icon, info);
        filesBox.appendChild(card);
      }
    });
    bubble.appendChild(filesBox);
  }

  if (source) {
    const link = document.createElement('a');
    link.href = source;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'source-link';
    link.textContent = 'Read source';
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

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

async function sendMessage(text, attachedFiles = []) {
  const trimmed = text.trim();
  if (!trimmed && !attachedFiles.length) return;

  appendMessage('user', trimmed, '', attachedFiles);
  promptInput.value = '';
  promptInput.style.height = '54px';
  setLoading(true);

  try {
    // Only feed small text/code files to the web search as context.
    // They are NOT rendered inside the chat bubble, preventing giant HTML/code blocks.
    let searchQuery = trimmed;
    const contextParts = [];
    for (const file of attachedFiles) {
      if (/\.(txt|md|csv|json|js|css|html|py|xml)$/i.test(file.name) || file.type.startsWith('text/')) {
        try {
          const content = await file.text();
          contextParts.push(`File ${file.name}:\n${content.slice(0, 12000)}`);
        } catch {}
      }
    }
    if (contextParts.length) {
      searchQuery += (searchQuery ? '\n\n' : '') + contextParts.join('\n\n');
    }

    if (!searchQuery.trim()) {
      setLoading(false);
      appendMessage('bot', 'The file is attached. Add a message if you want me to search for or explain something about it.');
      return;
    }

    const answer = await webAnswer(searchQuery);
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
  const filesToSend = [...selectedFiles];
  selectedFiles = [];
  renderAttachments();
  sendMessage(promptInput.value, filesToSend);
});

promptInput.addEventListener('input', () => {
  promptInput.style.height = 'auto';
  promptInput.style.height = `${Math.min(promptInput.scrollHeight, 180)}px`;
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
// Close the mobile sidebar when a navigation item is selected.
document.querySelectorAll('.sidebar-new-chat, .sidebar-search, .thread').forEach((el) => {
  el.addEventListener('click', () => {
    if (window.innerWidth <= 900) toggleSidebar(false);
  });
});
window.addEventListener('resize', () => {
  if (window.innerWidth > 900) sidebar?.classList.remove('open');
});
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


