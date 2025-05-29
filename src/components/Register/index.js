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
  useColorModeValue,
  FormErrorMessage
} from '@chakra-ui/react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const validateForm = () => {
    const newErrors = {};
    
    if (!name.trim()) {
      newErrors.name = 'O nome é obrigatório';
    }
    
    if (!email.trim()) {
      newErrors.email = 'O email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!password) {
      newErrors.password = 'A senha é obrigatória';
    } else if (password.length < 6) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres';
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await register(name, email, password);
      if (success) {
        toast({
          title: 'Sucesso',
          description: 'Conta criada com sucesso',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        navigate('/');
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível criar a conta',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro durante o registro',
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
            <Heading size="xl" mb={2}>Cadastro</Heading>
            <Text color="gray.500">
              Crie sua conta para acessar o PolyLingua
            </Text>
          </Box>

          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl id="name" isRequired isInvalid={errors.name}>
                <FormLabel>Nome</FormLabel>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                />
                <FormErrorMessage>{errors.name}</FormErrorMessage>
              </FormControl>

              <FormControl id="email" isRequired isInvalid={errors.email}>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu email"
                />
                <FormErrorMessage>{errors.email}</FormErrorMessage>
              </FormControl>

              <FormControl id="password" isRequired isInvalid={errors.password}>
                <FormLabel>Senha</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                />
                <FormErrorMessage>{errors.password}</FormErrorMessage>
              </FormControl>

              <FormControl id="confirmPassword" isRequired isInvalid={errors.confirmPassword}>
                <FormLabel>Confirmar Senha</FormLabel>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme sua senha"
                />
                <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                width="full"
                mt={4}
                isLoading={isLoading}
                loadingText="Registrando..."
              >
                Registrar
              </Button>
            </VStack>
          </form>

          <Text mt={4} textAlign="center">
            Já tem uma conta?{' '}
            <Link as={RouterLink} to="/login" color="blue.500">
              Faça login
            </Link>
          </Text>
        </VStack>
      </Box>
    </Container>
  );
};

export default Register; 