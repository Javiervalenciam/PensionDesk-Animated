import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { ArrowLeft, Save, FileText, Calendar, Play, CheckSquare, Clock, History, Download, Copy, FileEdit } from 'lucide-react';
import { api } from '../services/api';
import { Case, CaseStatus, Priority, DeadlineUnit, DocType, Document, Prompt, DeadlineRule, Holiday } from '../types';
import { getDaysDiff } from '../utils/dateUtils';

interface CaseDetailProps {
  caseId?: string;
  onNavigate: (view: string, id?: string) => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export const CaseDetail: React.FC<CaseDetailProps> = ({ caseId, onNavigate }) => {
  const isNew = !caseId;
  const [activeTab, setActiveTab] = useState('resumen');
  const [loading, setLoading] = useState(false);
  
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
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [showDocEditor, setShowDocEditor] = useState(false);
  const [docEditorContent, setDocEditorContent] = useState('');
  const [docEditorTitle, setDocEditorTitle] = useState('');
  const [docEditorType, setDocEditorType] = useState<DocType>(DocType.BORRADOR);
  
  // Prompts State
  const [availablePrompts, setAvailablePrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [promptVariables, setPromptVariables] = useState<Record<string, string>>({});
  const [generatedPrompt, setGeneratedPrompt] = useState('');

  // Terms State
  const [rules, setRules] = useState<DeadlineRule[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  // Checklist State
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: '1', label: 'Revisar hechos del caso', checked: false },
    { id: '2', label: 'Verificar documentación anexa', checked: false },
    { id: '3', label: 'Calcular término de respuesta', checked: false },
    { id: '4', label: 'Redactar documento de respuesta', checked: false },
    { id: '5', label: 'Revisión jurídica', checked: false },
    { id: '6', label: 'Firma del documento', checked: false },
    { id: '7', label: 'Radicación', checked: false },
  ]);

