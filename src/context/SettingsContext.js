import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const SettingsContext = createContext(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings deve ser usado dentro de um SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [settings, setSettings] = useState({
    name: '',
    email: '',
    preferredLanguage: 'pt',
    theme: 'light',
    notifications: false,
    autoDetectLanguage: true
  });
  const [isLoading, setIsLoading] = useState(false);

  // Sincroniza as configurações quando o usuário muda
  useEffect(() => {
    if (user) {
      setSettings(prevSettings => ({
        ...prevSettings,
        name: user.name || prevSettings.name,
        email: user.email || prevSettings.email,
        preferredLanguage: user.preferred_language || prevSettings.preferredLanguage,
        theme: user.theme || prevSettings.theme,
        notifications: typeof user.notifications === 'boolean' ? user.notifications : prevSettings.notifications,
        autoDetectLanguage: typeof user.auto_detect_language === 'boolean' ? user.auto_detect_language : prevSettings.autoDetectLanguage
      }));
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.user) {
        setSettings({
          name: data.user.name || '',
          email: data.user.email || '',
          preferredLanguage: data.user.preferred_language || 'pt',
          theme: data.user.theme || 'light',
          notifications: data.user.notifications || false,
          autoDetectLanguage: data.user.auto_detect_language || true
        });
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: newSettings.name,
          email: newSettings.email,
          preferred_language: newSettings.preferredLanguage,
          theme: newSettings.theme,
          notifications: newSettings.notifications,
          auto_detect_language: newSettings.autoDetectLanguage
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSettings(newSettings);
        return true;
      } else {
        throw new Error(data.message || 'Erro ao atualizar configurações');
      }
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
  };

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      updateSettings, 
      updateSetting,
      fetchUserProfile,
      isLoading
    }}>
      {children}
    </SettingsContext.Provider>
  );
}; 