(function(){
  const main = document.getElementById('appMain');
  if (!main) return;

  function fileName(pathname){
    const f = pathname.split('/').pop();
    return f || 'index.html';
  }

  function setActiveNav(pathname){
    const file = fileName(pathname);
    document.querySelectorAll('.site-nav a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      if (!href || !href.endsWith('.html')) return;
      a.classList.toggle('active', href === file);
    });
  }

  function runScriptsSequentially(container){
    return new Promise((resolve) => {
      const scripts = Array.from(container.querySelectorAll('script'));
      function next(i){
        if (i >= scripts.length){ resolve(); return; }
        const old = scripts[i];
        const s = document.createElement('script');
        Array.from(old.attributes).forEach((attr) => s.setAttribute(attr.name, attr.value));
        if (old.src){
          s.onload = () => next(i + 1);
          s.onerror = () => next(i + 1);
          old.replaceWith(s);
        } else {
          s.textContent = old.textContent;
          old.replaceWith(s);
          next(i + 1);
        }
      }
      next(0);
    });
  }

  async function loadPage(url, push){
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('fetch failed: ' + res.status);
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const newMain = doc.getElementById('appMain');
      if (!newMain){ location.href = url; return; }

      document.title = doc.title;
      main.innerHTML = newMain.innerHTML;
      await runScriptsSequentially(main);
      setActiveNav(url);
      window.scrollTo(0, 0);

      if (push) history.pushState({ url }, '', url);
    } catch (e){
      location.href = url;
    }
  }

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const a = e.target.closest('a[href]');
    if (!a) return;
    if (a.target === '_blank') return;

    const href = a.getAttribute('href');
    if (!href || !href.endsWith('.html')) return;
    if (href.startsWith('http') || href.startsWith('//')) return;

    if (href === fileName(location.pathname)) { e.preventDefault(); return; }

    e.preventDefault();
    loadPage(href, true);
  });

  window.addEventListener('popstate', () => {
    loadPage(location.pathname, false);
  });

  setActiveNav(location.pathname);
})();
