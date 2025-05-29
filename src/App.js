import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { TranslationProvider } from './context/TranslationContext';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import TranslationForm from './components/TranslationForm';
import History from './components/History';
import Profile from './components/Profile';
import Login from './components/Login';
import Register from './components/Register';
import ThemeManager from './components/ThemeManager';
import ImageTranslator from './components/ImageTranslator';

// Componente para rotas protegidas
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <ChakraProvider>
      <ColorModeScript />
      <AuthProvider>
        <SettingsProvider>
          <ThemeManager />
          <TranslationProvider>
            <BrowserRouter>
              <Header />
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                      <TranslationForm />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <PrivateRoute>
                      <History />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/image-translate"
                  element={
                    <PrivateRoute>
                      <ImageTranslator />
                    </PrivateRoute>
                  }
                />
              </Routes>
            </BrowserRouter>
          </TranslationProvider>
        </SettingsProvider>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App; 