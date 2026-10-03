const chatWindow = document.getElementById('chat');
const composer = document.getElementById('composer');
const promptInput = document.getElementById('prompt');

const seedMessages = [];

const CHAT_MEMORY_KEY = 'kira-chat-v6';
function saveChatState() {
  try {
    const messages = [...chatWindow.querySelectorAll('.message')].map(el => ({
      role: el.classList.contains('user') ? 'user' : 'bot',
      text: el.querySelector('.message-text')?.textContent || ''
    })).filter(x => x.text);
    localStorage.setItem(CHAT_MEMORY_KEY, JSON.stringify(messages.slice(-80)));
  } catch (_) {}
}
function restoreChatState() {
  try {
    const saved = JSON.parse(localStorage.getItem(CHAT_MEMORY_KEY) || '[]');
    if (!Array.isArray(saved)) return;
    saved.forEach(m => appendMessage(m.role === 'user' ? 'user' : 'bot', String(m.text || '')));
    if (Array.isArray(window.kiraConversation)) {
      window.kiraConversation.length = 0;
      saved.slice(-12).forEach(m => window.kiraConversation.push({ role: m.role === 'user' ? 'user' : 'assistant', content: String(m.text || '') }));
    }
  } catch (_) {}
}

function appendMessage(role, text = '', source = '', files = [], sources = []) {
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
        caption.className = 'message-image-caption';
        caption.textContent = file.name;
        figure.appendChild(caption);
        const reverseRow = document.createElement('div');
        reverseRow.className = 'image-search-actions';
        const reverseBtn = document.createElement('button');
        reverseBtn.type = 'button';
        reverseBtn.className = 'image-search-btn';
        reverseBtn.textContent = 'Reverse search';
        reverseBtn.title = 'Open Google Lens only when you choose';
        reverseBtn.addEventListener('click', () => reverseSearchImage(file));
        reverseRow.appendChild(reverseBtn);
        const bingBtn = document.createElement('button');
        bingBtn.type = 'button';
        bingBtn.className = 'image-search-btn secondary-search';
        bingBtn.textContent = 'Bing Visual';
        bingBtn.title = 'Open Bing Visual Search';
        bingBtn.addEventListener('click', () => openBingVisualSearch());
        reverseRow.appendChild(bingBtn);
        figure.appendChild(reverseRow);
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

  const sourceList = sources.length ? sources : (source ? [{name: 'Source', url: source}] : []);
  if (sourceList.length) {
    const sourcesBox = document.createElement('div');
    sourcesBox.className = 'sources-box';
    const label = document.createElement('div');
    label.className = 'sources-label';
    label.textContent = `Sources (${sourceList.length})`;
    sourcesBox.appendChild(label);
    sourceList.slice(0, 10).forEach((src) => {
      if (!src?.url) return;
      const link = document.createElement('a');
      link.href = src.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'source-link';
      link.textContent = src.name || 'Read source';
      sourcesBox.appendChild(link);
    });
    bubble.appendChild(sourcesBox);
  }

  const meta = document.createElement('div');
  meta.className = 'message-meta';
  meta.textContent = role === 'user' ? 'You' : 'Kira';

  wrapper.appendChild(bubble);
  wrapper.appendChild(meta);
  if (role === 'bot') addMessageActions(wrapper, text);
  chatWindow.appendChild(wrapper);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function extractPdfText(file) {
  throw new Error('PDF text extraction is disabled in zero-network mode. Convert the PDF to a text file locally and attach the text instead.');
}

function localContextMetadata() {
  const now = new Date();
  const date = now.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
  const time = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return [
    `Runtime date: ${date}.`,
    `Runtime time: ${time}.`,
    `This runtime metadata is context only. Do not answer with it unless the user asks for the current date/time.`
  ].join(' ');
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function setLoading(loading, label = 'Thinking locally…') {
  const old = document.getElementById('kira-loading');
  if (old) old.remove();
  if (!loading) return;

  const wrapper = document.createElement('div');
  wrapper.id = 'kira-loading';
  wrapper.className = 'message bot';
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble kira-thinking';
  bubble.innerHTML = `<span class="thinking-dot"></span><span class="thinking-label"></span>`;
  bubble.querySelector('.thinking-label').textContent = label;
  wrapper.appendChild(bubble);
  chatWindow.appendChild(wrapper);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function updateLoadingLabel(label) {
  const el = document.querySelector('#kira-loading .thinking-label');
  if (el) el.textContent = label;
}

window.addEventListener('kira-ai-status', event => {
  const d = event.detail || {};
  if (d.type === 'loading') updateLoadingLabel(d.kind === 'vision' ? 'Loading Kira Vision…' : 'Loading Kira AI…');
  if (d.type === 'progress' && d.status === 'progress' && Number.isFinite(d.progress)) {
    const pct = Math.round(d.progress);
    updateLoadingLabel(`Preparing local AI… ${pct}%`);
  }
  if (d.type === 'device') updateLoadingLabel(d.device === 'webgpu' ? 'Thinking with WebGPU…' : 'Thinking locally…');
  if (d.type === 'ready') updateLoadingLabel('Generating answer…');
});

function looksLikeImageSearch(query = '') {
  return /\b(reverse\s*search|reverse\s*image|search\s*this\s*image|find\s*(the\s*)?(source|original)|where\s*(did|is)\s*this\s*image|find\s*similar\s*images?)\b/i.test(String(query || ''));
}

function openBingVisualSearch() {
  window.open('https://www.bing.com/images/feed', '_blank', 'noopener,noreferrer');
}

function reverseSearchImage(file) {
  if (!file || !file.type?.startsWith('image/')) return;
  // Google Lens exposes a browser upload entrypoint. We submit the selected
  // file with a normal HTML form navigation; this is not an API/fetch call.
  // This is intentionally an explicit browser upload/navigation initiated by the user's image attachment. No API is called.
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = 'https://lens.google.com/v3/upload?ep=ccm&s=&st=' + Date.now();
  form.enctype = 'multipart/form-data';
  form.target = '_blank';
  form.style.display = 'none';
  const input = document.createElement('input');
  input.type = 'file';
  input.name = 'encoded_image';
  const dimensions = document.createElement('input');
  dimensions.type = 'hidden';
  dimensions.name = 'processed_image_dimensions';
  dimensions.value = '1000,1000';
  form.append(input, dimensions);
  document.body.appendChild(form);
  try {
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    form.submit();
  } catch (error) {
    console.error('Google Lens upload failed', error);
    // On browsers that block programmatic file-input assignment, send the user
    // to Lens where they can choose the same file manually.
    window.open('https://lens.google.com/', '_blank', 'noopener,noreferrer');
  } finally {
    setTimeout(() => form.remove(), 1000);
  }
}

function openWebSearch(query) {
  const q = encodeURIComponent(String(query || '').trim());
  if (!q) return;
  window.open(`https://www.google.com/search?q=${q}`, '_blank', 'noopener,noreferrer');
}

async function prepareImageForOCR(file, maxSide = 1600, quality = 0.82) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = new Image(); img.src = objectUrl;
    await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = () => reject(new Error('Could not decode image')); });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true }); ctx.drawImage(img, 0, 0, width, height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob) throw new Error('Could not create a smaller image');
    return { blob, width, height };
  } finally { URL.revokeObjectURL(objectUrl); }
}

