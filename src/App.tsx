import {AlertCircle, CheckCircle2, Clock, RefreshCw, Volume2, VolumeX, UserX, Activity, Siren} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

// --- Types ---
export interface Ticket {
  id: string;
  title: string;
  requester: string;
  department: string;
  priority: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  status: 'Aberto' | 'Em Andamento' | 'Pendente';
  assignedTo: string | null;
  createdAt: Date;
  sla: number; // minutes remaining
}

// --- Mock Data Generator ---
const DEPARTMENTS = ['Comercial', 'Logística', 'Financeiro', 'Produção', 'RH', 'Diretoria'];
const ISSUES = [
  'Impressora não imprime',
  'Erro no Senior-X ao faturar',
  'Internet lenta no setor',
  'Computador não liga',
  'Acesso bloqueado ao ERP',
  'Solicitação de novo usuário',
  'Monitor piscando',
  'VPN não conecta'
];

const generateMockTickets = (count: number): Ticket[] => {
  return Array.from({ length: count }).map((_, i) => {
    const isUnassigned = Math.random() > 0.2; // 80% chance of being unassigned for demo
    const priorityRoll = Math.random();
    const priority = priorityRoll > 0.9 ? 'Crítica' : priorityRoll > 0.6 ? 'Alta' : 'Média';
    
    return {
      id: `INC-${2024000 + i + Math.floor(Math.random() * 1000)}`,
      title: ISSUES[Math.floor(Math.random() * ISSUES.length)],
      requester: `Colaborador ${Math.floor(Math.random() * 50)}`,
      department: DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)],
      priority,
      status: 'Aberto',
      assignedTo: isUnassigned ? null : 'Técnico TI',
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 120) * 60000),
      sla: Math.floor(Math.random() * 240) - 30 // Some negative for breached SLA
    };
  }).sort((a, b) => (a.assignedTo === null ? -1 : 1)); // Unassigned first
};

// --- Sound Effect (Whistle/Beep) ---
// Simple beep using Web Audio API to avoid external asset dependencies
const playAlertSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = 'sawtooth';
  oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
  oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.5); // Drop to A4
  
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.5);
};

