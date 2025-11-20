// App.tsx - DeepSeek + Telegram Version COM VARIÁVEIS DE AMBIENTE
import React, { useState, useRef, useEffect } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Tab,
  Tabs,
  Box,
  Paper,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Fab,
  Zoom,
  Alert,
  Snackbar,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Settings as SettingsIcon,
  FileUpload as FileUploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  SmartToy as AgentIcon,
  Chat as ChatIcon,
  Psychology as PsychologyIcon,
  Hexagon as HexagonIcon,
  Hive as HiveIcon,
  Telegram as TelegramIcon,
  Key as KeyIcon,
  Send as SendIcon,
} from '@mui/icons-material';

// Paleta de cores personalizada (inspirada no DeepSeek)
const theme = createTheme({
  palette: {
    primary: {
      main: '#6366F1', // Índigo DeepSeek
      light: '#818CF8',
      dark: '#4338CA',
    },
    secondary: {
      main: '#10B981', // Verde DeepSeek
      light: '#34D399',
      dark: '#059669',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1E293B',
      secondary: '#64748B',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 25px 0 rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#6366F1',
          backgroundImage: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
        },
      },
    },
  },
});

// Tipos
interface Agent {
  id: string;
  name: string;
  avatar: string;
  systemInstruction: string;
  isIntercept: boolean;
}

interface Message {
  id: string;
  agentId: string;
  content: string;
  timestamp: Date;
  files?: string[];
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  agents: string[];
  createdAt: Date;
}

interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
}

interface DeepSeekConfig {
  apiKey: string;
  baseURL: string;
  model: string;
}