async function inspectImage(file) {
  if (!window.KiraLocalAI?.inspectImage) throw new Error('Offline image inspector unavailable.');
  return window.KiraLocalAI.inspectImage(file, 'Inspect this image locally.');
}

function normalizeQuery(query) { return String(query || '').replace(/\s+/g, ' ').trim(); }
function appendImageResults(text, images) {
  const wrapper = document.createElement('div');
  wrapper.className = 'message bot';
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble image-results-bubble';
  const heading = document.createElement('div');
  heading.className = 'message-text';
  heading.textContent = text;
  bubble.appendChild(heading);

  const grid = document.createElement('div');
  grid.className = 'image-results';
  images.forEach(item => {
    const link = document.createElement('a');
    link.className = 'image-result';
    link.href = item.page;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    const img = document.createElement('img');
    img.src = item.url;
    img.alt = item.title;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    img.onerror = () => link.remove();
    link.appendChild(img);
    const caption = document.createElement('span');
    caption.textContent = item.title;
    link.appendChild(caption);
    grid.appendChild(link);
  });
  bubble.appendChild(grid);
  wrapper.appendChild(bubble);
  const meta = document.createElement('div');
  meta.className = 'message-meta';
  meta.textContent = 'Kira';
  wrapper.appendChild(meta);
  chatWindow.appendChild(wrapper);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}


const conversation = [];
window.kiraConversation = conversation;

function isExplicitWebRequest(query) {
  return window.KiraLocalAI?.classifyQuery?.(query) === 'research' || /\b(search the web|look online|find online)\b/i.test(query);
}

