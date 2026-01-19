import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeSettings {
  primaryColor: string; // Hex code
  fontFamily: string;
  logoUrl?: string; // Base64 or URL to custom logo
}

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  themeSettings: ThemeSettings;
  updateThemeSettings: (settings: Partial<ThemeSettings>) => void;
  uploadLogo: (file: File) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper to convert Hex to RGB for Tailwind variables
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '74, 144, 184'; // Default fallback
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Dark Mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  
  // Sidebar
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Theme Customization
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(() => {
    const savedSettings = localStorage.getItem('theme_settings');
    return savedSettings ? JSON.parse(savedSettings) : {
      primaryColor: '#4A90B8', // Medical/ERP Blue
      fontFamily: 'Source Sans Pro',
    };
  });

  // Apply Dark Mode
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Apply Theme Settings (Colors & Fonts)
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Set Font
    root.style.setProperty('--font-family', `${themeSettings.fontFamily}, sans-serif`);
    
    // Set Primary Color
    const rgb = hexToRgb(themeSettings.primaryColor);
    root.style.setProperty('--color-primary', rgb);

    // Persist
    localStorage.setItem('theme_settings', JSON.stringify(themeSettings));
  }, [themeSettings]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);
  
  const updateThemeSettings = (newSettings: Partial<ThemeSettings>) => {
    setThemeSettings(prev => ({ ...prev, ...newSettings }));
  };

  const uploadLogo = async (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const base64 = e.target.result as string;
          updateThemeSettings({ logoUrl: base64 });
          resolve();
        } else {
          reject(new Error('Erreur lors de la lecture du fichier'));
        }
      };
      reader.onerror = () => {
        reject(new Error('Erreur lors du chargement du fichier'));
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <ThemeContext.Provider value={{ 
      isDarkMode, 
      toggleTheme, 
      isSidebarCollapsed, 
      toggleSidebar,
      themeSettings,
      updateThemeSettings,
      uploadLogo
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};