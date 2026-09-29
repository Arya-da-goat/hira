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