function shouldSearch(query) {
  if (window.kiraSettings?.smartSearch === false) return false;
  const type = window.KiraLocalAI?.classifyQuery?.(query);
  return type === 'research' || /\b(search|look online|look it up|find sources|research this|verify this)\b/i.test(query);
}

function buildResearchSources(query) {
  const raw = String(query || '').trim();
  const q = encodeURIComponent(raw);
  if (!q) return [];
  const sources = [
    { name: 'Wikipedia', url: `https://en.wikipedia.org/w/index.php?search=${q}`, kind: 'encyclopedia' },
    { name: 'Britannica', url: `https://www.britannica.com/search?query=${q}`, kind: 'reference' },
    { name: 'Google', url: `https://www.google.com/search?q=${q}`, kind: 'search' },
    { name: 'Bing', url: `https://www.bing.com/search?q=${q}`, kind: 'search' },
    { name: 'DuckDuckGo', url: `https://duckduckgo.com/?q=${q}`, kind: 'search' },
    { name: 'Google News', url: `https://news.google.com/search?q=${q}`, kind: 'news' }
  ];
  if (/\b(code|javascript|python|html|css|api|developer|programming)\b/i.test(raw)) {
    sources.push({ name: 'MDN', url: `https://developer.mozilla.org/en-US/search?q=${q}`, kind: 'technical' });
  }
  if (/\b(science|scientific|study|research|paper|medicine|physics|biology|chemistry)\b/i.test(raw)) {
    sources.push({ name: 'Google Scholar', url: `https://scholar.google.com/scholar?q=${q}`, kind: 'academic' });
  }
  return (window.kiraSettings?.multiSource === false ? sources.slice(0, 2) : sources).slice(0, 8);
}

function researchNote(query) {
  const sources = buildResearchSources(query);
  if (!sources.length) return { text: '', sources: [] };
  return {
    text: `This question needs source-backed or current information. Kira prepared ${sources.length} independent source routes. Open several of them and compare the evidence; Kira does not secretly scrape cross-origin pages or call a search API.`,
    sources
  };
}

function isImageQuestion(query) {
  return /\b(what|who|where|why|how|describe|explain|read|identify|find|count|look|see|image|picture|photo)\b/i.test(query);
}

async function localAnswer(userText, context = '') {
  if (!window.KiraLocalAI) throw new Error('Local AI engine is unavailable.');
  // Keep the user's actual message separate from runtime/evidence context.
  // Putting metadata in the user turn made small local models echo it as the answer.
  conversation.push({ role: 'user', content: userText });
  const result = await window.KiraLocalAI.answer(conversation, {
    max_newTokens: 448,
    context,
    settings: window.kiraSettings || {}
  });
  if (!result) throw new Error('Local model returned an empty response.');
  conversation.push({ role: 'assistant', content: result });
  if (conversation.length > 12) conversation.splice(0, conversation.length - 12);
  return result;
}

function addMessageActions(wrapper, text) {
  if (!text) return;
  const actions = document.createElement('div');
  actions.className = 'message-actions';
  const copy = document.createElement('button');
  copy.type = 'button'; copy.title = 'Copy'; copy.innerHTML = '<i class="fa-regular fa-copy"></i>';
  copy.onclick = async () => { try { await navigator.clipboard.writeText(text); copy.innerHTML = '<i class="fa-solid fa-check"></i>'; setTimeout(() => copy.innerHTML = '<i class="fa-regular fa-copy"></i>', 1200); } catch (_) {} };
  const speak = document.createElement('button');
  speak.type = 'button'; speak.title = 'Read aloud'; speak.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
  speak.onclick = () => { if ('speechSynthesis' in window) { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(text)); } };
  actions.append(copy, speak);
  wrapper.appendChild(actions);
}

