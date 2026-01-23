export enum CaseStatus {
  RECIBIDO = "RECIBIDO",
  EN_ANALISIS = "EN_ANALISIS",
  EN_REDACCION = "EN_REDACCION",
  EN_REVISION = "EN_REVISION",
  PENDIENTE_FIRMA = "PENDIENTE_FIRMA",
  RADICADO = "RADICADO",
  CERRADO = "CERRADO"
}

export enum DeadlineStatus {
  VENCIDO = "VENCIDO",
  HOY = "HOY",
  EN_RIESGO = "EN_RIESGO",
  ESTA_SEMANA = "ESTA_SEMANA",
  OK = "OK"
}

export interface Case {
  id: string;
  municipio: string;
  tipo: string;
  asunto: string;
  fechaRecepcion: string;
  estado: CaseStatus;
  fechaLimite: string;
  deadlineStatus: DeadlineStatus;
}

export interface NavItem {
  label: string;
  href: string;
  isActive?: boolean;
}