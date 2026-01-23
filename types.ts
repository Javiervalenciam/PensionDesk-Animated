export enum CaseStatus {
  RECIBIDO = "RECIBIDO",
  EN_ANALISIS = "EN_ANALISIS",
  EN_REDACCION = "EN_REDACCION",
  EN_REVISION = "EN_REVISION",
  PENDIENTE_FIRMA = "PENDIENTE_FIRMA",
  RADICADO = "RADICADO",
  CERRADO = "CERRADO"
}

export enum Priority {
  ALTA = "ALTA",
  MEDIA = "MEDIA",
  BAJA = "BAJA"
}

export enum DeadlineUnit {
  DIAS_HABILES = "DIAS_HABILES",
  DIAS_CALENDARIO = "DIAS_CALENDARIO",
  MESES = "MESES"
}

export enum DeadlineStatus {
  VENCIDO = "VENCIDO",
  HOY = "HOY",
  EN_RIESGO = "EN_RIESGO",
  ESTA_SEMANA = "ESTA_SEMANA",
  OK = "OK"
}

export enum DocType {
  BORRADOR = "BORRADOR",
  FINAL = "FINAL",
  PARCIAL = "PARCIAL"
}

export interface Holiday {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  year: number;
}

export interface DeadlineRule {
  id: string;
  name: string;
  unit: DeadlineUnit;
  quantity: number;
  anchor: string; // "FECHA_RECEPCION"
  notes?: string;
}

export interface Case {
  id: string;
  municipio: string;
  tipo: string; // Request Type
  asunto: string;
  fechaRecepcion: string;
  estado: CaseStatus;
  prioridad: Priority;
  
  // Terms
  deadlineRuleId?: string;
  fechaLimitePropuesta?: string;
  fechaLimiteConfirmada?: string;
  
  // Content
  hechos: string;
  peticiones: string;
  anexosJson: string; // JSON string of string[]
  notas: string;
  
  createdAt: number;
  updatedAt: number;
}

export interface PromptVariable {
  key: string;
  label: string;
  type: 'string' | 'text' | 'date' | 'enum';
  options?: string[]; // for enum
}

export interface Prompt {
  id: string;
  name: string;
  category: string;
  tagsJson: string;
  templateText: string;
  variablesSchemaJson: string; // JSON of PromptVariable[]
  version: number;
  isActive: boolean;
  type: 'PRODUCCION' | 'AUDITORIA';
}

export interface Document {
  id: string;
  caseId: string;
  docType: DocType;
  source: 'LLM' | 'MANUAL';
  contentText: string;
  version: number;
  isModel?: boolean;
  createdAt: number;
  title: string;
}

export interface AppSettings {
  riskDays: number;
  firmAlertDays: number;
}
