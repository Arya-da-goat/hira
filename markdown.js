/**
 * Kira Markdown & Syntax Highlighting Engine
 * Transforms markdown, code blocks, tables, and lists into polished interactive elements.
 */
(() => {
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function highlightCode(code, lang) {
    let escaped = escapeHtml(code);
    const l = (lang || '').toLowerCase().trim();

    if (['javascript', 'js', 'typescript', 'ts', 'jsx', 'tsx', 'node'].includes(l)) {
      // strings
      escaped = escaped.replace(/(['"`])((?:\\.|(?!\1).)*)\1/g, '<span class="hl-string">$1$2$1</span>');
      // comments
      escaped = escaped.replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>');
      // keywords
      escaped = escaped.replace(/\b(async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|function|if|import|in|instanceof|let|new|return|super|switch|this|throw|try|typeof|var|void|while|with|yield|from|as|interface|type|enum)\b/g, '<span class="hl-keyword">$1</span>');
      // builtins & primitives
      escaped = escaped.replace(/\b(true|false|null|undefined|NaN|Infinity)\b/g, '<span class="hl-builtin">$1</span>');
      escaped = escaped.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="hl-number">$1</span>');
      escaped = escaped.replace(/\b(console|document|window|Math|JSON|Promise|Array|Object|String|Number|Boolean|Set|Map|fetch|setTimeout|setInterval|clearTimeout|clearInterval)\b/g, '<span class="hl-builtin">$1</span>');
    } else if (['python', 'py'].includes(l)) {
      // multi-line strings / comments
      escaped = escaped.replace(/(['"]{3}[\s\S]*?['"]{3})/g, '<span class="hl-string">$1</span>');
      // single line strings
      escaped = escaped.replace(/(['"])((?:\\.|(?!\1).)*)\1/g, '<span class="hl-string">$1$2$1</span>');
      // comments
      escaped = escaped.replace(/(#[^\n]*)/g, '<span class="hl-comment">$1</span>');
      // keywords
      escaped = escaped.replace(/\b(and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield)\b/g, '<span class="hl-keyword">$1</span>');
      escaped = escaped.replace(/\b(True|False|None)\b/g, '<span class="hl-builtin">$1</span>');
      escaped = escaped.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="hl-number">$1</span>');
      escaped = escaped.replace(/\b(print|len|range|enumerate|zip|map|filter|int|str|float|list|dict|set|tuple|open|type|isinstance|sum|min|max|super)\b/g, '<span class="hl-builtin">$1</span>');
    } else if (['html', 'xml'].includes(l)) {
      escaped = escaped.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="hl-comment">$1</span>');
      escaped = escaped.replace(/(&lt;\/?)([a-zA-Z0-9\-]+)(.*?)(&gt;)/g, (m, p1, tag, attrs, p4) => {
        const styledAttrs = attrs.replace(/([a-zA-Z\-]+)=(&quot;.*?&quot;|&#039;.*?&#039;)/g, '<span class="hl-keyword">$1</span>=<span class="hl-string">$2</span>');
        return `${p1}<span class="hl-tag">${tag}</span>${styledAttrs}${p4}`;
      });
    } else if (['css', 'scss'].includes(l)) {
      escaped = escaped.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>');
      escaped = escaped.replace(/([a-zA-Z0-9\-_]+)\s*:/g, '<span class="hl-keyword">$1</span>:');
      escaped = escaped.replace(/(\b\d+(?:px|em|rem|%|vh|vw|s|ms|fr)?\b)/g, '<span class="hl-number">$1</span>');
      escaped = escaped.replace(/(#[a-fA-F0-9]{3,6})/g, '<span class="hl-string">$1</span>');
    } else if (['sql'].includes(l)) {
      escaped = escaped.replace(/(--[^\n]*|\/\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>');
      escaped = escaped.replace(/(['"])((?:\\.|(?!\1).)*)\1/g, '<span class="hl-string">$1$2$1</span>');
      escaped = escaped.replace(/\b(SELECT|FROM|WHERE|INSERT|INTO|UPDATE|DELETE|JOIN|LEFT|RIGHT|INNER|OUTER|FULL|CROSS|GROUP|BY|ORDER|HAVING|LIMIT|OFFSET|AS|ON|AND|OR|NOT|IN|EXISTS|BETWEEN|LIKE|IS|NULL|CREATE|TABLE|ALTER|DROP|PRIMARY|KEY|FOREIGN|INDEX|UNION|ALL|DISTINCT|COUNT|SUM|AVG|MIN|MAX|CASE|WHEN|THEN|ELSE|END)\b/gi, '<span class="hl-keyword">$1</span>');
      escaped = escaped.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="hl-number">$1</span>');
    } else if (['bash', 'sh', 'shell', 'zsh'].includes(l)) {
      escaped = escaped.replace(/(#[^\n]*)/g, '<span class="hl-comment">$1</span>');
      escaped = escaped.replace(/(['"])((?:\\.|(?!\1).)*)\1/g, '<span class="hl-string">$1$2$1</span>');
      escaped = escaped.replace(/\b(cd|ls|mkdir|rm|cp|mv|touch|cat|grep|chmod|chown|echo|export|source|sudo|curl|wget|git|npm|node|python|pip|docker|docker-compose)\b/g, '<span class="hl-keyword">$1</span>');
    } else if (['json'].includes(l)) {
      escaped = escaped.replace(/(&quot;.*?&quot;)\s*:/g, '<span class="hl-keyword">$1</span>:');
      escaped = escaped.replace(/:\s*(&quot;.*?&quot;)/g, ': <span class="hl-string">$1</span>');
      escaped = escaped.replace(/\b(true|false|null)\b/g, '<span class="hl-builtin">$1</span>');
      escaped = escaped.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="hl-number">$1</span>');
    } else {
      // generic
      escaped = escaped.replace(/(['"`])((?:\\.|(?!\1).)*)\1/g, '<span class="hl-string">$1$2$1</span>');
      escaped = escaped.replace(/(\/\/[^\n]*|#[^\n]*)/g, '<span class="hl-comment">$1</span>');
      escaped = escaped.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="hl-number">$1</span>');
    }

    return escaped;
  }

  function renderMarkdown(md) {
    if (!md) return '';
    let text = String(md).replace(/\r\n/g, '\n');

    // 1. Extract and store fenced code blocks
    const codeBlocks = [];
    text = text.replace(/```([a-zA-Z0-9_\-#+.]*)\n?([\s\S]*?)```/g, (match, lang, code) => {
      const idx = codeBlocks.length;
      codeBlocks.push({
        lang: (lang || 'code').trim(),
        code: code.replace(/\n$/, '')
      });
      return `\n\n@@@CODE_BLOCK_${idx}@@@\n\n`;
    });

    // 2. Parse Markdown Tables
    text = text.replace(/(?:^|\n)((?:\|[^\n]+\|\n)+)/g, (match, tableText) => {
      const lines = tableText.trim().split('\n');
      if (lines.length < 2) return match;
      // Check if second line is separator | --- | --- |
      if (!/^\|[\s\-:|]+\|$/.test(lines[1])) return match;

      const parseCells = row => row.split('|').slice(1, -1).map(c => c.trim());
      const headers = parseCells(lines[0]);
      const rows = lines.slice(2).map(parseCells);

      let html = '<table><thead><tr>';
      headers.forEach(h => {
        html += `<th>${formatInline(h)}</th>`;
      });
      html += '</tr></thead><tbody>';
      rows.forEach(r => {
        html += '<tr>';
        r.forEach((cell, i) => {
          html += `<td>${formatInline(cell || '')}</td>`;
        });
        html += '</tr>';
      });
      html += '</tbody></table>';
      return `\n\n${html}\n\n`;
    });

    // 3. Blockquotes
    text = text.replace(/(?:^|\n)(?:>[ ]?[^\n]*(?:\n>[ ]?[^\n]*)*)/g, match => {
      const cleaned = match.trim().split('\n').map(l => l.replace(/^>[ ]?/, '')).join('\n');
      return `\n\n<blockquote>${formatInline(cleaned)}</blockquote>\n\n`;
    });

    // 4. Headers
    text = text.replace(/^#### (.*?)$/gm, '<h4>$1</h4>');
    text = text.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    text = text.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    text = text.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

    // 5. Horizontal rule
    text = text.replace(/^(?:---|___|\*\*\*)$/gm, '<hr />');

    // 6. Lists (unordered & ordered)
    // Unordered
    text = text.replace(/(?:^|\n)((?:(?:[-*]|\u2022)[ ]+[^\n]+(?:\n|$))+)/g, (match, list) => {
      const items = list.trim().split('\n').map(l => l.replace(/^(?:[-*]|\u2022)[ ]+/, ''));
      return `\n\n<ul>${items.map(it => `<li>${formatInline(it)}</li>`).join('')}</ul>\n\n`;
    });

    // Ordered
    text = text.replace(/(?:^|\n)((?:\d+\.[ ]+[^\n]+(?:\n|$))+)/g, (match, list) => {
      const items = list.trim().split('\n').map(l => l.replace(/^\d+\.[ ]+/, ''));
      return `\n\n<ol>${items.map(it => `<li>${formatInline(it)}</li>`).join('')}</ol>\n\n`;
    });

    // 7. Paragraphs
    const blocks = text.split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
    const rendered = blocks.map(block => {
      if (/^<(h[1-4]|ul|ol|table|blockquote|hr|div)/i.test(block) || block.startsWith('@@@CODE_BLOCK_')) {
        return block;
      }
      return `<p>${formatInline(block).replace(/\n/g, '<br />')}</p>`;
    }).join('\n');

    // 8. Re-insert code blocks with syntax highlighting and copy button
    const finalHtml = rendered.replace(/@@@CODE_BLOCK_(\d+)@@@/g, (match, id) => {
      const item = codeBlocks[Number(id)];
      if (!item) return '';
      const encodedCode = encodeURIComponent(item.code);
      const highlighted = highlightCode(item.code, item.lang);
      return `<div class="code-block-wrapper">` +
        `<div class="code-block-header">` +
        `<span class="code-lang">${escapeHtml(item.lang || 'code')}</span>` +
        `<button type="button" class="code-copy-btn" data-code="${encodedCode}" title="Copy code">` +
        `<i class="fa-regular fa-copy"></i><span>Copy code</span>` +
        `</button>` +
        `</div>` +
        `<pre><code class="language-${escapeHtml(item.lang)}">${highlighted}</code></pre>` +
        `</div>`;
    });

    return finalHtml;
  }

  function formatInline(str) {
    let s = escapeHtml(str);

    // inline code `code`
    s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>');

    // bold **bold** or __bold__
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');

    // italic *italic* or _italic_
    s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    s = s.replace(/_([^_]+)_/g, '<em>$1</em>');

    // links [text](url)
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    return s;
  }

  // Global delegation for copy code buttons
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.code-copy-btn');
    if (!btn) return;
    const rawData = btn.getAttribute('data-code');
    if (!rawData) return;

    try {
      const code = decodeURIComponent(rawData);
      await navigator.clipboard.writeText(code);
      const originalHtml = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-check"></i><span>Copied!</span>';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.innerHTML = originalHtml;
        btn.classList.remove('copied');
      }, 2000);
    } catch (err) {
      console.error('Clipboard copy failed', err);
    }
  });

  window.KiraMarkdown = {
    render: renderMarkdown,
    escape: escapeHtml,
    highlight: highlightCode
  };
})();