function App() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const [flashAlert, setFlashAlert] = useState(false);
  
  // Stats
  const unassignedCount = tickets.filter(t => !t.assignedTo).length;
  const criticalCount = tickets.filter(t => t.priority === 'Crítica').length;

  // Simulate fetching data
  const refreshData = () => {
    const newTickets = generateMockTickets(Math.floor(Math.random() * 5) + 3); // 3-8 tickets
    setTickets(newTickets);
    setLastUpdated(new Date());
  };

  // Initial load
  useEffect(() => {
    refreshData();
  }, []);

  // Polling Effect (Every 10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Sound & Visual Alert Effect
  useEffect(() => {
    if (unassignedCount > 0) {
      // Visual flash
      setFlashAlert(true);
      const flashTimer = setTimeout(() => setFlashAlert(false), 1000);

      // Audio alert
      if (isSoundEnabled) {
        playAlertSound();
        // Repeat sound every 3 seconds if critical tickets exist
        const soundInterval = setInterval(() => {
          playAlertSound();
        }, 3000);
        return () => {
          clearInterval(soundInterval);
          clearTimeout(flashTimer);
        };
      }
      return () => clearTimeout(flashTimer);
    }
  }, [unassignedCount, isSoundEnabled, lastUpdated]);

  return (
    <div className={`min-h-screen bg-slate-900 text-white font-sans transition-colors duration-500 ${flashAlert ? 'bg-red-900/30' : ''}`}>
      
      {/* Header */}
      <header className="bg-slate-950 border-b border-slate-800 p-4 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-red-500 to-purple-600 animate-pulse"></div>
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-400 p-2 rounded-lg shadow-[0_0_15px_rgba(250,204,21,0.5)]">
              <Activity className="text-black h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter italic text-white">
                BALY <span className="text-yellow-400">MONITOR</span>
              </h1>
              <p className="text-xs text-slate-400 font-mono">IT SERVICE DESK • SENIOR-X INTEGRATION</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden md:block">
              <p className="text-xs text-slate-400">Última atualização</p>
              <div className="flex items-center gap-2 text-sm font-mono text-yellow-400">
                <Clock className="w-3 h-3" />
                {lastUpdated.toLocaleTimeString()}
              </div>
            </div>
            
            <button 
              onClick={() => setIsSoundEnabled(!isSoundEnabled)}
              className={`p-3 rounded-full transition-all ${isSoundEnabled ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}
              title={isSoundEnabled ? "Som Ativado" : "Som Desativado"}
            >
              {isSoundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card: Unassigned */}
          <div className={`p-6 rounded-xl border-l-4 shadow-lg transition-all ${unassignedCount > 0 ? 'bg-red-500/10 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'bg-slate-800 border-green-500'}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm uppercase font-bold tracking-wider">Aguardando Técnico</p>
                <h2 className="text-5xl font-black mt-2 text-white">{unassignedCount}</h2>
              </div>
              <div className={`p-3 rounded-full ${unassignedCount > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-700 text-slate-400'}`}>
                <UserX className="w-8 h-8" />
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-400">Chamados sem atribuição</p>
          </div>

          {/* Card: Total Tickets */}
          <div className="bg-slate-800 p-6 rounded-xl border-l-4 border-yellow-400 shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm uppercase font-bold tracking-wider">Total de Chamados</p>
                <h2 className="text-5xl font-black mt-2 text-white">{tickets.length}</h2>
              </div>
              <div className="p-3 rounded-full bg-yellow-400/20 text-yellow-400">
                <Siren className="w-8 h-8" />
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-400">Chamados ativos na fila</p>
          </div>

          {/* Card: System Status */}
          <div className="bg-slate-800 p-6 rounded-xl border-l-4 border-blue-500 shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm uppercase font-bold tracking-wider">Status do Sistema</p>
                <h2 className="text-2xl font-bold mt-4 text-green-400 flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6" /> ONLINE
                </h2>
              </div>
              <div className="p-3 rounded-full bg-blue-500/20 text-blue-400">
                <RefreshCw className={`w-8 h-8 ${unassignedCount > 0 ? 'animate-spin' : ''}`} />
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-400">Conectado ao Senior-X (Simulado)</p>
          </div>
        </div>

        {/* Ticket List */}
        <div className="bg-slate-800 rounded-xl shadow-xl overflow-hidden border border-slate-700">
          <div className="p-4 bg-slate-850 border-b border-slate-700 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertCircle className="text-yellow-400" />
              Fila de Chamados
            </h3>
            <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">
              Atualização auto: 10s
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="p-4">ID</th>
                  <th className="p-4">Assunto</th>
                  <th className="p-4">Solicitante / Depto</th>
                  <th className="p-4">Prioridade</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">SLA</th>
                  <th className="p-4 text-right">Técnico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className={`hover:bg-slate-700/50 transition-colors ${!ticket.assignedTo ? 'bg-red-500/5' : ''}`}>
                    <td className="p-4 font-mono text-slate-300 font-bold">{ticket.id}</td>
                    <td className="p-4">
                      <div className="font-medium text-white">{ticket.title}</div>
                      <div className="text-xs text-slate-500 md:hidden">{ticket.createdAt.toLocaleTimeString()}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-slate-300">{ticket.requester}</div>
                      <div className="text-xs text-slate-500">{ticket.department}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                        ${ticket.priority === 'Crítica' ? 'bg-red-500 text-white' : 
                          ticket.priority === 'Alta' ? 'bg-orange-500 text-white' : 
                          'bg-blue-500/20 text-blue-300'}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="flex items-center gap-1 text-sm text-slate-300">
                        <div className={`w-2 h-2 rounded-full ${ticket.status === 'Aberto' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`font-mono font-bold ${ticket.sla < 0 ? 'text-red-500' : 'text-green-400'}`}>
                        {ticket.sla > 0 ? `${ticket.sla} min` : `+${Math.abs(ticket.sla)} min`}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {ticket.assignedTo ? (
                        <span className="flex items-center justify-end gap-2 text-green-400 text-sm font-bold">
                          <CheckCircle2 className="w-4 h-4" /> {ticket.assignedTo}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30 animate-pulse">
                          NÃO ASSUMIDO
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer branding */}
      <footer className="fixed bottom-4 right-4 opacity-50 pointer-events-none">
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Powered by</p>
          <p className="text-xl font-black italic text-slate-600">BALY ENERGY</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
