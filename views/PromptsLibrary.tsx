import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { ArrowLeft, Plus, Edit, Trash2, Save, X, FileText } from 'lucide-react';
import { api } from '../services/api';
import { Prompt, PromptVariable } from '../types';

interface PromptsLibraryProps {
  onNavigate: (view: string, id?: string) => void;
}

export const PromptsLibrary: React.FC<PromptsLibraryProps> = ({ onNavigate }) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [formData, setFormData] = useState<Partial<Prompt>>({
    name: '',
    category: 'General',
    tagsJson: '[]',
    templateText: '',
    variablesSchemaJson: '[]',
    type: 'PRODUCCION',
    isActive: true,
  });
  const [variables, setVariables] = useState<PromptVariable[]>([]);
  const [filter, setFilter] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      const p = await api.getPrompts();
      setPrompts(p);
    } catch (error) {
      console.error('Error loading prompts:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.templateText) {
      alert('Complete nombre y plantilla');
      return;
    }

    setLoading(true);
    try {
      const promptData = {
        ...formData,
        variablesSchemaJson: JSON.stringify(variables),
        tagsJson: formData.tagsJson || '[]',
      };

      if (editingPrompt) {
        await api.updatePrompt(editingPrompt.id, promptData);
      } else {
        await api.createPrompt(promptData);
      }
      setShowForm(false);
      setEditingPrompt(null);
      setFormData({
        name: '',
        category: 'General',
        tagsJson: '[]',
        templateText: '',
        variablesSchemaJson: '[]',
        type: 'PRODUCCION',
        isActive: true,
      });
      setVariables([]);
      loadPrompts();
    } catch (error) {
      console.error('Error saving prompt:', error);
      alert('Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setFormData(prompt);
    try {
      const vars = JSON.parse(prompt.variablesSchemaJson || '[]');
      setVariables(vars);
    } catch {
      setVariables([]);
    }
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este prompt?')) return;
    try {
      await api.deletePrompt(id);
      loadPrompts();
    } catch (error) {
      console.error('Error deleting prompt:', error);
    }
  };

  const addVariable = () => {
    setVariables([...variables, { key: '', label: '', type: 'string' }]);
  };

  const updateVariable = (index: number, updates: Partial<PromptVariable>) => {
    const updated = [...variables];
    updated[index] = { ...updated[index], ...updates };
    setVariables(updated);
  };

  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const filteredPrompts = prompts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(filter.toLowerCase()) ||
                          p.category.toLowerCase().includes(filter.toLowerCase());
    const matchesType = filterType === 'ALL' || p.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-background text-zinc-300 pb-20">
      <Navbar simple onEnterApp={() => {}} />
      
      <div className="pt-24 px-6 max-w-6xl mx-auto">
        <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2 text-zinc-500 hover:text-white mb-6">
          <ArrowLeft size={16} /> Volver a la Bandeja
        </button>

        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-serif text-white mb-2">Biblioteca de Prompts</h1>
            <p className="text-zinc-500 text-sm">Gestión de prompts parametrizados para LLMs</p>
          </div>
          <button 
            onClick={() => {
              setShowForm(true);
              setEditingPrompt(null);
              setFormData({
                name: '',
                category: 'General',
                tagsJson: '[]',
                templateText: '',
                variablesSchemaJson: '[]',
                type: 'PRODUCCION',
                isActive: true,
              });
              setVariables([]);
            }}
            className="bg-white text-black px-6 py-2 rounded-lg font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2"
          >
            <Plus size={18} /> Nuevo Prompt
          </button>
        </div>

        {!showForm && (
          <>
            <div className="bg-surface border border-border rounded-xl p-4 mb-6 flex gap-4">
              <input 
                type="text"
                placeholder="Buscar por nombre o categoría..."
                className="flex-1 bg-black border border-zinc-800 rounded p-2 text-sm text-white"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              <select 
                className="bg-black border border-zinc-800 rounded p-2 text-sm text-white"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="ALL">Todos</option>
                <option value="PRODUCCION">Producción</option>
                <option value="AUDITORIA">Auditoría</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPrompts.map(prompt => (
                <div key={prompt.id} className="bg-surface border border-border rounded-xl p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-white font-medium mb-1">{prompt.name}</h3>
                      <div className="flex gap-2 items-center mb-2">
                        <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded">
                          {prompt.category}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          prompt.type === 'PRODUCCION' 
                            ? 'bg-blue-900/30 text-blue-400 border border-blue-800/50'
                            : 'bg-purple-900/30 text-purple-400 border border-purple-800/50'
                        }`}>
                          {prompt.type}
                        </span>
                        {!prompt.isActive && (
                          <span className="text-xs text-zinc-600">Inactivo</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEdit(prompt)}
                        className="text-zinc-400 hover:text-white p-1"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(prompt.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-3 mb-3">
                    {prompt.templateText.substring(0, 150)}...
                  </p>
                  <div className="text-xs text-zinc-600">
                    {JSON.parse(prompt.variablesSchemaJson || '[]').length} variables
                  </div>
                </div>
              ))}
              {filteredPrompts.length === 0 && (
                <div className="col-span-2 text-center py-12 text-zinc-600">
                  No se encontraron prompts.
                </div>
              )}
            </div>
          </>
        )}

        {showForm && (
          <div className="bg-surface border border-border rounded-xl p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-white font-medium text-xl">
                {editingPrompt ? 'Editar Prompt' : 'Nuevo Prompt'}
              </h2>
              <button 
                onClick={() => {
                  setShowForm(false);
                  setEditingPrompt(null);
                }}
                className="text-zinc-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">
                  Nombre *
                </label>
                <input 
                  type="text"
                  className="w-full bg-black border border-zinc-800 rounded p-2 text-sm text-white"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">
                  Categoría
                </label>
                <input 
                  type="text"
                  className="w-full bg-black border border-zinc-800 rounded p-2 text-sm text-white"
                  value={formData.category || ''}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">
                  Tipo
                </label>
                <select 
                  className="w-full bg-black border border-zinc-800 rounded p-2 text-sm text-white"
                  value={formData.type || 'PRODUCCION'}
                  onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                >
                  <option value="PRODUCCION">Producción</option>
                  <option value="AUDITORIA">Auditoría</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-zinc-400">
                  <input 
                    type="checkbox"
                    checked={formData.isActive !== false}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="rounded border-zinc-700 bg-zinc-800"
                  />
                  Activo
                </label>
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">
                Plantilla de Texto *
              </label>
              <textarea 
                className="w-full bg-black border border-zinc-800 rounded p-4 text-sm text-white font-mono h-48"
                value={formData.templateText || ''}
                onChange={(e) => setFormData({...formData, templateText: e.target.value})}
                placeholder="Usa {{VARIABLE}} para variables..."
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs text-zinc-500 uppercase tracking-wider">
                  Variables del Schema
                </label>
                <button 
                  onClick={addVariable}
                  className="text-xs bg-zinc-800 text-white px-3 py-1 rounded hover:bg-zinc-700"
                >
                  + Agregar Variable
                </button>
              </div>
              <div className="space-y-2">
                {variables.map((var_, index) => (
                  <div key={index} className="bg-zinc-900/50 p-3 rounded border border-zinc-800 grid grid-cols-12 gap-2">
                    <input 
                      type="text"
                      placeholder="key"
                      className="col-span-3 bg-black border border-zinc-700 rounded p-1 text-xs text-white font-mono"
                      value={var_.key}
                      onChange={(e) => updateVariable(index, { key: e.target.value })}
                    />
                    <input 
                      type="text"
                      placeholder="label"
                      className="col-span-4 bg-black border border-zinc-700 rounded p-1 text-xs text-white"
                      value={var_.label}
                      onChange={(e) => updateVariable(index, { label: e.target.value })}
                    />
                    <select 
                      className="col-span-3 bg-black border border-zinc-700 rounded p-1 text-xs text-white"
                      value={var_.type}
                      onChange={(e) => updateVariable(index, { type: e.target.value as any })}
                    >
                      <option value="string">String</option>
                      <option value="text">Text</option>
                      <option value="date">Date</option>
                      <option value="enum">Enum</option>
                    </select>
                    <button 
                      onClick={() => removeVariable(index)}
                      className="col-span-2 text-red-400 hover:text-red-300 text-xs"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
                {variables.length === 0 && (
                  <div className="text-center py-4 text-zinc-600 text-sm">
                    No hay variables definidas. Agregue variables que coincidan con {{VARIABLE}} en la plantilla.
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={handleSave}
                disabled={loading}
                className="bg-white text-black px-6 py-2 rounded-lg font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save size={18} /> Guardar Prompt
              </button>
              <button 
                onClick={() => {
                  setShowForm(false);
                  setEditingPrompt(null);
                }}
                className="bg-zinc-800 text-white px-6 py-2 rounded-lg font-bold hover:bg-zinc-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
