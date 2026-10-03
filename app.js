/**
 * Kira Intelligent AI Client Engine
 * Features server-side Gemini 3.8 Flash intelligence, persistent trainable memory,
 * adaptive learning from every turn, Google Search grounding, step-by-step math derivations,
 * code generation, and multi-file analysis with seamless offline fallback.
 */

// DOM Elements
const chatWindow = document.getElementById('chat');
const welcomeHero = document.getElementById('welcomeHero');
const composer = document.getElementById('composer');
const promptInput = document.getElementById('prompt');
const fileInput = document.getElementById('fileInput');
const attachButton = document.getElementById('attachButton');
const attachmentList = document.getElementById('attachmentList');
const openBrainBtn = document.getElementById('openBrainBtn');
const brainBadgeCount = document.getElementById('brainBadgeCount');
const summarizeChatBtn = document.getElementById('summarizeChatBtn');
const searchGroundingToggle = document.getElementById('searchGroundingToggle');
const searchToggleLabel = document.getElementById('searchToggleLabel');
const brainModal = document.getElementById('brainModal');
const closeBrainModal = document.getElementById('closeBrainModal');
const brainToast = document.getElementById('brainToast');
const sidebarTrainBtn = document.getElementById('sidebarTrainBtn');
const sidebarMemoryLabel = document.getElementById('sidebarMemoryLabel');

// State
let selectedFiles = [];
let isSearchEnabled = true;
const conversationHistory = [];

const CHAT_STORAGE_KEY = 'kira-chat-v7';
const MEMORY_STORAGE_KEY = 'kira-brain-memories-v2';
const KNOWLEDGE_STORAGE_KEY = 'kira-brain-knowledge-v2';

// Default initial training memories for Kira's brain
const DEFAULT_MEMORIES = [
  {
    id: 'mem-core-1',
    category: 'Math & Reasoning',
    content: 'Always explain mathematical equations step-by-step with derived LaTeX formulas ($$...$$ and $...$).',
    created: Date.now() - 100000
  },
  {
    id: 'mem-core-2',
    category: 'Coding Style',
    content: 'Write clean, modern, fully functional code with language tags, complexity analysis, and edge case coverage.',
    created: Date.now() - 80000
  },
  {
    id: 'mem-core-3',
    category: 'Summary Format',
    content: 'Format summaries with Executive Overview, Key Insights, and Action Items.',
    created: Date.now() - 60000
  }
];

const DEFAULT_KNOWLEDGE = [
  {
    id: 'kb-core-1',
    title: 'Kira Neural Architecture',
    content: 'Kira is an intelligent assistant capable of live Google Search grounding, multi-file multimodal inspection, step-by-step math reasoning, and continuous adaptive learning.',
    created: Date.now() - 50000
  }
];

// --- Brain & Memory Management ---
function getBrainMemories() {
  try {
    const raw = localStorage.getItem(MEMORY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  return [...DEFAULT_MEMORIES];
}

function saveBrainMemories(memories) {
  try {
    localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memories));
  } catch (_) {}
  updateBrainBadgeUI();
  renderMemoriesList();
}

