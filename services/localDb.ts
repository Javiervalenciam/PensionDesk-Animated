import { Case, Prompt, DeadlineRule, Holiday, Document, AppSettings, CaseStatus, Priority, DeadlineUnit, DocType } from "../types";

const DB_KEY = 'PENSIONDESK_DB_V1';

interface DatabaseSchema {
  cases: Case[];
  prompts: Prompt[];
  rules: DeadlineRule[];
  holidays: Holiday[];
  documents: Document[];
  settings: AppSettings;
}

const DEFAULT_SETTINGS: AppSettings = {
  riskDays: 2,
  firmAlertDays: 2
};

const SEED_DATA: DatabaseSchema = {
  cases: [
    { 
      id: 'CS-DEMO-001', 
      municipio: 'Medellín', 
      tipo: 'Derecho de Petición', 
      asunto: 'Solicitud reconocimiento pensión vejez', 
      fechaRecepcion: new Date().toISOString().split('T')[0], 
      estado: CaseStatus.PENDIENTE_FIRMA, 
      prioridad: Priority.ALTA,
      hechos: 'El ciudadano trabajó 20 años en el municipio.',
      peticiones: 'Reconocer pensión.',
      anexosJson: '["Cédula", "Historia Laboral"]',
      notas: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      fechaLimitePropuesta: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      fechaLimiteConfirmada: new Date(Date.now() - 86400000).toISOString().split('T')[0] // Vencido
    }
  ],
  prompts: [
    {
      id: 'PR-001',
      name: 'Respuesta DP Estándar',
      category: 'Derecho de Petición',
      tagsJson: '["General", "Respuesta"]',
      type: 'PRODUCCION',
      version: 1,
      isActive: true,
      variablesSchemaJson: JSON.stringify([
        { key: 'CIUDADANO', label: 'Nombre Ciudadano', type: 'string' },
        { key: 'RADICADO', label: 'No. Radicado', type: 'string' },
        { key: 'ANALISIS', label: 'Análisis Jurídico', type: 'text' }
      ]),
      templateText: 'Señor {{CIUDADANO}},\n\nEn respuesta a su petición con radicado {{RADICADO}}, nos permitimos informarle:\n\n{{ANALISIS}}\n\nAtentamente,\nOficina Jurídica.'
    }
  ],
  rules: [
    { id: 'RL-001', name: 'Derecho Petición (General)', unit: DeadlineUnit.DIAS_HABILES, quantity: 15, anchor: 'FECHA_RECEPCION' },
    { id: 'RL-002', name: 'Tutela', unit: DeadlineUnit.DIAS_HABILES, quantity: 2, anchor: 'FECHA_RECEPCION' }
  ],
  holidays: [],
  documents: [],
  settings: DEFAULT_SETTINGS
};

class LocalDatabase {
  private data: DatabaseSchema;

  constructor() {
    const stored = localStorage.getItem(DB_KEY);
    if (stored) {
      this.data = JSON.parse(stored);
    } else {
      this.data = SEED_DATA;
      this.save();
    }
  }

  private save() {
    localStorage.setItem(DB_KEY, JSON.stringify(this.data));
  }

  // CASES
  getCases() { return this.data.cases; }
  getCase(id: string) { return this.data.cases.find(c => c.id === id); }
  addCase(c: Case) { this.data.cases.push(c); this.save(); }
  updateCase(id: string, updates: Partial<Case>) {
    const idx = this.data.cases.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.data.cases[idx] = { ...this.data.cases[idx], ...updates, updatedAt: Date.now() };
      this.save();
    }
  }
  deleteCase(id: string) {
    this.data.cases = this.data.cases.filter(c => c.id !== id);
    this.save();
  }

  // PROMPTS
  getPrompts() { return this.data.prompts; }
  getPrompt(id: string) { return this.data.prompts.find(p => p.id === id); }
  addPrompt(p: Prompt) { this.data.prompts.push(p); this.save(); }
  updatePrompt(id: string, updates: Partial<Prompt>) {
    const idx = this.data.prompts.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.data.prompts[idx] = { ...this.data.prompts[idx], ...updates };
      this.save();
    }
  }
  deletePrompt(id: string) {
    this.data.prompts = this.data.prompts.filter(p => p.id !== id);
    this.save();
  }
  
  // RULES
  getRules() { return this.data.rules; }
  getRule(id: string) { return this.data.rules.find(r => r.id === id); }
  addRule(r: DeadlineRule) { this.data.rules.push(r); this.save(); }
  updateRule(id: string, updates: Partial<DeadlineRule>) {
    const idx = this.data.rules.findIndex(r => r.id === id);
    if (idx !== -1) {
      this.data.rules[idx] = { ...this.data.rules[idx], ...updates };
      this.save();
    }
  }
  deleteRule(id: string) {
    this.data.rules = this.data.rules.filter(r => r.id !== id);
    this.save();
  }

  // HOLIDAYS
  getHolidays() { return this.data.holidays; }
  getHoliday(id: string) { return this.data.holidays.find(h => h.id === id); }
  addHoliday(h: Holiday) { this.data.holidays.push(h); this.save(); }
  updateHoliday(id: string, updates: Partial<Holiday>) {
    const idx = this.data.holidays.findIndex(h => h.id === id);
    if (idx !== -1) {
      this.data.holidays[idx] = { ...this.data.holidays[idx], ...updates };
      this.save();
    }
  }
  deleteHoliday(id: string) {
    this.data.holidays = this.data.holidays.filter(h => h.id !== id);
    this.save();
  }

  // DOCUMENTS
  getDocuments(caseId: string) { return this.data.documents.filter(d => d.caseId === caseId); }
  getDocument(id: string) { return this.data.documents.find(d => d.id === id); }
  addDocument(d: Document) { this.data.documents.push(d); this.save(); }
  updateDocument(id: string, updates: Partial<Document>) {
    const idx = this.data.documents.findIndex(d => d.id === id);
    if (idx !== -1) {
      this.data.documents[idx] = { ...this.data.documents[idx], ...updates };
      this.save();
    }
  }
  deleteDocument(id: string) {
    this.data.documents = this.data.documents.filter(d => d.id !== id);
    this.save();
  }

  // SETTINGS
  getSettings() { return this.data.settings; }
  updateSettings(updates: Partial<AppSettings>) {
    this.data.settings = { ...this.data.settings, ...updates };
    this.save();
  }
  
  // BACKUP
  exportData() { return JSON.stringify(this.data); }
  importData(json: string) {
    try {
      this.data = JSON.parse(json);
      this.save();
      return true;
    } catch (e) {
      return false;
    }
  }
}

export const db = new LocalDatabase();
