import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/download-zip', async (req, res) => {
  try {
    const zip = new JSZip();
    const filesToInclude = [
      'index.html',
      'styles.css',
      'app.js',
      'markdown.js',
      'local-ai.js',
      'knowledge.js',
      'server.js',
      'package.json',
      'README.md',
      'metadata.json'
    ];

    for (const file of filesToInclude) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        const content = await fs.promises.readFile(filePath);
        zip.file(file, content);
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="kira-project.zip"');
    res.send(zipBuffer);
  } catch (err) {
    console.error('Error creating zip archive:', err);
    res.status(500).send('Error generating zip');
  }
});

app.use(express.static(__dirname));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
