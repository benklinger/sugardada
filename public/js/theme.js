document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('themeToggle');

  function toggleTheme() {
    if (document.documentElement.getAttribute('data-theme') === 'dark') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    if (window.location.pathname.includes('/results')) {
      updateChartTheme();
    }
    saveThemePreference();
  }

  function saveThemePreference() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    localStorage.setItem('theme', currentTheme);
  }

  function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  loadThemePreference();

  if (window.location.pathname.includes('/results')) {
    updateChartTheme();
  }
});