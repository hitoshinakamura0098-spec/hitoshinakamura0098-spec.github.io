(function(){
  const toggle = document.getElementById('settingsToggle');
  const panel = document.getElementById('settingsPanel');
  const themeBtns = document.querySelectorAll('.theme-btn');
  if (!toggle || !panel) return;

  function setPanelOpen(open){
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  }

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    setPanelOpen(panel.hidden);
  });

  document.addEventListener('click', (e) => {
    if (!panel.hidden && !panel.contains(e.target) && !toggle.contains(e.target)){
      setPanelOpen(false);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden){
      setPanelOpen(false);
      toggle.focus();
    }
  });

  function updateThemeButtons(){
    themeBtns.forEach((b) => {
      const selected = b.dataset.theme === document.documentElement.dataset.theme;
      b.classList.toggle('active', selected);
      b.setAttribute('aria-pressed', String(selected));
    });
  }

  const savedTheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = savedTheme;
  updateThemeButtons();

  themeBtns.forEach((b) => {
    b.addEventListener('click', () => {
      document.documentElement.dataset.theme = b.dataset.theme;
      localStorage.setItem('siteTheme', b.dataset.theme);
      updateThemeButtons();
    });
  });
})();
