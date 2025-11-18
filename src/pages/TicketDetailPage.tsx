import { useState, useEffect, useRef } from 'react';
import { useRoute } from 'wouter';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { ArrowLeft, Send, Paperclip, Loader2, FileText, Mic, Download, X, Square, Play, Pause } from 'lucide-react';
import { ticketsAPI, chatAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';

interface Ticket {
  id: number;
  subject: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: {
    id: number;
    name: string;
    email: string;
  };
  order?: {
    id: number;
    status: string;
    total: number;
  };
}

interface ChatMessage {
  id: number;
  ticketId: number;
  senderId: number;
  senderIsAdmin: boolean;
  content: string;
  messageType: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead: boolean;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: 'Aberto', color: 'bg-blue-500' },
  in_progress: { label: 'Em Andamento', color: 'bg-yellow-500' },
  waiting_customer: { label: 'Aguardando Cliente', color: 'bg-orange-500' },
  resolved: { label: 'Resolvido', color: 'bg-green-500' },
  closed: { label: 'Fechado', color: 'bg-gray-500' },
};

// Componente para reproduzir áudio com fallback
function AudioPlayer({ message }: { message: ChatMessage }) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDownloadFile = (message: ChatMessage) => {
    if (!message.fileUrl) return;
    
    const link = document.createElement('a');
    link.href = message.fileUrl;
    link.download = message.fileName || 'arquivo';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (!message.fileUrl) return;

    console.log('🎵 Processando áudio. URL começa com:', message.fileUrl.substring(0, 50));

    // Se já é uma URL válida (não base64), usar diretamente
    if (!message.fileUrl.startsWith('data:')) {
      console.log('✅ Usando URL diretamente');
      setAudioUrl(message.fileUrl);
      return;
    }

    // Para base64, converter para Blob e criar URL temporária
    try {
      let mimeType = 'audio/webm'; // Tipo padrão
      let base64Data = '';

      // Tentar diferentes formatos de data URI
      // Formato 1: data:audio/webm;codecs=opus;base64,... ou data:audio/webm;base64,...
      let matches = message.fileUrl.match(/^data:([^;]+(?:;[^;]+)*);base64,(.+)$/);
      
      if (!matches) {
        // Formato 2: data:audio/webm,... (sem base64)
        matches = message.fileUrl.match(/^data:([^,]+),(.+)$/);
      }
      
      if (!matches) {
        // Formato 3: apenas base64 sem prefixo data:
        // Tentar usar como base64 puro
        console.log('⚠️ Tentando processar como base64 puro');
        base64Data = message.fileUrl;
        // Tentar detectar o tipo MIME do nome do arquivo ou usar padrão
        if (message.fileName) {
          if (message.fileName.endsWith('.webm')) mimeType = 'audio/webm';
          else if (message.fileName.endsWith('.mp4')) mimeType = 'audio/mp4';
          else if (message.fileName.endsWith('.ogg')) mimeType = 'audio/ogg';
          else if (message.fileName.endsWith('.wav')) mimeType = 'audio/wav';
        }
      } else {
        // Extrair tipo MIME (pode incluir codecs, mas não incluir ;base64)
        mimeType = matches[1] || 'audio/webm';
        base64Data = matches[2];
        
        // Garantir que o tipo MIME não inclua 'base64'
        if (mimeType.includes('base64')) {
          mimeType = mimeType.replace(/;?\s*base64\s*/gi, '').trim();
        }
      }

      console.log('📦 Tipo MIME:', mimeType);
      console.log('📦 Tamanho do base64:', base64Data.length, 'caracteres');

      if (!base64Data || base64Data.length === 0) {
        throw new Error('Dados base64 vazios');
      }

      // Converter base64 para Blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      console.log('✅ Blob criado:', blob.size, 'bytes, tipo:', blob.type);

      // Criar URL temporária
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      console.log('✅ URL temporária criada');

      // Limpar URL quando componente desmontar
      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (err: any) {
      console.error('❌ Erro ao processar áudio base64:', err);
      console.error('❌ URL completa (primeiros 200 chars):', message.fileUrl?.substring(0, 200));
      setError('Erro ao carregar áudio: ' + (err.message || 'Formato inválido'));
    }
  }, [message.fileUrl]);

  if (error) {
    return (
      <div className="bg-white/10 rounded-lg p-3">
        <p className="text-sm text-white/70">{error}</p>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 mt-2"
          onClick={() => handleDownloadFile(message)}
        >
          <Download className="h-4 w-4 mr-2" />
          Baixar áudio
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white/10 rounded-lg p-3">
      <div className="flex items-center gap-3 mb-2">
        <Mic className="h-6 w-6 text-white" />
        <div className="flex-1">
          <p className="text-sm font-medium text-white">{message.fileName || 'Áudio'}</p>
          {message.fileSize && (
            <p className="text-xs text-white/70">{formatFileSize(message.fileSize)}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20"
          onClick={() => handleDownloadFile(message)}
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
      {audioUrl ? (
        <audio 
          controls 
          className="w-full" 
          style={{ maxWidth: '100%' }}
          preload="metadata"
          onError={(e) => {
            const audioElement = e.target as HTMLAudioElement;
            const error = audioElement.error;
            console.error('❌ Erro ao carregar áudio:', {
              code: error?.code,
              message: error?.message,
            });
            setError('Erro ao reproduzir áudio');
          }}
          onLoadedMetadata={(e) => {
            console.log('✅ Áudio carregado:', (e.target as HTMLAudioElement).duration, 'segundos');
          }}
        >
          <source src={audioUrl} />
          Seu navegador não suporta o elemento de áudio.
        </audio>
      ) : (
        <div className="text-sm text-white/70">Carregando áudio...</div>
      )}
    </div>
  );
}

export function TicketDetailPage() {
  const [, params] = useRoute('/tickets/:id');
  const ticketId = params?.id ? parseInt(params.id) : null;
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [attachedFile, setAttachedFile] = useState<{
    file: File;
    preview: string;
    type: 'image' | 'pdf' | 'audio';
  } | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Esperar o AuthContext terminar de carregar antes de verificar autenticação
    if (authLoading) {
      return;
    }
    
    if (!isAuthenticated || !ticketId) return;

    loadTicket();
    loadMessages();

    // Conectar ao WebSocket se disponível
    const socketEnabled = import.meta.env.VITE_SOCKET_IO_ENABLED === 'true';
    
    const getSocketUrl = async () => {
      if (import.meta.env.VITE_SOCKET_IO_URL) {
        return import.meta.env.VITE_SOCKET_IO_URL;
      }
      // Usar a função helper do api.ts para detectar a URL correta
      const { getServerUrl } = await import('../lib/api');
      return getServerUrl('5000');
    };
    
    if (socketEnabled) {
      getSocketUrl().then(socketUrl => {
        const newSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        console.log('✅ Conectado ao WebSocket para chat');
        if (ticketId) {
          newSocket.emit('chat:join', ticketId);
        }
      });

      newSocket.on('chat:message', (message: ChatMessage) => {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      });

      newSocket.on('ticket:update', (updatedTicket: Ticket) => {
        setTicket(updatedTicket);
      });

        setSocket(newSocket);

        return () => {
          if (ticketId) {
            newSocket.emit('chat:leave', ticketId);
          }
          newSocket.disconnect();
        };
      }).catch(error => {
        console.error('Erro ao conectar WebSocket:', error);
      });
    }

    // Polling como fallback (a cada 5 segundos)
    const pollingInterval = setInterval(() => {
      loadMessages();
    }, 5000);

    return () => {
      clearInterval(pollingInterval);
      if (socket) {
        if (ticketId) {
          socket.emit('chat:leave', ticketId);
        }
        socket.disconnect();
      }
      
      // Limpar recursos de gravação de áudio apenas se não estiver gravando
      // Não limpar durante a gravação para evitar interrupções
      if (mediaRecorderRef.current && !isRecording) {
        try {
          if (mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
        } catch (error) {
          console.warn('⚠️ Erro ao parar gravação no cleanup:', error);
        }
      }
      
      // Não parar o stream se estiver gravando
      if (mediaStreamRef.current && !isRecording) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
      }
      
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current = null;
      }
    };
  }, [ticketId, isAuthenticated, authLoading]); // Remover isRecording e audioPreviewUrl das dependências

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadTicket = async () => {
    if (!ticketId) return;

    try {
      const data = await ticketsAPI.getById(ticketId);
      setTicket(data);
    } catch (error: any) {
      console.error('Error loading ticket:', error);
      toast.error('Erro ao carregar ticket', {
        description: error.response?.data?.error || 'Tente novamente mais tarde.',
      });
    }
  };

  const loadMessages = async () => {
    if (!ticketId) return;

    try {
      const data = await chatAPI.getMessages(ticketId);
      setMessages(data);
      setLoading(false);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      setLoading(false);
    }
  };

  const compressImage = (file: File, maxWidth: number = 1600, maxHeight: number = 1600, quality: number = 0.75): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Redimensionar se for muito grande (mais agressivo para reduzir tamanho)
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Erro ao processar a imagem'));
            return;
          }

          // Melhorar qualidade de renderização
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Converter para JPEG com compressão (reduz tamanho)
          // Usar qualidade menor para reduzir tamanho do arquivo
          const base64String = canvas.toDataURL('image/jpeg', quality);
          
          // Verificar tamanho do base64 resultante
          const sizeInMB = (base64String.length * 3) / 4 / 1024 / 1024;
          console.log(`📸 Imagem comprimida: ${sizeInMB.toFixed(2)}MB (original: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
          
          if (sizeInMB > 5) {
            // Se ainda estiver muito grande, comprimir mais
            console.warn('⚠️ Imagem ainda muito grande, comprimindo mais...');
            return compressImage(file, maxWidth * 0.8, maxHeight * 0.8, quality * 0.9).then(resolve).catch(reject);
          }
          
          resolve(base64String);
        };
        img.onerror = () => {
          reject(new Error('Erro ao carregar a imagem'));
        };
        img.src = reader.result as string;
      };
      reader.onerror = () => {
        reject(new Error('Erro ao ler o arquivo'));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const isImage = file.type.startsWith('image/');
    const isPDF = file.type === 'application/pdf';
    const isAudio = file.type.startsWith('audio/');

    if (!isImage && !isPDF && !isAudio) {
      toast.error('Tipo de arquivo não suportado', {
        description: 'Apenas imagens, PDFs e arquivos de áudio são permitidos.',
      });
      return;
    }

    // Validar tamanho (máximo 10MB para arquivos originais)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande', {
        description: 'O tamanho máximo permitido é 10MB.',
      });
      return;
    }

    try {
      setUploadingFile(true);
      
      let base64 = '';
      let preview = '';

      if (isImage) {
        // Comprimir imagem antes de converter para base64
        base64 = await compressImage(file);
        preview = base64;
      } else {
        // Para PDF e áudio, converter diretamente para base64
        const reader = new FileReader();
        base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = (event) => {
            resolve(event.target?.result as string);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
      
      setAttachedFile({
        file,
        preview,
        type: isImage ? 'image' : isPDF ? 'pdf' : 'audio',
      });
      setUploadingFile(false);
    } catch (error: any) {
      console.error('Error reading file:', error);
      toast.error('Erro ao processar arquivo', {
        description: error.message || 'Tente novamente.',
      });
      setUploadingFile(false);
    }
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startRecording = async () => {
    try {
      // Verificar se o navegador suporta MediaRecorder
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Gravação de áudio não suportada', {
          description: 'Seu navegador não suporta gravação de áudio.',
        });
        return;
      }

      // Solicitar permissão para usar o microfone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      // Detectar o melhor tipo MIME suportado
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/wav',
      ];
      
      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          console.log('✅ Tipo MIME selecionado:', mimeType);
          break;
        }
      }
      
      if (!selectedMimeType) {
        // Fallback: usar o tipo padrão do navegador
        selectedMimeType = '';
        console.warn('⚠️ Nenhum tipo MIME específico suportado, usando padrão do navegador');
      }
      
      // Criar MediaRecorder
      const options: MediaRecorderOptions = {};
      if (selectedMimeType) {
        options.mimeType = selectedMimeType;
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      console.log('🎤 MediaRecorder criado com tipo:', mediaRecorder.mimeType || 'padrão do navegador');

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log('📦 Dados de áudio recebidos:', event.data.size, 'bytes');
        console.log('📊 Estado do MediaRecorder no momento:', mediaRecorder.state);
        
        // Aceitar apenas dados com tamanho maior que 0
        // Dados vazios podem ser enviados no início ou fim da gravação
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('✅ Chunk adicionado. Total de chunks:', audioChunksRef.current.length);
          console.log('📊 Tamanho total acumulado:', audioChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0), 'bytes');
        } else {
          console.warn('⚠️ Dados de áudio vazios recebidos (ignorado)');
        }
      };

      mediaRecorder.onstop = () => {
        console.log('🛑 Evento onstop disparado');
        console.log('📊 Estado do MediaRecorder:', mediaRecorder.state);
        console.log('📦 Total de chunks:', audioChunksRef.current.length);
        console.log('📦 Tamanho total dos chunks:', audioChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0), 'bytes');
        console.log('📊 Stack trace:', new Error().stack);
        
        // Verificar se foi uma parada intencional ou acidental
        // Se o tamanho for muito pequeno (< 1KB), pode ser uma parada acidental
        const totalSize = audioChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
        if (totalSize < 1000 && mediaRecorderRef.current?.state === 'inactive') {
          console.warn('⚠️ Gravação parou muito rapidamente. Pode ser uma parada acidental.');
        }
        
        // Atualizar estado imediatamente
        setIsRecording(false);
        
        // Aguardar um pouco mais para garantir que todos os dados sejam processados
        // Alguns navegadores podem enviar dados finais após o evento onstop
        setTimeout(() => {
          const totalSize = audioChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
          const chunkCount = audioChunksRef.current.length;
          
          console.log('📊 Verificação final - Chunks:', chunkCount, 'Tamanho:', totalSize, 'bytes');
          
          if (chunkCount === 0 || totalSize === 0) {
            console.error('❌ Nenhum dado de áudio foi coletado');
            toast.error('Erro na gravação', {
              description: 'Nenhum áudio foi gravado. Certifique-se de que o microfone está funcionando e tente novamente.',
            });
            
            // Limpar recursos
            if (mediaStreamRef.current) {
              mediaStreamRef.current.getTracks().forEach(track => track.stop());
              mediaStreamRef.current = null;
            }
            audioChunksRef.current = [];
            return;
          }
          
          // Criar Blob com todos os chunks
          const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
          console.log('🎵 Blob criado:', audioBlob.size, 'bytes, tipo:', audioBlob.type);
          
          if (audioBlob.size === 0) {
            console.error('❌ Blob de áudio está vazio');
            toast.error('Erro na gravação', {
              description: 'O áudio gravado está vazio. Tente novamente.',
            });
            
            // Limpar recursos
            if (mediaStreamRef.current) {
              mediaStreamRef.current.getTracks().forEach(track => track.stop());
              mediaStreamRef.current = null;
            }
            audioChunksRef.current = [];
            return;
          }
          
          // Verificar se o blob tem tamanho mínimo (pelo menos alguns KB)
          if (audioBlob.size < 1000) {
            console.warn('⚠️ Áudio muito pequeno:', audioBlob.size, 'bytes. Pode estar corrompido.');
          }
          
          setRecordedAudio(audioBlob);
          const url = URL.createObjectURL(audioBlob);
          setAudioPreviewUrl(url);
          console.log('✅ URL de preview criada:', url.substring(0, 50) + '...');
          
          toast.success('Gravação finalizada', {
            description: 'Você pode ouvir o áudio antes de enviar.',
          });
          
          // Parar todas as tracks do stream
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
          }
        }, 500); // Aumentar tempo de espera para garantir que todos os dados cheguem
      };

      mediaRecorder.onerror = (event: any) => {
        console.error('Erro na gravação:', event.error);
        toast.error('Erro ao gravar áudio', {
          description: event.error?.message || 'Tente novamente.',
        });
        setIsRecording(false);
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
          mediaStreamRef.current = null;
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      
      // Verificar se o stream está ativo antes de iniciar
      const activeTracks = stream.getAudioTracks().filter(track => track.readyState === 'live');
      console.log('🎤 Tracks de áudio ativas:', activeTracks.length);
      
      if (activeTracks.length === 0) {
        console.error('❌ Nenhuma track de áudio ativa!');
        toast.error('Erro ao iniciar gravação', {
          description: 'Nenhuma entrada de áudio detectada. Verifique o microfone.',
        });
        stream.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
        return;
      }
      
      // Iniciar gravação SEM timeslice inicialmente
      // O timeslice pode causar problemas em alguns navegadores
      try {
        // Garantir que o stream ainda está ativo antes de iniciar
        const tracks = stream.getAudioTracks();
        const activeTracksBeforeStart = tracks.filter(track => track.readyState === 'live');
        console.log('🎤 Tracks ativas antes de iniciar:', activeTracksBeforeStart.length);
        
        if (activeTracksBeforeStart.length === 0) {
          throw new Error('Nenhuma track de áudio ativa antes de iniciar gravação');
        }
        
        mediaRecorder.start();
        setIsRecording(true);
        
        console.log('🎤 Gravação iniciada. MimeType:', mediaRecorder.mimeType);
        console.log('📊 Estado do MediaRecorder:', mediaRecorder.state);
        console.log('📊 Tracks após iniciar:', stream.getAudioTracks().map(t => ({ id: t.id, readyState: t.readyState, enabled: t.enabled })));
        
        // Verificar se a gravação realmente iniciou e não parou imediatamente
        setTimeout(() => {
          if (mediaRecorderRef.current) {
            const currentState = mediaRecorderRef.current.state;
            console.log('📊 Estado após 500ms:', currentState);
            console.log('📊 Tracks após 500ms:', stream.getAudioTracks().map(t => ({ id: t.id, readyState: t.readyState, enabled: t.enabled })));
            
            if (currentState !== 'recording') {
              console.error('❌ Gravação não iniciou corretamente ou parou muito rápido! Estado:', currentState);
              
              // Verificar se as tracks ainda estão ativas
              const activeTracksAfter = stream.getAudioTracks().filter(track => track.readyState === 'live');
              console.error('📊 Tracks ativas após erro:', activeTracksAfter.length);
              
              toast.error('Erro ao iniciar gravação', {
                description: 'A gravação não iniciou ou parou muito rapidamente. Verifique o microfone e tente novamente.',
              });
              setIsRecording(false);
              if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
                mediaStreamRef.current = null;
              }
            } else {
              console.log('✅ Gravação confirmada como ativa');
            }
          }
        }, 500);
      } catch (error: any) {
        console.error('❌ Erro ao iniciar MediaRecorder:', error);
        toast.error('Erro ao iniciar gravação', {
          description: error.message || 'Tente novamente.',
        });
        setIsRecording(false);
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
          mediaStreamRef.current = null;
        }
        return;
      }

      toast.success('Gravação iniciada', {
        description: 'Clique no botão de parar para finalizar a gravação.',
      });
    } catch (error: any) {
      console.error('Erro ao iniciar gravação:', error);
      toast.error('Erro ao iniciar gravação', {
        description: error.message || 'Verifique as permissões do microfone.',
      });
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) {
      console.warn('⚠️ MediaRecorder não existe');
      setIsRecording(false);
      return;
    }

    if (!isRecording) {
      console.warn('⚠️ Gravação já está parada');
      return;
    }

    console.log('🛑 Parando gravação...');
    console.log('📊 Estado antes de parar:', mediaRecorderRef.current.state);
    console.log('📦 Chunks coletados até agora:', audioChunksRef.current.length);
    console.log('📦 Tamanho total dos chunks:', audioChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0), 'bytes');
    
    // Verificar se realmente está gravando
    if (mediaRecorderRef.current.state !== 'recording') {
      console.warn('⚠️ MediaRecorder não está gravando. Estado:', mediaRecorderRef.current.state);
      setIsRecording(false);
      return;
    }

    // Solicitar dados finais antes de parar
    try {
      mediaRecorderRef.current.requestData();
      console.log('📤 Dados finais solicitados');
    } catch (error) {
      console.warn('⚠️ Não foi possível solicitar dados finais:', error);
    }

    // Aguardar um pouco para os dados finais chegarem antes de parar
    setTimeout(() => {
      if (!mediaRecorderRef.current) {
        setIsRecording(false);
        return;
      }

      try {
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          console.log('✅ Comando de parar enviado');
        } else {
          console.warn('⚠️ MediaRecorder já estava parado');
          setIsRecording(false);
        }
      } catch (error: any) {
        console.error('❌ Erro ao parar gravação:', error);
        toast.error('Erro ao parar gravação', {
          description: error.message || 'Tente novamente.',
        });
        setIsRecording(false);
        
        // Limpar recursos
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
          mediaStreamRef.current = null;
        }
      }
    }, 200); // Aumentar tempo de espera para garantir que os dados finais cheguem
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    
    // Parar qualquer stream ativo
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    setRecordedAudio(null);
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
      setAudioPreviewUrl(null);
    }
    audioChunksRef.current = [];
    
    // Parar preview se estiver tocando
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current = null;
      setIsPlayingPreview(false);
    }
  };

  const useRecordedAudio = () => {
    if (!recordedAudio || !audioPreviewUrl) {
      console.error('❌ Não há áudio gravado para usar');
      return;
    }

    console.log('📤 Usando áudio gravado:', {
      size: recordedAudio.size,
      type: recordedAudio.type,
    });

    // Converter Blob para File
    const extension = recordedAudio.type.includes('webm') ? 'webm' : 
                     recordedAudio.type.includes('mp4') ? 'mp4' : 
                     recordedAudio.type.includes('ogg') ? 'ogg' : 'webm';
    
    const audioFile = new File([recordedAudio], `audio-${Date.now()}.${extension}`, {
      type: recordedAudio.type || 'audio/webm',
    });

    console.log('📁 Arquivo criado:', audioFile.name, audioFile.size, 'bytes');

    // Criar base64 do áudio
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      console.log('✅ Base64 criado:', base64.length, 'caracteres');
      setAttachedFile({
        file: audioFile,
        preview: '',
        type: 'audio',
      });
      
      // Limpar gravação
      cancelRecording();
      
      toast.success('Áudio anexado', {
        description: 'Pronto para enviar.',
      });
    };
    reader.onerror = (error) => {
      console.error('❌ Erro ao ler arquivo:', error);
      toast.error('Erro ao processar áudio gravado');
    };
    reader.readAsDataURL(audioFile);
  };

  const toggleAudioPreview = () => {
    if (!audioPreviewRef.current && audioPreviewUrl) {
      const audio = new Audio(audioPreviewUrl);
      audioPreviewRef.current = audio;
      
      audio.onended = () => {
        setIsPlayingPreview(false);
        audioPreviewRef.current = null;
      };
      
      audio.onerror = () => {
        toast.error('Erro ao reproduzir áudio');
        setIsPlayingPreview(false);
        audioPreviewRef.current = null;
      };
    }

    if (audioPreviewRef.current) {
      if (isPlayingPreview) {
        audioPreviewRef.current.pause();
        setIsPlayingPreview(false);
      } else {
        audioPreviewRef.current.play();
        setIsPlayingPreview(true);
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((!messageContent.trim() && !attachedFile) || !ticketId) return;

    try {
      setSending(true);
      
      let fileUrl = '';
      let fileName = '';
      let fileSize = 0;
      let messageType = 'text';

      if (attachedFile) {
        // Para imagens, já temos o base64 comprimido do preview
        // Para outros arquivos, converter novamente
        if (attachedFile.type === 'image' && attachedFile.preview) {
          fileUrl = attachedFile.preview;
          // Calcular tamanho aproximado do base64 comprimido
          fileSize = Math.round((fileUrl.length * 3) / 4);
        } else {
          // Converter arquivo para base64 (PDF e áudio)
          const reader = new FileReader();
          fileUrl = await new Promise<string>((resolve, reject) => {
            reader.onload = (event) => {
              resolve(event.target?.result as string);
            };
            reader.onerror = reject;
            reader.readAsDataURL(attachedFile.file);
          });
          fileSize = attachedFile.file.size;
        }
        
        fileName = attachedFile.file.name;
        messageType = attachedFile.type === 'image' ? 'image' : attachedFile.type === 'pdf' ? 'pdf' : 'audio';
      }

      console.log('📤 Enviando mensagem:', {
        hasContent: !!messageContent.trim(),
        hasFile: !!fileUrl,
        fileName,
        fileSize,
        fileUrlLength: fileUrl?.length || 0,
      });

      const newMessage = await chatAPI.sendMessage(ticketId, {
        content: messageContent.trim() || (attachedFile ? `Anexo: ${fileName}` : ''),
        messageType,
        fileUrl: fileUrl || undefined,
        fileName: fileName || undefined,
        fileSize: fileSize > 0 ? fileSize : undefined,
      });

      console.log('✅ Mensagem enviada com sucesso');
      setMessages((prev) => [...prev, newMessage]);
      setMessageContent('');
      setAttachedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      scrollToBottom();

      // Se não está usando WebSocket, recarregar mensagens
      if (!socket) {
        setTimeout(() => loadMessages(), 1000);
      }
    } catch (error: any) {
      console.error('❌ Erro ao enviar mensagem:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Erro desconhecido';
      const errorDetails = error.response?.data?.details;
      
      toast.error('Erro ao enviar mensagem', {
        description: errorDetails || errorMessage,
        duration: 5000,
      });
      
      // Se o erro for de arquivo muito grande, limpar o arquivo anexado
      if (errorMessage.includes('muito grande') || errorMessage.includes('too large')) {
        setAttachedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } finally {
      setSending(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDownloadFile = (message: ChatMessage) => {
    if (!message.fileUrl) return;
    
    const link = document.createElement('a');
    link.href = message.fileUrl;
    link.download = message.fileName || 'arquivo';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthenticated || !ticketId) {
    return null;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
          <p className="mt-4 text-gray-500">Carregando ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500">Ticket não encontrado</p>
        </div>
      </div>
    );
  }

  const statusInfo = statusConfig[ticket.status] || statusConfig.open;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
            {ticket.assignedTo && (
              <span className="text-sm text-gray-600">
                Atribuído a: {ticket.assignedTo.name}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chat */}
        <div className="lg:col-span-2">
          <Card className="flex h-[600px] flex-col">
            <CardHeader>
              <CardTitle>Conversa</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
              {/* Mensagens */}
              <div
                ref={messagesContainerRef}
                className="flex-1 space-y-4 overflow-y-auto p-6"
              >
                {messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    <p>Nenhuma mensagem ainda. Seja o primeiro a enviar!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwnMessage = message.senderId === user?.id;
                    const isAdmin = message.senderIsAdmin;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 break-words ${
                            isOwnMessage
                              ? 'bg-blue-500'
                              : isAdmin
                              ? 'bg-purple-100'
                              : 'bg-gray-100'
                          }`}
                          style={{
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            backgroundColor: isOwnMessage ? '#3b82f6' : isAdmin ? '#f3e8ff' : '#f3f4f6',
                            color: isOwnMessage ? '#ffffff' : '#111827'
                          }}
                        >
                          {isAdmin && !isOwnMessage && (
                            <div className="mb-1 text-xs font-semibold" style={{ color: '#111827', opacity: 1 }}>
                              Admin
                            </div>
                          )}
                          
                          {/* Exibir arquivo se houver */}
                          {message.fileUrl && (
                            <div className="mb-2">
                              {message.messageType === 'image' && (
                                <div className="relative">
                                  <img
                                    src={message.fileUrl}
                                    alt={message.fileName || 'Imagem'}
                                    className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition"
                                    style={{ maxHeight: '300px', objectFit: 'contain' }}
                                    onClick={() => window.open(message.fileUrl, '_blank')}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                                    onClick={() => handleDownloadFile(message)}
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                              
                              {message.messageType === 'pdf' && (
                                <div className="bg-white/10 rounded-lg p-3 flex items-center gap-3">
                                  <FileText className="h-8 w-8 text-white" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-white">{message.fileName || 'Documento PDF'}</p>
                                    {message.fileSize && (
                                      <p className="text-xs text-white/70">{formatFileSize(message.fileSize)}</p>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-white hover:bg-white/20"
                                    onClick={() => handleDownloadFile(message)}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                              
                              {message.messageType === 'audio' && (
                                <AudioPlayer message={message} />
                              )}
                            </div>
                          )}
                          
                          {message.content && (
                            <p className="text-sm" style={{ color: isOwnMessage ? '#ffffff' : '#111827', opacity: 1, fontWeight: 400 }}>
                              {message.content}
                            </p>
                          )}
                          <p
                            className="mt-1 text-xs"
                            style={{ color: isOwnMessage ? '#e0f2fe' : '#4b5563', opacity: 1 }}
                          >
                            {new Date(message.createdAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input de mensagem */}
              <form onSubmit={handleSendMessage} className="border-t p-4">
                {/* Preview do arquivo anexado */}
                {attachedFile && (
                  <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="flex items-center gap-3">
                      {attachedFile.type === 'image' && attachedFile.preview && (
                        <img
                          src={attachedFile.preview}
                          alt="Preview"
                          className="h-16 w-16 rounded object-cover"
                        />
                      )}
                      {attachedFile.type === 'pdf' && (
                        <div className="flex h-16 w-16 items-center justify-center rounded bg-red-100">
                          <FileText className="h-8 w-8 text-red-600" />
                        </div>
                      )}
                      {attachedFile.type === 'audio' && (
                        <div className="flex h-16 w-16 items-center justify-center rounded bg-purple-100">
                          <Mic className="h-8 w-8 text-purple-600" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{attachedFile.file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(attachedFile.file.size)}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeAttachedFile}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Preview do áudio gravado */}
                {recordedAudio && audioPreviewUrl && !attachedFile && (
                  <div className="mb-3 rounded-lg border border-purple-200 bg-purple-50 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded bg-purple-100">
                        <Mic className="h-8 w-8 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Áudio gravado</p>
                        <p className="text-xs text-gray-500">{formatFileSize(recordedAudio.size)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={toggleAudioPreview}
                          className="text-purple-600 hover:text-purple-700"
                        >
                          {isPlayingPreview ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={useRecordedAudio}
                          className="text-green-600 hover:text-green-700"
                        >
                          Usar
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={cancelRecording}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf,audio/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={sending || ticket.status === 'closed' || uploadingFile || isRecording}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending || ticket.status === 'closed' || uploadingFile || isRecording}
                    className="flex-shrink-0"
                    title="Anexar arquivo"
                  >
                    {uploadingFile ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Paperclip className="h-4 w-4" />
                    )}
                  </Button>
                  
                  {/* Botão de gravar áudio */}
                  {!isRecording && !recordedAudio && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={startRecording}
                      disabled={sending || ticket.status === 'closed' || uploadingFile || attachedFile !== null}
                      className="flex-shrink-0"
                      title="Gravar áudio"
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {/* Botão de parar gravação */}
                  {isRecording && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={stopRecording}
                      className="flex-shrink-0 animate-pulse"
                      title="Parar gravação"
                    >
                      <Square className="h-4 w-4 fill-current" />
                    </Button>
                  )}
                  <Textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    rows={2}
                    className="flex-1 resize-none text-gray-900 placeholder:text-gray-500 overflow-y-auto"
                    style={{ 
                      color: '#111827',
                      maxHeight: '200px',
                      minHeight: '60px'
                    }}
                    disabled={sending || ticket.status === 'closed'}
                  />
                  <Button 
                    type="submit" 
                    disabled={sending || (!messageContent.trim() && !attachedFile) || ticket.status === 'closed'}
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {ticket.status === 'closed' && (
                  <p className="mt-2 text-sm text-gray-500">
                    Este ticket está fechado. Não é possível enviar novas mensagens.
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Informações do Ticket */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-700">Categoria</p>
                <p className="text-sm text-gray-600 capitalize">{ticket.category}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Prioridade</p>
                <p className="text-sm text-gray-600 capitalize">{ticket.priority}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Criado em</p>
                <p className="text-sm text-gray-600">
                  {new Date(ticket.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
              {ticket.order && (
                <div>
                  <p className="text-sm font-semibold text-gray-700">Pedido Relacionado</p>
                  <p className="text-sm text-gray-600">
                    Pedido #{ticket.order.id} - {ticket.order.status}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Descrição Inicial</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{ticket.description}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


