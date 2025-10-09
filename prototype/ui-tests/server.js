import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const PRESETS_FILE = path.join(__dirname, 'presets.json');

// Middleware
app.use(cors());
app.use(express.json());

// Load presets from file
async function loadPresets() {
  try {
    const content = await fs.readFile(PRESETS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    // If file doesn't exist, return empty object
    return {};
  }
}

// Save presets to file
async function savePresets(presets) {
  await fs.writeFile(PRESETS_FILE, JSON.stringify(presets, null, 2));
}

// Get all presets
app.get('/api/presets', async (req, res) => {
  try {
    const presets = await loadPresets();
    // Convert object to array format
    const presetsArray = Object.entries(presets).map(([id, data]) => ({
      id,
      ...data,
    }));
    res.json(presetsArray);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single preset
app.get('/api/presets/:id', async (req, res) => {
  try {
    const presets = await loadPresets();
    const preset = presets[req.params.id];
    if (!preset) {
      return res.status(404).json({ error: 'Preset not found' });
    }
    res.json({ id: req.params.id, ...preset });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save preset
app.post('/api/presets', async (req, res) => {
  try {
    const { name, config } = req.body;
    if (!name || !config) {
      return res.status(400).json({ error: 'Name and config required' });
    }

    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const presets = await loadPresets();

    presets[id] = {
      name,
      config,
      updatedAt: new Date().toISOString(),
    };

    await savePresets(presets);
    res.json({ id, name, config });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete preset
app.delete('/api/presets/:id', async (req, res) => {
  try {
    const presets = await loadPresets();
    delete presets[req.params.id];
    await savePresets(presets);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Config server running on http://localhost:${PORT}`);
  console.log(`📁 Presets file: ${PRESETS_FILE}`);
});
