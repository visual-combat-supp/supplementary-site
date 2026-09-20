'use strict';
(async function () {
  const response = await fetch('results.json');
  if (!response.ok) throw new Error('Results unavailable');
  const data = await response.json();
  let config = 'native', metric = 'hp', boss = 0;
  const methods = Object.keys(data.configurations.native.series);
  const format = (v, m) => m === 'hp' ? v.toFixed(2) : String(v);
  const metricName = m => m === 'hp' ? 'Normalized Boss HP Reduction (%)' : 'Win Rate (%)';
  function element(tag, text, className) {
    const e = document.createElement(tag);
    if (text !== undefined) e.textContent = text;
    if (className) e.className = className;
    return e;
  }
  function render() {
    const current = data.configurations[config];
    document.querySelector('#configuration-note').textContent = `${current.label} · ${data.episodesPerBoss} episodes per method per boss.`;
    for (const b of document.querySelectorAll('[data-config]')) b.setAttribute('aria-pressed', String(b.dataset.config === config));
    for (const b of document.querySelectorAll('[data-metric]')) b.setAttribute('aria-pressed', String(b.dataset.metric === metric));
    for (const b of document.querySelectorAll('[data-boss]')) b.setAttribute('aria-pressed', String(Number(b.dataset.boss) === boss));
    document.querySelector('#selected-boss').textContent = data.bosses[boss];
    document.querySelector('#selected-metric').textContent = metricName(metric);
    const bars = document.querySelector('#method-bars');
    bars.replaceChildren();
    for (const method of methods) {
      const value = current.series[method][boss][metric];
      const row = element('div', undefined, `method-row${method === 'Ours' ? ' is-ours' : ''}${method === 'Novice human players' ? ' is-human' : ''}`);
      const label = element('span', method, 'method-label');
      const track = element('div', undefined, 'bar-track');
      const fill = element('div', undefined, 'bar-fill');
      fill.style.width = `${value}%`;
      fill.setAttribute('aria-hidden', 'true');
      track.append(fill);
      row.append(label, track, element('span', format(value, metric), 'bar-value'));
      bars.append(row);
    }
    const ours = current.series.Ours[boss], sft = current.series.SFT[boss];
    const delta = ours[metric] - sft[metric];
    const summary = document.querySelector('.result-summary');
    summary.replaceChildren();
    const main = element('div', format(ours[metric], metric), 'summary-number');
    main.append(element('span', '%'));
    const gain = element('div', `${delta > 0 ? '+' : ''}${format(delta, metric)} pp`, 'summary-gain');
    const secondary = metric === 'hp' ? 'win' : 'hp';
    summary.append(element('p', 'Ours', 'summary-label'), main,
      element('p', metric === 'hp' ? 'Normalized boss HP reduction' : 'Win rate', 'summary-caption'),
      gain, element('p', 'vs. SFT', 'summary-caption'),
      element('div', `${format(ours[secondary], secondary)}%`, 'summary-secondary'),
      element('p', secondary === 'win' ? 'Win rate' : 'Normalized boss HP reduction', 'summary-caption'));
    const table = document.querySelector('#full-results-table');
    table.replaceChildren(element('caption', `${current.label} · HP reduction / Win rate (%)`));
    const head = element('thead'), hr = element('tr');
    for (const title of ['Method', ...data.bosses]) { const th = element('th', title); th.scope = 'col'; hr.append(th); }
    head.append(hr); table.append(head);
    const body = element('tbody');
    for (const method of methods) {
      const row = element('tr', undefined, method === 'Ours' ? 'is-ours' : '');
      const th = element('th', method); th.scope = 'row'; row.append(th);
      for (const v of current.series[method]) row.append(element('td', `${format(v.hp, 'hp')} / ${v.win}`));
      body.append(row);
    }
    table.append(body);
  }
  data.bosses.forEach((name, index) => {
    const b = element('button', name); b.type = 'button'; b.dataset.boss = index;
    b.addEventListener('click', () => { boss = index; render(); });
    document.querySelector('#boss-switch').append(b);
  });
  for (const b of document.querySelectorAll('[data-config]')) b.addEventListener('click', () => { config = b.dataset.config; render(); });
  for (const b of document.querySelectorAll('[data-metric]')) b.addEventListener('click', () => { metric = b.dataset.metric; render(); });
  render();
})().catch(() => {
  const error = document.querySelector('#results-error');
  error.hidden = false;
  error.textContent = 'Results could not be loaded. Please reload the page.';
});
