import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

const ThemeToggle = () => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') || 'light';
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="ml-4 focus:outline-none"
      aria-label="Toggle Dark Mode"
    >
      {theme === 'light' ? (
        <Icon icon="fluent:moon-24-regular" className="w-6 h-6" />
      ) : (
        <Icon icon="fluent:sun-24-regular" className="w-6 h-6 text-white" />
      )}
    </button>
  );
};

export default ThemeToggle;
