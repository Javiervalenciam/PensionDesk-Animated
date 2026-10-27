import { Case, Prompt, DeadlineRule, Holiday, Document, AppSettings, CaseStatus } from "../types";

const API_BASE = import.meta.env.VITE_USE_API === 'true' ? 'http://localhost:8000/api' : null;

// Helper to convert backend format to frontend format
function convertCaseFromBackend(backendCase: any): Case {
  return {
    id: String(backendCase.id),
    municipio: backendCase.municipio,
    tipo: backendCase.tipo,
    asunto: backendCase.asunto,
    fechaRecepcion: backendCase.fecha_recepcion || backendCase.fechaRecepcion,
    estado: backendCase.estado,
    prioridad: backendCase.prioridad,
    deadlineRuleId: backendCase.deadline_rule_id ? String(backendCase.deadline_rule_id) : backendCase.deadlineRuleId,
    fechaLimitePropuesta: backendCase.fecha_limite_propuesta || backendCase.fechaLimitePropuesta,
    fechaLimiteConfirmada: backendCase.fecha_limite_confirmada || backendCase.fechaLimiteConfirmada,
    hechos: backendCase.hechos || '',
    peticiones: backendCase.peticiones || '',
    anexosJson: backendCase.anexos_json || backendCase.anexosJson || '[]',
    notas: backendCase.notas || '',
    createdAt: backendCase.created_at ? new Date(backendCase.created_at).getTime() : backendCase.createdAt,
    updatedAt: backendCase.updated_at ? new Date(backendCase.updated_at).getTime() : backendCase.updatedAt,
  };
}

function convertCaseToBackend(frontendCase: Partial<Case>): any {
  return {
    municipio: frontendCase.municipio,
    tipo: frontendCase.tipo,
    asunto: frontendCase.asunto,
    fecha_recepcion: frontendCase.fechaRecepcion,
    estado: frontendCase.estado,
    prioridad: frontendCase.prioridad,
    deadline_rule_id: frontendCase.deadlineRuleId ? parseInt(frontendCase.deadlineRuleId) : null,
    fecha_limite_propuesta: frontendCase.fechaLimitePropuesta || null,
    fecha_limite_confirmada: frontendCase.fechaLimiteConfirmada || null,
    hechos: frontendCase.hechos || null,
    peticiones: frontendCase.peticiones || null,
    anexos_json: frontendCase.anexosJson || '[]',
    notas: frontendCase.notas || null,
  };
}

function convertRuleFromBackend(backendRule: any): DeadlineRule {
  return {
    id: String(backendRule.id),
    name: backendRule.name,
    unit: backendRule.unit,
    quantity: backendRule.quantity,
    anchor: backendRule.anchor,
    notes: backendRule.notes,
  };
}

function convertRuleToBackend(frontendRule: Partial<DeadlineRule>): any {
  return {
    name: frontendRule.name,
    unit: frontendRule.unit,
    quantity: frontendRule.quantity,
    anchor: frontendRule.anchor || 'FECHA_RECEPCION',
    notes: frontendRule.notes,
  };
}

function convertHolidayFromBackend(backendHoliday: any): Holiday {
  return {
    id: String(backendHoliday.id),
    date: backendHoliday.date,
    name: backendHoliday.name,
    year: backendHoliday.year,
  };
}

function convertHolidayToBackend(frontendHoliday: Partial<Holiday>): any {
  return {
    date: frontendHoliday.date,
    name: frontendHoliday.name,
    year: frontendHoliday.year,
  };
}

function convertPromptFromBackend(backendPrompt: any): Prompt {
  return {
    id: String(backendPrompt.id),
    name: backendPrompt.name,
    category: backendPrompt.category || 'General',
    tagsJson: backendPrompt.tags_json || backendPrompt.tagsJson || '[]',
    templateText: backendPrompt.template_text || backendPrompt.templateText,
    variablesSchemaJson: backendPrompt.variables_schema_json || backendPrompt.variablesSchemaJson,
    version: backendPrompt.version || 1,
    isActive: backendPrompt.is_active !== undefined ? backendPrompt.is_active : backendPrompt.isActive,
    type: backendPrompt.type || 'PRODUCCION',
  };
}

