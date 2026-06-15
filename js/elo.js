/* ═══════════════════════════════════════════════════════════════════════
   elo.js — Elo Rating Table
   - Sortable columns
   - Search/filter
   - Color-coded rating changes
   ═══════════════════════════════════════════════════════════════════════ */

const EloTab = {
  sortCol: 'elo',
  sortDir: 'desc',

  async load() {
    const container = document.getElementById('elo-content');
    const loading = document.getElementById('elo-loading');
    if (container.style.display !== 'none') return;

    const data = await App.fetchData('elo.json');

    loading.style.display = 'none';
    container.style.display = 'block';

    if (!data || !data.ratings || data.ratings.length === 0) {
      container.innerHTML = '<div class="card"><div class="no-data">暂无 Elo 数据</div></div>';
      return;
    }

    this.data = data;
    this.render(container);
  },

  render(container) {
    const updatedAt = this.data.updated_at || '';

    let html = `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <h3 style="margin:0;">📈 Elo 评分排名</h3>
          <input type="text" class="search-box" id="elo-search"
                 placeholder="🔍 搜索球队..." oninput="EloTab.filter()">
        </div>
        <p style="font-size:0.8rem;color:var(--gray-500);margin:4px 0 12px;">
          K=60 · 基于已完赛结果动态更新 · 更新于 ${App.escapeHtml(updatedAt)}
        </p>
        <div class="table-container">
          <table id="elo-table">
            <thead>
              <tr>
                <th class="sortable" onclick="EloTab.sort('rank')">
                  #<span class="sort-arrow"></span></th>
                <th class="sortable" onclick="EloTab.sort('team')">
                  球队<span class="sort-arrow"></span></th>
                <th class="sortable" onclick="EloTab.sort('elo')">
                  Elo<span class="sort-arrow"></span></th>
                <th class="sortable" onclick="EloTab.sort('change')">
                  变化<span class="sort-arrow"></span></th>
                <th>已赛</th>
              </tr>
            </thead>
            <tbody id="elo-tbody"></tbody>
          </table>
        </div>
      </div>`;

    container.innerHTML = html;
    this.renderTable();
  },

  renderTable(filter = '') {
    let ratings = [...this.data.ratings];

    // Filter
    if (filter) {
      const q = filter.toLowerCase();
      ratings = ratings.filter(r =>
        r.team.toLowerCase().includes(q) ||
        r.team_cn.includes(q)
      );
    }

    // Sort
    ratings.sort((a, b) => {
      let va, vb;
      if (this.sortCol === 'team') {
        va = a.team_cn || a.team;
        vb = b.team_cn || b.team;
        return this.sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      va = a[this.sortCol] || 0;
      vb = b[this.sortCol] || 0;
      return this.sortDir === 'asc' ? va - vb : vb - va;
    });

    const tbody = document.getElementById('elo-tbody');
    if (!tbody) return;

    let html = '';
    ratings.forEach((r, i) => {
      const change = r.change || 0;
      let changeHtml;
      if (change > 0) changeHtml = `<span class="change-up">+${change}</span>`;
      else if (change < 0) changeHtml = `<span class="change-down">${change}</span>`;
      else changeHtml = `<span class="change-zero">—</span>`;

      html += `
        <tr>
          <td>${i + 1}</td>
          <td class="team-cell">
            ${App.escapeHtml(r.team_cn)}
            <span class="team-en">${App.escapeHtml(r.team)}</span>
          </td>
          <td><strong>${r.elo}</strong></td>
          <td>${changeHtml}</td>
          <td>${r.matches || 0}</td>
        </tr>`;
    });

    tbody.innerHTML = html;
  },

  sort(col) {
    if (this.sortCol === col) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortCol = col;
      this.sortDir = col === 'team' ? 'asc' : 'desc';
    }
    this.renderTable(document.getElementById('elo-search')?.value || '');
  },

  filter() {
    const q = document.getElementById('elo-search')?.value || '';
    this.renderTable(q);
  },
};
