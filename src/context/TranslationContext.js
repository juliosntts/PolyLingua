import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const TranslationContext = createContext();

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation deve ser usado dentro de um TranslationProvider');
  }
  return context;
};

export const TranslationProvider = ({ children }) => {
  const [translations, setTranslations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTranslations = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      
      const response = await fetch('http://localhost:5000/api/translations', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setTranslations(data.translations || []);
      } else {
        throw new Error(data.message || 'Erro ao buscar histórico de traduções');
      }
    } catch (err) {
      setError(err.message);
      console.error('Erro ao buscar histórico de traduções:', err);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const initialFetch = async () => {
        try {
          const response = await fetch('http://localhost:5000/api/translations', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          const data = await response.json();
          
          if (response.ok) {
            setTranslations(data.translations || []);
          }
        } catch (err) {
          console.error('Erro ao buscar histórico inicial:', err);
        }
      };
      
      initialFetch();
    }
  }, []);

  const translate = async (text, sourceLanguage, targetLanguage, autoDetect) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text,
          source: autoDetect ? 'auto' : sourceLanguage,
          target: targetLanguage,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Após uma tradução bem-sucedida, buscar traduções do backend mais recentes
        // Sem usar fetchTranslations para evitar potenciais loops
        const newTranslationResponse = await fetch('http://localhost:5000/api/translations', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (newTranslationResponse.ok) {
          const newData = await newTranslationResponse.json();
          setTranslations(newData.translations || []);
        }
        
        return { 
          success: true, 
          translated_text: data.translated_text,
          detected_language: data.detected_language
        };
      } else {
        throw new Error(data.message || 'Erro na tradução');
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const detectLanguage = async (text) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, detectedLanguage: data.detected_language };
      } else {
        throw new Error(data.message || 'Erro na detecção de idioma');
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (loading) return Promise.reject(new Error('Operação em andamento'));
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/translations', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setTranslations([]);
        return Promise.resolve();
      } else {
        throw new Error(data.message || 'Erro ao limpar histórico de traduções');
      }
    } catch (err) {
      setError(err.message);
      console.error('Erro ao limpar histórico de traduções:', err);
      return Promise.reject(err);
    } finally {
      setLoading(false);
    }
  };

  const removeTranslation = async (id) => {
    if (loading) return Promise.reject(new Error('Operação em andamento'));
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/translations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setTranslations(prev => prev.filter(t => t.id !== id));
        return Promise.resolve();
      } else {
        throw new Error(data.message || 'Erro ao remover tradução');
      }
    } catch (err) {
      setError(err.message);
      console.error('Erro ao remover tradução:', err);
      return Promise.reject(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TranslationContext.Provider
      value={{
        translations,
        loading,
        error,
        translate,
        detectLanguage,
        clearHistory,
        removeTranslation,
        fetchTranslations
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
}; 