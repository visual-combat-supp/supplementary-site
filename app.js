'use strict';
function updateNavigation() {
  for (const link of document.querySelectorAll('.nav a')) {
    if (link.hash === location.hash) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}
window.addEventListener('hashchange', updateNavigation);
updateNavigation();
const duration = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
const behaviors = {
  'guangmou': 'Uses Red Tides during the snake summon to survive the dangerous phase.',
  'white-clad-noble': 'Uses heavy attacks and light-combo finishers to stagger the boss.',
  'black-wind-king': 'After the boss disappears into wind form, the actor moves to the arena’s edge and charges a heavy attack while waiting for the boss to reappear.',
  'black-bear-guai': 'Activates the Fireproof Mantle during the wind-form phase to reduce incoming damage.'
};
function card(item) {
  const article = document.createElement('article');
  article.className = `video-card${item.group === 'comparisons' ? ' comparison-card' : ''}`;
  const label = item.title;
  article.innerHTML = `<div class="player"><video playsinline muted preload="none" poster="${item.poster}" aria-label="${label}"></video><button class="load-video" type="button" aria-label="Play ${label}"><span class="play" aria-hidden="true">▶</span></button><span class="duration">${duration(item.duration)}</span></div><div class="card-body"><div class="card-top"><h3 class="card-title">${item.title}</h3></div></div><p class="load-status" role="status"></p>`;
  const video = article.querySelector('video');
  video.setAttribute('controlslist', 'nodownload');
  video.setAttribute('aria-hidden', 'true');
  const button = article.querySelector('button');
  const status = article.querySelector('.load-status');
  video.muted = true;
  button.addEventListener('click', async () => {
    status.textContent = '';
    const pair = article.closest('.pair');
    for (const other of document.querySelectorAll('video[src]')) {
      if (other === video || (pair && other.closest('.pair') === pair)) continue;
      other.dataset.resume = String(other.currentTime || 0);
      other.pause();
      other.removeAttribute('src');
      other.load();
      other.controls = false;
      other.setAttribute('aria-hidden', 'true');
      const previous = other.closest('.video-card');
      previous.querySelector('.load-video').hidden = false;
      previous.querySelector('.duration').hidden = false;
      previous.querySelector('.load-status').textContent = '';
    }
    video.removeAttribute('aria-hidden');
    video.controls = true;
    if (!video.getAttribute('src')) {
      const resume = Number(video.dataset.resume || 0);
      if (resume > 0) video.addEventListener('loadedmetadata', () => { video.currentTime = Math.min(resume, video.duration); }, {once:true});
      video.src = item.video;
    }
    button.hidden = true;
    article.querySelector('.duration').hidden = true;
    try { await video.play(); if (video.getAttribute('src')) video.focus({preventScroll: true}); }
    catch (error) { if (error.name === 'AbortError') return; status.textContent = 'Playback could not start. Use the player controls or select play again.'; button.hidden = false; }
  });
  video.addEventListener('error', () => {
    status.textContent = 'This video could not be loaded. Check the connection and select play to retry.';
    video.removeAttribute('src');
    button.hidden = false;
  });
  // Each comparison is a single encoded video with a shared playback timeline.
  return article;
}
async function init() {
  const items = JSON.parse(document.getElementById('media-data').textContent);
  const paired = items.filter(x => x.group === 'comparisons');
  for (const item of paired) {
    const pair = document.createElement('div'); pair.className = 'pair';
    const heading = document.createElement('div'); heading.className = 'pair-heading';
    const h = document.createElement('h3'); h.textContent = item.title;
    heading.append(h);
    pair.append(heading, card(item));
    if (behaviors[item.id]) {
      const note = document.createElement('p'); note.className = 'behavior-note';
      const label = document.createElement('strong'); label.textContent = 'Ours · ';
      note.append(label, document.createTextNode(behaviors[item.id]));
      pair.append(note);
    }
    document.querySelector('#comparison-videos').append(pair);
  }
  for (const [group, target] of [['chapter-one', '#chapter-videos'], ['later-chapters', '#later-videos'], ['sekiro', '#sekiro-videos']]) {
    items.filter(x => x.group === group).forEach(x => document.querySelector(target).append(card(x)));
  }
}
init().catch(() => { const error = document.querySelector('#page-error'); error.hidden = false; error.textContent = 'The video catalog could not be loaded. Please reload this page.'; });
