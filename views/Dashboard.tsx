import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Search, Plus, Filter, MoreHorizontal, AlertCircle, FileText, CheckCircle, Clock } from 'lucide-react';
import { Case, CaseStatus, DeadlineStatus } from '../types';

interface DashboardProps {
  onLogout: () => void;
}

// Mock Data representing the local SQLite DB
const MOCK_CASES: Case[] = [
  { id: 'CS-2024-001', municipio: 'Medellín', tipo: 'Derecho de Petición', asunto: 'Solicitud reconocimiento pensión vejez', fechaRecepcion: '2023-10-25', estado: CaseStatus.PENDIENTE_FIRMA, fechaLimite: '2023-11-15', deadlineStatus: DeadlineStatus.VENCIDO },
  { id: 'CS-2024-002', municipio: 'Bello', tipo: 'Tutela', asunto: 'Desacato fallo judicial', fechaRecepcion: '2023-11-01', estado: CaseStatus.EN_REDACCION, fechaLimite: '2023-11-05', deadlineStatus: DeadlineStatus.EN_RIESGO },
  { id: 'CS-2024-003', municipio: 'Envigado', tipo: 'Cuotas Partes', asunto: 'Cobro persuasivo exp 445', fechaRecepcion: '2023-11-02', estado: CaseStatus.RECIBIDO, fechaLimite: '2023-12-01', deadlineStatus: DeadlineStatus.OK },
  { id: 'CS-2024-004', municipio: 'Itagüí', tipo: 'Bonos Pensionales', asunto: 'Certificación CETIL', fechaRecepcion: '2023-11-03', estado: CaseStatus.EN_ANALISIS, fechaLimite: '2023-11-10', deadlineStatus: DeadlineStatus.ESTA_SEMANA },
  { id: 'CS-2024-005', municipio: 'Medellín', tipo: 'Reclamación Adm.', asunto: 'Recurso de reposición', fechaRecepcion: '2023-11-03', estado: CaseStatus.RADICADO, fechaLimite: '2023-11-20', deadlineStatus: DeadlineStatus.OK },
];

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'cases' | 'prompts' | 'settings'>('cases');

  return (
    <div className="min-h-screen bg-background text-zinc-300">
      <Navbar simple />
      
      <div className="pt-24 pb-12 px-6 max-w-[1600px] mx-auto flex gap-8">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 hidden lg:block sticky top-24 h-[calc(100vh-8rem)]">
          <div className="space-y-8">
            <div>
               <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Workspace</h3>
               <nav className="space-y-1">
                 <SidebarItem icon={<FileText size={18} />} label="Bandeja de Casos" active={activeTab === 'cases'} onClick={() => setActiveTab('cases')} />
                 <SidebarItem icon={<Clock size={18} />} label="Términos & Reglas" />
                 <SidebarItem icon={<CheckCircle size={18} />} label="Documentos" />
               </nav>
            </div>

            <div>
               <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Biblioteca IA</h3>
               <nav className="space-y-1">
                 <SidebarItem icon={<Search size={18} />} label="Prompts / Plantillas" active={activeTab === 'prompts'} onClick={() => setActiveTab('prompts')} />
                 <SidebarItem icon={<Filter size={18} />} label="Playbooks (MVP3)" />
               </nav>
            </div>

            <div>
               <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Sistema</h3>
               <nav className="space-y-1">
                 <SidebarItem icon={<MoreHorizontal size={18} />} label="Configuración" />
                 <button onClick={onLogout} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-zinc-900 rounded transition-colors mt-4">
                    Cerrar Sesión Local
                 </button>
               </nav>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-3xl font-serif text-white mb-2">
                {activeTab === 'cases' ? 'Bandeja de Gestión' : 'Biblioteca de Prompts'}
              </h1>
              <p className="text-zinc-500 text-sm">
                {activeTab === 'cases' 
                  ? 'Gestionando 5 casos activos. 1 vencido.' 
                  : 'Colección de 124 prompts optimizados.'}
              </p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors text-sm">
                <Filter size={16} /> Filtros
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors text-sm font-semibold">
                <Plus size={16} /> Nuevo {activeTab === 'cases' ? 'Caso' : 'Prompt'}
              </button>
            </div>
          </div>

          {/* Quick Stats / Alerts */}
          {activeTab === 'cases' && (
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <StatCard label="Vencidos" value="1" color="text-red-500" borderColor="border-red-900/30" />
                <StatCard label="Pendiente Firma" value="1" color="text-yellow-500" borderColor="border-yellow-900/30" />
                <StatCard label="En Riesgo (<48h)" value="1" color="text-orange-500" borderColor="border-orange-900/30" />
                <StatCard label="Total Activos" value="5" color="text-white" borderColor="border-zinc-800" />
             </div>
          )}

          {/* Table Area */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-2xl">
             <div className="p-4 border-b border-border flex gap-4">
                <div className="relative flex-1">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                   <input 
                      type="text" 
                      placeholder="Buscar por asunto, radicado o municipio..." 
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
                   />
                </div>
             </div>
             
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                 <thead>
                   <tr className="bg-zinc-900/50 text-zinc-500 font-medium">
                     <th className="px-6 py-4">ID</th>
                     <th className="px-6 py-4">Municipio</th>
                     <th className="px-6 py-4">Tipo / Asunto</th>
                     <th className="px-6 py-4">Estado</th>
                     <th className="px-6 py-4">Vencimiento</th>
                     <th className="px-6 py-4 text-right">Acciones</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-zinc-800/50">
                    {MOCK_CASES.map((item) => (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors group cursor-pointer">
                        <td className="px-6 py-4 font-mono text-zinc-500">{item.id}</td>
                        <td className="px-6 py-4 text-white">{item.municipio}</td>
                        <td className="px-6 py-4">
                           <div className="text-white font-medium">{item.tipo}</div>
                           <div className="text-zinc-500 text-xs truncate max-w-[200px]">{item.asunto}</div>
                        </td>
                        <td className="px-6 py-4">
                           <StatusBadge status={item.estado} />
                        </td>
                        <td className="px-6 py-4">
                           <DeadlineBadge status={item.deadlineStatus} date={item.fechaLimite} />
                        </td>
                        <td className="px-6 py-4 text-right">
                           <button className="text-zinc-500 hover:text-white transition-colors">
                              <MoreHorizontal size={18} />
                           </button>
                        </td>
                      </tr>
                    ))}
                 </tbody>
               </table>
             </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const SidebarItem = ({ icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
      active 
        ? 'bg-white text-black font-medium' 
        : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const StatCard = ({ label, value, color, borderColor }: any) => (
  <div className={`bg-zinc-950/50 border ${borderColor} p-4 rounded-lg`}>
    <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">{label}</div>
    <div className={`text-2xl font-mono font-medium ${color}`}>{value}</div>
  </div>
);

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