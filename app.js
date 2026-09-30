import { inspectImages } from './vision.js';

const chatWindow = document.getElementById('chat');
const composer = document.getElementById('composer');
const promptInput = document.getElementById('prompt');

const MAX_CONTEXT_CHARS = 90000;
const MAX_SOURCE_RESULTS = 12;
const REQUEST_TIMEOUT = 12000;

function appendMessage(role, text = '', sources = [], files = []) {
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
        icon.className = file.type === 'application/pdf'
          ? 'fa-regular fa-file-pdf'
          : 'fa-regular fa-file-lines';

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

  if (sources.length) {
    const sourceBox = document.createElement('div');
    sourceBox.className = 'source-box';

    const title = document.createElement('div');
    title.className = 'source-title';
    title.textContent = `Sources (${sources.length})`;
    sourceBox.appendChild(title);

    sources.forEach((source) => {
      if (!source?.url) return;
      const link = document.createElement('a');
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'source-link';
      link.textContent = source.title || source.name || source.url;
      sourceBox.appendChild(link);
    });

    bubble.appendChild(sourceBox);
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

function setLoading(loading, label = 'Searching multiple sources…') {
  const old = document.getElementById('kira-loading');
  if (old) old.remove();
  if (!loading) return;

  const wrapper = document.createElement('div');
  wrapper.id = 'kira-loading';
  wrapper.className = 'message bot';

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble loading-bubble';
  bubble.innerHTML = `<span class="loading-dot"></span><span>${label}</span>`;
  wrapper.appendChild(bubble);

  chatWindow.appendChild(wrapper);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function fetchJSON(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function cleanText(text = '') {
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/\[\d+\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitSentences(text = '') {
  return cleanText(text)
    .match(/[^.!?]+(?:[.!?]+|$)/g)
    ?.map(s => s.trim())
    .filter(Boolean) || [];
}

function sentenceWords(sentence) {
  return new Set(
    sentence.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2)
  );
}

const STOP_WORDS = new Set(`
a an and are as at be been being but by can could did do does for from had has have he her hers him his how i if in into is it its just me more most my no not of on or our she so some than that the their them then there these they this to was we were what when where which who why will with would you your about after before between during each few other such through very
`.trim().split(/\s+/));

function keywords(text, limit = 10) {
  const counts = new Map();
  for (const word of cleanText(text).toLowerCase().match(/[a-z0-9][a-z0-9'-]{2,}/g) || []) {
    if (STOP_WORDS.has(word)) continue;
    counts.set(word, (counts.get(word) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

/*
  Long-input understanding:
  - keeps the user's exact request
  - extracts important terms from the whole message
  - selects representative sentences from long text
  - builds several smaller search queries instead of sending one enormous URL
*/
function understandLongInput(text) {
  const cleaned = cleanText(text);
  const sentences = splitSentences(cleaned);
  const terms = keywords(cleaned, 12);

  if (cleaned.length <= 1800) {
    return { cleaned, terms, chunks: [cleaned], long: false };
  }

  const target = 1400;
  const chunks = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).trim().length > target && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += (current ? ' ' : '') + sentence;
    }
  }
  if (current) chunks.push(current.trim());

  const important = [...chunks]
    .map(chunk => ({
      chunk,
      score: keywords(chunk, 8).filter(k => terms.includes(k)).length
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(x => x.chunk);

  return {
    cleaned,
    terms,
    chunks: important.length ? important : chunks.slice(0, 8),
    long: true
  };
}

async function wikipediaSearch(query) {
  const url = 'https://en.wikipedia.org/w/api.php?action=query&list=search' +
    '&srsearch=' + encodeURIComponent(query) +
    '&srlimit=5&format=json&origin=*';

  const data = await fetchJSON(url);
  return (data.query?.search || []).map(item => ({
    title: item.title,
    snippet: cleanText(item.snippet),
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replaceAll(' ', '_'))}`
  }));
}

async function wikipediaSummary(title) {
  try {
    const url = 'https://en.wikipedia.org/api/rest_v1/page/summary/' +
      encodeURIComponent(title.replaceAll(' ', '_'));
    const data = await fetchJSON(url);

    return data.extract ? {
      title: data.title,
      text: cleanText(data.extract),
      url: data.content_urls?.desktop?.page ||
        `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(' ', '_'))}`
    } : null;
  } catch {
    return null;
  }
}

async function wikidataSearch(query) {
  const url = 'https://www.wikidata.org/w/api.php?action=wbsearchentities' +
    '&search=' + encodeURIComponent(query) +
    '&language=en&uselang=en&limit=5&format=json&origin=*';

  const data = await fetchJSON(url);
  return (data.search || []).map(item => ({
    title: item.label || item.id,
    text: cleanText(item.description || ''),
    url: item.concepturi || `https://www.wikidata.org/wiki/${item.id}`
  })).filter(x => x.text);
}

async function openAlexSearch(query) {
  const url = 'https://api.openalex.org/works?search=' +
    encodeURIComponent(query) + '&per-page=4&select=id,title,publication_year,doi,abstract_inverted_index';

  const data = await fetchJSON(url);
  return (data.results || []).map(item => {
    let abstract = '';
    if (item.abstract_inverted_index) {
      const words = [];
      for (const [word, positions] of Object.entries(item.abstract_inverted_index)) {
        positions.forEach(pos => { words[pos] = word; });
      }
      abstract = cleanText(words.filter(Boolean).join(' '));
    }

    return {
      title: item.title || 'Research paper',
      text: abstract || `Published in ${item.publication_year || 'an academic source'}.`,
      url: item.doi || item.id || 'https://openalex.org/'
    };
  });
}

async function crossrefSearch(query) {
  const url = 'https://api.crossref.org/works?query.bibliographic=' +
    encodeURIComponent(query) + '&rows=4&select=title,DOI,published,URL,abstract';

  const data = await fetchJSON(url);
  return (data.message?.items || []).map(item => ({
    title: item.title?.[0] || 'Crossref result',
    text: cleanText(item.abstract || (
      item.published?.['date-parts']?.[0]
        ? `Published in ${item.published['date-parts'][0][0]}.`
        : ''
    )),
    url: item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : 'https://www.crossref.org/')
  }));
}

async function duckDuckGoSearch(query) {
  const url = 'https://api.duckduckgo.com/?q=' +
    encodeURIComponent(query) +
    '&format=json&no_html=1&skip_disambig=0';

  const data = await fetchJSON(url);
  const results = [];

  if (data.AbstractText) {
    results.push({
      title: data.Heading || 'DuckDuckGo Instant Answer',
      text: cleanText(data.AbstractText),
      url: data.AbstractURL || 'https://duckduckgo.com/'
    });
  }

  const walkTopics = (topics) => {
    for (const item of topics || []) {
      if (item.Topics) walkTopics(item.Topics);
      else if (item.Text) {
        results.push({
          title: cleanText(item.Text.split(' - ')[0] || 'DuckDuckGo result'),
          text: cleanText(item.Text),
          url: item.FirstURL || 'https://duckduckgo.com/'
        });
      }
    }
  };
  walkTopics(data.RelatedTopics);

  return results.slice(0, 5);
}

function relevanceScore(text, terms) {
  const words = sentenceWords(text);
  return terms.reduce((score, term) => score + (words.has(term) ? 1 : 0), 0);
}

function buildAnswer(results, understanding) {
  const usable = results
    .filter(r => r?.text)
    .map(r => ({ ...r, text: cleanText(r.text) }))
    .filter(r => r.text.length > 20);

  if (!usable.length) {
    return {
      text: 'I could not find enough information from the available sources. Try adding a more specific topic, name, date, or question.',
      sources: []
    };
  }

  // Rank snippets by overlap with the user's important terms.
  const ranked = usable
    .map(r => ({ ...r, score: relevanceScore(r.text + ' ' + (r.title || ''), understanding.terms) }))
    .sort((a, b) => b.score - a.score);

  const seen = new Set();
  const sentences = [];

  for (const item of ranked) {
    for (const sentence of splitSentences(item.text)) {
      if (sentence.length < 35) continue;
      const key = sentence.toLowerCase().slice(0, 180);
      if (seen.has(key)) continue;
      seen.add(key);
      sentences.push({
        sentence,
        score: relevanceScore(sentence, understanding.terms) + (item.score * 0.15)
      });
    }
  }

  sentences.sort((a, b) => b.score - a.score);

  const maxSentences = understanding.long ? 9 : 6;
  const answerSentences = sentences.slice(0, maxSentences).map(x => x.sentence);

  let answer = answerSentences.join(' ');
  if (answer.length > 5000) answer = answer.slice(0, 5000).replace(/\s+\S*$/, '') + '…';

  if (understanding.long) {
    answer = `I processed the long message and compared the most relevant parts across multiple sources.\n\n${answer}`;
  }

  const sourceMap = new Map();
  for (const item of ranked) {
    if (item.url && !sourceMap.has(item.url)) sourceMap.set(item.url, {
      title: item.title || item.name || 'Source',
      url: item.url
    });
  }

  return {
    text: answer,
    sources: [...sourceMap.values()].slice(0, MAX_SOURCE_RESULTS)
  };
}

async function webAnswer(query) {
  const understanding = understandLongInput(query);

  // Search several compact queries rather than one giant query.
  const baseQueries = [];
  if (understanding.terms.length) {
    baseQueries.push(understanding.terms.slice(0, 7).join(' '));
  }

  for (const chunk of understanding.chunks.slice(0, understanding.long ? 4 : 1)) {
    const terms = keywords(chunk, 7);
    if (terms.length) baseQueries.push(terms.join(' '));
  }

  const uniqueQueries = [...new Set(baseQueries)].slice(0, 5);

  const settled = await Promise.allSettled(
    uniqueQueries.map(async q => {
      const [wiki, wikidata, openAlex, crossref, duck] =
        await Promise.allSettled([
          wikipediaSearch(q),
          wikidataSearch(q),
          openAlexSearch(q),
          crossrefSearch(q),
          duckDuckGoSearch(q)
        ]);

      let wikiSummaryResults = [];
      if (wiki.status === 'fulfilled') {
        const summaries = await Promise.all(
          wiki.value.slice(0, 3).map(x => wikipediaSummary(x.title))
        );
        wikiSummaryResults = summaries.filter(Boolean).map(x => ({
          title: x.title, text: x.text, url: x.url
        }));
      }

      return [
        ...(wiki.status === 'fulfilled' ? wiki.value : []),
        ...wikiSummaryResults,
        ...(wikidata.status === 'fulfilled' ? wikidata.value : []),
        ...(openAlex.status === 'fulfilled' ? openAlex.value : []),
        ...(crossref.status === 'fulfilled' ? crossref.value : []),
        ...(duck.status === 'fulfilled' ? duck.value : [])
      ];
    })
  );

  const results = settled
    .filter(x => x.status === 'fulfilled')
    .flatMap(x => x.value);

  return buildAnswer(results, understanding);
}


async function fileToDataURL(file) {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}


async function extractFileContext(attachedFiles) {
  const parts = [];
  for (const file of attachedFiles) {
    if (/\.(txt|md|csv|json|js|css|html|py|xml|log|yaml|yml)$/i.test(file.name) ||
        file.type.startsWith('text/')) {
      try {
        const content = await file.text();
        parts.push(`File: ${file.name}\n${content}`);
      } catch {}
    }
  }

  const combined = parts.join('\n\n');
  return combined.slice(0, MAX_CONTEXT_CHARS);
}

async function sendMessage(text, attachedFiles = []) {
  const trimmed = text.trim();
  if (!trimmed && !attachedFiles.length) return;

  appendMessage('user', trimmed, [], attachedFiles);
  promptInput.value = '';
  promptInput.style.height = '54px';
  setLoading(true);

  try {
    const images = attachedFiles.filter(file => file.type.startsWith('image/'));
    const nonImages = attachedFiles.filter(file => !file.type.startsWith('image/'));

    let visionAnswer = '';

    if (images.length) {
      visionAnswer = await inspectImages(
        images,
        trimmed,
        (status) => setLoading(true, status)
      );

      if (visionAnswer) {
        appendMessage(
          'bot',
          `🖼️ **Local image inspection**\n\n${visionAnswer}`
            .replace(/\*\*/g, '')
        );
      }
    }

    const fileContext = await extractFileContext(nonImages);
    const queryParts = [trimmed, fileContext].filter(Boolean);

    // If there is no textual request but images were supplied, image inspection
    // is the complete answer and we don't waste web requests.
    if (!queryParts.length) {
      setLoading(false);
      if (!visionAnswer) {
        appendMessage('bot', 'The file is attached. Tell me what you want Kira to inspect.');
      }
      return;
    }

    const query = queryParts.join('\n\n');
    const understanding = understandLongInput(query);

    if (understanding.long) {
      setLoading(true, 'Reading the long message and comparing sources…');
    } else {
      setLoading(true, 'Searching free sources…');
    }

    const answer = await webAnswer(query);
    setLoading(false);

    if (answer.text && answer.text.trim()) {
      appendMessage('bot', answer.text, answer.sources);
    }
  } catch (error) {
    setLoading(false);
    console.error(error);

    const message = error?.message || String(error);
    if (message.includes('WebGPU') || message.includes('vision') || message.includes('model')) {
      appendMessage(
        'bot',
        'I could not load the local vision model on this device. Try a current Chrome/Edge browser with WebGPU enabled, or retry using CPU/WASM mode.'
      );
    } else {
      appendMessage(
        'bot',
        'Something went wrong while processing that request. Try again with a smaller file or shorter message.'
      );
    }
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
  promptInput.style.height = `${Math.min(promptInput.scrollHeight, 320)}px`;
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

document.querySelectorAll('.sidebar-new-chat, .sidebar-search, .thread').forEach((el) => {
  el.addEventListener('click', () => {
    if (window.innerWidth <= 900) toggleSidebar(false);
  });
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 900) sidebar?.classList.remove('open');
});

accountButton?.addEventListener('click', (e) => {
  e.stopPropagation();
  accountMenu.classList.toggle('open');
});
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
    icon.className = file.type.startsWith('image/')
      ? 'fa-regular fa-image'
      : 'fa-regular fa-file';

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
