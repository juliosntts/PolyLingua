import React, { useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  Text,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Container,
  useColorModeValue,
  IconButton,
  Button,
  Flex,
  HStack,
  Tooltip,
  useToast
} from '@chakra-ui/react';
import { DeleteIcon, RepeatIcon } from '@chakra-ui/icons';
import { useTranslation } from '../../context/TranslationContext';

const History = () => {
  const { translations, removeTranslation, clearHistory, fetchTranslations, loading } = useTranslation();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const toast = useToast();
  const initialFetchDone = useRef(false);

  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchTranslations();
      initialFetchDone.current = true;
    }
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getLanguageName = (code) => {
    const languages = {
      'pt': 'Português',
      'en': 'English',
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch',
      'it': 'Italiano',
      'ja': '日本語',
      'ko': '한국어',
      'zh': '中文',
      'auto': 'Detectado automaticamente'
    };
    return languages[code] || code;
  };

  const handleRemoveTranslation = (id) => {
    if (loading) return;
    
    removeTranslation(id)
      .then(() => {
        toast({
          title: 'Tradução removida',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      })
      .catch((error) => {
        toast({
          title: 'Erro',
          description: 'Não foi possível remover a tradução',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      });
  };

  const handleClearHistory = () => {
    if (loading) return;
    
    clearHistory()
      .then(() => {
        toast({
          title: 'Histórico limpo',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      })
      .catch((error) => {
        toast({
          title: 'Erro',
          description: 'Não foi possível limpar o histórico',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      });
  };

  const handleRefresh = () => {
    if (loading) return;
    fetchTranslations();
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading size="lg" mb={2}>Histórico de Traduções</Heading>
          <Text color="gray.500">
            Visualize suas traduções recentes usando o LibreTranslate
          </Text>
        </Box>

        <Box
          bg={bgColor}
          p={6}
          borderRadius="lg"
          boxShadow="sm"
          borderWidth="1px"
          borderColor={borderColor}
          overflowX="auto"
        >
          <Flex justifyContent="space-between" mb={4}>
            <Tooltip label="Atualizar histórico">
              <IconButton
                icon={<RepeatIcon />}
                onClick={handleRefresh}
                isLoading={loading}
                aria-label="Atualizar histórico"
              />
            </Tooltip>
            
            {translations.length > 0 && (
              <Button
                colorScheme="red"
                size="sm"
                onClick={handleClearHistory}
                isLoading={loading}
              >
                Limpar Histórico
              </Button>
            )}
          </Flex>

          {translations.length === 0 ? (
            <Text textAlign="center" color="gray.500">
              Nenhuma tradução realizada ainda
            </Text>
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Data</Th>
                  <Th>Texto Original</Th>
                  <Th>Tradução</Th>
                  <Th>Idiomas</Th>
                  <Th>Ações</Th>
                </Tr>
              </Thead>
              <Tbody>
                {translations.map((translation) => (
                  <Tr key={translation.id}>
                    <Td>{formatDate(translation.created_at)}</Td>
                    <Td maxW="300px" isTruncated>{translation.source_text}</Td>
                    <Td maxW="300px" isTruncated>{translation.translated_text}</Td>
                    <Td>
                      <Badge colorScheme="blue" mr={2}>
                        {getLanguageName(translation.source_language)}
                      </Badge>
                      <Badge colorScheme="green">
                        {getLanguageName(translation.target_language)}
                      </Badge>
                    </Td>
                    <Td>
                      <IconButton
                        icon={<DeleteIcon />}
                        onClick={() => handleRemoveTranslation(translation.id)}
                        aria-label="Remover tradução"
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Box>
      </VStack>
    </Container>
  );
};

export default History; 