function convertPromptToBackend(frontendPrompt: Partial<Prompt>): any {
  return {
    name: frontendPrompt.name,
    category: frontendPrompt.category || 'General',
    tags_json: frontendPrompt.tagsJson || '[]',
    template_text: frontendPrompt.templateText,
    variables_schema_json: frontendPrompt.variablesSchemaJson,
    version: frontendPrompt.version || 1,
    is_active: frontendPrompt.isActive !== undefined ? frontendPrompt.isActive : true,
    type: frontendPrompt.type || 'PRODUCCION',
  };
}

function convertDocumentFromBackend(backendDoc: any): Document {
  return {
    id: String(backendDoc.id),
    caseId: String(backendDoc.case_id || backendDoc.caseId),
    docType: backendDoc.doc_type || backendDoc.docType,
    source: backendDoc.source,
    contentText: backendDoc.content_text || backendDoc.contentText,
    version: backendDoc.version || 1,
    isModel: backendDoc.is_model || backendDoc.isModel || false,
    title: backendDoc.title,
    createdAt: backendDoc.created_at ? new Date(backendDoc.created_at).getTime() : backendDoc.createdAt,
  };
}

function convertDocumentToBackend(frontendDoc: Partial<Document>): any {
  return {
    case_id: frontendDoc.caseId ? parseInt(frontendDoc.caseId) : null,
    doc_type: frontendDoc.docType,
    source: frontendDoc.source || 'MANUAL',
    content_text: frontendDoc.contentText,
    version: frontendDoc.version || 1,
    is_model: frontendDoc.isModel || false,
    title: frontendDoc.title,
  };
}

class ApiService {
  private useApi: boolean;

  constructor() {
    this.useApi = API_BASE !== null;
  }

  // CASES
  async getCases(status?: CaseStatus, q?: string): Promise<Case[]> {
    if (!this.useApi) {
      const { db } = await import('./localDb');
      let cases = db.getCases();
      if (status) cases = cases.filter(c => c.estado === status);
      if (q) {
        const query = q.toLowerCase();
        cases = cases.filter(c => 
          c.asunto.toLowerCase().includes(query) ||
          c.municipio.toLowerCase().includes(query) ||
          c.id.toLowerCase().includes(query)
        );
      }
      return cases;
    }

    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (q) params.append('q', q);
    const res = await fetch(`${API_BASE}/cases/?${params}`);
    const data = await res.json();
    return data.map(convertCaseFromBackend);
  }

  async getCase(id: string): Promise<Case | null> {
    if (!this.useApi) {
      const { db } = await import('./localDb');
      return db.getCase(id) || null;
    }

    const res = await fetch(`${API_BASE}/cases/${id}`);
    if (!res.ok) return null;
    const data = await res.json();
    return convertCaseFromBackend(data);
  }

  async createCase(caseData: Partial<Case>): Promise<Case> {
    if (!this.useApi) {
      const { db } = await import('./localDb');
      const newCase: Case = {
        ...caseData as Case,
        id: `CS-${Date.now()}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      db.addCase(newCase);
      return newCase;
    }

    const res = await fetch(`${API_BASE}/cases/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(convertCaseToBackend(caseData)),
    });
    const data = await res.json();
    return convertCaseFromBackend(data);
  }

