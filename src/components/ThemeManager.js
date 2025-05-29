import React, { useEffect } from 'react';
import { useColorMode } from '@chakra-ui/react';
import { useSettings } from '../context/SettingsContext';

const ThemeManager = () => {
  const { settings } = useSettings();
  const { setColorMode, colorMode } = useColorMode();

  // Aplicar o tema apenas quando as configurações mudarem e se for diferente do tema atual
  useEffect(() => {
    if (settings.theme && settings.theme !== colorMode) {
      setColorMode(settings.theme);
    }
  }, [settings.theme, setColorMode, colorMode]);

  return null; // Este componente não renderiza nada
};

export default ThemeManager; 