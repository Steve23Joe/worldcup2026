/* ═══════════════════════════════════════════════════════════════════════
   predictions.js — 比赛结果 & 预测 Tab
   - Loads predictions.json (historical_results + tomorrow predictions)
   - Renders 历史比赛结果 section with actual scores
   - Renders 明天预测 section with AI analysis
   ═══════════════════════════════════════════════════════════════════════ */

const PredictionsTab = {
  async load() {
    const container = document.getElementById('pred-content');
    const loading = document.getElementById('pred-loading');
    if (container.style.display !== 'none') return; // Already loaded

    const data = await App.fetchData('predictions.json');

    loading.style.display = 'none';
    container.style.display = 'block';

    if (!data) {
      container.innerHTML = `
        <div class="card">
          <div class="no-data">
            <p style="font-size:2rem;">📭</p>
            <p style="font-size:1.2rem;font-weight:600;">暂无数据</p>
            <p>数据尚未生成。</p>
          </div>
        </div>`;
      return;
    }

    // Update footer
    document.getElementById('footer-updated').textContent =
      data.generated_at || '—';

    let html = '';

    // ── Section 1: 历史比赛结果 ──
    html += this.renderHistoricalResults(data);

    // ── Section 2: 明天预测 ──
    html += this.renderTomorrowPredictions(data);

    container.innerHTML = html;

    // Attach collapsible section handlers
    container.querySelectorAll('.analysis-section-title').forEach(title => {
      title.addEventListener('click', () => {
        title.classList.toggle('collapsed');
        const content = title.nextElementSibling;
        content.classList.toggle('collapsed');
      });
    });

    // Attach result card expand handlers
    container.querySelectorAll('.result-card-header').forEach(header => {
      header.addEventListener('click', () => {
        const card = header.closest('.result-card');
        card.classList.toggle('expanded');
      });
    });
  },

  // ── Render historical results section ──
  renderHistoricalResults(data) {
    const historical = data.historical_results;
    if (!historical || historical.length === 0) {
      return `
        <div class="card" style="text-align:center;">
          <div class="no-data">
            <p style="font-size:1.5rem;">📋</p>
            <p style="font-weight:600;">暂无历史比赛记录</p>
          </div>
        </div>`;
    }

    let html = `
      <div class="card" style="text-align:center;background:linear-gradient(135deg,var(--navy),var(--green-dark));color:var(--white);margin-bottom:24px;">
        <h2 style="margin:0;font-size:1.4rem;">📋 历史比赛结果</h2>
        <p style="margin:8px 0 0;opacity:0.8;">${historical.length} 个比赛日 · ${historical.reduce((s, d) => s + d.match_count, 0)} 场比赛</p>
      </div>`;

    historical.forEach(day => {
      html += `
        <div class="result-day" style="margin-bottom:16px;">
          <div class="result-day-header" style="font-weight:700;font-size:1rem;color:var(--navy);padding:8px 0;border-bottom:2px solid var(--green);margin-bottom:8px;">
            📅 ${day.date_label_cn} · ${day.match_count} 场
          </div>`;

      day.matches.forEach(m => {
        html += this.renderResultCard(m);
      });

      html += '</div>';
    });

    return html;
  },

  // ── Render a single historical result card ──
  renderResultCard(m) {
    const hasGoals = m.goals && m.goals.trim();
    const hasNote = m.note && m.note.trim();
    const hasDetail = hasGoals || hasNote;

    return `
      <div class="result-card" style="background:var(--white);border:1px solid var(--gray-200);border-radius:10px;padding:16px;margin-bottom:8px;${hasDetail ? 'cursor:pointer;' : ''}">
        <div class="result-card-header" style="display:flex;align-items:center;justify-content:space-between;${hasDetail ? '' : 'cursor:default;'}">
          <div class="result-teams" style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:12px;">
              <div style="text-align:right;flex:1;min-width:0;">
                <div style="font-weight:700;font-size:1rem;">${App.escapeHtml(m.home_cn)}</div>
                <div style="font-size:0.75rem;color:var(--gray-500);">${App.escapeHtml(m.home)}</div>
              </div>
              <div class="result-score" style="font-size:1.5rem;font-weight:900;color:var(--navy);white-space:nowrap;padding:0 12px;">
                ${App.escapeHtml(m.score)}
              </div>
              <div style="text-align:left;flex:1;min-width:0;">
                <div style="font-weight:700;font-size:1rem;">${App.escapeHtml(m.away_cn)}</div>
                <div style="font-size:0.75rem;color:var(--gray-500);">${App.escapeHtml(m.away)}</div>
              </div>
            </div>
            <div style="display:flex;gap:12px;margin-top:8px;font-size:0.8rem;color:var(--gray-500);">
              <span>🏆 Group ${m.group}</span>
              ${m.venue_cn ? `<span>🏟 ${App.escapeHtml(m.venue_cn)}</span>` : ''}
              <span>🕐 ${App.escapeHtml(m.time_bj)} BJT</span>
            </div>
          </div>
          ${hasDetail ? '<span style="color:var(--gray-400);font-size:0.8rem;">展开 ▼</span>' : ''}
        </div>
        ${hasDetail ? `
        <div class="result-card-detail" style="display:none;margin-top:12px;padding-top:12px;border-top:1px solid var(--gray-200);font-size:0.9rem;line-height:1.8;color:var(--gray-700);">
          ${hasGoals ? `<div><strong>⚽ 进球：</strong>${App.escapeHtml(m.goals)}</div>` : ''}
          ${hasNote ? `<div style="margin-top:4px;"><strong>📝 备注：</strong>${App.escapeHtml(m.note)}</div>` : ''}
        </div>` : ''}
      </div>`;
  },

  // ── Render tomorrow predictions section ──
  renderTomorrowPredictions(data) {
    const matches = data.matches;
    if (!matches || matches.length === 0) {
      return `
        <div class="card" style="text-align:center;margin-top:24px;">
          <div class="no-data">
            <p style="font-size:1.5rem;">📭</p>
            <p style="font-size:1.1rem;font-weight:600;">暂无明日预测</p>
            <p style="font-size:0.85rem;color:var(--gray-500);">${data.date_label_cn} 没有未赛比赛，或数据尚未生成。</p>
          </div>
        </div>`;
    }

    let html = `
      <div class="card" style="text-align:center;background:linear-gradient(135deg,var(--navy),var(--green-dark));color:var(--white);margin-bottom:24px;margin-top:24px;">
        <h2 style="margin:0;font-size:1.4rem;">📅 ${data.date_label_cn} 比赛预测</h2>
        <p style="margin:8px 0 0;opacity:0.8;">共 ${data.match_count} 场比赛 · 生成时间：${data.generated_at}</p>
      </div>`;

    // Render each prediction match card
    data.matches.forEach((m, idx) => {
      html += this.renderMatchCard(m, idx);
    });

    return html;
  },

  renderMatchCard(m, idx) {
    const pred = m.prediction || {};
    const raw = m.raw_analysis || '';

    // Split raw analysis into the 4 sections
    const sections = this.splitSections(raw);

    let html = `
    <div class="match-card">
      <div class="match-card-header">
        <div class="match-team">
          <div class="match-team-name">${App.escapeHtml(m.home_cn)}</div>
          <div class="match-team-en">${App.escapeHtml(m.home)}</div>
        </div>
        <div class="match-vs">VS</div>
        <div class="match-team">
          <div class="match-team-name">${App.escapeHtml(m.away_cn)}</div>
          <div class="match-team-en">${App.escapeHtml(m.away)}</div>
        </div>
      </div>
      <div class="match-meta">
        <span>🏆 Group ${m.group}</span>
        <span>🏟 ${App.escapeHtml(m.venue_cn)}</span>
        <span>🕐 ${App.escapeHtml(m.time_bj)} BJT</span>
      </div>
      <div class="match-card-body">`;

    // Check if we have the full 4-part analysis or just a summary
    const hasFullAnalysis = sections.team || sections.players || sections.simulation;

    if (hasFullAnalysis) {
      // Full 4-part analysis
      if (sections.team) {
        html += this.renderSection('1. 球队分析', sections.team, true);
      }
      if (sections.players) {
        html += this.renderSection('2. 球员分析', sections.players);
      }
      if (sections.simulation) {
        html += this.renderSection('3. 赛事模拟', sections.simulation);
      }
      html += this.renderPredictionBox(pred, sections.prediction);
    } else if (pred.predicted_score || pred.confidence_stars != null) {
      // Summary mode: show prediction card with raw commentary
      html += this.renderSummaryCard(pred, raw);
    } else if (raw) {
      // Fallback: just render the raw text
      html += `<div class="analysis-content">${App.renderMarkdown(raw)}</div>`;
    } else {
      html += '<div class="no-data" style="padding:20px;">暂无分析数据</div>';
    }

    html += `
      </div>
    </div>`;

    return html;
  },

  /** Split raw Claude output into the 4 numbered sections */
  splitSections(raw) {
    const result = { team: '', players: '', simulation: '', prediction: '' };
    if (!raw) return result;

    // Find section boundaries using ## markers
    const teamMatch = raw.match(/##\s*1\.?\s*(?:Team Analysis|球队分析)([\s\S]*?)(?=##\s*2\.|$)/i);
    const playerMatch = raw.match(/##\s*2\.?\s*(?:Player Analysis|球员分析)([\s\S]*?)(?=##\s*3\.|$)/i);
    const simMatch = raw.match(/##\s*3\.?\s*(?:Match Simulation|赛事模拟)([\s\S]*?)(?=##\s*4\.|$)/i);
    const predMatch = raw.match(/##\s*4\.?\s*(?:Score Prediction|比分预测)([\s\S]*?)$/i);

    if (teamMatch) result.team = teamMatch[1].trim();
    if (playerMatch) result.players = playerMatch[1].trim();
    if (simMatch) result.simulation = simMatch[1].trim();
    if (predMatch) result.prediction = predMatch[1].trim();

    // If no ## markers found, try to use the entire raw content
    if (!result.team && !result.players && !result.simulation && !result.prediction) {
      result.team = raw;
    }

    return result;
  },

  /** Render a collapsible analysis section */
  renderSection(title, content, open = false) {
    const collapsedClass = open ? '' : ' collapsed';
    const contentClass = open ? '' : ' collapsed';
    return `
      <div class="analysis-section">
        <div class="analysis-section-title${collapsedClass}">
          <span class="toggle-icon">▼</span> ${title}
        </div>
        <div class="analysis-content${contentClass}">
          ${App.renderMarkdown(content)}
        </div>
      </div>`;
  },

  /** Render the prediction box with probability bars, scorelines, etc. */
  renderPredictionBox(pred, sectionText) {
    const hwp = pred.home_win_pct;
    const dp = pred.draw_pct;
    const awp = pred.away_win_pct;
    const scorelines = pred.scorelines || [];
    const predictedScore = pred.predicted_score;
    const stars = pred.confidence_stars;
    const hasProbs = hwp != null && dp != null && awp != null;

    let html = `
      <div class="analysis-section">
        <div class="analysis-section-title">
          <span class="toggle-icon">▼</span> 4. 比分预测
        </div>
        <div class="analysis-content">
          <div class="prediction-box">`;

    // Probability bars
    if (hasProbs) {
      html += `
            <div class="prob-legend">
              <div class="prob-legend-item">
                <div class="prob-dot home"></div> 主胜 ${hwp}%
              </div>
              <div class="prob-legend-item">
                <div class="prob-dot draw"></div> 平局 ${dp}%
              </div>
              <div class="prob-legend-item">
                <div class="prob-dot away"></div> 客胜 ${awp}%
              </div>
            </div>
            <div class="prob-bars">
              <div class="prob-bar home" style="width:${hwp}%">${hwp >= 15 ? hwp + '%' : ''}</div>
              <div class="prob-bar draw" style="width:${dp}%">${dp >= 15 ? dp + '%' : ''}</div>
              <div class="prob-bar away" style="width:${awp}%">${awp >= 15 ? awp + '%' : ''}</div>
            </div>`;
    }

    // Top 3 scorelines
    if (scorelines.length > 0) {
      html += '<div class="scorelines">';
      scorelines.forEach((sl, i) => {
        const topClass = i === 0 ? ' top' : '';
        html += `
            <div class="scoreline-card${topClass}">
              <div class="scoreline-rank">Top ${sl.rank || i + 1}</div>
              <div class="scoreline-score">${App.escapeHtml(sl.score)}</div>
              <div class="scoreline-pct">${sl.pct}%</div>
            </div>`;
      });
      html += '</div>';
    }

    // Predicted score
    if (predictedScore) {
      html += `
            <div class="predicted-score">
              <div class="predicted-score-label">预测比分</div>
              <div class="predicted-score-value">${App.escapeHtml(predictedScore)}</div>
            </div>`;
    }

    // Confidence stars
    if (stars != null) {
      html += `
            <div class="confidence">
              <span class="confidence-stars">${App.renderStars(stars)}</span>
              <span class="confidence-label">${stars}/5 信心评级</span>
            </div>`;
    }

    html += `
          </div>`;

    // Additional prediction text from Claude
    if (sectionText) {
      html += `
          <div style="margin-top:16px;">
            ${App.renderMarkdown(sectionText)}
          </div>`;
    }

    html += `
        </div>
      </div>`;

    return html;
  },

  /** Render a compact summary card when only predicted score + stars are available */
  renderSummaryCard(pred, rawText) {
    const predictedScore = pred.predicted_score;
    const stars = pred.confidence_stars;

    let html = '<div class="prediction-box" style="margin:0;">';

    // Big predicted score
    if (predictedScore) {
      html += `
        <div class="predicted-score">
          <div class="predicted-score-label">AI 预测比分</div>
          <div class="predicted-score-value">${App.escapeHtml(predictedScore)}</div>
        </div>`;
    }

    // Confidence stars
    if (stars != null) {
      html += `
        <div class="confidence">
          <span class="confidence-stars">${App.renderStars(stars)}</span>
          <span class="confidence-label">${stars}/5 信心评级</span>
        </div>`;
    }

    // Raw commentary (strip the table, keep the text)
    if (rawText) {
      // Extract text after the table
      const textParts = rawText.split(/\n\n/);
      const commentary = textParts.filter(p =>
        !p.includes('|---') && !p.includes('预测比分') && p.trim().length > 20
      );
      if (commentary.length > 0) {
        html += `
          <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--gray-200);font-size:0.9rem;line-height:1.75;color:var(--gray-700);">
            ${App.renderMarkdown(commentary.join('\n\n'))}
          </div>`;
      }
    }

    html += '</div>';
    return html;
  },
};
