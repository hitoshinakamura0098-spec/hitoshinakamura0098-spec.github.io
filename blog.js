(function(){
  const list = document.getElementById('blogList');
  const filters = document.getElementById('blogFilters');
  if (!list || typeof BLOG_POSTS === 'undefined') return;

  const posts = [...BLOG_POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));

  if (posts.length === 0){
    list.innerHTML = '<p class="note">まだ投稿はありません。</p>';
    return;
  }

  function youtubeEmbedUrl(url){
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
    return m ? `https://www.youtube.com/embed/${m[1]}` : null;
  }

  function escapeHtml(value){
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return String(value == null ? '' : value).replace(/[&<>"']/g, (char) => entities[char]);
  }

  function linkifyText(value){
    const text = String(value == null ? '' : value);
    const pattern = /https?:\/\/[^\s]+/g;
    let html = '';
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(text)) !== null){
      const rawUrl = match[0];
      const trailing = (rawUrl.match(/[、。）」』】]+$/) || [''])[0];
      const url = trailing ? rawUrl.slice(0, -trailing.length) : rawUrl;
      html += escapeHtml(text.slice(lastIndex, match.index));
      html += `<a class="blog-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`;
      html += escapeHtml(trailing);
      lastIndex = match.index + rawUrl.length;
    }

    return html + escapeHtml(text.slice(lastIndex));
  }

  function bodyHtml(value){
    return linkifyText(value).replace(
      /━{5,}/g,
      '<span class="blog-text-divider" aria-hidden="true"></span>'
    );
  }

  function mediaHtml(p){
    let html = '';

    if (p.image){
      html += `<img class="blog-media-img" src="${p.image}" alt="${p.title}" />`;
    }

    if (p.video){
      const yt = youtubeEmbedUrl(p.video);
      html += yt
        ? `<div class="blog-video-wrap"><iframe src="${yt}" loading="lazy" allowfullscreen></iframe></div>`
        : `<video class="blog-media-video" src="${p.video}" controls></video>`;
    }

    if (p.audio){
      html += `<audio class="blog-media-audio" src="${p.audio}" controls></audio>`;
    }

    return html;
  }

  const filterTags = [...new Set(posts.flatMap((p) => p.tags || []))];
  const allFilters = ['すべて', ...filterTags];

  if (filters){
    filters.innerHTML = allFilters.map((tag, index) => `
      <button
        type="button"
        class="blog-filter-btn${index === 0 ? ' is-active' : ''}"
        data-filter-index="${index}"
        aria-pressed="${index === 0 ? 'true' : 'false'}"
      >${escapeHtml(tag)}</button>
    `).join('');
  }

  list.innerHTML = posts.map((p, index) => {
    const tags = (p.tags || []).map((t) => `<li>${escapeHtml(t)}</li>`).join('');
    const body = String(p.body || '');
    const needsToggle = body.length > 320 || body.split('\n').length > 8;
    const bodyId = `blog-body-${index}`;
    return `
      <article class="card blog-post" data-post-index="${index}">
        <div class="blog-date">${escapeHtml(p.date)}</div>
        <h2 class="section-title">${escapeHtml(p.title)}</h2>
        ${tags ? `<ul class="badge-list cat-learn" style="margin-bottom:10px;">${tags}</ul>` : ''}
        <div id="${bodyId}" class="note blog-body${needsToggle ? '' : ' is-expanded'}">${bodyHtml(body)}</div>
        ${needsToggle ? `<button type="button" class="blog-read-more" aria-expanded="false" aria-controls="${bodyId}">続きを読む</button>` : ''}
        ${mediaHtml(p)}
      </article>
    `;
  }).join('');

  if (filters){
    filters.addEventListener('click', (event) => {
      const button = event.target.closest('.blog-filter-btn');
      if (!button) return;
      const filterIndex = Number(button.dataset.filterIndex);
      const selectedTag = filterIndex === 0 ? '' : filterTags[filterIndex - 1];

      filters.querySelectorAll('.blog-filter-btn').forEach((item) => {
        const isActive = item === button;
        item.classList.toggle('is-active', isActive);
        item.setAttribute('aria-pressed', String(isActive));
      });

      list.querySelectorAll('.blog-post').forEach((article) => {
        const post = posts[Number(article.dataset.postIndex)];
        article.hidden = Boolean(selectedTag) && !(post.tags || []).includes(selectedTag);
      });
    });
  }

  list.addEventListener('click', (event) => {
    const button = event.target.closest('.blog-read-more');
    if (!button) return;
    const body = document.getElementById(button.getAttribute('aria-controls'));
    if (!body) return;

    const expanded = button.getAttribute('aria-expanded') === 'true';
    body.classList.toggle('is-expanded', !expanded);
    button.setAttribute('aria-expanded', String(!expanded));
    button.textContent = expanded ? '続きを読む' : '閉じる';

    if (expanded){
      button.closest('.blog-post').scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  });

  if (window.renderMathInElement){
    renderMathInElement(list, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ]
    });
  }
})();
