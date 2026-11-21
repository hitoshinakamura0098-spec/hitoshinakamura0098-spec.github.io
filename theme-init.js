(function(){
  let theme = 'light';
  try {
    if (localStorage.getItem('siteTheme') === 'dark') theme = 'dark';
  } catch (error) {
    // The light default also works when browser storage is unavailable.
  }
  document.documentElement.dataset.theme = theme;
})();