async function sendMessage(text, attachedFiles = []) {
  const trimmed = text.trim();
  if (!trimmed && !attachedFiles.length) return;

  appendMessage('user', trimmed, '', attachedFiles);
  saveChatState();
  promptInput.value = '';
  promptInput.style.height = '54px';
  setLoading(true);

  try {
    let imageContext = '';
    const fileContext = [];

    for (const file of attachedFiles) {
      if (file.type.startsWith('image/')) {
        updateLoadingLabel('Inspecting image locally…');
        const question = trimmed || 'Describe this image in detail, including objects, people, scene, visible text, colors, relationships, and anything unusual.';
        const result = await window.KiraLocalAI.inspectImage(file, question);
        const parts = result ? [`Offline image analysis: ${result}`] : [];
        imageContext += `Image ${file.name}: ${parts.join('\n')}\n`;
      } else if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
        try {
          updateLoadingLabel(`Reading ${file.name}…`);
          const content = await extractPdfText(file);
          fileContext.push(`PDF ${file.name}:\n${content.slice(0, 30000)}`);
        } catch (error) {
          fileContext.push(`PDF ${file.name}: text extraction failed (${error?.message || 'unknown error'}).`);
        }
      } else if (/\.(txt|md|csv|json|js|css|html|py|xml|yaml|yml|java|c|cpp|ts|tsx|jsx|sql|sh)$/i.test(file.name) || file.type.startsWith('text/')) {
        try {
          const content = await file.text();
          fileContext.push(`File ${file.name}:\n${content.slice(0, 30000)}`);
        } catch (_) {}
      }
    }

    const combinedContext = [imageContext, ...fileContext].filter(Boolean).join('\n\n');

    // An attachment must not hijack an unrelated message. Saying "Hi" after
    // attaching an image should still produce a normal greeting. Only expose
    // attachment context when the user actually asks about the attachment, or
    // when there is no text at all.
    const attachmentQuestion = /\b(image|picture|photo|screenshot|attached|attachment|file|document|pdf|read|inspect|look at|what do you see|describe|identify|text in)\b/i.test(trimmed);
    const allContext = (combinedContext && (attachmentQuestion || !trimmed)) ? combinedContext : '';
    const basic = window.KiraLocalAI?.classifyQuery?.(trimmed || '') === 'simple';
    updateLoadingLabel(basic ? 'Answering instantly…' : 'Thinking locally…');
    const answer = await localAnswer(trimmed || 'Inspect the attached file.', window.kiraSettings?.context === false ? '' : allContext);
    setLoading(false);
    const research = (!attachedFiles.length && shouldSearch(trimmed)) ? researchNote(trimmed) : {text:'',sources:[]};
    const finalAnswer = answer + (research.text ? `\n\n${research.text}` : '');
    appendMessage('bot', finalAnswer, '', [], window.kiraSettings?.sources === false ? [] : research.sources);
    if(window.kiraSettings?.voiceEnabled) speakKira(answer);
    saveChatState();
  } catch (error) {
    console.error(error);
    setLoading(false);
    appendMessage('bot', `Kira could not finish that request. ${error?.message ? `Details: ${error.message}` : 'Please make sure the local model has finished downloading, then try again.'}`);
  }
}