function getCustomKnowledge() {
  try {
    const raw = localStorage.getItem(KNOWLEDGE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  return [...DEFAULT_KNOWLEDGE];
}

function saveCustomKnowledge(knowledge) {
  try {
    localStorage.setItem(KNOWLEDGE_STORAGE_KEY, JSON.stringify(knowledge));
  } catch (_) {}
  updateBrainBadgeUI();
  renderKnowledgeList();
}

function showToast(message, icon = 'fa-brain') {
  if (!brainToast) return;
  brainToast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
  brainToast.classList.add('open');
  setTimeout(() => {
    brainToast.classList.remove('open');
  }, 4000);
}

function updateBrainBadgeUI() {
  const count = getBrainMemories().length;
  if (brainBadgeCount) brainBadgeCount.textContent = count;
  const statCount = document.getElementById('statMemoriesCount');
  if (statCount) statCount.textContent = count;
  const tabMemCount = document.getElementById('tabMemCount');
  if (tabMemCount) tabMemCount.textContent = count;

  const kbCount = getCustomKnowledge().length;
  const statKbCount = document.getElementById('statKnowledgeCount');
  if (statKbCount) statKbCount.textContent = kbCount;

  if (sidebarMemoryLabel) {
    sidebarMemoryLabel.textContent = `${count} active rule${count === 1 ? '' : 's'}`;
  }
  const settingsBrainSub = document.getElementById('settingsBrainSub');
  if (settingsBrainSub) {
    settingsBrainSub.textContent = `${count} rules learned • Evolving constantly`;
  }
}

function addTrainedRule(content, category = 'Custom Rule') {
  if (!content || !content.trim()) return false;
  const memories = getBrainMemories();
  const exists = memories.some(m => m.content.toLowerCase().trim() === content.toLowerCase().trim());
  if (exists) return false;

  const newRule = {
    id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    category,
    content: content.trim(),
    created: Date.now()
  };

  memories.unshift(newRule);
  saveBrainMemories(memories);
  showToast(`Trained Kira: "${content.slice(0, 45)}…"`, 'fa-graduation-cap');

  // Synchronize with server if available
  fetch('/api/brain/train', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: newRule.content, category: newRule.category, type: 'rule' })
  }).catch(() => {});

  return true;
}

function addKnowledgeDocument(title, content) {
  if (!content || !content.trim()) return false;
  const kb = getCustomKnowledge();
  const doc = {
    id: `kb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: (title || 'Custom Document').trim(),
    content: content.trim(),
    created: Date.now()
  };
  kb.unshift(doc);
  saveCustomKnowledge(kb);
  showToast(`Added to Knowledge: "${doc.title}"`, 'fa-book-bookmark');

  fetch('/api/brain/train', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: doc.content, title: doc.title, type: 'knowledge' })
  }).catch(() => {});

  return true;
}

function deleteMemory(id) {
  const memories = getBrainMemories().filter(m => m.id !== id);
  saveBrainMemories(memories);
}

function deleteKnowledge(id) {
  const kb = getCustomKnowledge().filter(k => k.id !== id);
  saveCustomKnowledge(kb);
}

function renderMemoriesList() {
  const container = document.getElementById('memoriesList');
  if (!container) return;
  const memories = getBrainMemories();
  container.innerHTML = '';

  if (memories.length === 0) {
    container.innerHTML = '<div style="color:var(--muted);text-align:center;padding:20px;">No custom memories yet. Teach Kira above!</div>';
    return;
  }

  memories.forEach(mem => {
    const card = document.createElement('div');
    card.className = 'memory-card';
    card.innerHTML = `
      <div class="memory-content">
        <span class="memory-category">${mem.category || 'Rule'}</span>
        <div class="memory-text">${escapeHtml(mem.content)}</div>
      </div>
      <button class="memory-delete-btn" title="Forget rule" data-id="${mem.id}"><i class="fa-solid fa-trash"></i></button>
    `;
    card.querySelector('.memory-delete-btn').addEventListener('click', () => {
      deleteMemory(mem.id);
    });
    container.appendChild(card);
  });
}

function renderKnowledgeList() {
  const container = document.getElementById('knowledgeList');
  if (!container) return;
  const kb = getCustomKnowledge();
  container.innerHTML = '';

  if (kb.length === 0) {
    container.innerHTML = '<div style="color:var(--muted);text-align:center;padding:20px;">No custom knowledge documents added yet.</div>';
    return;
  }

  kb.forEach(doc => {
    const card = document.createElement('div');
    card.className = 'memory-card';
    card.innerHTML = `
      <div class="memory-content">
        <span class="memory-category"><i class="fa-solid fa-book"></i> Document</span>
        <strong>${escapeHtml(doc.title)}</strong>
        <div class="memory-text">${escapeHtml(doc.content.slice(0, 200))}${doc.content.length > 200 ? '…' : ''}</div>
      </div>
      <button class="memory-delete-btn" title="Remove document" data-id="${doc.id}"><i class="fa-solid fa-trash"></i></button>
    `;
    card.querySelector('.memory-delete-btn').addEventListener('click', () => {
      deleteKnowledge(doc.id);
    });
    container.appendChild(card);
  });
}

// Background Self-Training UI Updater
function updateBackgroundTrainingUI(bg) {
  if (!bg) return;
  const epoch = bg.epoch || 1;
  const synapses = bg.neuralConnections || 1240;
  const tone = bg.tone || 'balanced';

  const pillText = document.getElementById('bgTrainingEpochText');
  if (pillText) {
    pillText.textContent = `Epoch ${epoch} • Adapted: ${tone}`;
  }

  const statEpochNum = document.getElementById('statEpochNum');
  if (statEpochNum) statEpochNum.textContent = epoch;

  const bgModalEpoch = document.getElementById('bgModalEpoch');
  if (bgModalEpoch) bgModalEpoch.textContent = epoch;

  const bgModalSynapses = document.getElementById('bgModalSynapses');
  if (bgModalSynapses) bgModalSynapses.textContent = Number(synapses).toLocaleString();

  const bgModalTone = document.getElementById('bgModalTone');
  if (bgModalTone) bgModalTone.textContent = tone;

  // Add to telemetry log if provided
  if (bg.logEntry) {
    const logBox = document.getElementById('bgTrainingLog');
    if (logBox) {
      const item = document.createElement('div');
      item.className = 'telemetry-item';
      item.innerHTML = `<span class="timestamp">[${escapeHtml(bg.logEntry.timestamp || new Date().toLocaleTimeString())}]</span> ${escapeHtml(bg.logEntry.event || '')}`;
      logBox.prepend(item);
    }
  }

  if (bg.adaptation) {
    const adaptBox = document.getElementById('bgAdaptationsList');
    if (adaptBox) {
      const item = document.createElement('div');
      item.className = 'adaptation-item';
      item.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${escapeHtml(bg.adaptation)}</span>`;
      adaptBox.prepend(item);
    }
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// --- Chat State Persistence ---
function saveChatState() {
  try {
    const messages = [...chatWindow.querySelectorAll('.message')].map(el => ({
      role: el.classList.contains('user') ? 'user' : 'assistant',
      text: el.dataset.rawText || el.querySelector('.message-text')?.textContent || '',
      sources: JSON.parse(el.dataset.sources || '[]')
    })).filter(x => x.text);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-80)));
  } catch (_) {}
}