  // Activity State (lite)
  const [activities, setActivities] = useState<Array<{id: string, action: string, date: string}>>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!isNew && caseId) {
        setLoading(true);
        try {
          const c = await api.getCase(caseId);
          if (c) {
            setFormData(c);
            const docs = await api.getDocuments(caseId);
            setDocuments(docs);
            
            // Load activities from case updates
            setActivities([
              { id: '1', action: 'Caso creado', date: new Date(c.createdAt).toLocaleString() },
              { id: '2', action: `Estado: ${c.estado}`, date: new Date(c.updatedAt).toLocaleString() },
            ]);
          }
        } catch (error) {
          console.error('Error loading case:', error);
        } finally {
          setLoading(false);
        }
      }
      
      // Load prompts and rules
      try {
        const [prompts, rulesData, holidaysData] = await Promise.all([
          api.getPrompts(true),
          api.getRules(),
          api.getHolidays(new Date().getFullYear()),
        ]);
        setAvailablePrompts(prompts);
        setRules(rulesData);
        setHolidays(holidaysData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, [caseId, isNew]);

  const handleSave = async () => {
    if (!formData.asunto || !formData.municipio || !formData.fechaRecepcion) {
      alert('Por favor complete los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      if (isNew) {
        const newCase = await api.createCase(formData);
        onNavigate('case_detail', newCase.id);
      } else {
        await api.updateCase(caseId!, formData);
        alert('Guardado correctamente');
        // Reload case
        const updated = await api.getCase(caseId!);
        if (updated) setFormData(updated);
      }
    } catch (error) {
      console.error('Error saving case:', error);
      alert('Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateDeadline = async () => {
    const rule = rules.find(r => r.id === formData.deadlineRuleId);
    if (!rule || !formData.fechaRecepcion) {
      alert('Seleccione una regla y fecha de recepción');
      return;
    }

    try {
      const proposed = await api.calculateDeadline(
        formData.fechaRecepcion,
        rule.unit,
        rule.quantity,
        holidays
      );
      setFormData(prev => ({ ...prev, fechaLimitePropuesta: proposed }));
    } catch (error) {
      console.error('Error calculating deadline:', error);
      alert('Error al calcular fecha límite');
    }
  };

  const handleRenderPrompt = () => {
    if (!selectedPrompt) return;
    let text = selectedPrompt.templateText;
    Object.keys(promptVariables).forEach(key => {
      text = text.replace(new RegExp(`{{${key}}}`, 'g'), promptVariables[key] || '');
    });
    setGeneratedPrompt(text);
  };

  const handleNewDocument = () => {
    setEditingDoc(null);
    setDocEditorTitle('');
    setDocEditorContent('');
    setDocEditorType(DocType.BORRADOR);
    setShowDocEditor(true);
  };

  const handleEditDocument = (doc: Document) => {
    setEditingDoc(doc);
    setDocEditorTitle(doc.title);
    setDocEditorContent(doc.contentText);
    setDocEditorType(doc.docType);
    setShowDocEditor(true);
  };

  const handleSaveDocument = async () => {
    if (!docEditorTitle || !docEditorContent || !caseId) return;

    try {
      if (editingDoc) {
        await api.updateDocument(editingDoc.id, {
          title: docEditorTitle,
          contentText: docEditorContent,
          docType: docEditorType,
        });
      } else {
        await api.createDocument({
          caseId,
          title: docEditorTitle,
          contentText: docEditorContent,
          docType: docEditorType,
          source: 'MANUAL',
        });
      }
      setShowDocEditor(false);
      const docs = await api.getDocuments(caseId);
      setDocuments(docs);
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Error al guardar documento');
    }
  };

  const handleExportDocument = (doc: Document, format: 'txt' | 'md') => {
    const content = doc.contentText;
    const blob = format === 'txt' 
      ? new Blob([content], { type: 'text/plain' })
      : new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConvertToPrompt = async (doc: Document) => {
    if (!confirm('¿Convertir este documento final en un Prompt reutilizable?')) return;
    if (doc.docType !== DocType.FINAL) {
      alert('Solo se pueden convertir documentos marcados como FINAL');
      return;
    }

    const name = prompt(`Nombre del prompt:`, `Prompt desde ${doc.title}`);
    if (!name) return;

    try {
      await api.createPrompt({
        name,
        category: 'Generado',
        templateText: doc.contentText,
        variablesSchemaJson: JSON.stringify([]),
        type: 'PRODUCCION',
      });
      alert('Prompt creado exitosamente');
      // Optionally navigate to prompts library
      // onNavigate('prompts_library');
    } catch (error) {
      console.error('Error creating prompt:', error);
      alert('Error al crear prompt');
    }
  };

  const handleMarkFinal = async (doc: Document) => {
    if (!confirm('¿Marcar este documento como FINAL?')) return;
    try {
      await api.updateDocument(doc.id, { docType: DocType.FINAL });
      const docs = await api.getDocuments(caseId!);
      setDocuments(docs);
    } catch (error) {
      console.error('Error updating document:', error);
    }
  };

  const handleDuplicateDocument = async (doc: Document) => {
    try {
      await api.createDocument({
        caseId: doc.caseId,
        title: `${doc.title} (Copia)`,
        contentText: doc.contentText,
        docType: DocType.BORRADOR,
        source: doc.source,
      });
      const docs = await api.getDocuments(caseId!);
      setDocuments(docs);
    } catch (error) {
      console.error('Error duplicating document:', error);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('¿Eliminar este documento?')) return;
    try {
      await api.deleteDocument(docId);
      const docs = await api.getDocuments(caseId!);
      setDocuments(docs);
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  if (loading && !isNew) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <div>Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-zinc-300 pb-20">
      <Navbar simple onEnterApp={() => {}} />
      
      <div className="pt-24 px-6 max-w-6xl mx-auto">
        <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2 text-zinc-500 hover:text-white mb-6">
          <ArrowLeft size={16} /> Volver a la Bandeja
        </button>

        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-serif text-white mb-2">{isNew ? 'Nuevo Caso' : formData.asunto || 'Caso'}</h1>
            <p className="text-zinc-500 font-mono text-sm">{formData.id || 'Borrador'}</p>
          </div>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="bg-white text-black px-6 py-2 rounded-lg font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={18} /> {isNew ? 'Crear Caso' : 'Guardar Cambios'}
          </button>
        </div>

        {!isNew && (
          <div className="flex gap-1 border-b border-border mb-8 overflow-x-auto">
            <TabButton active={activeTab === 'resumen'} onClick={() => setActiveTab('resumen')} icon={<FileText size={16} />} label="Resumen" />
            <TabButton active={activeTab === 'terminos'} onClick={() => setActiveTab('terminos')} icon={<Calendar size={16} />} label="Términos" />
            <TabButton active={activeTab === 'docs'} onClick={() => setActiveTab('docs')} icon={<FileEdit size={16} />} label="Documentos" />
            <TabButton active={activeTab === 'prompts'} onClick={() => setActiveTab('prompts')} icon={<Play size={16} />} label="Prompts IA" />
            <TabButton active={activeTab === 'checklist'} onClick={() => setActiveTab('checklist')} icon={<CheckSquare size={16} />} label="Checklist" />
            <TabButton active={activeTab === 'actividad'} onClick={() => setActiveTab('actividad')} icon={<History size={16} />} label="Actividad" />
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
                <InputGroup label="Anexos (JSON)" value={formData.anexosJson} onChange={v => setFormData({...formData, anexosJson: v})} />
              </div>
              <div className="space-y-4">
                <InputGroup label="Hechos Relevantes" textarea value={formData.hechos} onChange={v => setFormData({...formData, hechos: v})} />
                <InputGroup label="Peticiones" textarea value={formData.peticiones} onChange={v => setFormData({...formData, peticiones: v})} />
                <InputGroup label="Notas Internas" textarea value={formData.notas} onChange={v => setFormData({...formData, notas: v})} />
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
                            className="w-full bg-black border border-zinc-700 rounded p-2 text-sm text-white"
                            value={formData.deadlineRuleId || ''}
                            onChange={(e) => setFormData({...formData, deadlineRuleId: e.target.value})}
                          >
                            <option value="">Seleccionar Regla...</option>
                            {rules.map(r => (
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
                              value={formData.fechaLimiteConfirmada || ''}
                              onChange={(e) => setFormData({...formData, fechaLimiteConfirmada: e.target.value})}
                            />
                         </div>
                      </div>
                      {formData.fechaLimiteConfirmada && (
                        <div className="mt-4 p-3 bg-zinc-900 rounded border border-zinc-800">
                          <span className="text-zinc-400 text-sm">
                            Días restantes: <strong className="text-white">{getDaysDiff(formData.fechaLimiteConfirmada)}</strong>
                          </span>
                        </div>
                      )}
                   </div>
                </div>
             </div>
          )}

          {/* TAB: DOCUMENTOS */}
          {!isNew && activeTab === 'docs' && (
            <div>
              {showDocEditor ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-white font-medium">{editingDoc ? 'Editar Documento' : 'Nuevo Documento'}</h3>
                    <button onClick={() => setShowDocEditor(false)} className="text-zinc-400 hover:text-white">Cancelar</button>
                  </div>
                  <InputGroup label="Título" value={docEditorTitle} onChange={v => setDocEditorTitle(v)} />
                  <SelectGroup 
                    label="Tipo" 
                    value={docEditorType} 
                    onChange={v => setDocEditorType(v as DocType)} 
                    options={Object.values(DocType)} 
                  />
                  <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">Contenido</label>
                    <textarea 
                      className="w-full bg-black border border-zinc-800 rounded p-4 text-sm text-white focus:border-white/50 focus:outline-none h-96 font-mono"
                      value={docEditorContent}
                      onChange={(e) => setDocEditorContent(e.target.value)}
                    />
                  </div>
                  <button onClick={handleSaveDocument} className="bg-white text-black px-6 py-2 rounded-lg font-bold hover:bg-zinc-200">
                    Guardar Documento
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-white font-medium">Historial de Documentos</h3>
                    <button onClick={handleNewDocument} className="text-xs bg-white text-black px-3 py-1 rounded font-bold hover:bg-zinc-200">
                      + Nuevo Doc
                    </button>
                  </div>
                  <div className="space-y-2">
                    {documents.length === 0 ? (
                      <div className="text-center py-12 text-zinc-600 border border-dashed border-zinc-800 rounded">
                        No hay documentos asociados.
                      </div>
                    ) : (
                      documents.map(doc => (
                        <div key={doc.id} className="bg-zinc-900/50 p-4 rounded border border-zinc-800">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="text-white font-medium">{doc.title}</div>
                              <div className="text-xs text-zinc-500 mt-1">
                                {doc.docType} &bull; v{doc.version} &bull; {doc.source}
                                {doc.docType === DocType.FINAL && <span className="ml-2 text-green-400">✓ FINAL</span>}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleEditDocument(doc)} className="text-xs text-zinc-400 hover:text-white border border-zinc-700 px-2 py-1 rounded">
                                Editar
                              </button>
                              {doc.docType !== DocType.FINAL && (
                                <button onClick={() => handleMarkFinal(doc)} className="text-xs text-green-400 hover:text-green-300 border border-green-800 px-2 py-1 rounded">
                                  Marcar FINAL
                                </button>
                              )}
                              <button onClick={() => handleDuplicateDocument(doc)} className="text-xs text-zinc-400 hover:text-white border border-zinc-700 px-2 py-1 rounded">
                                Duplicar
                              </button>
                              <button onClick={() => handleExportDocument(doc, 'txt')} className="text-xs text-zinc-400 hover:text-white border border-zinc-700 px-2 py-1 rounded">
                                Export TXT
                              </button>
                              <button onClick={() => handleExportDocument(doc, 'md')} className="text-xs text-zinc-400 hover:text-white border border-zinc-700 px-2 py-1 rounded">
                                Export MD
                              </button>
                              {doc.docType === DocType.FINAL && (
                                <button onClick={() => handleConvertToPrompt(doc)} className="text-xs text-blue-400 hover:text-blue-300 border border-blue-800 px-2 py-1 rounded">
                                  → Prompt
                                </button>
                              )}
                              <button onClick={() => handleDeleteDocument(doc.id)} className="text-xs text-red-400 hover:text-red-300 border border-red-800 px-2 py-1 rounded">
                                Eliminar
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB: PROMPTS */}
          {!isNew && activeTab === 'prompts' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
               <div className="border-r border-zinc-800 pr-8">
                  <h3 className="text-white font-medium mb-4">1. Seleccionar Prompt</h3>
                  <select 
                    className="w-full bg-black border border-zinc-700 rounded p-2 mb-6 text-white"
                    value={selectedPrompt?.id || ''}
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
                       {JSON.parse(selectedPrompt.variablesSchemaJson || '[]').map((v: any) => (
                         <div key={v.key}>
                            <label className="text-xs text-zinc-500 mb-1 block">{v.label}</label>
                            {v.type === 'text' ? (
                              <textarea 
                                className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm text-white h-24"
                                value={promptVariables[v.key] || ''}
                                onChange={(e) => setPromptVariables({...promptVariables, [v.key]: e.target.value})}
                              />
                            ) : (
                              <input 
                                type="text" 
                                className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm text-white"
                                value={promptVariables[v.key] || ''}
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
                      onClick={() => {
                        navigator.clipboard.writeText(generatedPrompt);
                        alert('Copiado al portapapeles');
                      }}
                      className="mt-4 w-full bg-zinc-800 text-white py-2 rounded hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center gap-2"
                    >
                      <Copy size={16} /> Copiar al Portapapeles
                    </button>
                  )}
               </div>
            </div>
          )}

          {/* TAB: CHECKLIST */}
          {!isNew && activeTab === 'checklist' && (
            <div className="max-w-2xl mx-auto">
              <h3 className="text-white font-medium mb-6">Checklist de Proceso</h3>
              <div className="space-y-3">
                {checklist.map(item => (
                  <label key={item.id} className="flex items-center gap-3 p-4 bg-zinc-900/50 rounded border border-zinc-800 hover:bg-zinc-900 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={item.checked}
                      onChange={(e) => {
                        setChecklist(prev => prev.map(i => 
                          i.id === item.id ? { ...i, checked: e.target.checked } : i
                        ));
                      }}
                      className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-white focus:ring-2 focus:ring-white"
                    />
                    <span className={`flex-1 ${item.checked ? 'line-through text-zinc-500' : 'text-white'}`}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* TAB: ACTIVIDAD */}
          {!isNew && activeTab === 'actividad' && (
            <div className="max-w-2xl mx-auto">
              <h3 className="text-white font-medium mb-6">Historial de Actividad</h3>
              <div className="space-y-3">
                {activities.map(activity => (
                  <div key={activity.id} className="p-4 bg-zinc-900/50 rounded border border-zinc-800">
                    <div className="text-white">{activity.action}</div>
                    <div className="text-xs text-zinc-500 mt-1">{activity.date}</div>
                  </div>
                ))}
                {activities.length === 0 && (
                  <div className="text-center py-12 text-zinc-600">
                    No hay actividad registrada.
                  </div>
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
