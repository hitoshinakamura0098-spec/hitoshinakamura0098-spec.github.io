(function(){
  const list = document.getElementById('blogList');
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

  list.innerHTML = posts.map((p) => {
    const tags = (p.tags || []).map((t) => `<li>${t}</li>`).join('');
    return `
      <article class="card blog-post">
        <div class="blog-date">${p.date}</div>
        <h2 class="section-title">${p.title}</h2>
        ${tags ? `<ul class="badge-list cat-learn" style="margin-bottom:10px;">${tags}</ul>` : ''}
        <p class="note" style="margin-bottom:0; white-space:pre-line;">${bodyHtml(p.body)}</p>
        ${mediaHtml(p)}
      </article>
    `;
  }).join('');

  if (window.renderMathInElement){
    renderMathInElement(list, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ]
    });
  }
})();