// Componente principal
const ColmeiaApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string>('');
  const [newMessage, setNewMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [newAgent, setNewAgent] = useState<Partial<Agent>>({});
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  
  // CONFIGURAÇÕES COM VARIÁVEIS DE AMBIENTE
  const [deepSeekConfig, setDeepSeekConfig] = useState<DeepSeekConfig>({
    apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY || '',
    baseURL: import.meta.env.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
    model: import.meta.env.VITE_DEEPSEEK_MODEL || 'deepseek-chat'
  });
  
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>({
    botToken: import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '',
    chatId: import.meta.env.VITE_TELEGRAM_CHAT_ID || '',
    enabled: !!(import.meta.env.VITE_TELEGRAM_BOT_TOKEN && import.meta.env.VITE_TELEGRAM_CHAT_ID)
  });

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Session Restore - Persistência de estado
  useEffect(() => {
    const savedState = localStorage.getItem('colmeia-deepseek-state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        setAgents(state.agents || []);
        setConversations(state.conversations || []);
        setCurrentConversation(state.currentConversation || '');
        setMemoryEnabled(state.memoryEnabled !== false);
        
        // Mesclar configurações salvas com variáveis de ambiente
        setDeepSeekConfig(prev => ({
          ...prev,
          ...state.deepSeekConfig,
          // Mantém a API key da environment variable se existir
          apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY || state.deepSeekConfig?.apiKey || ''
        }));
        
        setTelegramConfig(prev => ({
          ...prev,
          ...state.telegramConfig,
          // Mantém os tokens das environment variables se existirem
          botToken: import.meta.env.VITE_TELEGRAM_BOT_TOKEN || state.telegramConfig?.botToken || '',
          chatId: import.meta.env.VITE_TELEGRAM_CHAT_ID || state.telegramConfig?.chatId || '',
          enabled: !!(import.meta.env.VITE_TELEGRAM_BOT_TOKEN && import.meta.env.VITE_TELEGRAM_CHAT_ID) || state.telegramConfig?.enabled
        }));
      } catch (error) {
        console.error('Erro ao restaurar estado:', error);
      }
    }
  }, []);

  // Salvar estado automaticamente
  useEffect(() => {
    const state = {
      agents,
      conversations,
      currentConversation,
      memoryEnabled,
      deepSeekConfig: {
        ...deepSeekConfig,
        // Não salvar API key no localStorage por segurança
        apiKey: deepSeekConfig.apiKey && !import.meta.env.VITE_DEEPSEEK_API_KEY ? deepSeekConfig.apiKey : ''
      },
      telegramConfig: {
        ...telegramConfig,
        // Não salvar tokens no localStorage por segurança
        botToken: telegramConfig.botToken && !import.meta.env.VITE_TELEGRAM_BOT_TOKEN ? telegramConfig.botToken : '',
        chatId: telegramConfig.chatId && !import.meta.env.VITE_TELEGRAM_CHAT_ID ? telegramConfig.chatId : ''
      },
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('colmeia-deepseek-state', JSON.stringify(state));
  }, [agents, conversations, currentConversation, memoryEnabled, deepSeekConfig, telegramConfig]);

  // Função para chamar DeepSeek API
  const callDeepSeekAPI = async (prompt: string, context: string = '', agentInstruction: string = '') => {
    // Usar API key das environment variables OU do estado
    const apiKeyToUse = import.meta.env.VITE_DEEPSEEK_API_KEY || deepSeekConfig.apiKey;
    
    if (!apiKeyToUse) {
      throw new Error('Chave da API DeepSeek não configurada. Configure VITE_DEEPSEEK_API_KEY no .env ou nas configurações.');
    }

    const apiUrl = `${deepSeekConfig.baseURL}/chat/completions`;
    
    const messages = [];
    
    // Adicionar system message se houver instrução do agente
    if (agentInstruction) {
      messages.push({
        role: 'system',
        content: agentInstruction
      });
    }
    
    // Adicionar contexto de memória
    if (context && memoryEnabled) {
      messages.push({
        role: 'system',
        content: `Contexto da conversa:\n${context}`
      });
    }
    
    // Adicionar mensagem do usuário
    messages.push({
      role: 'user',
      content: prompt
    });

    const payload = {
      model: deepSeekConfig.model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2048,
      stream: false
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKeyToUse}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`DeepSeek API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Erro ao chamar DeepSeek API:', error);
      throw error;
    }
  };

  // Função para enviar mensagem para Telegram
  const sendTelegramMessage = async (message: string, files?: File[]) => {
    // Usar tokens das environment variables OU do estado
    const botTokenToUse = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || telegramConfig.botToken;
    const chatIdToUse = import.meta.env.VITE_TELEGRAM_CHAT_ID || telegramConfig.chatId;
    
    if (!telegramConfig.enabled || !botTokenToUse || !chatIdToUse) {
      return;
    }

    try {
      // Enviar mensagem de texto
      if (message) {
        const textUrl = `https://api.telegram.org/bot${botTokenToUse}/sendMessage`;
        await fetch(textUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatIdToUse,
            text: `🤖 ${message}`,
            parse_mode: 'HTML'
          })
        });
      }

      // Enviar arquivos se houver
      if (files && files.length > 0) {
        for (const file of files) {
          const formData = new FormData();
          formData.append('chat_id', chatIdToUse);
          formData.append('document', file);
          
          const fileUrl = `https://api.telegram.org/bot${botTokenToUse}/sendDocument`;
          await fetch(fileUrl, {
            method: 'POST',
            body: formData
          });
        }
      }
    } catch (error) {
      console.error('Erro ao enviar para Telegram:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao enviar mensagem para Telegram',
        severity: 'error'
      });
    }
  };

  // Função para criar agente com IA
  const generateAgentWithAI = async (description: string) => {
    try {
      const prompt = `Crie uma system instruction concisa e profissional para um agente de IA com as seguintes características: ${description}. 
      A system instruction deve definir claramente o papel, especialidade e comportamento do agente. 
      Retorne apenas a system instruction, sem explicações adicionais.`;
      
      const instruction = await callDeepSeekAPI(prompt, '', 'Você é um especialista em criar instruções para agentes de IA.');
      setNewAgent(prev => ({
        ...prev,
        systemInstruction: instruction
      }));
      
      setSnackbar({
        open: true,
        message: 'System instruction gerada com sucesso!',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao gerar system instruction com IA',
        severity: 'error'
      });
    }
  };

  // Função para enviar mensagem
  const sendMessage = async () => {
    if (!newMessage.trim() || !currentConversation) return;

    const conversation = conversations.find(c => c.id === currentConversation);
    if (!conversation) return;

    // Adicionar mensagem do usuário
    const userMessage: Message = {
      id: Date.now().toString(),
      agentId: 'user',
      content: newMessage,
      timestamp: new Date(),
      files: uploadedFiles.map(f => f.name),
    };

    const updatedConversation = {
      ...conversation,
      messages: [...conversation.messages, userMessage],
    };

    setConversations(prev => 
      prev.map(c => c.id === currentConversation ? updatedConversation : c)
    );
    
    const currentMessage = newMessage;
    const currentFiles = [...uploadedFiles];
    
    setNewMessage('');
    setUploadedFiles([]);

    try {
      // Enviar para Telegram se configurado
      if (telegramConfig.enabled) {
        await sendTelegramMessage(`💬 Nova mensagem: ${currentMessage}`, currentFiles);
      }

      // Processar com agentes
      for (const agentId of conversation.agents) {
        const agent = agents.find(a => a.id === agentId);
        if (!agent) continue;

        // Construir contexto com memória se habilitada
        let context = '';
        if (memoryEnabled) {
          const recentMessages = conversation.messages.slice(-10);
          context = recentMessages.map(m => 
            `${m.agentId === 'user' ? 'User' : agents.find(a => a.id === m.agentId)?.name}: ${m.content}`
          ).join('\n');
        }

        const response = await callDeepSeekAPI(currentMessage, context, agent.systemInstruction);
        
        const agentMessage: Message = {
          id: `${Date.now()}-${agentId}`,
          agentId: agent.id,
          content: response,
          timestamp: new Date(),
        };

        setConversations(prev => 
          prev.map(c => 
            c.id === currentConversation 
              ? { ...c, messages: [...c.messages, agentMessage] }
              : c
          )
        );

        // Enviar resposta do agente para Telegram
        if (telegramConfig.enabled) {
          await sendTelegramMessage(`🤖 ${agent.name}: ${response}`);
        }
      }

      setSnackbar({
        open: true,
        message: 'Mensagem processada com sucesso!',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao processar mensagem: ' + (error instanceof Error ? error.message : 'Erro desconhecido'),
        severity: 'error'
      });
    }
  };

  // Função para exportar configurações
  const exportSettings = () => {
    const data = {
      agents,
      conversations,
      memoryEnabled,
      deepSeekConfig: {
        ...deepSeekConfig,
        apiKey: '' // Não exportar chave por segurança
      },
      telegramConfig: {
        ...telegramConfig,
        botToken: '', // Não exportar token por segurança
        chatId: '' // Não exportar chat ID por segurança
      },
      exportDate: new Date().toISOString(),
      version: '2.0-deepseek',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `colmeia-deepseek-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Função para importar configurações
  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          setAgents(data.agents || []);
          setConversations(data.conversations || []);
          setMemoryEnabled(data.memoryEnabled !== false);
          
          // Só atualiza configurações se não houver environment variables
          if (!import.meta.env.VITE_DEEPSEEK_API_KEY) {
            setDeepSeekConfig(prev => ({
              ...prev,
              ...data.deepSeekConfig
            }));
          }
          
          if (!import.meta.env.VITE_TELEGRAM_BOT_TOKEN) {
            setTelegramConfig(prev => ({
              ...prev,
              ...data.telegramConfig
            }));
          }
          
          setSnackbar({
            open: true,
            message: 'Configurações importadas com sucesso!',
            severity: 'success'
          });
        } catch (error) {
          setSnackbar({
            open: true,
            message: 'Erro ao importar configurações',
            severity: 'error'
          });
        }
      };
      reader.readAsText(file);
    }
  };

  // Verificar se está usando environment variables
  const usingEnvDeepSeek = !!import.meta.env.VITE_DEEPSEEK_API_KEY;
  const usingEnvTelegram = !!(import.meta.env.VITE_TELEGRAM_BOT_TOKEN && import.meta.env.VITE_TELEGRAM_CHAT_ID);

  // Componente de aba de Chat
  const ChatTab = () => (
    <Box sx={{ p: 3, height: 'calc(100vh - 200px)' }}>
      <Paper sx={{ p: 2, mb: 2, backgroundColor: 'primary.light', color: 'white' }}>
        <Typography variant="h6" gutterBottom>
          🐝 Colmeia DeepSeek + Telegram
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Sistema multi-agente com integração DeepSeek API e Telegram
          {usingEnvDeepSeek && (
            <Chip 
              label="Usando Environment Variables" 
              size="small" 
              color="success" 
              sx={{ mt: 1, mr: 1 }}
            />
          )}
          {usingEnvTelegram && (
            <Chip 
              label="Telegram via Environment" 
              size="small" 
              color="info" 
              sx={{ mt: 1 }}
            />
          )}
        </Typography>
        {!deepSeekConfig.apiKey && (
          <Alert severity="warning" sx={{ mt: 1, backgroundColor: 'rgba(255,255,255,0.2)' }}>
            Configure sua chave da API DeepSeek nas Configurações ou via Environment Variables
          </Alert>
        )}
      </Paper>

      <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
        {/* Lista de conversas */}
        <Card sx={{ width: 300, flexShrink: 0 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Conversas
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              fullWidth
              sx={{ mb: 2 }}
              onClick={() => {
                const newConv: Conversation = {
                  id: Date.now().toString(),
                  title: `Nova Conversa ${conversations.length + 1}`,
                  messages: [],
                  agents: agents.filter(a => !a.isIntercept).map(a => a.id),
                  createdAt: new Date(),
                };
                setConversations(prev => [...prev, newConv]);
                setCurrentConversation(newConv.id);
              }}
            >
              Nova Conversa
            </Button>
            
            <List>
              {conversations.map(conv => (
                <ListItem
                  key={conv.id}
                  button
                  selected={currentConversation === conv.id}
                  onClick={() => setCurrentConversation(conv.id)}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <ListItemText
                    primary={conv.title}
                    secondary={`${conv.messages.length} mensagens`}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>

        {/* Área de mensagens */}
        <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {currentConversation ? (
              <>
                <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
                  {conversations
                    .find(c => c.id === currentConversation)
                    ?.messages.map(message => {
                      const agent = agents.find(a => a.id === message.agentId);
                      return (
                        <Box
                          key={message.id}
                          sx={{
                            display: 'flex',
                            justifyContent: message.agentId === 'user' ? 'flex-end' : 'flex-start',
                            mb: 2,
                          }}
                        >
                          <Paper
                            sx={{
                              p: 2,
                              maxWidth: '70%',
                              backgroundColor: message.agentId === 'user' 
                                ? 'primary.main' 
                                : 'background.paper',
                              color: message.agentId === 'user' ? 'white' : 'text.primary',
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              {agent && (
                                <Avatar
                                  sx={{ 
                                    width: 24, 
                                    height: 24, 
                                    mr: 1,
                                    bgcolor: message.agentId === 'user' ? 'white' : 'primary.main',
                                    color: message.agentId === 'user' ? 'primary.main' : 'white'
                                  }}
                                  src={agent.avatar}
                                  alt={agent.name}
                                >
                                  {message.agentId === 'user' ? '👤' : <AgentIcon />}
                                </Avatar>
                              )}
                              <Typography variant="subtitle2">
                                {message.agentId === 'user' ? 'Você' : agent?.name}
                              </Typography>
                            </Box>
                            <Typography variant="body1">{message.content}</Typography>
                            {message.files && message.files.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                {message.files.map(file => (
                                  <Chip
                                    key={file}
                                    icon={<FileUploadIcon />}
                                    label={file}
                                    size="small"
                                    sx={{ 
                                      mr: 1, 
                                      mb: 1,
                                      backgroundColor: message.agentId === 'user' ? 'rgba(255,255,255,0.2)' : 'action.hover'
                                    }}
                                  />
                                ))}
                              </Box>
                            )}
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                opacity: 0.7, 
                                display: 'block', 
                                mt: 1,
                                color: message.agentId === 'user' ? 'rgba(255,255,255,0.8)' : 'text.secondary'
                              }}
                            >
                              {message.timestamp.toLocaleTimeString()}
                            </Typography>
                          </Paper>
                        </Box>
                      );
                    })}
                </Box>

                {/* Área de input */}
                <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
                  {uploadedFiles.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Arquivos anexados:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {uploadedFiles.map((file, index) => (
                          <Chip
                            key={index}
                            label={file.name}
                            onDelete={() => {
                              setUploadedFiles(prev => prev.filter((_, i) => i !== index));
                            }}
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                    <input
                      type="file"
                      multiple
                      id="file-upload"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files) {
                          setUploadedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                        }
                      }}
                    />
                    <label htmlFor="file-upload">
                      <IconButton component="span" color="primary">
                        <FileUploadIcon />
                      </IconButton>
                    </label>
                    
                    <TextField
                      fullWidth
                      variant="outlined"
                      placeholder="Digite sua mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      multiline
                      maxRows={4}
                      disabled={!deepSeekConfig.apiKey}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton 
                              onClick={sendMessage}
                              disabled={!newMessage.trim() || !deepSeekConfig.apiKey}
                              color="primary"
                            >
                              <SendIcon />
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                  </Box>
                  {!deepSeekConfig.apiKey && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                      Configure sua chave da API DeepSeek para habilitar o chat
                    </Typography>
                  )}
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  textAlign: 'center',
                }}
              >
                <HiveIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Colmeia DeepSeek + Telegram
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  Sistema multi-agente com integração completa
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    const newConv: Conversation = {
                      id: Date.now().toString(),
                      title: `Nova Conversa ${conversations.length + 1}`,
                      messages: [],
                      agents: agents.filter(a => !a.isIntercept).map(a => a.id),
                      createdAt: new Date(),
                    };
                    setConversations(prev => [...prev, newConv]);
                    setCurrentConversation(newConv.id);
                  }}
                >
                  Começar Nova Conversa
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );

  // Componente de aba de Configurações
  const SettingsTab = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Configurações - DeepSeek + Telegram
      </Typography>

      {/* Configurações DeepSeek */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <KeyIcon /> Configurações DeepSeek API
          </Typography>
          
          {usingEnvDeepSeek && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Usando environment variable VITE_DEEPSEEK_API_KEY
            </Alert>
          )}
          
          <TextField
            fullWidth
            label="API Key"
            type="password"
            value={deepSeekConfig.apiKey}
            onChange={(e) => setDeepSeekConfig(prev => ({ ...prev, apiKey: e.target.value }))}
            sx={{ mb: 2 }}
            disabled={usingEnvDeepSeek}
            helperText={usingEnvDeepSeek 
              ? "API Key definida via environment variable" 
              : "Obtenha sua chave em: https://platform.deepseek.com/api_keys"
            }
          />
          
          <TextField
            fullWidth
            label="URL da API"
            value={deepSeekConfig.baseURL}
            onChange={(e) => setDeepSeekConfig(prev => ({ ...prev, baseURL: e.target.value }))}
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            label="Modelo"
            value={deepSeekConfig.model}
            onChange={(e) => setDeepSeekConfig(prev => ({ ...prev, model: e.target.value }))}
            helperText="Ex: deepseek-chat, deepseek-coder"
          />
        </CardContent>
      </Card>

      {/* Configurações Telegram */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TelegramIcon /> Configurações Telegram Bot
          </Typography>
          
          {usingEnvTelegram && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Usando environment variables VITE_TELEGRAM_BOT_TOKEN e VITE_TELEGRAM_CHAT_ID
            </Alert>
          )}
          
          <FormControlLabel
            control={
              <Switch
                checked={telegramConfig.enabled}
                onChange={(e) => setTelegramConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                color="primary"
              />
            }
            label="Habilitar integração com Telegram"
            sx={{ mb: 2 }}
            disabled={usingEnvTelegram}
          />
          
          <TextField
            fullWidth
            label="Bot Token"
            type="password"
            value={telegramConfig.botToken}
            onChange={(e) => setTelegramConfig(prev => ({ ...prev, botToken: e.target.value }))}
            sx={{ mb: 2 }}
            disabled={!telegramConfig.enabled || usingEnvTelegram}
            helperText={usingEnvTelegram 
              ? "Bot Token definido via environment variable" 
              : "Obtenha com @BotFather no Telegram"
            }
          />
          
          <TextField
            fullWidth
            label="Chat ID"
            value={telegramConfig.chatId}
            onChange={(e) => setTelegramConfig(prev => ({ ...prev, chatId: e.target.value }))}
            disabled={!telegramConfig.enabled || usingEnvTelegram}
            helperText={usingEnvTelegram 
              ? "Chat ID definido via environment variable" 
              : "ID do chat/grupo para receber mensagens"
            }
          />
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Sistema de Memória
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={memoryEnabled}
                onChange={(e) => setMemoryEnabled(e.target.checked)}
                color="primary"
              />
            }
            label="Habilitar sistema de memória persistente"
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Quando habilitado, os agentes manterão contexto das conversas anteriores
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Gerenciar Agentes</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAgentDialogOpen(true)}
            >
              Novo Agente
            </Button>
          </Box>

          <List>
            {agents.map(agent => (
              <ListItem
                key={agent.id}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  mb: 1,
                }}
              >
                <ListItemAvatar>
                  <Avatar src={agent.avatar} alt={agent.name}>
                    <AgentIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {agent.name}
                      {agent.isIntercept && (
                        <Chip
                          label="Interceptador"
                          size="small"
                          color="secondary"
                          icon={<PsychologyIcon />}
                        />
                      )}
                    </Box>
                  }
                  secondary={agent.systemInstruction.substring(0, 100) + '...'}
                />
                {!agent.isIntercept && (
                  <IconButton
                    onClick={() => setAgents(prev => prev.filter(a => a.id !== agent.id))}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Backup e Restauração
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportSettings}
            >
              Exportar Configurações
            </Button>
            
            <input
              type="file"
              accept=".json"
              id="import-settings"
              style={{ display: 'none' }}
              onChange={importSettings}
            />
            <label htmlFor="import-settings">
              <Button
                component="span"
                variant="outlined"
                startIcon={<FileUploadIcon />}
              >
                Importar Configurações
              </Button>
            </label>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );

  // Dialog para criar/editar agente
  const AgentDialog = () => (
    <Dialog open={agentDialogOpen} onClose={() => setAgentDialogOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        {newAgent.id ? 'Editar Agente' : 'Criar Novo Agente'}
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Nome do Agente"
          value={newAgent.name || ''}
          onChange={(e) => setNewAgent(prev => ({ ...prev, name: e.target.value }))}
          sx={{ mt: 2 }}
        />
        
        <TextField
          fullWidth
          label="URL do Avatar"
          value={newAgent.avatar || ''}
          onChange={(e) => setNewAgent(prev => ({ ...prev, avatar: e.target.value }))}
          sx={{ mt: 2 }}
          helperText="Ou deixe em branco para usar avatar padrão"
        />
        
        <TextField
          fullWidth
          multiline
          rows={4}
          label="System Instruction"
          value={newAgent.systemInstruction || ''}
          onChange={(e) => setNewAgent(prev => ({ ...prev, systemInstruction: e.target.value }))}
          sx={{ mt: 2 }}
          helperText="Instruções que definem o comportamento do agente"
        />