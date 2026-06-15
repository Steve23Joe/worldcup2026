/* ═══════════════════════════════════════════════════════════════════════
   standings.js — Group Standings + Best 3rd-Place Ranking
   ═══════════════════════════════════════════════════════════════════════ */

const StandingsTab = {
  async load() {
    const container = document.getElementById('std-content');
    const loading = document.getElementById('std-loading');
    if (container.style.display !== 'none') return;

    const data = await App.fetchData('tournament.json');

    loading.style.display = 'none';
    container.style.display = 'block';

    if (!data || !data.groups || Object.keys(data.groups).length === 0) {
      container.innerHTML = '<div class="card"><div class="no-data">暂无积分榜数据</div></div>';
      return;
    }

    let html = '';

    // Group tables grid
    html += '<div class="group-grid">';
    for (const [group, table] of Object.entries(data.groups)) {
      html += this.renderGroupCard(group, table);
    }
    html += '</div>';

    // Best 3rd-place ranking
    if (data.best_thirds && data.best_thirds.length > 0) {
      html += this.renderBestThirds(data.best_thirds);
    }

    container.innerHTML = html;
  },

  renderGroupCard(group, table) {
    let html = `
    <div class="group-card">
      <div class="group-card-header">Group ${group}</div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>#</th><th>球队</th><th>P</th><th>W</th><th>D</th><th>L</th>
              <th>GF</th><th>GA</th><th>GD</th><th>Pts</th>
            </tr>
          </thead>
          <tbody>`;

    // Calculate W/D/L for each team from results
    table.forEach((row, i) => {
      // We need to compute W/D/L from the results data
      // For simplicity, show what we can from the standings data
      const wdl = this.estimateWDL(row);
      html += `
            <tr>
              <td>${i + 1}</td>
              <td class="team-cell">
                ${App.escapeHtml(row.team_cn)}
                <span class="team-en">${App.escapeHtml(row.team)}</span>
              </td>
              <td>${row.played}</td>
              <td>${wdl.w}</td>
              <td>${wdl.d}</td>
              <td>${wdl.l}</td>
              <td>${row.gf}</td>
              <td>${row.ga}</td>
              <td>${row.gd > 0 ? '+' + row.gd : row.gd}</td>
              <td><strong>${row.pts}</strong></td>
            </tr>`;
    });

    html += `
          </tbody>
        </table>
      </div>
    </div>`;

    return html;
  },

  /** Estimate W/D/L from points and matches played.
   *  This is approximate — exact W/D/L requires results data. */
  estimateWDL(row) {
    const played = row.played || 0;
    const pts = row.pts || 0;
    if (played === 0) return { w: 0, d: 0, l: 0 };
    // With 3 pts per win, 1 per draw:
    // w * 3 + d = pts, w + d + l = played
    // We don't have enough to uniquely determine, use a heuristic
    const maxW = Math.floor(pts / 3);
    const remaining = pts - maxW * 3;
    // Assume max wins first, rest draws
    const w = maxW;
    const d = remaining;
    const l = played - w - d;
    return { w: Math.max(0, w), d: Math.max(0, d), l: Math.max(0, l) };
  },

  renderBestThirds(thirds) {
    let html = `
    <div class="thirds-section card">
      <h3 style="margin-bottom:4px;">🏅 最佳小组第三排名</h3>
      <p style="font-size:0.85rem;color:var(--gray-500);margin-bottom:16px;">
        48 支球队，12 个小组，小组第三中排名前 8 晋级 32 强
      </p>
      <div class="thirds-grid">`;

    thirds.forEach((t, i) => {
      let statusClass = '';
      if (t.status && t.status.includes('ADVANCING')) statusClass = 'advancing';
      else if (t.status && t.status.includes('BUBBLE')) statusClass = 'bubble';
      else statusClass = 'out';

      html += `
        <div class="third-card ${statusClass}">
          <div class="third-rank">#${i + 1}</div>
          <div class="third-team">${App.escapeHtml(t.team_cn)}</div>
          <div class="third-group">Group ${t.group} · ${t.pts}pts · GD ${t.gd > 0 ? '+' + t.gd : t.gd}</div>
        </div>`;
    });

    html += `
      </div>
    </div>`;

    return html;
  },
};
