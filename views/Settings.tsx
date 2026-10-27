import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { ArrowLeft, Download, Upload, Save, Calendar, FileText } from 'lucide-react';
import { api } from '../services/api';
import { AppSettings, Holiday, DeadlineRule } from '../types';

interface SettingsProps {
  onNavigate: (view: string, id?: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ onNavigate }) => {
  const [settings, setSettings] = useState<AppSettings>({ riskDays: 2, firmAlertDays: 2 });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const s = await api.getSettings();
        setSettings(s);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await api.updateSettings(settings);
      alert('Configuración guardada');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      const data = await api.exportBackup();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pensiondesk-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      alert('Backup exportado exitosamente');
    } catch (error) {
      console.error('Error exporting backup:', error);
      alert('Error al exportar backup');
    }
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm('¿Importar este backup? Esto reemplazará todos los datos actuales.')) {
      return;
    }

    try {
      const text = await file.text();
      const success = await api.importBackup(text);
      if (success) {
        alert('Backup importado exitosamente. Recargue la página.');
        window.location.reload();
      } else {
        alert('Error al importar backup');
      }
    } catch (error) {
      console.error('Error importing backup:', error);
      alert('Error al importar backup');
    }
  };

  return (
    <div className="min-h-screen bg-background text-zinc-300 pb-20">
      <Navbar simple onEnterApp={() => {}} />
      
      <div className="pt-24 px-6 max-w-6xl mx-auto">
        <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2 text-zinc-500 hover:text-white mb-6">
          <ArrowLeft size={16} /> Volver a la Bandeja
        </button>

        <h1 className="text-3xl font-serif text-white mb-8">Configuración</h1>

        <div className="flex gap-1 border-b border-border mb-8 overflow-x-auto">
          <TabButton active={activeTab === 'general'} onClick={() => setActiveTab('general')} label="General" />
          <TabButton active={activeTab === 'backup'} onClick={() => setActiveTab('backup')} label="Backup" />
          <TabButton active={activeTab === 'rules'} onClick={() => setActiveTab('rules')} label="Reglas" />
          <TabButton active={activeTab === 'holidays'} onClick={() => setActiveTab('holidays')} label="Festivos" />
        </div>

        <div className="bg-surface border border-border rounded-xl p-8">
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="max-w-2xl space-y-6">
              <h3 className="text-white font-medium text-lg mb-4">Configuración General</h3>
              
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">
                  Días de Riesgo
                </label>
                <input 
                  type="number"
                  className="w-full bg-black border border-zinc-800 rounded p-2 text-sm text-white"
                  value={settings.riskDays}
                  onChange={(e) => setSettings({...settings, riskDays: parseInt(e.target.value) || 2})}
                  min="1"
                />
                <p className="text-xs text-zinc-500 mt-1">Días antes del vencimiento para marcar como "En Riesgo"</p>
              </div>

              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">
                  Días de Alerta Firma
                </label>
                <input 
                  type="number"
                  className="w-full bg-black border border-zinc-800 rounded p-2 text-sm text-white"
                  value={settings.firmAlertDays}
                  onChange={(e) => setSettings({...settings, firmAlertDays: parseInt(e.target.value) || 2})}
                  min="1"
                />
                <p className="text-xs text-zinc-500 mt-1">Días antes del vencimiento para alertar sobre firma pendiente</p>
              </div>

              <button 
                onClick={handleSaveSettings}
                disabled={loading}
                className="bg-white text-black px-6 py-2 rounded-lg font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save size={18} /> Guardar Configuración
              </button>
            </div>
          )}

          {/* BACKUP TAB */}
          {activeTab === 'backup' && (
            <div className="max-w-2xl space-y-6">
              <h3 className="text-white font-medium text-lg mb-4">Backup y Restauración</h3>
              
              <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
                <h4 className="text-white font-medium mb-2">Exportar Backup</h4>
                <p className="text-sm text-zinc-400 mb-4">
                  Descarga una copia completa de todos los datos (casos, prompts, reglas, festivos, documentos).
                </p>
                <button 
                  onClick={handleExportBackup}
                  className="bg-white text-black px-6 py-2 rounded-lg font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2"
                >
                  <Download size={18} /> Exportar Backup JSON
                </button>
              </div>

              <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
                <h4 className="text-white font-medium mb-2">Importar Backup</h4>
                <p className="text-sm text-zinc-400 mb-4">
                  Restaura todos los datos desde un archivo de backup. <strong className="text-yellow-400">Esto reemplazará todos los datos actuales.</strong>
                </p>
                <label className="bg-zinc-800 text-white px-6 py-2 rounded-lg font-bold hover:bg-zinc-700 transition-colors flex items-center gap-2 cursor-pointer inline-block">
                  <Upload size={18} /> Seleccionar Archivo JSON
                  <input 
                    type="file" 
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* RULES TAB */}
          {activeTab === 'rules' && (
            <RulesManagement />
          )}

          {/* HOLIDAYS TAB */}
          {activeTab === 'holidays' && (
            <HolidaysManagement />
          )}
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, label }: any) => (
  <button 
    onClick={onClick}
    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
      active ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
    }`}
  >
    {label}
  </button>
);

const RulesManagement: React.FC = () => {
  const [rules, setRules] = useState<DeadlineRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<DeadlineRule | null>(null);
  const [formData, setFormData] = useState<Partial<DeadlineRule>>({
    name: '',
    unit: 'DIAS_HABILES' as any,
    quantity: 15,
    anchor: 'FECHA_RECEPCION',
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const r = await api.getRules();
      setRules(r);
    } catch (error) {
      console.error('Error loading rules:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.quantity) {
      alert('Complete todos los campos');
      return;
    }

    setLoading(true);
    try {
      if (editingRule) {
        await api.updateRule(editingRule.id, formData);
      } else {
        await api.createRule(formData);
      }
      setShowForm(false);
      setEditingRule(null);
      setFormData({ name: '', unit: 'DIAS_HABILES' as any, quantity: 15, anchor: 'FECHA_RECEPCION' });
      loadRules();
    } catch (error) {
      console.error('Error saving rule:', error);
      alert('Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rule: DeadlineRule) => {
    setEditingRule(rule);
    setFormData(rule);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta regla?')) return;
    try {
      await api.deleteRule(id);
      loadRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-white font-medium text-lg">Reglas de Término</h3>
        <button 
          onClick={() => {
            setShowForm(true);
            setEditingRule(null);
            setFormData({ name: '', unit: 'DIAS_HABILES' as any, quantity: 15, anchor: 'FECHA_RECEPCION' });
          }}
          className="bg-white text-black px-4 py-2 rounded-lg font-bold hover:bg-zinc-200 text-sm"
        >
          + Nueva Regla
        </button>
      </div>

      {showForm && (
        <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800 space-y-4">
          <h4 className="text-white font-medium">{editingRule ? 'Editar Regla' : 'Nueva Regla'}</h4>
          <input 
            type="text"
            placeholder="Nombre de la regla"
            className="w-full bg-black border border-zinc-800 rounded p-2 text-sm text-white"
            value={formData.name || ''}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Cantidad</label>
              <input 
                type="number"
                className="w-full bg-black border border-zinc-800 rounded p-2 text-sm text-white"
                value={formData.quantity || 0}
                onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Unidad</label>
              <select 
                className="w-full bg-black border border-zinc-800 rounded p-2 text-sm text-white"
                value={formData.unit || 'DIAS_HABILES'}
                onChange={(e) => setFormData({...formData, unit: e.target.value as any})}
              >
                <option value="DIAS_HABILES">Días Hábiles</option>
                <option value="DIAS_CALENDARIO">Días Calendario</option>
                <option value="MESES">Meses</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={loading} className="bg-white text-black px-4 py-2 rounded font-bold hover:bg-zinc-200 text-sm">
              Guardar
            </button>
            <button onClick={() => { setShowForm(false); setEditingRule(null); }} className="bg-zinc-800 text-white px-4 py-2 rounded font-bold hover:bg-zinc-700 text-sm">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {rules.map(rule => (
          <div key={rule.id} className="bg-zinc-900/50 p-4 rounded border border-zinc-800 flex justify-between items-center">
            <div>
              <div className="text-white font-medium">{rule.name}</div>
              <div className="text-xs text-zinc-500 mt-1">
                {rule.quantity} {rule.unit.replace(/_/g, ' ')} desde {rule.anchor}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(rule)} className="text-xs text-zinc-400 hover:text-white border border-zinc-700 px-2 py-1 rounded">
                Editar
              </button>
              <button onClick={() => handleDelete(rule.id)} className="text-xs text-red-400 hover:text-red-300 border border-red-800 px-2 py-1 rounded">
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {rules.length === 0 && (
          <div className="text-center py-12 text-zinc-600">
            No hay reglas configuradas.
          </div>
        )}
      </div>
    </div>
  );
};

const HolidaysManagement: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Holiday>>({
    date: '',
    name: '',
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    loadHolidays();
  }, [year]);

  const loadHolidays = async () => {
    try {
      const h = await api.getHolidays(year);
      setHolidays(h);
    } catch (error) {
      console.error('Error loading holidays:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.date || !formData.name) {
      alert('Complete todos los campos');
      return;
    }

    try {
      await api.createHoliday({...formData, year: year});
      setShowForm(false);
      setFormData({ date: '', name: '', year: year });
      loadHolidays();
    } catch (error) {
      console.error('Error saving holiday:', error);
      alert('Error al guardar');
    }
  };

  const handleBulkImport = async (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value;
    if (!text) return;

    try {
      const lines = text.split('\n').filter(l => l.trim());
      const holidaysToImport = lines.map(line => {
        const [dateStr, ...nameParts] = line.split(/\s+/);
        const name = nameParts.join(' ');
        return {
          date: dateStr,
          name: name || 'Festivo',
          year: year,
        };
      });

      await api.createHolidaysBulk(holidaysToImport);
      alert(`${holidaysToImport.length} festivos importados`);
      loadHolidays();
    } catch (error) {
      console.error('Error importing holidays:', error);
      alert('Error al importar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este festivo?')) return;
    try {
      await api.deleteHoliday(id);
      loadHolidays();
    } catch (error) {
      console.error('Error deleting holiday:', error);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-white font-medium text-lg">Festivos {year}</h3>
        <div className="flex gap-2">
          <input 
            type="number"
            className="w-24 bg-black border border-zinc-800 rounded p-2 text-sm text-white"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
          />
          <button 
            onClick={() => {
              setShowForm(true);
              setFormData({ date: '', name: '', year: year });
            }}
            className="bg-white text-black px-4 py-2 rounded-lg font-bold hover:bg-zinc-200 text-sm"
          >
            + Nuevo Festivo
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800 space-y-4">
          <h4 className="text-white font-medium">Nuevo Festivo</h4>
          <input 
            type="date"
            className="w-full bg-black border border-zinc-800 rounded p-2 text-sm text-white"
            value={formData.date || ''}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
          />
          <input 
            type="text"
            placeholder="Nombre del festivo"
            className="w-full bg-black border border-zinc-800 rounded p-2 text-sm text-white"
            value={formData.name || ''}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
          <div className="flex gap-2">
            <button onClick={handleSave} className="bg-white text-black px-4 py-2 rounded font-bold hover:bg-zinc-200 text-sm">
              Guardar
            </button>
            <button onClick={() => setShowForm(false)} className="bg-zinc-800 text-white px-4 py-2 rounded font-bold hover:bg-zinc-700 text-sm">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
        <h4 className="text-white font-medium mb-2">Importación Masiva</h4>
        <p className="text-xs text-zinc-400 mb-2">
          Formato: una línea por festivo. Fecha (YYYY-MM-DD) seguida del nombre. Ejemplo:<br />
          <code className="text-zinc-500">2024-01-01 Año Nuevo</code>
        </p>
        <textarea 
          className="w-full bg-black border border-zinc-800 rounded p-2 text-sm text-white h-32 font-mono"
          placeholder="2024-01-01 Año Nuevo&#10;2024-12-25 Navidad"
          onBlur={handleBulkImport}
        />
      </div>

      <div className="space-y-2">
        {holidays.map(holiday => (
          <div key={holiday.id} className="bg-zinc-900/50 p-4 rounded border border-zinc-800 flex justify-between items-center">
            <div>
              <div className="text-white font-medium">{holiday.name}</div>
              <div className="text-xs text-zinc-500 mt-1">{holiday.date}</div>
            </div>
            <button onClick={() => handleDelete(holiday.id)} className="text-xs text-red-400 hover:text-red-300 border border-red-800 px-2 py-1 rounded">
              Eliminar
            </button>
          </div>
        ))}
        {holidays.length === 0 && (
          <div className="text-center py-12 text-zinc-600">
            No hay festivos configurados para {year}.
          </div>
        )}
      </div>
    </div>
  );
};