// ---- Professional productivity layer -----------------------------------
function getChatTranscript() {
  return [...chatWindow.querySelectorAll('.message')].map(m => {
    const role = m.classList.contains('user') ? 'You' : 'Kira';
    const text = m.querySelector('.message-text')?.textContent?.trim() || '';
    return text ? `${role}: ${text}` : '';
  }).filter(Boolean).join('\n\n');
}
function downloadText(filename, text, type='text/plain') {
  const blob = new Blob([text], {type});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=filename; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function exportChat(format='txt') {
  const transcript=getChatTranscript();
  if(!transcript){ appendMessage('bot','There is no conversation to export yet.'); return; }
  const stamp=new Date().toISOString().replace(/[:.]/g,'-');
  if(format==='json') downloadText(`kira-chat-${stamp}.json`, JSON.stringify({exportedAt:new Date().toISOString(), version:'v19', messages:[...chatWindow.querySelectorAll('.message')].map(m=>({role:m.classList.contains('user')?'user':'assistant',content:m.querySelector('.message-text')?.textContent||''}))},null,2),'application/json');
  else downloadText(`kira-chat-${stamp}.txt`, transcript);
}
function shareChat() {
  const text=getChatTranscript(); if(!text) return;
  if(navigator.share) navigator.share({title:'Kira conversation',text}).catch(()=>{});
  else navigator.clipboard?.writeText(text).then(()=>{updateLoadingLabel(''); appendMessage('bot','Conversation copied to your clipboard.');}).catch(()=>{});
}
function refreshAccountUI(){
  const name=(window.kiraSettings?.name||'Arya').trim() || 'Arya';
  document.querySelectorAll('.account-text strong,.account-heading strong,.settings-profile strong').forEach(el=>el.textContent=name);
  document.querySelectorAll('.avatar,.settings-avatar').forEach(el=>{ if(!el.querySelector('.edit-dot')) el.textContent=name.slice(0,1).toUpperCase(); });
  const small=document.querySelector('.account-text small'); if(small) small.textContent='Local workspace';
}
window.addEventListener('kira-settings-changed', refreshAccountUI);
refreshAccountUI();
// Global keyboard shortcuts: Ctrl/Cmd+K focuses chat search; Ctrl/Cmd+Shift+E exports.
document.addEventListener('keydown', e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault(); document.getElementById('searchChats')?.click();}
  if((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key.toLowerCase()==='e'){e.preventDefault(); exportChat('txt');}
});
// Wire top-bar actions without adding external dependencies.
document.querySelector('.top-actions button[aria-label="Share"]')?.addEventListener('click',shareChat);
document.querySelector('.top-actions button[aria-label="More"]')?.addEventListener('click',()=>{
  const ok=confirm('Export this conversation as a text file?'); if(ok) exportChat('txt');
});
// A lightweight chat search that filters the visible thread list and can also search messages.
document.getElementById('searchChats')?.addEventListener('click',()=>{
  const q=prompt('Search this conversation:'); if(!q) return;
  const needle=q.toLowerCase();
  const matches=[...chatWindow.querySelectorAll('.message')].filter(m=>(m.textContent||'').toLowerCase().includes(needle));
  if(matches.length){matches[0].scrollIntoView({behavior:'smooth',block:'center'}); matches[0].style.outline='2px solid var(--accent)'; setTimeout(()=>matches[0].style.outline='',1200);}
  else appendMessage('bot',`I couldn't find “${q}” in this conversation.`);
});

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
  if (event.key === 'Enter' && !event.shiftKey && window.kiraSettings?.enterSend !== false) {
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
  conversation.length = 0;
  try { localStorage.removeItem(CHAT_MEMORY_KEY); } catch (_) {}
  document.querySelectorAll('.thread').forEach(t => t.classList.remove('active'));
  const first = document.querySelector('.thread');
  if (first) first.classList.add('active');
  promptInput.focus();
}
newChat?.addEventListener('click', clearChat);
newChatTop?.addEventListener('click', clearChat);

