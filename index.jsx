import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, X, Share2, BookOpen, Heart, 
  Moon, Sun, Zap, Award, ChevronRight, 
  ArrowLeft, Eye, Clock, Minimize2, Maximize2,
  Sparkles, Send, Bot, Plus, Edit3, Trash2, 
  Image as ImageIcon, Type, Loader2, Wand2, Globe
} from 'lucide-react';

// --- Configurazione API Gemini ---
const apiKey = ""; 

const INITIAL_ARTICLES = [
  {
    id: 1,
    title: "L'Estetica del Silenzio Digitale",
    subtitle: "Perché il minimalismo non è solo visivo, ma mentale.",
    author: "Elena V.",
    readTime: "4 min",
    category: "Design",
    image: "https://images.unsplash.com/photo-1449247709967-d4461a6a6103?q=80&w=1000&auto=format&fit=crop",
    content: "In un'era di rumore costante, il silenzio è diventato il bene di lusso definitivo. Non parliamo solo di assenza di suono, ma di assenza di input. Il design moderno si sta spostando verso interfacce che non urlano, ma sussurrano."
  },
  {
    id: 2,
    title: "Neuro-Architettura",
    subtitle: "Come gli spazi virtuali modellano i nostri pensieri.",
    author: "Marco D.",
    readTime: "6 min",
    category: "Tech",
    image: "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?q=80&w=1000&auto=format&fit=crop",
    content: "Le cattedrali gotiche erano progettate per elevare lo spirito. I social media sono progettati per catturare l'attenzione. Cosa succede quando applichiamo i principi dell'architettura sacra al web design?"
  }
];

const callGemini = async (prompt, systemInstruction = "") => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] }
  };

  let delay = 1000;
  for (let i = 0; i < 5; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "Nessuna risposta.";
    } catch (err) {
      if (i === 4) throw err;
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }
};

const GlassPanel = ({ children, className = "", onClick, theme }) => (
  <div 
    onClick={onClick}
    className={`backdrop-blur-xl border rounded-2xl shadow-2xl transition-all duration-300 ${className} 
      ${theme === 'neon' ? 'bg-black/60 border-cyan-500/40 shadow-[0_8px_32px_rgba(6,182,212,0.1)]' : 'bg-white/5 border-white/10 shadow-black/20'}`}
  >
    {children}
  </div>
);

const Typewriter = ({ text }) => {
  const [val, setVal] = useState('');
  useEffect(() => {
    let i = 0; setVal('');
    if (!text) return;
    const timer = setInterval(() => {
      setVal(t => t + text.charAt(i));
      i++;
      if (i >= text.length) clearInterval(timer);
    }, 5);
    return () => clearInterval(timer);
  }, [text]);
  return <div className="leading-relaxed whitespace-pre-wrap">{val}</div>;
};

