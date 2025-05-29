import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  Link,
  useToast,
  Container,
  useColorModeValue
} from '@chakra-ui/react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/');
      } else {
        toast({
          title: 'Erro',
          description: 'Email ou senha inválidos',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro durante o login',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Container maxW="container.sm" py={8}>
      <Box
        bg={bgColor}
        p={8}
        borderRadius="lg"
        boxShadow="md"
        borderWidth="1px"
        borderColor={borderColor}
      >
        <VStack spacing={6} align="stretch">
          <Box textAlign="center">
            <Heading size="xl" mb={2}>Login</Heading>
            <Text color="gray.500">
              Entre com suas credenciais para acessar o PolyLingua
            </Text>
          </Box>

          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl id="email" isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu email"
                />
              </FormControl>

              <FormControl id="password" isRequired>
                <FormLabel>Senha</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                />
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                width="full"
                mt={4}
                isLoading={isLoading}
                loadingText="Entrando..."
              >
                Entrar
              </Button>
            </VStack>
          </form>

          <Text mt={4} textAlign="center">
            Não tem uma conta?{' '}
            <Link as={RouterLink} to="/register" color="blue.500">
              Registre-se
            </Link>
          </Text>
        </VStack>
      </Box>
    </Container>
  );
};

export default Login; 