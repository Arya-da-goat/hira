const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function generateReply(input) {
  const text = String(input || '').trim();
  if (!text) return 'How can I help you today?';

  const lower = text.toLowerCase();

  if (lower.includes('hello') || lower.includes('hi')) return 'Hello! I\'m Kira. What would you like to explore today?';
  if (lower.includes('plan') || lower.includes('strategy')) return 'I can help you turn that into a clear roadmap. Start with the goal, constraints, timeline, and key milestones, and I\'ll help structure it.';
  if (lower.includes('code') || lower.includes('build') || lower.includes('app')) return 'I can help design, debug, or improve a project. Share the goal, stack, and current blocker, and I\'ll guide the next steps.';
  if (lower.includes('idea') || lower.includes('brainstorm')) return 'Great idea. Let\'s clarify the problem, audience, and success metric, then I\'ll suggest a few practical directions.';
  if (lower.includes('write') || lower.includes('copy') || lower.includes('email')) return 'I can help draft polished copy. Tell me the audience, tone, and purpose, and I\'ll produce a concise version.';
  if (lower.includes('thank')) return 'You\'re very welcome. I\'m here whenever you want to think through the next step.';

  return `I\'m Kira, and I\'ve processed your message: “${text}”. I can help with ideas, planning, coding, writing, and product thinking. Tell me what you want to do next.`;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'POST' && url.pathname === '/api/chat') {
    let raw = '';

    req.on('data', chunk => {
      raw += chunk;
    });

    req.on('end', () => {
      try {
        const body = raw ? JSON.parse(raw) : {};
        const message = body.message || '';
        const reply = generateReply(message);

        sendJson(res, 200, {
          ok: true,
          reply,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        sendJson(res, 400, { ok: false, error: 'Invalid JSON payload' });
      }
    });

    return;
  }

  const safePath = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
      }

      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Server error');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Kira is running at http://localhost:${PORT}`);
});
