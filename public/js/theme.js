// public/js/theme.js

document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('themeToggle');

  // Function to toggle theme
  function toggleTheme() {
    if (document.documentElement.getAttribute('data-theme') === 'dark') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    saveThemePreference();
  }

  // Function to save theme preference in localStorage
  function saveThemePreference() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    localStorage.setItem('theme', currentTheme);
  }

  // Function to load theme preference from localStorage
  function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }

  // Event listener for theme toggle
  themeToggle.addEventListener('click', toggleTheme);

  // Initialize theme based on saved preference
  loadThemePreference();
});