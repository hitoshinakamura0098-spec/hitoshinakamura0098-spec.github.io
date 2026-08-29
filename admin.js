(function(){
  const OWNER = 'hitoshinakamura0098-spec';
  const REPO = 'hitoshinakamura0098-spec.github.io';
  const POSTS_PATH = 'posts.js';
  const IMAGE_DIR = 'uploads/blog';
  const MAX_IMAGE_EDGE = 1600;
  const IMAGE_QUALITY = 0.82;
  const MAX_SOURCE_BYTES = 20 * 1024 * 1024;

  const tokenEl = document.getElementById('ghToken');
  const dateEl = document.getElementById('postDate');
  const titleEl = document.getElementById('postTitle');
  const tagsEl = document.getElementById('postTags');
  const bodyEl = document.getElementById('postBody');
  const imageFileEl = document.getElementById('postImageFile');
  const imageEl = document.getElementById('postImage');
  const imagePreviewWrapEl = document.getElementById('postImagePreviewWrap');
  const imagePreviewEl = document.getElementById('postImagePreview');
  const imageInfoEl = document.getElementById('postImageInfo');
  const clearImageBtn = document.getElementById('clearImageBtn');
  const videoEl = document.getElementById('postVideo');
  const audioEl = document.getElementById('postAudio');
  const btn = document.getElementById('publishBtn');
  const statusEl = document.getElementById('publishStatus');
  let previewUrl = '';

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

  function clearImageSelection(){
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = '';
    imageFileEl.value = '';
    imagePreviewEl.removeAttribute('src');
    imagePreviewWrapEl.hidden = true;
    imageInfoEl.textContent = '';
  }

  imageFileEl.addEventListener('change', () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = '';

    const file = imageFileEl.files && imageFileEl.files[0];
    if (!file){
      clearImageSelection();
      return;
    }

    if (!file.type.startsWith('image/')){
      clearImageSelection();
      setStatus('画像ファイルを選択してください。', true);
      return;
    }

    if (file.size > MAX_SOURCE_BYTES){
      clearImageSelection();
      setStatus('画像は20MB以下を選択してください。', true);
      return;
    }

    previewUrl = URL.createObjectURL(file);
    imagePreviewEl.src = previewUrl;
    imageInfoEl.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`;
    imagePreviewWrapEl.hidden = false;
    setStatus('');
  });

  clearImageBtn.addEventListener('click', clearImageSelection);

  function loadImage(file){
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('画像を読み込めませんでした。JPEG、PNG、WebPなどを選択してください。'));
      };
      img.src = url;
    });
  }

  function canvasToBlob(canvas){
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('画像の変換に失敗しました。'));
      }, 'image/webp', IMAGE_QUALITY);
    });
  }

  async function optimizeImage(file){
    const img = await loadImage(file);
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('画像処理を開始できませんでした。');
    context.drawImage(img, 0, 0, width, height);
    return canvasToBlob(canvas);
  }

  function blobToBase64(blob){
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || '');
        const comma = result.indexOf(',');
        if (comma === -1) reject(new Error('画像データの変換に失敗しました。'));
        else resolve(result.slice(comma + 1));
      };
      reader.onerror = () => reject(new Error('画像ファイルを読み込めませんでした。'));
      reader.readAsDataURL(blob);
    });
  }

  function apiPath(path){
    const encoded = path.split('/').map(encodeURIComponent).join('/');
    return `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encoded}`;
  }

  function authHeaders(token){
    return {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
  }

  async function uploadSelectedImage(token, file, postDate){
    setStatus('画像を最適化中...');
    const optimized = await optimizeImage(file);
    const content = await blobToBase64(optimized);
    const datePart = String(postDate || '').replace(/[^0-9]/g, '') || 'undated';
    const path = `${IMAGE_DIR}/${datePart}-${Date.now()}.webp`;

    setStatus('画像をアップロード中...');
    const response = await fetch(apiPath(path), {
      method: 'PUT',
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Add blog image: ${path}`,
        content
      })
    });

    if (!response.ok){
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `画像のアップロードに失敗 (${response.status})`);
    }

    return path;
  }

  async function publishPost(token, post){
    const apiBase = apiPath(POSTS_PATH);
    const headers = authHeaders(token);
    const getRes = await fetch(apiBase, { headers });
    if (!getRes.ok) throw new Error(`ファイル取得に失敗 (${getRes.status})`);
    const fileData = await getRes.json();
    const currentContent = b64DecodeUnicode(fileData.content);

    const marker = 'window.BLOG_POSTS = [';
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
        message: `Add blog post: ${post.title}`,
        content: b64EncodeUnicode(newContent),
        sha: fileData.sha
      })
    });

    if (!putRes.ok){
      const err = await putRes.json().catch(() => ({}));
      throw new Error(err.message || `公開に失敗 (${putRes.status})`);
    }
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
    setStatus('公開準備中...');

    try {
      const selectedFile = imageFileEl.files && imageFileEl.files[0];
      if (selectedFile){
        post.image = await uploadSelectedImage(token, selectedFile, post.date);
      }

      setStatus('記事を公開中...');
      await publishPost(token, post);

      setStatus('公開しました！数分でBlogページに反映されます。');
      titleEl.value = '';
      tagsEl.value = '';
      bodyEl.value = '';
      imageEl.value = '';
      videoEl.value = '';
      audioEl.value = '';
      clearImageSelection();
    } catch (e){
      setStatus(`エラー: ${e.message}`, true);
    } finally {
      btn.disabled = false;
    }
  });
})();