  async updateCase(id: string, updates: Partial<Case>): Promise<Case> {
    if (!this.useApi) {
      const { db } = await import('./localDb');
      db.updateCase(id, updates);
      return db.getCase(id)!;
    }

    const res = await fetch(`${API_BASE}/cases/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(convertCaseToBackend(updates)),
    });
    const data = await res.json();
    return convertCaseFromBackend(data);
  }

  async deleteCase(id: string): Promise<void> {
    if (!this.useApi) {
      const { db } = await import('./localDb');
      db.deleteCase(id);
      return;
    }

    await fetch(`${API_BASE}/cases/${id}`, { method: 'DELETE' });
  }

  // RULES
  async getRules(): Promise<DeadlineRule[]> {
    if (!this.useApi) {
      const { db } = await import('./localDb');
      return db.getRules();
    }

    const res = await fetch(`${API_BASE}/rules/`);
    const data = await res.json();
    return data.map(convertRuleFromBackend);
  }

  async createRule(rule: Partial<DeadlineRule>): Promise<DeadlineRule> {
    if (!this.useApi) {
      const { db } = await import('./localDb');
      const newRule: DeadlineRule = {
        ...rule as DeadlineRule,
        id: `RL-${Date.now()}`,
      };
      db.addRule(newRule);
      return newRule;
    }

    const res = await fetch(`${API_BASE}/rules/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(convertRuleToBackend(rule)),
    });
    const data = await res.json();
    return convertRuleFromBackend(data);
  }

  async updateRule(id: string, updates: Partial<DeadlineRule>): Promise<DeadlineRule> {
    if (!this.useApi) {
      const { db } = await import('./localDb');
      db.updateRule(id, updates);
      return db.getRule(id)!;
    }

    const res = await fetch(`${API_BASE}/rules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(convertRuleToBackend(updates)),
    });
    const data = await res.json();
    return convertRuleFromBackend(data);
  }

  async deleteRule(id: string): Promise<void> {
    if (!this.useApi) {
      const { db } = await import('./localDb');
      // Would need deleteRule method in localDb
      return;
    }

    await fetch(`${API_BASE}/rules/${id}`, { method: 'DELETE' });
  }

  // HOLIDAYS
  async getHolidays(year?: number): Promise<Holiday[]> {
    if (!this.useApi) {
      const { db } = await import('./localDb');
      let holidays = db.getHolidays();
      if (year) holidays = holidays.filter(h => h.year === year);
      return holidays;
    }

    const params = year ? `?year=${year}` : '';
    const res = await fetch(`${API_BASE}/holidays/${params}`);
    const data = await res.json();
    return data.map(convertHolidayFromBackend);
  }

  async createHoliday(holiday: Partial<Holiday>): Promise<Holiday> {
    if (!this.useApi) {
      const { db } = await import('./localDb');
      const newHoliday: Holiday = {
        ...holiday as Holiday,
        id: `HL-${Date.now()}`,
      };
      db.addHoliday(newHoliday);
      return newHoliday;
    }

    const res = await fetch(`${API_BASE}/holidays/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(convertHolidayToBackend(holiday)),
    });
    const data = await res.json();
    return convertHolidayFromBackend(data);
  }

  async createHolidaysBulk(holidays: Partial<Holiday>[]): Promise<Holiday[]> {
    if (!this.useApi) {
      const { db } = await import('./localDb');
      return holidays.map(h => {
        const newHoliday: Holiday = {
          ...h as Holiday,
          id: `HL-${Date.now()}-${Math.random()}`,
        };
        db.addHoliday(newHoliday);
        return newHoliday;
      });
    }

    const res = await fetch(`${API_BASE}/holidays/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(holidays.map(convertHolidayToBackend)),
    });
    const data = await res.json();
    return data.map(convertHolidayFromBackend);
  }

  async deleteHoliday(id: string): Promise<void> {
    if (!this.useApi) {
      const { db } = await import('./localDb');
      db.deleteHoliday(id);
      return;
    }

    await fetch(`${API_BASE}/holidays/${id}`, { method: 'DELETE' });
  }

  // PROMPTS
  async getPrompts(activeOnly = false, type?: string): Promise<Prompt[]> {
    if (!this.useApi) {
      const { db } = await import('./localDb');
      let prompts = db.getPrompts();
      if (activeOnly) prompts = prompts.filter(p => p.isActive);
      if (type) prompts = prompts.filter(p => p.type === type);
      return prompts;
    }

    const params = new URLSearchParams();
    if (activeOnly) params.append('active_only', 'true');
    if (type) params.append('type', type);
    const res = await fetch(`${API_BASE}/prompts/?${params}`);
    const data = await res.json();
    return data.map(convertPromptFromBackend);
  }

  async createPrompt(prompt: Partial<Prompt>): Promise<Prompt> {
    if (!this.useApi) {
      const { db } = await import('./localDb');
      const newPrompt: Prompt = {
        ...prompt as Prompt,
        id: `PR-${Date.now()}`,
      };
      db.addPrompt(newPrompt);
      return newPrompt;
    }

    const res = await fetch(`${API_BASE}/prompts/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(convertPromptToBackend(prompt)),
    });
    const data = await res.json();
    return convertPromptFromBackend(data);
  }

  async updatePrompt(id: string, updates: Partial<Prompt>): Promise<Prompt> {
    if (!this.useApi) {
      const { db } = await import('./localDb');
      db.updatePrompt(id, updates);
      return db.getPrompt(id)!;
    }

    const res = await fetch(`${API_BASE}/prompts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(convertPromptToBackend(updates)),
    });
    const data = await res.json();
    return convertPromptFromBackend(data);
  }

  async deletePrompt(id: string): Promise<void> {
    if (!this.useApi) {
      const { db } = await import('./localDb');
      db.deletePrompt(id);
      return;
    }

    await fetch(`${API_BASE}/prompts/${id}`, { method: 'DELETE' });
  }

  // DOCUMENTS
  async getDocuments(caseId: string): Promise<Document[]> {
    if (!this.useApi) {
      const { db } = await import('./localDb');
      return db.getDocuments(caseId);
    }

    const res = await fetch(`${API_BASE}/documents/?case_id=${caseId}`);
    const data = await res.json();
    return data.map(convertDocumentFromBackend);
  }

  async createDocument(doc: Partial<Document>): Promise<Document> {
    if (!this.useApi) {
      const { db } = await import('./localDb');
      const newDoc: Document = {
        ...doc as Document,
        id: `DOC-${Date.now()}`,
        createdAt: Date.now(),
      };
      db.addDocument(newDoc);
      return newDoc;
    }

    const res = await fetch(`${API_BASE}/documents/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(convertDocumentToBackend(doc)),
    });
    const data = await res.json();
    return convertDocumentFromBackend(data);
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<Document> {
    if (!this.useApi) {
      const { db } = await import('./localDb');
      db.updateDocument(id, updates);
      const docs = db.getDocuments(updates.caseId || '');
      return docs.find(d => d.id === id)!;
    }

    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(convertDocumentToBackend(updates)),
    });
    const data = await res.json();
    return convertDocumentFromBackend(data);
  }

  async deleteDocument(id: string): Promise<void> {
    if (!this.useApi) {
      const { db } = await import('./localDb');
      db.deleteDocument(id);
      return;
    }

    await fetch(`${API_BASE}/documents/${id}`, { method: 'DELETE' });
  }

  // SETTINGS
  async getSettings(): Promise<AppSettings> {
    if (!this.useApi) {
      const { db } = await import('./localDb');
      return db.getSettings();
    }

    const res = await fetch(`${API_BASE}/settings/`);
    const data = await res.json();
    return {
      riskDays: data.risk_days || data.riskDays || 2,
      firmAlertDays: data.firm_alert_days || data.firmAlertDays || 2,
    };
  }

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    if (!this.useApi) {
      const { db } = await import('./localDb');
      db.updateSettings(settings);
      return db.getSettings();
    }

    const res = await fetch(`${API_BASE}/settings/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    return {
      riskDays: data.risk_days || data.riskDays || 2,
      firmAlertDays: data.firm_alert_days || data.firmAlertDays || 2,
    };
  }

  // BACKUP
  async exportBackup(): Promise<string> {
    if (!this.useApi) {
      const { db } = await import('./localDb');
      return db.exportData();
    }

    const res = await fetch(`${API_BASE}/backup/export`);
    const data = await res.json();
    return JSON.stringify(data);
  }

  async importBackup(jsonData: string): Promise<boolean> {
    if (!this.useApi) {
      const { db } = await import('./localDb');
      return db.importData(jsonData);
    }

    const data = JSON.parse(jsonData);
    const res = await fetch(`${API_BASE}/backup/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.ok;
  }

  // CALCULATE DEADLINE
  async calculateDeadline(startDate: string, unit: string, quantity: number, holidays: Holiday[] = []): Promise<string> {
    if (!this.useApi) {
      const { calculateDeadline } = await import('../utils/dateUtils');
      return calculateDeadline(startDate, unit as any, quantity, holidays);
    }

    const res = await fetch(`${API_BASE}/calculate-deadline/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start_date: startDate,
        unit,
        quantity,
      }),
    });
    const data = await res.json();
    return data.deadline;
  }
}

export const api = new ApiService();
