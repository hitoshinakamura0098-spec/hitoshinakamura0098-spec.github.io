(function(){
  const OWNER = 'hitoshinakamura0098-spec';
  const REPO = 'hitoshinakamura0098-spec.github.io';
  const PATH = 'posts.js';

  const tokenEl = document.getElementById('ghToken');
  const dateEl = document.getElementById('postDate');
  const titleEl = document.getElementById('postTitle');
  const tagsEl = document.getElementById('postTags');
  const bodyEl = document.getElementById('postBody');
  const imageEl = document.getElementById('postImage');
  const videoEl = document.getElementById('postVideo');
  const audioEl = document.getElementById('postAudio');
  const btn = document.getElementById('publishBtn');
  const statusEl = document.getElementById('publishStatus');

  const savedToken = localStorage.getItem('ghToken');
  if (savedToken) tokenEl.value = savedToken;

  const today = new Date();
  dateEl.value = today.toISOString().slice(0, 10);

  function b64EncodeUnicode(str){
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      (match, p1) => String.fromCharCode('0x' + p1)));
  }

  function b64DecodeUnicode(str){
    return decodeURIComponent(atob(str).split('').map((c) =>
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
  }

  function jsField(name, value){
    return `    ${name}: ${JSON.stringify(value)}`;
  }

  function buildPostEntry(post){
    const lines = [jsField('date', post.date), jsField('title', post.title)];
    if (post.tags && post.tags.length) lines.push(`    tags: ${JSON.stringify(post.tags)}`);
    lines.push(jsField('body', post.body));
    if (post.image) lines.push(jsField('image', post.image));
    if (post.video) lines.push(jsField('video', post.video));
    if (post.audio) lines.push(jsField('audio', post.audio));
    return `  {\n${lines.join(',\n')}\n  },\n`;
  }

  function setStatus(msg, isError){
    statusEl.textContent = msg;
    statusEl.style.color = isError ? '#db2777' : 'var(--text-sub)';
  }

  btn.addEventListener('click', async () => {
    const token = tokenEl.value.trim();
    const title = titleEl.value.trim();
    const body = bodyEl.value.trim();

    if (!token){ setStatus('GitHubトークンを入力してください。', true); return; }
    if (!title || !body){ setStatus('タイトルと本文は必須です。', true); return; }

    localStorage.setItem('ghToken', token);

    const post = {
      date: dateEl.value || today.toISOString().slice(0, 10),
      title,
      tags: tagsEl.value.split(',').map((t) => t.trim()).filter(Boolean),
      body,
      image: imageEl.value.trim(),
      video: videoEl.value.trim(),
      audio: audioEl.value.trim()
    };

    btn.disabled = true;
    setStatus('公開中...');

    try {
      const apiBase = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
      const headers = {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github+json'
      };

      const getRes = await fetch(apiBase, { headers });
      if (!getRes.ok) throw new Error(`ファイル取得に失敗 (${getRes.status})`);
      const fileData = await getRes.json();
      const currentContent = b64DecodeUnicode(fileData.content);

      const marker = 'const BLOG_POSTS = [';
      const idx = currentContent.indexOf(marker);
      if (idx === -1) throw new Error('posts.js の構造を認識できませんでした。');

      const insertAt = idx + marker.length + 1;
      const newContent =
        currentContent.slice(0, insertAt) +
        buildPostEntry(post) +
        currentContent.slice(insertAt);

      const putRes = await fetch(apiBase, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Add blog post: ${title}`,
          content: b64EncodeUnicode(newContent),
          sha: fileData.sha
        })
      });

      if (!putRes.ok){
        const err = await putRes.json().catch(() => ({}));
        throw new Error(err.message || `公開に失敗 (${putRes.status})`);
      }

      setStatus('公開しました！数分でBlogページに反映されます。');
      titleEl.value = '';
      tagsEl.value = '';
      bodyEl.value = '';
      imageEl.value = '';
      videoEl.value = '';
      audioEl.value = '';
    } catch (e){
      setStatus(`エラー: ${e.message}`, true);
    } finally {
      btn.disabled = false;
    }
  });
})();
