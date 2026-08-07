(function(){
  const toggle = document.getElementById('settingsToggle');
  const panel = document.getElementById('settingsPanel');
  const volumeSlider = document.getElementById('volumeSlider');
  const themeBtns = document.querySelectorAll('.theme-btn');
  if (!toggle || !panel) return;

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.hidden = !panel.hidden;
  });

  document.addEventListener('click', (e) => {
    if (!panel.hidden && !panel.contains(e.target) && e.target !== toggle){
      panel.hidden = true;
    }
  });

  const savedVolume = localStorage.getItem('bgmVolume');
  if (volumeSlider){
    volumeSlider.value = savedVolume !== null ? parseInt(savedVolume, 10) : 50;

    volumeSlider.addEventListener('input', () => {
      const v = parseInt(volumeSlider.value, 10);
      localStorage.setItem('bgmVolume', String(v));
      if (window.ytPlayer && typeof ytPlayer.setVolume === 'function'){
        ytPlayer.setVolume(v);
      }
    });
  }

  function updateThemeButtons(){
    themeBtns.forEach((b) => {
      b.classList.toggle('active', b.dataset.theme === document.documentElement.dataset.theme);
    });
  }

  const savedTheme = localStorage.getItem('siteTheme') || 'dark';
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
