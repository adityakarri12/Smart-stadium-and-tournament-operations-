import { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { FiSend, FiCpu, FiUser, FiVolume2, FiMic, FiMicOff } from 'react-icons/fi';
import { useStadium } from '../contexts/StadiumContext';
import { useAuth } from '../contexts/AuthContext';
import { Helmet } from 'react-helmet-async';

const translations = {
  en: {
    title: 'AI Stadium Assistant',
    subtitle: 'Ask about navigation, food options, crowd wait times, and match schedules.',
    welcome: 'Welcome to the FIFA World Cup 2026 Smart Stadium Assistant! How can I help you today?',
    placeholder: 'Ask me about stadium navigation, events, or facilities...',
    typing: 'AI is typing...',
    demoHeader: 'Suggested Questions',
    demoQuestions: [
      "Where is the nearest medical station?",
      "What time do the gates open?",
      "Which food stand has the shortest wait time?",
      "Show me the current crowd density in the North Stand."
    ]
  },
  es: {
    title: 'Asistente de Estadio IA',
    subtitle: 'Pregunta sobre la navegación, comidas, tiempos de espera y horarios de partidos.',
    welcome: '¡Bienvenido al Asistente del Estadio Inteligente de la Copa Mundial de la FIFA 2026! ¿En qué puedo ayudarte hoy?',
    placeholder: 'Pregúntame sobre navegación, eventos o instalaciones...',
    typing: 'La IA está escribiendo...',
    demoHeader: 'Preguntas Sugeridas',
    demoQuestions: [
      "¿Dónde está la estación médica más cercana?",
      "¿A qué hora abren las puertas?",
      "¿Qué puesto de comida tiene el menor tiempo de espera?",
      "Muéstrame la densidad de personas en la Grada Norte."
    ]
  },
  fr: {
    title: 'Assistant de Stade IA',
    subtitle: 'Posez vos questions sur la navigation, la restauration, l\'attente et les matchs.',
    welcome: 'Bienvenue dans l\'Assistant de Stade Intelligent de la Coupe du Monde de la FIFA 2026 ! Comment puis-je vous aider aujourd\'hui ?',
    placeholder: 'Demandez-moi des infos sur la navigation, les événements...',
    typing: 'L\'IA est en train d\'écrire...',
    demoHeader: 'Questions Suggérées',
    demoQuestions: [
      "Où se trouve le poste médical le plus proche ?",
      "À quelle heure ouvrent les portes ?",
      "Quel stand de nourriture a le moins d'attente ?",
      "Montrez-moi la densité de foule actuelle dans la tribune Nord."
    ]
  }
};

export const Assistant = () => {
  const { activeStadiumId } = useStadium();
  const { userProfile } = useAuth();
  
  const t = translations[userProfile.preferredLanguage] || translations.en;

  const [messages, setMessages] = useState<{role: 'user' | 'bot', content: string}[]>([
    { role: 'bot', content: t.welcome }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Audio TTS states
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);

  // Voice STT states
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Sync welcome message if language changes and it is the only message
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].role === 'bot') {
        return [{ role: 'bot', content: t.welcome }];
      }
      return prev;
    });
  }, [userProfile.preferredLanguage, t.welcome]);

  // Clean TTS speaking on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendQuestion = async (question: string) => {
    if (isLoading) return;
    
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message: question,
          stadiumId: activeStadiumId,
          userProfile
        })
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: data?.data?.reply || 'Sorry, I could not process that request.'
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'bot', content: 'Connection error. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMessage = input.trim();
    setInput('');
    sendQuestion(userMessage);
  };

  // Text-To-Speech audio synthesizer
  const handleSpeak = (text: string, idx: number) => {
    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
    } else {
      window.speechSynthesis.cancel();

      // Strip markdown syntax characters for cleaner speech output
      const cleanText = text
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/#/g, '')
        .replace(/- /g, '')
        .replace(/`[^`]*`/g, ''); // strip inline code blocks

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = userProfile.preferredLanguage === 'es' 
        ? 'es-ES' 
        : userProfile.preferredLanguage === 'fr' 
          ? 'fr-FR' 
          : 'en-US';
      
      utterance.onend = () => setSpeakingIdx(null);
      utterance.onerror = () => setSpeakingIdx(null);

      setSpeakingIdx(idx);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Speech-To-Text dictation transcription
  const handleDictate = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('Voice recognition is not supported in this browser. Please use Google Chrome.');
        return;
      }

      const rec = new SpeechRecognition();
      rec.lang = userProfile.preferredLanguage === 'es' 
        ? 'es-ES' 
        : userProfile.preferredLanguage === 'fr' 
          ? 'fr-FR' 
          : 'en-US';
      rec.continuous = false;
      rec.interimResults = false;

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev ? prev + ' ' + transcript : transcript);
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error:', e.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    }
  };

  // Safe client-side markdown formatter
  const renderMessageContent = (text: string) => {
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Markdown Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Markdown Italics
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Headers
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    
    // Bullet points
    html = html.replace(/^\s*-\s+(.*?)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
    html = html.replace(/<\/ul>\s*<ul>/g, ''); // Clean duplicated tags

    // Line breaks
    html = html.replace(/\n/g, '<br />');

    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Helmet>
        <title>{t.title} | FIFA World Cup 2026™</title>
        <meta name="description" content="Get smart help from the FIFA 2026 Smart Stadium Assistant. Real-time translation, toilet wait times, and emergency navigation directions." />
      </Helmet>

      <div style={{ marginBottom: '1rem' }}>
        <h2>{t.title}</h2>
        <p className="text-muted">{t.subtitle}</p>
      </div>
      
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="chat-messages" role="log" aria-live="polite" aria-label="Chat history">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`chat-bubble ${msg.role}`}
              style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}
            >
              <div style={{ 
                background: msg.role === 'bot' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(139, 92, 246, 0.1)', 
                borderRadius: '50%', 
                padding: '0.4rem', 
                color: msg.role === 'bot' ? 'var(--accent-blue)' : 'var(--accent-purple)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '2px'
              }} aria-hidden="true">
                {msg.role === 'bot' ? <FiCpu size={16} /> : <FiUser size={16} />}
              </div>
              <div style={{ flex: 1, overflowWrap: 'anywhere' }}>
                {msg.role === 'bot' ? renderMessageContent(msg.content) : msg.content}
              </div>
              
              {/* Speaker icon for voice reading (TTS) */}
              {msg.role === 'bot' && (
                <button
                  onClick={() => handleSpeak(msg.content, idx)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: speakingIdx === idx ? 'var(--accent-blue)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '0.35rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignSelf: 'flex-start',
                    boxShadow: speakingIdx === idx ? '0 0 10px rgba(0, 240, 255, 0.2)' : 'none'
                  }}
                  title="Read message aloud"
                  aria-label={speakingIdx === idx ? "Stop reading" : "Read message aloud"}
                >
                  <FiVolume2 size={16} />
                </button>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="chat-bubble bot" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ background: 'rgba(0, 240, 255, 0.1)', borderRadius: '50%', padding: '0.4rem', color: 'var(--accent-blue)', display: 'flex' }}>
                <FiCpu size={16} />
              </div>
              <div>
                <span className="sr-only">{t.typing}</span>
                <div className="typing-indicator" aria-hidden="true">...</div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {messages.length === 1 && (
          <div style={{ padding: '0 1rem 1rem 1rem' }}>
            <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
              {t.demoHeader}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {t.demoQuestions.map((q, i) => (
                <button 
                  key={i} 
                  onClick={() => sendQuestion(q)}
                  disabled={isLoading}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(0, 240, 255, 0.08)',
                    border: '1px solid rgba(0, 240, 255, 0.25)',
                    borderRadius: '20px',
                    color: 'var(--accent-blue)',
                    fontSize: '0.85rem',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    fontWeight: 500
                  }}
                  onMouseOver={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.background = 'rgba(0, 240, 255, 0.18)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.background = 'rgba(0, 240, 255, 0.08)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)' }}>
          <form onSubmit={handleSubmit} className="chat-input-wrapper" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            
            {/* Dictation voice input button (STT) */}
            <button
              type="button"
              onClick={handleDictate}
              style={{
                background: isListening ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${isListening ? 'var(--danger)' : 'var(--glass-border)'}`,
                color: isListening ? 'var(--danger)' : 'var(--text-muted)',
                borderRadius: '8px',
                padding: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isListening ? '0 0 10px rgba(239, 68, 68, 0.25)' : 'none'
              }}
              title="Dictate message"
              aria-label={isListening ? "Stop listening" : "Dictate message"}
            >
              {isListening ? <FiMicOff size={18} /> : <FiMic size={18} />}
            </button>

            <label htmlFor="chatInput" className="sr-only">Type your message</label>
            <input
              id="chatInput"
              type="text"
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.placeholder}
              disabled={isLoading}
              style={{ flex: 1 }}
            />
            
            <button type="submit" className="btn-primary" disabled={isLoading || !input.trim()} aria-label="Send message">
              <FiSend size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
