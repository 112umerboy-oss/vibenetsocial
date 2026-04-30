import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const isLightStored = localStorage.getItem('vibe-theme') === 'light';
    if (isLightStored) {
      setIsLight(true);
      document.documentElement.classList.add('light-mode');
    }
  }, []);

  const toggleTheme = () => {
    const newIsLight = !isLight;
    setIsLight(newIsLight);
    if (newIsLight) {
      document.documentElement.classList.add('light-mode');
      localStorage.setItem('vibe-theme', 'light');
    } else {
      document.documentElement.classList.remove('light-mode');
      localStorage.setItem('vibe-theme', 'dark');
    }
  };

  return (
    <button 
      onClick={toggleTheme}
      className="p-2 border border-vibe-border text-vibe-muted hover:text-vibe-neon transition-all bg-vibe-pure"
      title={isLight ? "Switch to Dark Protocol" : "Switch to Light Protocol"}
    >
      {isLight ? (
        <Moon className="w-4 h-4" />
      ) : (
        <Sun className="w-4 h-4" />
      )}
    </button>
  );
};
