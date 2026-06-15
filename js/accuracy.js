/* ═══════════════════════════════════════════════════════════════════════
   accuracy.js — Prediction Accuracy Report
   - Stats cards (total, outcome accuracy, exact score, Brier)
   - Probability calibration chart
   - Confidence star calibration
   - Recent predictions vs actual results table
   ═══════════════════════════════════════════════════════════════════════ */

const AccuracyTab = {
  async load() {
    const container = document.getElementById('acc-content');
    const loading = document.getElementById('acc-loading');
    if (container.style.display !== 'none') return;

    const data = await App.fetchData('accuracy.json');

    loading.style.display = 'none';
    container.style.display = 'block';

    if (!data || !data.stats) {
      container.innerHTML = '<div class="card"><div class="no-data">暂无准确率数据</div></div>';
      return;
    }

    const stats = data.stats;
    const recent = data.recent || [];
    const updatedAt = data.updated_at || '';

    let html = '';

    // ── Stats Cards ──
    html += `
      <div class="stats-grid">
        ${this.statCard('总预测数', stats.total || 0)}
        ${this.statCard('胜负预测准确率', (stats.outcome_accuracy || 0) + '%', 'green')}
        ${this.statCard('精确比分命中率', (stats.exact_accuracy || 0) + '%', 'gold')}
        ${this.statCard('Brier 分数', stats.brier_score != null ? stats.brier_score : '—', 'navy')}
        ${this.statCard('平均进球误差', stats.avg_goal_error != null ? stats.avg_goal_error : '—', 'gray')}
      </div>
      <p style="font-size:0.8rem;color:var(--gray-500);text-align:center;margin-top:-12px;margin-bottom:20px;">
        更新于 ${App.escapeHtml(updatedAt)} · Brier 分数越低越好（0=完美预测）
      </p>`;

    // ── Calibration Chart ──
    const calibration = stats.calibration;
    if (calibration && Object.keys(calibration).length > 0) {
      html += `
        <div class="card">
          <h3 style="margin-bottom:16px;">📊 概率校准曲线</h3>
          <p style="font-size:0.85rem;color:var(--gray-500);margin-bottom:12px;">
            对比预测的主胜概率 vs 实际主胜比例。理想情况下两值应接近（对角线）
          </p>
          <div class="calibration-chart">`;

      const buckets = ['0-20', '21-40', '41-60', '61-80', '81-100'];
      buckets.forEach(bucket => {
        const c = calibration[bucket];
        if (!c) return;
        const mid = c.predicted_mid || 0;
        const actual = c.actual_rate || 0;
        const diff = actual - mid;
        let fillClass = 'good';
        if (diff > 15) fillClass = 'over';
        else if (diff < -15) fillClass = 'under';

        html += `
            <div class="cal-row">
              <div class="cal-label">${bucket}%</div>
              <div class="cal-bar-container">
                <div class="cal-bar-fill ${fillClass}" style="width:${Math.max(actual, 8)}%">
                  ${actual}%
                </div>
              </div>
              <div class="cal-n">n=${c.n}</div>
            </div>`;
      });

      html += `
          </div>
        </div>`;
    }

    // ── Star Calibration ──
    const starCal = stats.star_calibration;
    if (starCal && Object.keys(starCal).length > 0) {
      html += `
        <div class="card">
          <h3 style="margin-bottom:16px;">⭐ 信心星级校准</h3>
          <p style="font-size:0.85rem;color:var(--gray-500);margin-bottom:12px;">
            不同信心星级下的实际预测准确率。星级越高，准确率应该越高
          </p>`;

      const sortedStars = Object.keys(starCal).sort((a, b) => parseInt(a) - parseInt(b));
      sortedStars.forEach(stars => {
        const sc = starCal[stars];
        const outcomeAcc = sc.outcome_accuracy || 0;
        const starStr = '★'.repeat(parseInt(stars)) + '☆'.repeat(5 - parseInt(stars));

        html += `
          <div class="star-cal-row">
            <div class="star-cal-stars">${starStr}</div>
            <div class="star-cal-bar">
              <div class="star-cal-fill" style="width:${outcomeAcc}%"></div>
            </div>
            <div class="star-cal-pct">
              胜负 ${outcomeAcc}%
              <span style="font-size:0.75rem;color:var(--gray-500);">
                (${sc.total}场)
              </span>
            </div>
          </div>`;
      });

      html += `</div>`;
    }

    // ── Recent Predictions Table ──
    if (recent.length > 0) {
      html += `
        <div class="card">
          <h3 style="margin-bottom:16px;">📋 近期预测 vs 实际结果</h3>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>日期</th><th>比赛</th><th>预测比分</th><th>实际比分</th><th>结果</th>
                </tr>
              </thead>
              <tbody>`;

      recent.slice().reverse().forEach(r => {
        let statusHtml;
        if (r.exact_score) {
          statusHtml = '<span class="pred-status exact">✅ 精确命中</span>';
        } else if (r.outcome_correct) {
          statusHtml = '<span class="pred-status outcome">⚠️ 胜负正确</span>';
        } else if (r.outcome_correct === false) {
          statusHtml = '<span class="pred-status wrong">❌ 预测错误</span>';
        } else {
          statusHtml = '<span style="color:var(--gray-500);">—</span>';
        }

        html += `
                <tr>
                  <td>${App.escapeHtml(r.date || '')}</td>
                  <td>
                    ${App.escapeHtml(r.home_cn)} vs ${App.escapeHtml(r.away_cn)}
                    <span style="font-size:0.75rem;color:var(--gray-500);">(Group ${r.group})</span>
                  </td>
                  <td><strong>${App.escapeHtml(r.predicted_score || '?')}</strong></td>
                  <td>${App.escapeHtml(r.actual_score || '')}</td>
                  <td>${statusHtml}</td>
                </tr>`;
      });

      html += `
              </tbody>
            </table>
          </div>
        </div>`;
    }

    // No data at all
    if (!stats.total && recent.length === 0) {
      html += `
        <div class="card">
          <div class="no-data">
            <p style="font-size:2rem;">📐</p>
            <p>暂无真实准确率数据</p>
            <p style="font-size:0.85rem;">预测会在比赛实际结束后与真实比分进行对比</p>
            <p style="font-size:0.85rem;">目前 RESULTS 中的数据为模拟数据，不用于准确率计算</p>
          </div>
        </div>`;
    }

    container.innerHTML = html;
  },

  statCard(label, value, color = 'green') {
    let colorStyle = '';
    if (color === 'gold') colorStyle = 'color:var(--gold);';
    else if (color === 'navy') colorStyle = 'color:var(--navy);';
    else if (color === 'gray') colorStyle = 'color:var(--gray-700);';
    return `
      <div class="stat-card">
        <div class="stat-value" style="${colorStyle}">${value}</div>
        <div class="stat-label">${label}</div>
      </div>`;
  },
};
