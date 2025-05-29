import React from 'react';
import {
  Box,
  Flex,
  Button,
  Link as ChakraLink,
  useColorMode,
  HStack,
  Text,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { MoonIcon, SunIcon, ChevronDownIcon } from '@chakra-ui/icons';

const Header = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { user, logout } = useAuth();
  const { settings, updateSetting, updateSettings } = useSettings();

  const handleToggleTheme = () => {
    const newTheme = colorMode === 'light' ? 'dark' : 'light';
    
    // Atualizar localmente
    updateSetting('theme', newTheme);
    
    // Atualizar no backend se o usuário estiver logado
    if (user) {
      updateSettings({
        ...settings,
        theme: newTheme
      });
    } else {
      // Se não estiver logado, apenas alternar o tema
      toggleColorMode();
    }
  };

  return (
    <Box as="header" bg={colorMode === 'light' ? 'white' : 'gray.800'} boxShadow="sm" py={4}>
      <Flex maxW="container.xl" mx="auto" px={4} justify="space-between" align="center">
        <ChakraLink as={RouterLink} to="/" fontSize="xl" fontWeight="bold">
          PolyLingua
        </ChakraLink>

        <HStack spacing={4}>
          <IconButton
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            onClick={handleToggleTheme}
            variant="ghost"
            aria-label="Alternar tema"
          />

          {user ? (
            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<ChevronDownIcon />}
                variant="ghost"
                leftIcon={
                  <Avatar 
                    size="sm" 
                    name={user.name || "Usuário"} 
                    src={user.avatar_url || undefined} 
                  />
                }
              >
                <Text display={{ base: 'none', md: 'block' }}>{user.name}</Text>
              </MenuButton>
              <MenuList>
                <MenuItem as={RouterLink} to="/profile">
                  Perfil
                </MenuItem>
                <MenuItem as={RouterLink} to="/history">
                  Histórico
                </MenuItem>
                <MenuItem onClick={logout}>
                  Sair
                </MenuItem>
              </MenuList>
            </Menu>
          ) : (
            <HStack spacing={4}>
              <Button as={RouterLink} to="/login" variant="ghost">
                Entrar
              </Button>
              <Button as={RouterLink} to="/register" colorScheme="blue">
                Registrar
              </Button>
            </HStack>
          )}
        </HStack>
      </Flex>
    </Box>
  );
};

export default Header; 