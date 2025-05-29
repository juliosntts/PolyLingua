import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  useToast,
  Divider,
  Switch,
  HStack,
  Avatar,
  IconButton,
  Flex,
  useColorMode,
  Container,
  useColorModeValue,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure
} from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { user, updateUser, updateAvatar, loading: authLoading } = useAuth();
  const { settings, updateSettings, updateSetting, isLoading: settingsLoading } = useSettings();
  const { setColorMode, colorMode } = useColorMode();
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    preferredLanguage: 'pt',
    theme: 'light',
    autoDetectLanguage: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const toast = useToast();
  const fileInputRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Inicializar os dados do usuário quando o componente for montado
  useEffect(() => {
    if (user) {
      setUserData({
        name: user.name || '',
        email: user.email || '',
        preferredLanguage: user.preferred_language || 'pt',
        theme: user.theme || 'light',
        autoDetectLanguage: user.auto_detect_language || false
      });
    }
  }, [user]);

  // Efeito para aplicar o tema quando ele mudar
  useEffect(() => {
    if (userData.theme && userData.theme !== colorMode) {
      setColorMode(userData.theme);
    }
  }, [userData.theme, setColorMode, colorMode]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Aplicar tema apenas se mudou
      if (userData.theme !== colorMode) {
        setColorMode(userData.theme);
      }
      
      // Atualizar localmente apenas se necessário
      if (settings.theme !== userData.theme) {
        updateSetting('theme', userData.theme);
      }
      if (settings.preferredLanguage !== userData.preferredLanguage) {
        updateSetting('preferredLanguage', userData.preferredLanguage);
      }
      
      // Atualizar no backend
      await updateSettings({
        name: userData.name,
        email: userData.email,
        preferredLanguage: userData.preferredLanguage,
        theme: userData.theme,
        autoDetectLanguage: userData.autoDetectLanguage
      });
      
      // Atualizar no estado do contexto de autenticação
      updateUser({
        name: userData.name,
        email: userData.email,
        preferred_language: userData.preferredLanguage,
        theme: userData.theme,
        auto_detect_language: userData.autoDetectLanguage
      });
      
      toast({
        title: 'Configurações salvas',
        description: 'Suas configurações foram atualizadas com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setUserData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Aplicar o tema imediatamente quando for alterado
    if (name === 'theme') {
      setColorMode(value);
      updateSetting('theme', value);
    }
    
    // Atualizar o idioma preferido imediatamente
    if (name === 'preferredLanguage') {
      updateSetting('preferredLanguage', value);
    }
  };

  const handleAvatarClick = () => {
    onOpen();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Verificar tipo de arquivo
    if (!file.type.match('image.*')) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione uma imagem válida',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Verificar tamanho (limite de 1MB)
    if (file.size > 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'A imagem deve ter menos de 1MB',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Converter para Base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result;
        
        // Enviar para o servidor
        const success = await updateAvatar(base64data);
        
        if (success) {
          toast({
            title: 'Sucesso',
            description: 'Foto de perfil atualizada com sucesso',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          onClose();
        } else {
          throw new Error('Falha ao atualizar avatar');
        }
        setIsUploadingAvatar(false);
      };
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar a foto de perfil',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setIsUploadingAvatar(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Se estiver carregando, mostrar um spinner
  if (authLoading) {
    return (
      <Container maxW="container.xl" py={8} centerContent>
        <Spinner size="xl" />
        <Text mt={4}>Carregando dados do perfil...</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handleFileChange}
      />
      
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Alterar foto de perfil</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Avatar 
                size="2xl" 
                name={userData.name || "Usuário"} 
                src={user?.avatar_url || undefined} 
              />
              <Button
                onClick={triggerFileInput}
                isLoading={isUploadingAvatar}
                loadingText="Enviando..."
              >
                Selecionar imagem
              </Button>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancelar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading size="lg" mb={2}>Perfil do Usuário</Heading>
          <Text color="gray.500">
            Gerencie suas configurações e preferências do LibreTranslate
          </Text>
        </Box>

        <Box
          bg={bgColor}
          p={6}
          borderRadius="lg"
          boxShadow="sm"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <VStack spacing={6}>
            <HStack spacing={4} width="full" align="center">
              <Box position="relative">
                <Avatar 
                  size="xl" 
                  name={userData.name || "Usuário"} 
                  src={user?.avatar_url || undefined} 
                  cursor="pointer"
                  onClick={handleAvatarClick}
                />
                <IconButton
                  aria-label="Editar foto"
                  icon={<EditIcon />}
                  size="xs"
                  position="absolute"
                  bottom="0"
                  right="0"
                  colorScheme="blue"
                  rounded="full"
                  onClick={handleAvatarClick}
                />
              </Box>
              <VStack align="start" spacing={1}>
                <Text fontSize="xl" fontWeight="bold">{userData.name}</Text>
                <Text color="gray.500">{userData.email}</Text>
              </VStack>
            </HStack>

            <FormControl>
              <FormLabel>Nome</FormLabel>
              <Input
                name="name"
                value={userData.name}
                onChange={handleChange}
                placeholder="Digite seu nome"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Email</FormLabel>
              <Input
                name="email"
                type="email"
                value={userData.email}
                onChange={handleChange}
                placeholder="Digite seu email"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Idioma Preferido</FormLabel>
              <Select
                name="preferredLanguage"
                value={userData.preferredLanguage}
                onChange={handleChange}
              >
                <option value="pt">Português</option>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="it">Italiano</option>
                <option value="ja">日本語</option>
                <option value="ko">한국어</option>
                <option value="zh">中文</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Tema</FormLabel>
              <Select
                name="theme"
                value={userData.theme}
                onChange={handleChange}
              >
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
              </Select>
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel mb="0">
                Detecção Automática de Idioma
              </FormLabel>
              <Switch
                name="autoDetectLanguage"
                isChecked={userData.autoDetectLanguage}
                onChange={handleChange}
              />
            </FormControl>

            <Button
              colorScheme="blue"
              onClick={handleSave}
              isLoading={isLoading || settingsLoading}
              loadingText="Salvando..."
              width="full"
            >
              Salvar Configurações
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default Profile; 