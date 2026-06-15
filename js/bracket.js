/* ═══════════════════════════════════════════════════════════════════════
   bracket.js — Round of 32 Bracket Projection
   ═══════════════════════════════════════════════════════════════════════ */

const BracketTab = {
  async load() {
    const container = document.getElementById('brk-content');
    const loading = document.getElementById('brk-loading');
    if (container.style.display !== 'none') return;

    const tournament = await App.fetchData('tournament.json');
    const eloData = await App.fetchData('elo.json');

    loading.style.display = 'none';
    container.style.display = 'block';

    if (!tournament) {
      container.innerHTML = '<div class="card"><div class="no-data">暂无对阵数据</div></div>';
      return;
    }

    const groups = tournament.groups || {};
    const thirds = tournament.best_thirds || [];
    const eloMap = {};
    if (eloData && eloData.ratings) {
      eloData.ratings.forEach(r => { eloMap[r.team] = r.elo; });
    }

    // Collect group winners and runners-up
    const winners = [];
    const runnersUp = [];

    for (const [g, table] of Object.entries(groups)) {
      if (table.length >= 1) {
        winners.push({ ...table[0], group: g });
      }
      if (table.length >= 2) {
        runnersUp.push({ ...table[1], group: g });
      }
    }

    // Sort winners by points then GD
    winners.sort((a, b) => b.pts - a.pts || b.gd - a.gd);
    runnersUp.sort((a, b) => b.pts - a.pts || b.gd - a.gd);

    // Advancing thirds
    const advancingThirds = thirds
      .filter(t => t.status && t.status.includes('ADVANCING'))
      .slice(0, 8);

    let html = '';

    // Header
    html += `
      <div class="card" style="text-align:center;background:linear-gradient(135deg,var(--navy),var(--green-dark));color:var(--white);margin-bottom:20px;">
        <h2 style="margin:0;">🏟 32 强对阵投影</h2>
        <p style="margin:8px 0 0;opacity:0.8;">
          基于当前积分榜自动推演 · 随比赛结果更新
        </p>
      </div>`;

    // Group Winners section
    html += `
      <div class="bracket-section card">
        <div class="bracket-section-title">🏆 小组第一（种子队 1-12）</div>
        <div class="bracket-grid">`;

    winners.forEach((w, i) => {
      const elo = eloMap[w.team] || '?';
      html += `
          <div class="bracket-team-card">
            <div class="bracket-seed">${i + 1}</div>
            <div class="bracket-team-info">
              <div class="bracket-team-name">${App.escapeHtml(w.team_cn)}</div>
              <div class="bracket-team-detail">
                Group ${App.escapeHtml(w.group)} · ${w.pts}pts · GD ${w.gd > 0 ? '+' + w.gd : w.gd} · Elo ${elo}
              </div>
            </div>
          </div>`;
    });

    html += `
        </div>
      </div>`;

    // Group Runners-up section
    html += `
      <div class="bracket-section card">
        <div class="bracket-section-title">🥈 小组第二（种子队 13-24）</div>
        <div class="bracket-grid">`;

    runnersUp.forEach((ru, i) => {
      const elo = eloMap[ru.team] || '?';
      html += `
          <div class="bracket-team-card">
            <div class="bracket-seed">${i + 13}</div>
            <div class="bracket-team-info">
              <div class="bracket-team-name">${App.escapeHtml(ru.team_cn)}</div>
              <div class="bracket-team-detail">
                Group ${App.escapeHtml(ru.group)} · ${ru.pts}pts · GD ${ru.gd > 0 ? '+' + ru.gd : ru.gd} · Elo ${elo}
              </div>
            </div>
          </div>`;
    });

    html += `
        </div>
      </div>`;

    // Best 3rd-Place section
    html += `
      <div class="bracket-section card">
        <div class="bracket-section-title">🥉 最佳小组第三（种子队 25-32，前8名晋级）</div>`;

    if (advancingThirds.length > 0) {
      html += '<div class="bracket-grid">';
      advancingThirds.forEach((t, i) => {
        const elo = eloMap[t.team] || '?';
        html += `
          <div class="bracket-team-card">
            <div class="bracket-seed" style="background:var(--orange);">${i + 25}</div>
            <div class="bracket-team-info">
              <div class="bracket-team-name">${App.escapeHtml(t.team_cn)}</div>
              <div class="bracket-team-detail">
                Group ${App.escapeHtml(t.group)} · ${t.pts}pts · GD ${t.gd > 0 ? '+' + t.gd : t.gd} · Elo ${elo}
              </div>
            </div>
          </div>`;
      });
      html += '</div>';
    } else {
      html += '<p class="no-data">小组赛数据不足，尚无法确定晋级小组第三</p>';
    }

    html += `
      </div>`;

    // Note
    html += `
      <div class="card" style="text-align:center;font-size:0.85rem;color:var(--gray-500);">
        ℹ️ 此对阵表为基于当前积分榜的实时投影，随着更多比赛结束将自动更新。
        32 强对阵规则：小组第一 vs 小组第三，小组第二之间相互对阵。
      </div>`;

    container.innerHTML = html;
  },
};
