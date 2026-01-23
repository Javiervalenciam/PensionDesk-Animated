import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Search, Plus, Filter, MoreHorizontal, AlertCircle } from 'lucide-react';
import { Case, CaseStatus, DeadlineStatus, Priority } from '../types';
import { db } from '../services/localDb';
import { getDaysDiff } from '../utils/dateUtils';

interface DashboardProps {
  onLogout: () => void;
  onNavigate: (view: string, id?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout, onNavigate }) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [filter, setFilter] = useState('');
  const [activeStatus, setActiveStatus] = useState<string>('ALL');

  useEffect(() => {
    const loadCases = () => {
      const allCases = db.getCases();
      setCases([...allCases]); // Clone to force refresh
    };
    loadCases();
    // Simple polling for demo purposes or could add an event listener
    const interval = setInterval(loadCases, 5000);
    return () => clearInterval(interval);
  }, []);

  const getDeadlineStatus = (c: Case): DeadlineStatus => {
    const target = c.fechaLimiteConfirmada || c.fechaLimitePropuesta;
    if (!target) return DeadlineStatus.OK;
    const diff = getDaysDiff(target);
    
    if (diff < 0) return DeadlineStatus.VENCIDO;
    if (diff === 0) return DeadlineStatus.HOY;
    if (diff <= 2) return DeadlineStatus.EN_RIESGO;
    if (diff <= 7) return DeadlineStatus.ESTA_SEMANA;
    return DeadlineStatus.OK;
  };

  const filteredCases = cases.filter(c => {
    const matchesSearch = c.asunto.toLowerCase().includes(filter.toLowerCase()) || 
                          c.municipio.toLowerCase().includes(filter.toLowerCase()) ||
                          c.id.toLowerCase().includes(filter.toLowerCase());
    
    let matchesStatus = true;
    if (activeStatus === 'VENCIDO') {
        matchesStatus = getDeadlineStatus(c) === DeadlineStatus.VENCIDO;
    } else if (activeStatus !== 'ALL') {
        matchesStatus = c.estado === activeStatus;
    }
    
    return matchesSearch && matchesStatus;
  });

  const countPendingSignature = cases.filter(c => c.estado === CaseStatus.PENDIENTE_FIRMA).length;
  const countVencidos = cases.filter(c => getDeadlineStatus(c) === DeadlineStatus.VENCIDO).length;

  return (
    <div className="min-h-screen bg-background text-zinc-300 pb-20">
      <Navbar simple onEnterApp={() => {}} />
      
      <div className="pt-24 px-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-serif text-white mb-2">Bandeja de Gestión</h1>
            <p className="text-zinc-500 text-sm">Sistema Local v1.0 &bull; {cases.length} Casos Totales</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => onNavigate('create_case')}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors text-sm font-semibold shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            >
              <Plus size={16} /> Nuevo Caso
            </button>
          </div>
        </div>

        {/* Alerts Bar */}
        {(countPendingSignature > 0 || countVencidos > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {countVencidos > 0 && (
               <div className="bg-red-950/20 border border-red-900/50 p-4 rounded-lg flex items-center gap-3">
                  <AlertCircle className="text-red-500" />
                  <div>
                    <span className="text-red-400 font-bold">{countVencidos} Casos Vencidos</span>
                    <p className="text-red-500/60 text-xs">Requieren atención inmediata.</p>
                  </div>
               </div>
            )}
            {countPendingSignature > 0 && (
               <div className="bg-yellow-950/20 border border-yellow-900/50 p-4 rounded-lg flex items-center gap-3">
                  <AlertCircle className="text-yellow-500" />
                  <div>
                    <span className="text-yellow-500 font-bold">{countPendingSignature} Pendientes de Firma</span>
                    <p className="text-yellow-500/60 text-xs">Gestionar firmas para radicación.</p>
                  </div>
               </div>
            )}
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-surface border border-border rounded-t-xl p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
             <input 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                type="text" 
                placeholder="Buscar por asunto, ID o municipio..." 
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
             />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
             <FilterBtn active={activeStatus === 'ALL'} onClick={() => setActiveStatus('ALL')} label="Todos" />
             <FilterBtn active={activeStatus === CaseStatus.PENDIENTE_FIRMA} onClick={() => setActiveStatus(CaseStatus.PENDIENTE_FIRMA)} label="Firma" />
             <FilterBtn active={activeStatus === CaseStatus.EN_REDACCION} onClick={() => setActiveStatus(CaseStatus.EN_REDACCION)} label="Redacción" />
             <FilterBtn active={activeStatus === 'VENCIDO'} onClick={() => setActiveStatus('VENCIDO')} label="Vencidos" />
          </div>
        </div>
        
        {/* Table */}
        <div className="bg-surface border-x border-b border-border rounded-b-xl overflow-hidden shadow-2xl overflow-x-auto">
           <table className="w-full text-left text-sm whitespace-nowrap">
             <thead>
               <tr className="bg-zinc-900/50 text-zinc-500 font-medium">
                 <th className="px-6 py-4">Prioridad</th>
                 <th className="px-6 py-4">ID / Municipio</th>
                 <th className="px-6 py-4">Asunto</th>
                 <th className="px-6 py-4">Estado</th>
                 <th className="px-6 py-4">Vencimiento</th>
                 <th className="px-6 py-4 text-right">Acción</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-zinc-800/50">
                {filteredCases.map((item) => {
                  const deadlineStatus = getDeadlineStatus(item);
                  return (
                    <tr 
                      key={item.id} 
                      onClick={() => onNavigate('case_detail', item.id)}
                      className={`hover:bg-white/5 transition-colors group cursor-pointer ${item.estado === CaseStatus.PENDIENTE_FIRMA ? 'bg-yellow-900/5' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <PriorityBadge priority={item.prioridad} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono text-zinc-500 text-xs">{item.id}</div>
                        <div className="text-white font-medium">{item.municipio}</div>
                      </td>
                      <td className="px-6 py-4 max-w-[300px] truncate">
                         <div className="text-zinc-300 text-xs mb-1 bg-zinc-800 inline-block px-1 rounded">{item.tipo}</div>
                         <div className="text-zinc-400 truncate" title={item.asunto}>{item.asunto}</div>
                      </td>
                      <td className="px-6 py-4">
                         <StatusBadge status={item.estado} />
                      </td>
                      <td className="px-6 py-4">
                         <DeadlineBadge status={deadlineStatus} date={item.fechaLimiteConfirmada || item.fechaLimitePropuesta || 'N/A'} />
                      </td>
                      <td className="px-6 py-4 text-right">
                         <button className="text-zinc-500 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded">
                            <MoreHorizontal size={18} />
                         </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredCases.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-600">
                      No se encontraron casos con los filtros actuales.
                    </td>
                  </tr>
                )}
             </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

const FilterBtn = ({ active, onClick, label }: any) => (
  <button 
    onClick={onClick}
    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
      active ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
    }`}
  >
    {label}
  </button>
);

const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const colors = {
    [Priority.ALTA]: 'text-red-500 bg-red-950/30 border-red-900/50',
    [Priority.MEDIA]: 'text-yellow-500 bg-yellow-950/30 border-yellow-900/50',
    [Priority.BAJA]: 'text-blue-500 bg-blue-950/30 border-blue-900/50',
  };
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${colors[priority]}`}>
      {priority}
    </span>
  );
};

const StatusBadge = ({ status }: { status: CaseStatus }) => {
  const styles = {
    [CaseStatus.RECIBIDO]: 'bg-zinc-800 text-zinc-300',
    [CaseStatus.EN_ANALISIS]: 'bg-blue-900/30 text-blue-300 border border-blue-800/50',
    [CaseStatus.EN_REDACCION]: 'bg-purple-900/30 text-purple-300 border border-purple-800/50',
    [CaseStatus.EN_REVISION]: 'bg-indigo-900/30 text-indigo-300 border border-indigo-800/50',
    [CaseStatus.PENDIENTE_FIRMA]: 'bg-yellow-900/20 text-yellow-500 border border-yellow-800/50 animate-pulse',
    [CaseStatus.RADICADO]: 'bg-green-900/30 text-green-300 border border-green-800/50',
    [CaseStatus.CERRADO]: 'bg-zinc-900 text-zinc-500',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium tracking-wide ${styles[status]}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

const DeadlineBadge = ({ status, date }: { status: DeadlineStatus, date: string }) => {
   const styles = {
      [DeadlineStatus.VENCIDO]: 'text-red-500',
      [DeadlineStatus.HOY]: 'text-red-400',
      [DeadlineStatus.EN_RIESGO]: 'text-orange-400',
      [DeadlineStatus.ESTA_SEMANA]: 'text-yellow-400',
      [DeadlineStatus.OK]: 'text-green-400',
   };

   return (
      <div className="flex flex-col">
         <span className={`text-xs font-bold ${styles[status]}`}>
            {status}
         </span>
         <span className="text-xs text-zinc-600 font-mono">
            {date}
         </span>
      </div>
   )
}