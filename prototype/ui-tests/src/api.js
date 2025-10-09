const API_URL = 'http://localhost:3001/api';

export const api = {
  // Get all presets
  async getPresets() {
    const res = await fetch(`${API_URL}/presets`);
    return res.json();
  },

  // Get single preset
  async getPreset(id) {
    const res = await fetch(`${API_URL}/presets/${id}`);
    return res.json();
  },

  // Save preset
  async savePreset(name, config) {
    const res = await fetch(`${API_URL}/presets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, config }),
    });
    return res.json();
  },

  // Delete preset
  async deletePreset(id) {
    const res = await fetch(`${API_URL}/presets/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },
};
