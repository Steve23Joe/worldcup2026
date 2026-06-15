/* ═══════════════════════════════════════════════════════════════════════
   app.js — Main Application Controller
   - Tab switching
   - Beijing time display
   - JSON data fetching with cache-busting
   ═══════════════════════════════════════════════════════════════════════ */

const App = {
  dataCache: {},
  cacheTimestamps: {},
  CACHE_TTL_MS: 5 * 60 * 1000, // 5 minutes — data refreshes daily, but allow short cache for tab switches

  /* ── Initialize ──────────────────────────────────────────────────── */
  async init() {
    this.updateBeijingTime();
    setInterval(() => this.updateBeijingTime(), 60000);

    // Check for new version on load
    await this.checkVersion();

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });

    // Load default tab (predictions)
    this.switchTab('predictions');
  },

  /* ── Beijing Time ────────────────────────────────────────────────── */
  updateBeijingTime() {
    const now = new Date();
    const bj = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
    const str = bj.getFullYear() + '-' +
      String(bj.getMonth() + 1).padStart(2, '0') + '-' +
      String(bj.getDate()).padStart(2, '0') + ' ' +
      String(bj.getHours()).padStart(2, '0') + ':' +
      String(bj.getMinutes()).padStart(2, '0') + ':' +
      String(bj.getSeconds()).padStart(2, '0');
    const el = document.getElementById('bj-time');
    if (el) el.textContent = str + ' 北京时间';
  },

  /* ── Tab Switching ───────────────────────────────────────────────── */
  switchTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tabId);
    });

    // Update content panels
    document.querySelectorAll('.tab-content').forEach(s => {
      s.classList.toggle('active', s.id === 'tab-' + tabId);
    });

    // Trigger data load for this tab
    const loaders = {
      predictions: () => PredictionsTab.load(),
      standings: () => StandingsTab.load(),
      elo: () => EloTab.load(),
      bracket: () => BracketTab.load(),
      accuracy: () => AccuracyTab.load(),
    };
    if (loaders[tabId]) loaders[tabId]();
  },

  /* ── JSON Fetch with Cache-Busting ────────────────────────────────── */
  async fetchData(filename) {
    // Check in-memory cache with TTL
    const now = Date.now();
    const cached = this.dataCache[filename];
    const cachedAt = this.cacheTimestamps[filename] || 0;
    if (cached && (now - cachedAt) < this.CACHE_TTL_MS) {
      return cached;
    }

    try {
      // Add cache-busting: use version if available, otherwise timestamp
      const separator = filename.includes('?') ? '&' : '?';
      const bust = this._buildVersion || now;
      const url = 'data/' + filename + separator + 'v=' + bust;
      const resp = await fetch(url, { cache: 'no-cache' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      this.dataCache[filename] = data;
      this.cacheTimestamps[filename] = now;
      return data;
    } catch (err) {
      console.error(`Failed to load ${filename}:`, err);
      // Return stale cache if available and network failed
      if (cached) return cached;
      return null;
    }
  },

  /* ── Version Check ───────────────────────────────────────────────── */
  async checkVersion() {
    try {
      const v = Date.now();
      const resp = await fetch('version.txt?v=' + v, { cache: 'no-cache' });
      if (resp.ok) {
        const text = await resp.text();
        this._buildVersion = text.trim();
        // If version changed since last visit, force full page reload
        const stored = localStorage.getItem('_wc_version');
        if (stored && stored !== this._buildVersion) {
          console.log('New version detected: ' + this._buildVersion + ' (was ' + stored + '). Reloading...');
          localStorage.setItem('_wc_version', this._buildVersion);
          window.location.reload(true);
          return; // never reached — page reloads
        }
        localStorage.setItem('_wc_version', this._buildVersion);
      }
    } catch (e) {
      // version.txt not found — use timestamp fallback in fetchData
      this._buildVersion = null;
    }
  },

  /* ── Helpers ─────────────────────────────────────────────────────── */
  /** Simple markdown-to-HTML for Chinese analysis text */
  renderMarkdown(text) {
    if (!text) return '';
    let html = text
      // Escape HTML
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Headers
      .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      // Bullet points
      .replace(/^[•·] (.+)$/gm, '<li>$1</li>')
      .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
      .replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')
      .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
      // Newlines to <br> or </p><p>
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    html = '<p>' + html + '</p>';
    // Clean up empty paragraphs and double wraps
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p><ul>/g, '<ul>');
    html = html.replace(/<\/ul><\/p>/g, '</ul>');
    html = html.replace(/<p><h([234])>/g, '<h$1>');
    html = html.replace(/<\/h([234])><\/p>/g, '</h$1>');
    return html;
  },

  /** Render star string from count */
  renderStars(count) {
    if (count == null) return '';
    return '★'.repeat(count) + '☆'.repeat(5 - count);
  },

  /** Escape HTML */
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
