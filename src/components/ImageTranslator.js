import React, { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  Text,
  useToast,
  Image,
  Spinner,
  Heading,
  Container,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from '../context/TranslationContext';

const ImageTranslator = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const { translate } = useTranslation();

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleTranslate = async () => {
    if (!selectedImage) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione uma imagem primeiro',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('image', selectedImage);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/translate-image', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      const { original_text } = response.data;
      
      // Redirecionar para a página principal com o texto extraído
      navigate('/', { state: { extractedText: original_text } });
      
      toast({
        title: 'Sucesso',
        description: 'Texto extraído com sucesso!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao processar imagem',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading size="lg" mb={2}>Extração de Texto de Imagem</Heading>
          <Text color="gray.500">
            Extraia texto de imagens usando EasyOCR e traduza para qualquer idioma
          </Text>
        </Box>

        <Alert
          status="info"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          borderRadius="md"
          mb={4}
        >
          <AlertIcon boxSize="24px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Como funciona
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            Faça upload de uma imagem contendo texto. Nossa tecnologia EasyOCR 
            extrairá automaticamente o texto e o enviará para a área de tradução.
            Para melhores resultados, use imagens com texto claro e boa resolução.
          </AlertDescription>
        </Alert>

        <Box p={6} borderWidth="1px" borderRadius="lg">
          <VStack spacing={4} align="stretch">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
              id="image-upload"
            />
            <label htmlFor="image-upload">
              <Button as="span" colorScheme="blue" width="100%">
                Selecionar Imagem
              </Button>
            </label>

            {previewUrl && (
              <Box>
                <Image
                  src={previewUrl}
                  alt="Preview"
                  maxH="300px"
                  objectFit="contain"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.200"
                />
              </Box>
            )}

            <Button
              colorScheme="green"
              onClick={handleTranslate}
              isLoading={isLoading}
              loadingText="Processando..."
              isDisabled={!selectedImage}
            >
              Extrair Texto
            </Button>

            {isLoading && (
              <Box textAlign="center">
                <Spinner size="xl" />
                <Text mt={2}>Processando imagem com EasyOCR...</Text>
                <Text fontSize="sm" color="gray.500">
                  Isso pode levar alguns segundos dependendo da complexidade da imagem
                </Text>
              </Box>
            )}
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default ImageTranslator; 