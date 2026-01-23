import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { ArrowLeft, Save, FileText, Calendar, Play, CheckSquare, Clock } from 'lucide-react';
import { db } from '../services/localDb';
import { Case, CaseStatus, Priority, DeadlineUnit, DocType, Document, Prompt } from '../types';
import { calculateDeadline, getDaysDiff } from '../utils/dateUtils';

interface CaseDetailProps {
  caseId?: string; // If undefined, create mode
  onNavigate: (view: string, id?: string) => void;
}

export const CaseDetail: React.FC<CaseDetailProps> = ({ caseId, onNavigate }) => {
  const isNew = !caseId;
  const [activeTab, setActiveTab] = useState('resumen');
  
  // Form State
  const [formData, setFormData] = useState<Partial<Case>>({
    estado: CaseStatus.RECIBIDO,
    prioridad: Priority.MEDIA,
    fechaRecepcion: new Date().toISOString().split('T')[0],
    tipo: 'Derecho de Petición',
    anexosJson: '[]'
  });

  // Docs State
  const [documents, setDocuments] = useState<Document[]>([]);
  const [newDocContent, setNewDocContent] = useState('');
  
  // Prompts State
  const [availablePrompts, setAvailablePrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [promptVariables, setPromptVariables] = useState<Record<string, string>>({});
  const [generatedPrompt, setGeneratedPrompt] = useState('');

  useEffect(() => {
    if (!isNew && caseId) {
      const c = db.getCase(caseId);
      if (c) {
        setFormData(c);
        setDocuments(db.getDocuments(caseId));
      }
    }
    setAvailablePrompts(db.getPrompts().filter(p => p.isActive));
  }, [caseId, isNew]);

  const handleSave = () => {
    if (isNew) {
      const newCase: Case = {
        ...formData as Case,
        id: `CS-${Date.now()}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        hechos: formData.hechos || '',
        peticiones: formData.peticiones || '',
        notas: formData.notas || '',
        anexosJson: formData.anexosJson || '[]',
        fechaLimitePropuesta: formData.fechaLimitePropuesta || '',
        fechaLimiteConfirmada: formData.fechaLimiteConfirmada || ''
      };
      db.addCase(newCase);
      onNavigate('case_detail', newCase.id);
    } else {
      db.updateCase(caseId!, formData);
      alert('Guardado correctamente');
    }
  };

  const handleCalculateDeadline = () => {
    // Simple logic: lookup rule by ID (mocked here directly or need lookup)
    const rules = db.getRules();
    const rule = rules.find(r => r.id === formData.deadlineRuleId);
    if (rule && formData.fechaRecepcion) {
      const proposed = calculateDeadline(formData.fechaRecepcion, rule.unit, rule.quantity, []);
      setFormData(prev => ({ ...prev, fechaLimitePropuesta: proposed }));
    }
  };

  const handleRenderPrompt = () => {
    if (!selectedPrompt) return;
    let text = selectedPrompt.templateText;
    Object.keys(promptVariables).forEach(key => {
      text = text.replace(new RegExp(`{{${key}}}`, 'g'), promptVariables[key]);
    });
    setGeneratedPrompt(text);
  };

  return (
    <div className="min-h-screen bg-background text-zinc-300 pb-20">
      <Navbar simple onEnterApp={() => {}} />
      
      <div className="pt-24 px-6 max-w-6xl mx-auto">
        <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2 text-zinc-500 hover:text-white mb-6">
          <ArrowLeft size={16} /> Volver a la Bandeja
        </button>

        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-serif text-white mb-2">{isNew ? 'Nuevo Caso' : formData.asunto}</h1>
            <p className="text-zinc-500 font-mono text-sm">{formData.id || 'Borrador'}</p>
          </div>
          <button onClick={handleSave} className="bg-white text-black px-6 py-2 rounded-lg font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2">
            <Save size={18} /> {isNew ? 'Crear Caso' : 'Guardar Cambios'}
          </button>
        </div>

        {!isNew && (
          <div className="flex gap-1 border-b border-border mb-8 overflow-x-auto">
            <TabButton active={activeTab === 'resumen'} onClick={() => setActiveTab('resumen')} icon={<FileText size={16} />} label="Resumen" />
            <TabButton active={activeTab === 'terminos'} onClick={() => setActiveTab('terminos')} icon={<Calendar size={16} />} label="Términos" />
            <TabButton active={activeTab === 'prompts'} onClick={() => setActiveTab('prompts')} icon={<Play size={16} />} label="Prompts IA" />
            <TabButton active={activeTab === 'docs'} onClick={() => setActiveTab('docs')} icon={<CheckSquare size={16} />} label="Documentos" />
          </div>
        )}

        <div className="bg-surface border border-border rounded-xl p-8 min-h-[500px]">
          {/* TAB: RESUMEN / CREATE */}
          {(activeTab === 'resumen' || isNew) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <InputGroup label="Asunto *" value={formData.asunto} onChange={v => setFormData({...formData, asunto: v})} />
                <InputGroup label="Municipio / Entidad *" value={formData.municipio} onChange={v => setFormData({...formData, municipio: v})} />
                <div className="grid grid-cols-2 gap-4">
                   <InputGroup label="Fecha Recepción *" type="date" value={formData.fechaRecepcion} onChange={v => setFormData({...formData, fechaRecepcion: v})} />
                   <SelectGroup label="Prioridad" value={formData.prioridad} onChange={v => setFormData({...formData, prioridad: v as Priority})} options={Object.values(Priority)} />
                </div>
                <SelectGroup label="Tipo de Requerimiento" value={formData.tipo} onChange={v => setFormData({...formData, tipo: v})} options={['Derecho de Petición', 'Tutela', 'Cuotas Partes', 'Bono Pensional']} />
              </div>
              <div className="space-y-4">
                <InputGroup label="Hechos Relevantes" textarea value={formData.hechos} onChange={v => setFormData({...formData, hechos: v})} />
                <InputGroup label="Peticiones" textarea value={formData.peticiones} onChange={v => setFormData({...formData, peticiones: v})} />
                {!isNew && (
                  <SelectGroup label="Estado Actual" value={formData.estado} onChange={v => setFormData({...formData, estado: v as CaseStatus})} options={Object.values(CaseStatus)} />
                )}
              </div>
            </div>
          )}

          {/* TAB: TERMINOS */}
          {!isNew && activeTab === 'terminos' && (
             <div className="max-w-2xl mx-auto space-y-8">
                <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
                   <h3 className="text-lg text-white font-medium mb-4 flex items-center gap-2"><Clock size={18} /> Calculadora de Vencimiento</h3>
                   <div className="grid grid-cols-1 gap-4">
                      <div className="flex gap-4 items-end">
                        <div className="flex-1">
                          <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">Regla de Término</label>
                          <select 
                            className="w-full bg-black border border-zinc-700 rounded p-2 text-sm"
                            value={formData.deadlineRuleId || ''}
                            onChange={(e) => setFormData({...formData, deadlineRuleId: e.target.value})}
                          >
                            <option value="">Seleccionar Regla...</option>
                            {db.getRules().map(r => (
                              <option key={r.id} value={r.id}>{r.name} ({r.quantity} {r.unit})</option>
                            ))}
                          </select>
                        </div>
                        <button onClick={handleCalculateDeadline} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded text-sm mb-[2px]">
                          Calcular
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                         <div className="bg-black p-4 rounded border border-zinc-800">
                            <span className="text-zinc-500 text-xs block">Fecha Propuesta</span>
                            <span className="text-xl font-mono text-white">{formData.fechaLimitePropuesta || '--'}</span>
                         </div>
                         <div className="bg-black p-4 rounded border border-zinc-800">
                            <span className="text-zinc-500 text-xs block">Confirmar Fecha</span>
                            <input 
                              type="date" 
                              className="bg-transparent text-white font-mono text-lg focus:outline-none w-full"
                              value={formData.fechaLimiteConfirmada}
                              onChange={(e) => setFormData({...formData, fechaLimiteConfirmada: e.target.value})}
                            />
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {/* TAB: PROMPTS */}
          {!isNew && activeTab === 'prompts' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
               <div className="border-r border-zinc-800 pr-8">
                  <h3 className="text-white font-medium mb-4">1. Seleccionar Prompt</h3>
                  <select 
                    className="w-full bg-black border border-zinc-700 rounded p-2 mb-6"
                    onChange={(e) => {
                      const p = availablePrompts.find(x => x.id === e.target.value);
                      setSelectedPrompt(p || null);
                      setPromptVariables({});
                      setGeneratedPrompt('');
                    }}
                  >
                    <option value="">Seleccione...</option>
                    {availablePrompts.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                    ))}
                  </select>

                  {selectedPrompt && (
                    <div className="space-y-4 animate-fade-in">
                       <h4 className="text-zinc-400 text-sm font-medium border-b border-zinc-800 pb-2">Variables Requeridas</h4>
                       {JSON.parse(selectedPrompt.variablesSchemaJson).map((v: any) => (
                         <div key={v.key}>
                            <label className="text-xs text-zinc-500 mb-1 block">{v.label}</label>
                            {v.type === 'text' ? (
                              <textarea 
                                className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm text-white h-24"
                                onChange={(e) => setPromptVariables({...promptVariables, [v.key]: e.target.value})}
                              />
                            ) : (
                              <input 
                                type="text" 
                                className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm text-white"
                                onChange={(e) => setPromptVariables({...promptVariables, [v.key]: e.target.value})}
                              />
                            )}
                         </div>
                       ))}
                       <button onClick={handleRenderPrompt} className="w-full bg-white text-black font-bold py-2 rounded hover:bg-zinc-200">
                         Generar Prompt
                       </button>
                    </div>
                  )}
               </div>
               
               <div className="h-full flex flex-col">
                  <h3 className="text-white font-medium mb-4">2. Resultado (Copiar a LLM)</h3>
                  <textarea 
                    readOnly
                    value={generatedPrompt}
                    className="flex-1 w-full bg-black border border-zinc-800 rounded p-4 text-zinc-300 font-mono text-sm leading-relaxed focus:outline-none min-h-[300px]"
                    placeholder="El prompt generado aparecerá aquí..."
                  />
                  {generatedPrompt && (
                    <button 
                      onClick={() => navigator.clipboard.writeText(generatedPrompt)}
                      className="mt-4 w-full bg-zinc-800 text-white py-2 rounded hover:bg-zinc-700 border border-zinc-700"
                    >
                      Copiar al Portapapeles
                    </button>
                  )}
               </div>
            </div>
          )}

          {/* TAB: DOCUMENTOS */}
          {!isNew && activeTab === 'docs' && (
            <div>
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-white font-medium">Historial de Documentos</h3>
                 <button className="text-xs bg-white text-black px-3 py-1 rounded font-bold">+ Nuevo Doc</button>
               </div>
               <div className="space-y-2">
                 {documents.length === 0 ? (
                   <div className="text-center py-12 text-zinc-600 border border-dashed border-zinc-800 rounded">
                     No hay documentos asociados.
                   </div>
                 ) : (
                   documents.map(doc => (
                     <div key={doc.id} className="bg-zinc-900/50 p-4 rounded border border-zinc-800 flex justify-between items-center">
                        <div>
                          <div className="text-white font-medium">{doc.title}</div>
                          <div className="text-xs text-zinc-500">{doc.docType} &bull; v{doc.version}</div>
                        </div>
                        <button className="text-xs text-zinc-400 hover:text-white border border-zinc-700 px-2 py-1 rounded">Editar</button>
                     </div>
                   ))
                 )}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
      active ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
    }`}
  >
    {icon} {label}
  </button>
);

const InputGroup = ({ label, value, onChange, textarea, type = "text" }: any) => (
  <div>
    <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">{label}</label>
    {textarea ? (
      <textarea 
        className="w-full bg-black border border-zinc-800 rounded p-2 text-sm text-white focus:border-white/50 focus:outline-none h-32 transition-colors"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    ) : (
      <input 
        type={type}
        className="w-full bg-black border border-zinc-800 rounded p-2 text-sm text-white focus:border-white/50 focus:outline-none transition-colors"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    )}
  </div>
);

const SelectGroup = ({ label, value, onChange, options }: any) => (
  <div>
    <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">{label}</label>
    <select 
      className="w-full bg-black border border-zinc-800 rounded p-2 text-sm text-white focus:border-white/50 focus:outline-none transition-colors"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt: string) => (
        <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
      ))}
    </select>
  </div>
);