// Settings UI — intentionally local-only. Preferences are stored in localStorage.
const settingsOverlay = document.getElementById('settingsOverlay');
const settingsClose = document.getElementById('settingsClose');
const settingsHome = document.getElementById('settingsHome');
const settingsSubpage = document.getElementById('settingsSubpage');
const settingsRows = document.querySelectorAll('[data-settings]');
const SETTINGS_KEY = 'kira-settings-v1';
let kiraSettings = {};
try { kiraSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') || {}; } catch (_) {}
window.kiraSettings = kiraSettings;
const DEFAULT_SETTINGS = { name: 'Arya', style: 'natural', detail: 'balanced', emojis: false, context: true, memory: true, smartSearch: true, multiSource: true, enterSend: true, sources: true, voiceEnabled: false, voice: false, voiceRate: 1, voicePitch: 1, voice: '', language: 'auto', proactive: true };
kiraSettings = { ...DEFAULT_SETTINGS, ...kiraSettings };
window.kiraSettings = kiraSettings;

function saveSettings(){ try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(kiraSettings)); } catch (_) {} window.kiraSettings = kiraSettings; window.dispatchEvent(new CustomEvent('kira-settings-changed',{detail:kiraSettings})); }
function openSettings(){
  if (!settingsOverlay) return;
  settingsOverlay.classList.add('open'); settingsOverlay.setAttribute('aria-hidden','false');
  showSettingsHome(); document.body.style.overflow='hidden';
}
function closeSettings(){
  if (!settingsOverlay) return;
  settingsOverlay.classList.remove('open'); settingsOverlay.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
}
function showSettingsHome(){ settingsHome?.classList.remove('settings-subpage'); settingsSubpage?.classList.remove('open'); }
function escapeHtml(value){ return String(value ?? '').replace(/[&<>\"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[ch])); }


function getBrowserVoices(){
  return ('speechSynthesis' in window) ? window.speechSynthesis.getVoices() : [];
}
function populateVoiceSettings(){
  const select=document.getElementById('voiceChoice');
  if(!select) return;
  const list=getBrowserVoices();
  select.innerHTML='';
  if(!list.length){
    const o=document.createElement('option'); o.textContent='No browser voices available'; o.disabled=true; select.appendChild(o); return;
  }
  list.forEach(v=>{
    const o=document.createElement('option');
    o.value=v.name; o.textContent=`${v.name} — ${v.lang}`;
    if(v.name===kiraSettings.voice) o.selected=true;
    select.appendChild(o);
  });
  if(!kiraSettings.voice || !list.some(v=>v.name===kiraSettings.voice)){
    kiraSettings.voice=list[0].name; saveSettings();
  }
}
function speakKira(text){
  if(!kiraSettings.voiceEnabled || !('speechSynthesis' in window) || !text) return;
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(String(text).replace(/[*_`#]/g,''));
  const v=getBrowserVoices().find(x=>x.name===kiraSettings.voice);
  if(v) u.voice=v;
  u.rate=Number(kiraSettings.voiceRate)||1;
  u.pitch=Number(kiraSettings.voicePitch)||1;
  u.volume=1;
  speechSynthesis.speak(u);
}

function settingPage(key){
  const pages = {
    personalization: ['Personalization', `<label class="settings-field"><span>What should Kira call you?</span><input id="profileName" type="text" maxlength="40" value="${escapeHtml(kiraSettings.name || '')}" placeholder="Your name"></label><label class="settings-field"><span>Response style</span><select id="responseStyle"><option value="natural">Natural</option><option value="friendly">Friendly</option><option value="professional">Professional</option><option value="direct">Direct</option></select></label><label class="settings-field"><span>Answer detail</span><select id="answerDetail"><option value="concise">Concise</option><option value="balanced">Balanced</option><option value="detailed">Detailed</option></select></label><label class="settings-field"><span>Preferred language</span><select id="preferredLanguage"><option value="auto">Automatic</option><option value="en-US">English (US)</option><option value="en-GB">English (UK)</option><option value="ta-IN">Tamil</option><option value="hi-IN">Hindi</option></select></label><div class="settings-choice"><span>Use conversation context</span><button class="settings-toggle ${kiraSettings.context !== false ? 'on' : ''}" data-setting-toggle="context"></button></div><div class="settings-choice"><span>Ask useful follow-up questions</span><button class="settings-toggle ${kiraSettings.proactive !== false ? 'on' : ''}" data-setting-toggle="proactive"></button></div><div class="settings-choice"><span>Use emojis occasionally</span><button class="settings-toggle ${kiraSettings.emojis ? 'on' : ''}" data-setting-toggle="emojis"></button></div><p class="settings-note">Preferences are saved only in this browser. They affect Kira's local response behavior.</p>`],
    memory: ['Memory', `<div class="settings-choice"><span>Local memory</span><button class="settings-toggle ${kiraSettings.memory === false ? '' : 'on'}" data-setting-toggle="memory"></button></div><p class="settings-note">Kira can keep recent conversations in localStorage so follow-up questions make sense. Nothing is uploaded by this setting.</p><button class="settings-row" id="clearKiraMemory"><span class="row-icon">⌫</span><span class="row-main"><strong>Clear local memory</strong><small>Delete saved conversation context</small></span></button>`],
    research: ['Research & sources', `<div class="settings-choice"><span>Search only when useful</span><button class="settings-toggle ${kiraSettings.smartSearch !== false ? 'on' : ''}" data-setting-toggle="smartSearch"></button></div><div class="settings-choice"><span>Multiple sources for research</span><button class="settings-toggle ${kiraSettings.multiSource !== false ? 'on' : ''}" data-setting-toggle="multiSource"></button></div><p class="settings-note">Simple prompts such as greetings and arithmetic stay local. Research-style prompts can open normal web search pages; Kira does not use a search API.</p>`],
    appearance: ['Appearance', `<div class="settings-choice"><span>Theme</span><select id="themeChoice"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></div><p class="settings-note">The theme is stored locally on this device.</p>`],
    accent: ['Accent color', '<div class="settings-choice"><span>Blue</span><input type="radio" name="accent" value="blue" checked></div><div class="settings-choice"><span>Teal</span><input type="radio" name="accent" value="teal"></div><div class="settings-choice"><span>Purple</span><input type="radio" name="accent" value="purple"></div>'],
    workspace: ['Workspace', '<div class="settings-about"><strong>Personal</strong><br>Local Kira workspace. Your chats and preferences stay in this browser unless you manually export or share them.</div>'],
    usage: ['Usage and limits', '<div class="settings-about">This build has no subscription meter or AI API quota. Your practical limits are the browser, available memory, local storage, and any model/files you choose to run locally.</div>'],
    general: ['General', `<div class="settings-choice"><span>Send with Enter</span><button class="settings-toggle ${kiraSettings.enterSend !== false ? 'on' : ''}" data-setting-toggle="enterSend"></button></div><div class="settings-choice"><span>Show source cards</span><button class="settings-toggle ${kiraSettings.sources !== false ? 'on' : ''}" data-setting-toggle="sources"></button></div>`],
    notifications: ['Notifications', '<div class="settings-choice"><span>Browser notifications</span><button class="settings-toggle" data-toggle="notifications"></button></div><p class="settings-note">No notifications are enabled by default.</p>'],
    voice: ['Voice', `<div class="settings-choice"><span>Read answers aloud</span><button class="settings-toggle ${kiraSettings.voiceEnabled ? 'on' : ''}" data-setting-toggle="voiceEnabled"></button></div>
<label class="settings-field"><span>Voice</span><select id="voiceChoice"><option>Loading voices…</option></select></label>
<div class="settings-choice"><span>Speech speed</span><input id="voiceRate" type="range" min="0.5" max="2" step="0.05" value="${kiraSettings.voiceRate || 1}"><strong id="voiceRateValue">${kiraSettings.voiceRate || 1}×</strong></div>
<div class="settings-choice"><span>Pitch</span><input id="voicePitch" type="range" min="0.5" max="2" step="0.05" value="${kiraSettings.voicePitch || 1}"><strong id="voicePitchValue">${kiraSettings.voicePitch || 1}</strong></div>
<div class="settings-choice"><button class="settings-row-inline" id="previewVoice">▶ Preview voice</button><button class="settings-row-inline" id="stopVoice">■ Stop</button></div>
<p class="settings-note">Kira uses voices provided by your device/browser. No voice service or API is required. Available voices depend on your phone and browser.</p>`],
    security: ['Security and login', '<div class="settings-about">Kira v19 does not create a server account and does not send login credentials anywhere. This is a browser-local project.</div>'],
    privacy: ['Privacy center', '<div class="settings-about">Local chat memory, preferences and attached-file processing happen in your browser. External websites are opened only when you choose a web research/search action.</div>'],
    storage: ['Storage', '<div class="settings-about" id="storageInfo">Checking local storage…</div><button class="settings-row" id="clearKiraStorage"><span class="row-icon">⌫</span><span class="row-main"><strong>Clear Kira local data</strong><small>Chats, memory and preferences</small></span></button>'],
    data: ['Data controls', '<div class="settings-about">No AI API is configured. You can clear local data from Storage. Web research opens normal browser pages rather than sending data through a Kira backend.</div>'],
    remote: ['Remote control', '<div class="settings-about">Remote-control features are not enabled in this build.</div>'],
    report: ['Report bug', '<div class="settings-about">If something breaks, copy the browser console error and describe the steps that caused it. Kira has no built-in reporting server in this API-free build.</div>'],
    export: ['Export & backup', '<div class="settings-choice"><span>Export chat as text</span><button class="settings-row-inline" id="exportTxt">Export</button></div><div class="settings-choice"><span>Export chat as JSON</span><button class="settings-row-inline" id="exportJson">Export</button></div><p class="settings-note">Exports are generated locally. Nothing is uploaded.</p>'],
    about: ['About Kira', '<div class="settings-about"><strong>Kira v21 — Advanced Local</strong><br><br>Local-first browser assistant with adaptive conversation, rule-based reasoning, file handling, advanced image diagnostics and optional web navigation. No OpenAI, Hugging Face or other AI API is required.</div>']
  };
  const page=pages[key] || pages.about;
  settingsHome?.classList.add('settings-subpage'); settingsSubpage?.classList.add('open');
  settingsSubpage.innerHTML=`<h3>${page[0]}</h3>${page[1]}`;
  if(key==='voice'){
    populateVoiceSettings();
    const vs=document.getElementById('voiceChoice');
    const rate=document.getElementById('voiceRate');
    const pitch=document.getElementById('voicePitch');
    const rv=document.getElementById('voiceRateValue');
    const pv=document.getElementById('voicePitchValue');
    vs?.addEventListener('change',()=>{kiraSettings.voice=vs.value;saveSettings();});
    rate?.addEventListener('input',()=>{kiraSettings.voiceRate=Number(rate.value);rv.textContent=rate.value+'×';saveSettings();});
    pitch?.addEventListener('input',()=>{kiraSettings.voicePitch=Number(pitch.value);pv.textContent=pitch.value;saveSettings();});
    document.getElementById('previewVoice')?.addEventListener('click',()=>{
      const n=kiraSettings.name&&kiraSettings.name!=='Arya'?` ${kiraSettings.name}`:'';
      speakKira(`Hi${n}. I'm Kira. This is a preview of your selected voice.`);
    });
    document.getElementById('stopVoice')?.addEventListener('click',()=>speechSynthesis?.cancel());
  }

  settingsSubpage.querySelectorAll('[data-setting-toggle]').forEach(btn=>btn.addEventListener('click',()=>{
    const key=btn.dataset.settingToggle; const on=!btn.classList.contains('on'); btn.classList.toggle('on',on); kiraSettings[key]=on; saveSettings();
  }));
  const profileName=settingsSubpage.querySelector('#profileName');
  if(profileName){ profileName.addEventListener('change',()=>{kiraSettings.name=profileName.value.trim().slice(0,40)||'Arya'; saveSettings();}); }
  const responseStyle=settingsSubpage.querySelector('#responseStyle');
  if(responseStyle){ responseStyle.value=kiraSettings.style||'natural'; responseStyle.addEventListener('change',()=>{kiraSettings.style=responseStyle.value; saveSettings();}); }
  const answerDetail=settingsSubpage.querySelector('#answerDetail');
  if(answerDetail){ answerDetail.value=kiraSettings.detail||'balanced'; answerDetail.addEventListener('change',()=>{kiraSettings.detail=answerDetail.value; saveSettings();}); }
  const preferredLanguage=settingsSubpage.querySelector('#preferredLanguage');
  if(preferredLanguage){ preferredLanguage.value=kiraSettings.language||'auto'; preferredLanguage.addEventListener('change',()=>{kiraSettings.language=preferredLanguage.value; saveSettings();}); }
  const theme=settingsSubpage.querySelector('#themeChoice');
  if(theme){ theme.value=kiraSettings.theme||'system'; theme.addEventListener('change',()=>applyTheme(theme.value)); }
  settingsSubpage.querySelector('#clearKiraMemory')?.addEventListener('click',()=>{localStorage.removeItem('kira-local-memory-v15'); alert('Kira local memory cleared.');});
  settingsSubpage.querySelector('#clearKiraStorage')?.addEventListener('click',()=>{const keep=localStorage.getItem(SETTINGS_KEY); localStorage.clear(); if(keep)localStorage.setItem(SETTINGS_KEY,keep); location.reload();});
  const storage=settingsSubpage.querySelector('#storageInfo');
  if(storage){let bytes=0;try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i)||'';bytes+=k.length+(localStorage.getItem(k)||'').length;}}catch(_){} storage.textContent=`Approximately ${(bytes/1024).toFixed(1)} KB of local browser storage is currently used.`;}
  settingsSubpage.querySelectorAll('input[name="accent"]').forEach(r=>r.addEventListener('change',()=>applyAccent(r.value)));
  settingsSubpage.querySelector('#exportTxt')?.addEventListener('click',()=>exportChat('txt'));
  settingsSubpage.querySelector('#exportJson')?.addEventListener('click',()=>exportChat('json'));
}
function applyTheme(theme){ kiraSettings.theme=theme; saveSettings(); const dark=theme==='dark'||(theme==='system'&&matchMedia('(prefers-color-scheme: dark)').matches); document.documentElement.dataset.theme=dark?'dark':'light'; }
function applyAccent(accent){ kiraSettings.accent=accent; saveSettings(); document.documentElement.dataset.accent=accent; }
settingsRows.forEach(row=>row.addEventListener('click',()=>settingPage(row.dataset.settings)));
settingsClose?.addEventListener('click',()=>{ if(settingsSubpage?.classList.contains('open')) showSettingsHome(); else closeSettings(); });
settingsOverlay?.addEventListener('click',e=>{if(e.target===settingsOverlay)closeSettings();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSettings();});
// Account menu has a Settings row; wire it by its visible label rather than relying on icon classes.
accountMenu?.querySelectorAll('button').forEach(btn=>{if(/settings/i.test(btn.textContent||''))btn.addEventListener('click',e=>{e.stopPropagation();accountMenu.classList.remove('open');openSettings();});});
applyTheme(kiraSettings.theme||'system');
applyAccent(kiraSettings.accent||'blue');

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



// Restore the current conversation after all UI handlers are ready.
restoreChatState();