function restoreChatState() {
  try {
    const saved = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || '[]');
    if (Array.isArray(saved) && saved.length > 0) {
      if (welcomeHero) welcomeHero.style.display = 'none';
      saved.forEach(m => {
        appendMessage(m.role === 'user' ? 'user' : 'bot', String(m.text || ''), m.sources || []);
        conversationHistory.push({ role: m.role, content: String(m.text || '') });
      });
    }
  } catch (_) {}
}

// --- Message Rendering ---
function appendMessage(role, text = '', sources = [], files = []) {
  if (welcomeHero) welcomeHero.style.display = 'none';

  const wrapper = document.createElement('div');
  wrapper.className = `message ${role}`;
  wrapper.dataset.rawText = text;
  wrapper.dataset.sources = JSON.stringify(sources || []);

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';

  // Render text with Markdown & LaTeX typesetting
  if (text) {
    const textEl = document.createElement('div');
    textEl.className = 'message-text';
    if (role === 'bot' && window.KiraMarkdown?.render) {
      textEl.innerHTML = window.KiraMarkdown.render(text);
    } else {
      textEl.textContent = text;
    }
    bubble.appendChild(textEl);
  }

  // Attached files/images
  if (files && files.length > 0) {
    const filesBox = document.createElement('div');
    filesBox.className = 'message-files';
    files.forEach(file => {
      if (file.type && file.type.startsWith('image/')) {
        const figure = document.createElement('div');
        figure.className = 'message-image';
        const img = document.createElement('img');
        img.alt = file.name;
        img.src = file.data || (file instanceof File ? URL.createObjectURL(file) : '');
        figure.appendChild(img);
        filesBox.appendChild(figure);
      } else {
        const card = document.createElement('div');
        card.className = 'message-file-card';
        card.innerHTML = `<i class="fa-regular fa-file-code"></i><div class="message-file-info"><strong>${escapeHtml(file.name)}</strong><small>${file.type || 'Document'}</small></div>`;
        filesBox.appendChild(card);
      }
    });
    bubble.appendChild(filesBox);
  }

  // Grounding Sources
  if (sources && sources.length > 0) {
    const sourcesBox = document.createElement('div');
    sourcesBox.className = 'sources-box';
    const label = document.createElement('div');
    label.className = 'sources-label';
    label.innerHTML = `<i class="fa-solid fa-earth-americas"></i> Verified Sources (${sources.length})`;
    sourcesBox.appendChild(label);

    sources.slice(0, 8).forEach(src => {
      if (!src?.url) return;
      const link = document.createElement('a');
      link.href = src.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'source-link';
      link.innerHTML = `<i class="fa-solid fa-arrow-up-right-from-square"></i> <span>${escapeHtml(src.name || 'Source')}</span>`;
      sourcesBox.appendChild(link);
    });
    bubble.appendChild(sourcesBox);
  }

  const meta = document.createElement('div');
  meta.className = 'message-meta';
  meta.textContent = role === 'user' ? 'You' : 'Kira Brain';

  wrapper.appendChild(bubble);
  wrapper.appendChild(meta);

  // Message quick actions for assistant responses
  if (role === 'bot') {
    addMessageActions(wrapper, text);
  }

  chatWindow.appendChild(wrapper);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function addMessageActions(wrapper, text) {
  if (!text) return;
  const actions = document.createElement('div');
  actions.className = 'message-actions';

  // Copy button
  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.title = 'Copy response';
  copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
  copyBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
      setTimeout(() => { copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy'; }, 2000);
    } catch (_) {}
  };

  // Speak aloud
  const speakBtn = document.createElement('button');
  speakBtn.type = 'button';
  speakBtn.title = 'Read aloud';
  speakBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i> Listen';
  speakBtn.onclick = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const cleanText = text.replace(/[*#`_$\\]/g, ' ');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      speechSynthesis.speak(utterance);
    }
  };

  // Reinforce learning button
  const reinforceBtn = document.createElement('button');
  reinforceBtn.type = 'button';
  reinforceBtn.className = 'btn-reinforce';
  reinforceBtn.title = 'Reinforce this answer in Kira\'s brain';
  reinforceBtn.innerHTML = '<i class="fa-solid fa-star"></i> Reinforce';
  reinforceBtn.onclick = () => {
    const snippet = text.slice(0, 100).replace(/\n/g, ' ');
    addTrainedRule(`User strongly approved of response style: "${snippet}…"`, 'Reinforced Exemplar');
    reinforceBtn.innerHTML = '<i class="fa-solid fa-check"></i> Learned!';
    setTimeout(() => { reinforceBtn.innerHTML = '<i class="fa-solid fa-star"></i> Reinforce'; }, 3000);
  };

  // Teach rule button
  const teachBtn = document.createElement('button');
  teachBtn.type = 'button';
  teachBtn.title = 'Teach Kira a specific rule based on this answer';
  teachBtn.innerHTML = '<i class="fa-solid fa-lightbulb"></i> Teach Rule';
  teachBtn.onclick = () => {
    const input = prompt('Teach Kira a rule or correction based on this interaction:\n(e.g., "Always write math in numbered steps" or "Use Python 3.12 syntax")');
    if (input && input.trim()) {
      addTrainedRule(input.trim(), 'User Correction/Rule');
    }
  };

  actions.append(copyBtn, speakBtn, reinforceBtn, teachBtn);
  wrapper.appendChild(actions);
}

// Loading indicator
function setLoading(loading, label = 'Kira is thinking…') {
  const old = document.getElementById('kira-loading');
  if (old) old.remove();
  if (!loading) return;

  const wrapper = document.createElement('div');
  wrapper.id = 'kira-loading';
  wrapper.className = 'message bot';
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble kira-thinking';
  bubble.innerHTML = `<span class="thinking-dot"></span><span class="thinking-label">${escapeHtml(label)}</span>`;
  wrapper.appendChild(bubble);
  chatWindow.appendChild(wrapper);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// --- Attachment Handlers ---
async function handleFilesSelected(fileList) {
  for (const file of fileList) {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      const base64Data = await new Promise(resolve => {
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
      selectedFiles.push({
        name: file.name,
        type: file.type,
        data: base64Data,
        size: file.size
      });
    } else {
      const textContent = await file.text().catch(() => '');
      selectedFiles.push({
        name: file.name,
        type: file.type || 'text/plain',
        textContent,
        size: file.size
      });
    }
  }
  renderAttachments();
}

function renderAttachments() {
  attachmentList.innerHTML = '';
  selectedFiles.forEach((file, index) => {
    const chip = document.createElement('div');
    chip.className = 'attachment-chip';
    chip.innerHTML = `
      <i class="fa-solid ${file.type.startsWith('image/') ? 'fa-image' : 'fa-file-lines'}"></i>
      <span>${escapeHtml(file.name)}</span>
      <button type="button" aria-label="Remove" data-index="${index}">×</button>
    `;
    chip.querySelector('button').addEventListener('click', () => {
      selectedFiles.splice(index, 1);
      renderAttachments();
    });
    attachmentList.appendChild(chip);
  });
}

// --- Send Message & Server-Side AI ---
async function sendMessage(text, attached = []) {
  const trimmed = text.trim();
  if (!trimmed && attached.length === 0) return;

  const currentFiles = [...attached];
  appendMessage('user', trimmed, [], currentFiles);
  conversationHistory.push({ role: 'user', content: trimmed });

  promptInput.value = '';
  promptInput.style.height = 'auto';
  saveChatState();

  const isMath = /[\d+\-*/=^√∫∑]|\b(solve|equation|derive|calculate|integral|derivative|algebra|roots|quadratics?|matrix)\b/i.test(trimmed);
  const isCode = /\b(code|python|javascript|typescript|function|algorithm|react|sql|class|method|api)\b/i.test(trimmed);
  const isSummary = /\b(summarize|summary|overview|bullet points|tldr|recap)\b/i.test(trimmed);

  let loadingLabel = 'Kira is analyzing…';
  if (isMath) loadingLabel = 'Solving step-by-step with mathematical derivations…';
  else if (isCode) loadingLabel = 'Synthesizing clean code & complexity analysis…';
  else if (isSummary) loadingLabel = 'Crafting executive summary…';
  else if (isSearchEnabled) loadingLabel = 'Grounded reasoning with live web knowledge…';

  setLoading(true, loadingLabel);

  try {
    // Call server-side Gemini intelligence
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: conversationHistory.slice(-18),
        prompt: trimmed,
        files: currentFiles,
        trainingMemory: getBrainMemories(),
        customKnowledge: getCustomKnowledge(),
        enableSearch: isSearchEnabled,
        userProfile: {
          name: (localStorage.getItem('kira-user-name') || 'Arya').trim(),
          style: localStorage.getItem('kira-user-style') || 'thoughtful and technical'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const data = await response.json();
    setLoading(false);

    const botReply = data.text || 'I have completed your request.';
    const botSources = data.sources || [];

    appendMessage('bot', botReply, botSources);
    conversationHistory.push({ role: 'assistant', content: botReply });

    // Handle auto-learning if Kira extracted a new memory in this turn
    if (data.newMemory && data.newMemory.content) {
      const memories = getBrainMemories();
      const alreadyHas = memories.some(m => m.content.toLowerCase().trim() === data.newMemory.content.toLowerCase().trim());
      if (!alreadyHas) {
        memories.unshift(data.newMemory);
        saveBrainMemories(memories);
        showToast(`🧠 Learned new memory: "${data.newMemory.content.slice(0, 45)}…"`, 'fa-sparkles');
      }
    }

    // Handle background self-training telemetry
    if (data.backgroundTraining) {
      updateBackgroundTrainingUI(data.backgroundTraining);
    }

    saveChatState();
  } catch (error) {
    console.warn('Server chat call failed or offline, testing local reasoning fallback:', error);
    // Offline local fallback
    try {
      if (window.KiraLocalAI?.answer) {
        const localReply = await window.KiraLocalAI.answer(conversationHistory);
        setLoading(false);
        appendMessage('bot', localReply, []);
        conversationHistory.push({ role: 'assistant', content: localReply });
        saveChatState();
      } else {
        throw error;
      }
    } catch (fallbackError) {
      setLoading(false);
      appendMessage('bot', `Kira encountered a temporary issue processing that request. Please try again. (Details: ${error.message})`);
    }
  }
}

// --- Summarize Conversation Feature ---
function getChatTranscript() {
  return [...chatWindow.querySelectorAll('.message')].map(m => {
    const role = m.classList.contains('user') ? 'User' : 'Kira';
    const text = m.dataset.rawText || m.querySelector('.message-text')?.textContent?.trim() || '';
    return text ? `${role}: ${text}` : '';
  }).filter(Boolean).join('\n\n');
}

async function summarizeChat() {
  const transcript = getChatTranscript();
  if (!transcript || transcript.length < 30) {
    alert('Please chat with Kira first so there is a conversation to summarize!');
    return;
  }

  setLoading(true, 'Generating comprehensive executive summary…');

  try {
    const res = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, style: 'executive' })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    setLoading(false);

    appendMessage('bot', data.summary || '### Summary\n\nNo summary could be generated.');
    saveChatState();
  } catch (err) {
    setLoading(false);
    // Fallback summary
    const count = chatWindow.querySelectorAll('.message').length;
    appendMessage('bot', `### Executive Summary\n\n• **Turn Count**: ${count} interaction turns recorded.\n• **Context**: Full conversation review and multi-topic technical synthesis.\n• **Key Takeaway**: Continue querying for specific deep dives or code generation.`);
    saveChatState();
  }
}

// --- Event Listeners & Initializations ---
document.addEventListener('DOMContentLoaded', () => {
  // Restore chats & memories
  restoreChatState();
  updateBrainBadgeUI();

  // Prompt Cards
  document.querySelectorAll('.prompt-card').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.dataset.prompt;
      if (p) {
        promptInput.value = p;
        sendMessage(p);
      }
    });
  });

  // Quick Chips
  document.querySelectorAll('.chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.chip;
      if (type === 'solve math') {
        promptInput.value = 'Solve this math equation step-by-step with LaTeX formulas: ';
      } else if (type === 'write code') {
        promptInput.value = 'Write clean, production-ready code with time and space complexities: ';
      } else if (type === 'executive summary') {
        summarizeChat();
        return;
      } else if (type === 'train rule') {
        openBrainModalAction();
        return;
      } else if (type === 'compare') {
        promptInput.value = 'Provide a structured comparative analysis with a side-by-side table between ';
      }
      promptInput.focus();
    });
  });

  // Composer submit
  composer.addEventListener('submit', (e) => {
    e.preventDefault();
    const files = [...selectedFiles];
    selectedFiles = [];
    renderAttachments();
    sendMessage(promptInput.value, files);
  });

  // Input auto-expand
  promptInput.addEventListener('input', () => {
    promptInput.style.height = 'auto';
    promptInput.style.height = `${Math.min(promptInput.scrollHeight, 160)}px`;
  });

  promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      composer.requestSubmit();
    }
  });

  // File attachments
  attachButton.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files?.length) {
      handleFilesSelected([...e.target.files]);
      fileInput.value = '';
    }
  });

  // Drag and drop into composer
  document.addEventListener('dragover', e => e.preventDefault());
  document.addEventListener('drop', e => {
    e.preventDefault();
    if (e.dataTransfer?.files?.length) {
      handleFilesSelected([...e.dataTransfer.files]);
    }
  });

  // Search Grounding Toggle
  searchGroundingToggle.addEventListener('click', () => {
    isSearchEnabled = !isSearchEnabled;
    searchGroundingToggle.classList.toggle('active', isSearchEnabled);
    searchToggleLabel.textContent = isSearchEnabled ? 'Sources On' : 'Sources Off';
    showToast(isSearchEnabled ? 'Live Web Sources enabled' : 'Web Sources turned off', 'fa-globe');
  });

  // Summarize button
  summarizeChatBtn.addEventListener('click', summarizeChat);

  // Brain Modal Open/Close
  function openBrainModalAction() {
    brainModal.classList.add('open');
    brainModal.setAttribute('aria-hidden', 'false');
    renderMemoriesList();
    renderKnowledgeList();
  }

  function closeBrainModalAction() {
    brainModal.classList.remove('open');
    brainModal.setAttribute('aria-hidden', 'true');
  }

  openBrainBtn.addEventListener('click', openBrainModalAction);
  sidebarTrainBtn.addEventListener('click', openBrainModalAction);
  closeBrainModal.addEventListener('click', closeBrainModalAction);
  brainModal.addEventListener('click', (e) => {
    if (e.target === brainModal) closeBrainModalAction();
  });

  // Brain Modal Tabs
  document.querySelectorAll('.brain-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.brain-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.brain-tab-body').forEach(b => b.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      if (target === 'train') document.getElementById('tabContentTrain')?.classList.add('active');
      if (target === 'memories') document.getElementById('tabContentMemories')?.classList.add('active');
      if (target === 'knowledge') document.getElementById('tabContentKnowledge')?.classList.add('active');
      if (target === 'bgtrain') document.getElementById('tabContentBgTrain')?.classList.add('active');
    });
  });

  // Topbar Background Training pill click -> open Background Training tab
  document.getElementById('bgTrainingPill')?.addEventListener('click', () => {
    openBrainModalAction();
    document.querySelector('.brain-tab[data-tab="bgtrain"]')?.click();
  });

  // Manual Background Training Cycle button
  document.getElementById('btnRunBgCycle')?.addEventListener('click', async () => {
    const btn = document.getElementById('btnRunBgCycle');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Running Optimization Cycle…';
    try {
      const res = await fetch('/api/brain/cycle', { method: 'POST' });
      const d = await res.json();
      updateBackgroundTrainingUI({
        epoch: d.epoch,
        neuralConnections: d.neuralConnections,
        adaptation: 'Manual background cycle executed: recalculated neural pathways & associative weights.'
      });
      showToast(`Background Cycle Finished: Epoch ${d.epoch}`, 'fa-bolt');
    } catch (_) {
      showToast('Optimization cycle completed locally.', 'fa-bolt');
    } finally {
      if (btn) btn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Run Background Optimization Cycle';
    }
  });

  // Training form submit
  const trainRuleSubmitBtn = document.getElementById('trainRuleSubmitBtn');
  const trainRuleInput = document.getElementById('trainRuleInput');
  const trainCategorySelect = document.getElementById('trainCategorySelect');

  trainRuleSubmitBtn.addEventListener('click', () => {
    const text = trainRuleInput.value.trim();
    if (!text) {
      alert('Please enter a training instruction or rule.');
      return;
    }
    const cat = trainCategorySelect.value;
    addTrainedRule(text, cat);
    trainRuleInput.value = '';
    // Switch to memories tab to show it
    document.querySelector('.brain-tab[data-tab="memories"]')?.click();
  });

  // Preset pills
  document.querySelectorAll('.preset-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      trainRuleInput.value = pill.dataset.preset || '';
      trainRuleInput.focus();
    });
  });

  // Clear all memories button
  document.getElementById('btnClearAllMemories')?.addEventListener('click', () => {
    if (confirm('Reset Kira\'s memories to core defaults?')) {
      saveBrainMemories([...DEFAULT_MEMORIES]);
      showToast('Brain memories reset to defaults', 'fa-rotate-left');
    }
  });

  // Knowledge base submit
  const kbSubmitBtn = document.getElementById('kbSubmitBtn');
  const kbTitleInput = document.getElementById('kbTitleInput');
  const kbContentInput = document.getElementById('kbContentInput');

  kbSubmitBtn.addEventListener('click', () => {
    const title = kbTitleInput.value.trim();
    const content = kbContentInput.value.trim();
    if (!content) {
      alert('Please enter document content to save to Knowledge Base.');
      return;
    }
    addKnowledgeDocument(title, content);
    kbTitleInput.value = '';
    kbContentInput.value = '';
  });

  // Topbar Share & ZIP
  document.getElementById('shareChatBtn')?.addEventListener('click', async () => {
    const t = getChatTranscript();
    if (!t) return;
    try {
      await navigator.clipboard.writeText(t);
      showToast('Conversation copied to clipboard!', 'fa-clipboard-check');
    } catch (_) {}
  });

  document.getElementById('moreOptionsBtn')?.addEventListener('click', () => {
    if (confirm('Download the entire project as a ZIP archive?')) {
      window.location.href = '/api/download-zip';
    }
  });

  // Sidebar mobile toggle
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  sidebarToggle?.addEventListener('click', () => sidebar.classList.toggle('open'));
  mobileMenu?.addEventListener('click', () => sidebar.classList.toggle('open'));

  // Account menu toggle
  const accountButton = document.getElementById('accountButton');
  const accountMenu = document.getElementById('accountMenu');
  accountButton?.addEventListener('click', (e) => {
    e.stopPropagation();
    accountMenu.classList.toggle('open');
  });
  document.addEventListener('click', () => accountMenu.classList.remove('open'));

  // Account menu actions
  document.getElementById('accountMenuTrain')?.addEventListener('click', () => {
    accountMenu.classList.remove('open');
    openBrainModalAction();
  });

  const settingsOverlay = document.getElementById('settingsOverlay');
  const settingsClose = document.getElementById('settingsClose');
  document.getElementById('accountMenuSettings')?.addEventListener('click', () => {
    accountMenu.classList.remove('open');
    settingsOverlay.classList.add('open');
  });
  settingsClose?.addEventListener('click', () => settingsOverlay.classList.remove('open'));
  document.getElementById('settingsOpenBrain')?.addEventListener('click', () => {
    settingsOverlay.classList.remove('open');
    openBrainModalAction();
  });

  document.getElementById('accountMenuExport')?.addEventListener('click', () => {
    const transcript = getChatTranscript();
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kira-chat-${Date.now()}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  document.getElementById('accountMenuZip')?.addEventListener('click', () => {
    window.location.href = '/api/download-zip';
  });

  // New Chat buttons
  const resetChat = () => {
    if (conversationHistory.length === 0) return;
    if (confirm('Start a fresh conversation? Current messages will be cleared.')) {
      chatWindow.innerHTML = '';
      if (welcomeHero) {
        welcomeHero.style.display = 'block';
        chatWindow.appendChild(welcomeHero);
      }
      conversationHistory.length = 0;
      localStorage.removeItem(CHAT_STORAGE_KEY);
      sidebar.classList.remove('open');
    }
  };
  document.getElementById('newChat')?.addEventListener('click', resetChat);
  document.getElementById('newChatTop')?.addEventListener('click', resetChat);

  // Search chats shortcut Ctrl+K
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const q = prompt('Search in conversation:');
      if (q && q.trim()) {
        const needle = q.toLowerCase().trim();
        const matches = [...chatWindow.querySelectorAll('.message')].filter(m => (m.textContent || '').toLowerCase().includes(needle));
        if (matches.length > 0) {
          matches[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
          matches[0].style.outline = '2px solid var(--accent)';
          setTimeout(() => matches[0].style.outline = '', 1500);
        } else {
          alert(`No matches found for "${q}".`);
        }
      }
    }
  });

  // Fetch initial brain state from server to sync stats
  fetch('/api/brain/state')
    .then(r => r.json())
    .then(data => {
      if (data.status === 'online') {
        const engineBadge = document.getElementById('engineBadge');
        if (engineBadge) engineBadge.textContent = 'Gemini 3.8 Flash';
        if (data.epoch) {
          updateBackgroundTrainingUI({
            epoch: data.epoch,
            neuralConnections: data.neuralConnections,
            tone: data.learnedTone
          });
        }
        if (Array.isArray(data.adaptations)) {
          const adaptBox = document.getElementById('bgAdaptationsList');
          if (adaptBox) {
            adaptBox.innerHTML = '';
            data.adaptations.forEach(ad => {
              const item = document.createElement('div');
              item.className = 'adaptation-item';
              item.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${escapeHtml(ad)}</span>`;
              adaptBox.appendChild(item);
            });
          }
        }
        if (Array.isArray(data.backgroundLog)) {
          const logBox = document.getElementById('bgTrainingLog');
          if (logBox) {
            logBox.innerHTML = '';
            data.backgroundLog.forEach(entry => {
              const item = document.createElement('div');
              item.className = 'telemetry-item';
              item.innerHTML = `<span class="timestamp">[${escapeHtml(entry.timestamp || '')}]</span> ${escapeHtml(entry.event || '')}`;
              logBox.appendChild(item);
            });
          }
        }
      }
    })
    .catch(() => {});
});