export default function App() {
  const [view, setView] = useState('home');
  const [articles, setArticles] = useState(INITIAL_ARTICLES);
  const [activeArticle, setActiveArticle] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [menuOpen, setMenuOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  const [aiChat, setAiChat] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInput, setAiInput] = useState("");

  const [newPost, setNewPost] = useState({
    title: '',
    subtitle: '',
    category: 'Design',
    content: '',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop'
  });

  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(window.scrollY / (total || 1));
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const saveArticle = () => {
    if (!newPost.title || !newPost.content) return;
    const post = {
      ...newPost,
      id: Date.now(),
      author: "Ospite",
      readTime: Math.ceil(newPost.content.length / 500) + " min",
    };
    setArticles([post, ...articles]);
    setView('home');
    setNewPost({ title: '', subtitle: '', category: 'Design', content: '', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop' });
  };

  const expandWithAI = async () => {
    if (!newPost.content) return;
    setIsAiLoading(true);
    try {
      const prompt = `Espandi questi appunti in un articolo completo per un magazine di design: "${newPost.content}". Titolo: ${newPost.title}`;
      const res = await callGemini(prompt, "Sei un editor creativo. Rispondi in italiano.");
      setNewPost(prev => ({ ...prev, content: res }));
    } catch (e) { console.error(e); }
    finally { setIsAiLoading(false); }
  };

  const handleChat = async () => {
    if (!aiInput.trim()) return;
    const msg = aiInput;
    setAiInput("");
    setAiChat(p => [...p, { role: 'user', content: msg }]);
    setIsAiLoading(true);
    try {
      const res = await callGemini(msg, "Sei l'assistente AI di Flux Journal. Rispondi in italiano.");
      setAiChat(p => [...p, { role: 'assistant', content: res }]);
    } catch (e) {
      setAiChat(p => [...p, { role: 'assistant', content: "Errore di connessione." }]);
    } finally { setIsAiLoading(false); }
  };

  const getThemeClasses = () => {
    switch(theme) {
      case 'neon': return 'bg-[#050505] text-cyan-400';
      case 'light': return 'bg-slate-50 text-slate-900';
      default: return 'bg-neutral-950 text-white';
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-700 ${getThemeClasses()} selection:bg-cyan-500/40`}>
      
      {/* Background blobs */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[80vw] h-[80vw] rounded-full blur-[120px] opacity-10 animate-pulse-slow ${theme === 'neon' ? 'bg-cyan-900' : 'bg-cyan-600'}`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[80vw] h-[80vw] rounded-full blur-[120px] opacity-10 animate-pulse-slow ${theme === 'neon' ? 'bg-fuchsia-900' : 'bg-purple-600'}`} />
      </div>

      {/* Progress */}
      <div className={`fixed top-0 left-0 h-1 z-[120] transition-all ${theme === 'neon' ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'bg-cyan-500'}`} style={{ width: `${scrollProgress * 100}%` }} />

      {/* Nav */}
      <nav className="fixed top-0 w-full z-[100] p-4 md:p-6">
        <div className={`max-w-6xl mx-auto flex justify-between items-center backdrop-blur-2xl border rounded-full px-4 py-2 md:px-6 md:py-3 transition-colors
          ${theme === 'neon' ? 'bg-black/40 border-cyan-500/30' : 'bg-white/10 border-white/20'}`}>
          <h1 className="text-xl font-black tracking-tighter cursor-pointer" onClick={() => setView('home')}>FLUX.</h1>
          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={() => setView('write')} className={`p-2 rounded-full transition-all ${view === 'write' ? 'bg-cyan-500 text-black' : 'hover:bg-white/10'}`}>
              <Plus size={20} />
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 hover:bg-white/10 rounded-full">
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`fixed inset-0 z-[110] transition-all duration-500 ${menuOpen ? 'visible' : 'invisible'}`}>
        <div className={`absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity ${menuOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setMenuOpen(false)} />
        <div className={`absolute right-0 inset-y-0 w-full max-w-sm bg-black/90 border-l border-white/10 p-10 transition-transform ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex flex-col gap-8 mt-20">
            <h3 className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Interfaccia</h3>
            {['dark', 'light', 'neon'].map(t => (
              <button key={t} onClick={() => {setTheme(t); setMenuOpen(false);}} 
                className={`text-2xl font-bold capitalize transition-colors ${theme === t ? 'text-cyan-500' : 'text-white hover:text-cyan-400'}`}>
                {t} Mode
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Assistant Panel - LIQUID GLASS EDITION ✨ */}
      <div className={`fixed inset-y-0 right-0 z-[130] w-full md:w-[460px] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]
        ${aiOpen ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}`}>
        <div className="h-full md:p-4">
          <div className={`h-full flex flex-col md:rounded-[2.5rem] border-l md:border overflow-hidden backdrop-blur-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all
            ${theme === 'neon' ? 'bg-black/60 border-cyan-500/30' : 
              theme === 'light' ? 'bg-white/70 border-white/40' : 'bg-neutral-900/60 border-white/10'}`}>
            
            {/* Header Liquid Glass */}
            <div className={`p-6 border-b flex justify-between items-center ${theme === 'neon' ? 'border-cyan-500/10' : 'border-white/5'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${theme === 'neon' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-cyan-500'}`}>
                  <Bot size={20} />
                </div>
                <div>
                  <span className="font-black tracking-widest uppercase text-[10px] block opacity-50">Intelligence</span>
                  <span className="font-bold text-sm">FLUX ASSISTANT</span>
                </div>
              </div>
              <button onClick={() => setAiOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
            </div>
            
            {/* Chat Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar">
              {aiChat.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-30 text-center px-10">
                  <Sparkles size={48} className="mb-4 animate-pulse" />
                  <p className="text-sm font-medium">Sono pronto ad analizzare i tuoi articoli o a generare nuove idee. Come posso aiutarti oggi?</p>
                </div>
              )}
              {aiChat.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-sm
                    ${m.role === 'user' 
                      ? (theme === 'neon' ? 'bg-cyan-500 text-black font-bold' : 'bg-white text-black font-medium') 
                      : (theme === 'neon' ? 'bg-white/5 border border-cyan-500/20' : 'bg-white/5 border border-white/10')}`}>
                    {m.role === 'assistant' ? <Typewriter text={m.content} /> : m.content}
                  </div>
                </div>
              ))}
              {isAiLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3">
                    <Loader2 size={16} className="animate-spin text-cyan-500" />
                    <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">Elaborazione...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Liquid Glass */}
            <div className={`p-6 border-t pb-12 md:pb-8 ${theme === 'neon' ? 'border-cyan-500/10' : 'border-white/5'}`}>
              <div className={`flex gap-2 p-2 rounded-2xl border transition-all focus-within:ring-4
                ${theme === 'neon' ? 'bg-black/40 border-cyan-500/40 focus-within:ring-cyan-500/10' : 'bg-white/5 border-white/10 focus-within:ring-white/5'}`}>
                <input 
                  className="bg-transparent flex-1 px-4 outline-none text-sm placeholder:opacity-30" 
                  placeholder="Scrivi un messaggio..."
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleChat()}
                />
                <button 
                  onClick={handleChat} 
                  className={`p-3 rounded-xl active:scale-90 transition-all shadow-lg
                    ${theme === 'neon' ? 'bg-cyan-500 text-black shadow-cyan-500/20' : 'bg-white text-black shadow-white/10'}`}
                >
                  <Send size={18}/>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pt-24 md:pt-36 pb-20 px-4 max-w-6xl mx-auto">
        
        {view === 'home' && (
          <div className="animate-in fade-in duration-700">
            <header className="mb-12 md:mb-24 text-center md:text-left">
              <h1 className={`text-6xl md:text-[9rem] font-black tracking-tighter leading-none mb-6 ${theme === 'neon' ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]' : ''}`}>
                THE FLUX.
              </h1>
              <p className="text-lg md:text-xl opacity-60 font-light max-w-xl mx-auto md:mx-0">Magazine digitale dinamico potenziato dall'intelligenza artificiale.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {articles.map(a => (
                <GlassPanel key={a.id} theme={theme} className="group cursor-pointer overflow-hidden flex flex-col hover:translate-y-[-5px]" onClick={() => {setActiveArticle(a); setView('article'); window.scrollTo(0,0);}}>
                  <div className="h-52 overflow-hidden relative">
                    <img src={a.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-cyan-500 font-black mb-3">{a.category}</span>
                    <h3 className="text-xl font-bold mb-3 leading-tight group-hover:text-cyan-400 transition-colors">{a.title}</h3>
                    <p className="text-sm opacity-50 line-clamp-2 mb-6">{a.subtitle}</p>
                    <div className="mt-auto flex justify-between items-center pt-4 border-t border-white/5">
                      <span className="text-[10px] uppercase font-bold opacity-0 group-hover:opacity-100 transition-opacity">Leggi Tutto</span>
                      <ChevronRight size={16} className="text-cyan-500" />
                    </div>
                  </div>
                </GlassPanel>
              ))}
            </div>
          </div>
        )}

        {view === 'write' && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div className="space-y-4">
                <button onClick={() => setView('home')} className="flex items-center gap-2 opacity-50 hover:opacity-100 text-sm"><ArrowLeft size={16}/> Annulla</button>
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase">Crea Contenuto</h2>
              </div>
              <button 
                onClick={saveArticle}
                className="w-full md:w-auto px-10 py-5 bg-cyan-500 text-black font-black rounded-full shadow-xl shadow-cyan-500/20 active:scale-95 transition-all"
              >
                PUBBLICA ORA
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Main Column */}
              <div className="lg:col-span-8 space-y-8">
                <GlassPanel theme={theme} className="p-6 md:p-10 space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase font-bold opacity-40 tracking-widest">Titolo Articolo</label>
                    <input 
                      type="text" 
                      className="w-full bg-transparent border-b border-white/10 py-4 text-3xl font-bold outline-none focus:border-cyan-500 transition-colors"
                      placeholder="L'evoluzione del design..."
                      value={newPost.title}
                      onChange={e => setNewPost({...newPost, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3 relative">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase font-bold opacity-40 tracking-widest">Corpo del Testo</label>
                      <button 
                        onClick={expandWithAI}
                        disabled={isAiLoading || !newPost.content}
                        className="flex items-center gap-2 text-[10px] font-black text-cyan-400 hover:text-cyan-300 disabled:opacity-30 p-2 bg-cyan-400/10 rounded-lg"
                      >
                        {isAiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        AI MAGIC EXPAND ✨
                      </button>
                    </div>
                    <textarea 
                      rows="14" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-lg outline-none focus:border-cyan-500 transition-all resize-none font-serif"
                      placeholder="Digita i tuoi pensieri o appunti..."
                      value={newPost.content}
                      onChange={e => setNewPost({...newPost, content: e.target.value})}
                    />
                  </div>
                </GlassPanel>
              </div>

              {/* Sidebar Settings */}
              <div className="lg:col-span-4 space-y-8">
                <GlassPanel theme={theme} className="p-8 space-y-8">
                  <div className="space-y-6">
                    <h4 className="text-xs uppercase font-black tracking-widest text-cyan-500 border-b border-cyan-500/20 pb-2">Configurazione</h4>
                    
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase opacity-40 font-bold">Sottotitolo</span>
                      <input 
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-cyan-500"
                        placeholder="Una riga descrittiva..."
                        value={newPost.subtitle}
                        onChange={e => setNewPost({...newPost, subtitle: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] uppercase opacity-40 font-bold">Categoria</span>
                      <select 
              