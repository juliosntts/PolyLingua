import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Textarea,
  Select,
  Button,
  useToast,
  Text,
  Switch,
  FormControl,
  FormLabel,
  Container,
  Heading,
  useColorModeValue
} from '@chakra-ui/react';
import { useTranslation } from '../../context/TranslationContext';
import { useSettings } from '../../context/SettingsContext';
import { useLocation, useNavigate } from 'react-router-dom';

const TranslationForm = () => {
  const [text, setText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('auto');
  const [targetLanguage, setTargetLanguage] = useState('pt');
  const [isLoading, setIsLoading] = useState(false);
  const { translate, detectLanguage } = useTranslation();
  const { settings } = useSettings();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const translatedTextBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    if (settings.preferredLanguage) {
      setTargetLanguage(settings.preferredLanguage);
    }
  }, [settings.preferredLanguage]);

  useEffect(() => {
    if (location.state?.extractedText) {
      setText(location.state.extractedText);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleTranslate = async () => {
    if (!text.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um texto para traduzir',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await translate(text, sourceLanguage, targetLanguage, settings.autoDetectLanguage);
      if (!result.success) {
        throw new Error(result.error);
      }
      setTranslatedText(result.translated_text);
    } catch (error) {
      toast({
        title: 'Erro na tradução',
        description: error.message || 'Ocorreu um erro ao traduzir o texto',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetectLanguage = async () => {
    if (!text.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um texto para detectar o idioma',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await detectLanguage(text);
      if (result.success) {
        setSourceLanguage(result.detectedLanguage);
        toast({
          title: 'Idioma detectado',
          description: `O idioma detectado foi: ${result.detectedLanguage}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: 'Erro na detecção',
        description: error.message || 'Ocorreu um erro ao detectar o idioma',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading size="lg" mb={2}>Tradutor LibreTranslate</Heading>
          <Text color="gray.500">
            Traduza textos entre diferentes idiomas usando o LibreTranslate
          </Text>
        </Box>

        <Box textAlign="right">
          <Button
            colorScheme="teal"
            onClick={() => navigate('/image-translate')}
            mb={4}
          >
            Traduzir Texto de Imagem
          </Button>
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
            <FormControl>
              <FormLabel>Texto para traduzir</FormLabel>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Digite ou cole o texto aqui..."
                size="lg"
                rows={6}
              />
            </FormControl>

            <HStack spacing={4} width="full">
              <FormControl>
                <FormLabel>Idioma de origem</FormLabel>
                <Select
                  value={sourceLanguage}
                  onChange={(e) => setSourceLanguage(e.target.value)}
                >
                  <option value="auto">Detectar automaticamente</option>
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
                <FormLabel>Idioma de destino</FormLabel>
                <Select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
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
            </HStack>

            <HStack spacing={4} width="full">
              <Button
                colorScheme="blue"
                onClick={handleTranslate}
                isLoading={isLoading}
                loadingText="Traduzindo..."
                width="full"
              >
                Traduzir
              </Button>
              <Button
                onClick={handleDetectLanguage}
                isLoading={isLoading}
                loadingText="Detectando..."
                width="full"
              >
                Detectar Idioma
              </Button>
            </HStack>

            {translatedText && (
              <FormControl>
                <FormLabel>Tradução</FormLabel>
                <Textarea
                  value={translatedText}
                  isReadOnly
                  size="lg"
                  rows={6}
                  bg={translatedTextBg}
                />
              </FormControl>
            )}
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default TranslationForm; 