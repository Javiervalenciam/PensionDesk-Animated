"""
Backend simplificado usando JSON en lugar de SQLite
Funciona sin SQLModel/SQLAlchemy
"""
import os
import json
from datetime import date, datetime, timedelta
from typing import List, Optional
from enum import Enum
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# === DOMAIN MODELS ===

class CaseStatus(str, Enum):
    RECIBIDO = "RECIBIDO"
    EN_ANALISIS = "EN_ANALISIS"
    EN_REDACCION = "EN_REDACCION"
    EN_REVISION = "EN_REVISION"
    PENDIENTE_FIRMA = "PENDIENTE_FIRMA"
    RADICADO = "RADICADO"
    CERRADO = "CERRADO"

class Priority(str, Enum):
    ALTA = "ALTA"
    MEDIA = "MEDIA"
    BAJA = "BAJA"

class DeadlineUnit(str, Enum):
    DIAS_HABILES = "DIAS_HABILES"
    DIAS_CALENDARIO = "DIAS_CALENDARIO"
    MESES = "MESES"

class DocType(str, Enum):
    BORRADOR = "BORRADOR"
    FINAL = "FINAL"
    PARCIAL = "PARCIAL"

# Pydantic models for API
class Case(BaseModel):
    id: Optional[int] = None
    municipio: str
    tipo: str
    asunto: str
    fecha_recepcion: str
    estado: CaseStatus = CaseStatus.RECIBIDO
    prioridad: Priority = Priority.MEDIA
    deadline_rule_id: Optional[int] = None
    fecha_limite_propuesta: Optional[str] = None
    fecha_limite_confirmada: Optional[str] = None
    hechos: Optional[str] = None
    peticiones: Optional[str] = None
    anexos_json: str = "[]"
    notas: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class DeadlineRule(BaseModel):
    id: Optional[int] = None
    name: str
    unit: DeadlineUnit
    quantity: int
    anchor: str = "FECHA_RECEPCION"
    notes: Optional[str] = None

class Holiday(BaseModel):
    id: Optional[int] = None
    date: str
    name: str
    year: int

class Prompt(BaseModel):
    id: Optional[int] = None
    name: str
    category: str = "General"
    tags_json: str = "[]"
    template_text: str
    variables_schema_json: str
    version: int = 1
    is_active: bool = True
    type: str = "PRODUCCION"

class Document(BaseModel):
    id: Optional[int] = None
    case_id: int
    doc_type: DocType
    source: str = "MANUAL"
    content_text: str
    version: int = 1
    is_model: bool = False
    title: str
    created_at: Optional[str] = None

class AppSettings(BaseModel):
    id: Optional[int] = None
    risk_days: int = 2
    firm_alert_days: int = 2

# === JSON STORAGE ===

DB_FILE = Path("pensiondesk_data.json")

def load_db():
    if DB_FILE.exists():
        with open(DB_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {
        "cases": [],
        "rules": [],
        "holidays": [],
        "prompts": [],
        "documents": [],
        "settings": {"risk_days": 2, "firm_alert_days": 2},
        "next_id": {"cases": 1, "rules": 1, "holidays": 1, "prompts": 1, "documents": 1}
    }

def save_db(data):
    with open(DB_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False, default=str)

# === DATE UTILITIES ===

def is_weekend(d: date) -> bool:
    return d.weekday() >= 5

def add_business_days(start: date, days: int, holidays: List[date]) -> date:
    holiday_set = set(holidays)
    current = start
    added = 0
    while added < days:
        current += timedelta(days=1)
        if not is_weekend(current) and current not in holiday_set:
            added += 1
    return current

def calculate_deadline_date(start_date: date, unit: DeadlineUnit, quantity: int, holidays: List[date] = []) -> date:
    if unit == DeadlineUnit.DIAS_CALENDARIO:
        return start_date + timedelta(days=quantity)
    elif unit == DeadlineUnit.MESES:
        new_month = start_date.month + quantity
        new_year = start_date.year
        while new_month > 12:
            new_month -= 12
            new_year += 1
        try:
            return date(new_year, new_month, start_date.day)
        except ValueError:
            return date(new_year, new_month, 28)
    elif unit == DeadlineUnit.DIAS_HABILES:
        return add_business_days(start_date, quantity, holidays)
    return start_date

# === API ===

app = FastAPI(title="PensiónDesk Local API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === CASES ===

@app.get("/api/cases/")
def read_cases(status: Optional[CaseStatus] = None, q: Optional[str] = None):
    db = load_db()
    cases = db["cases"]
    if status:
        cases = [c for c in cases if c.get("estado") == status.value]
    if q:
        cases = [c for c in cases if q.lower() in c.get("asunto", "").lower() or q.lower() in c.get("municipio", "").lower()]
    return cases

@app.post("/api/cases/")
def create_case(case_data: dict):
    db = load_db()
    case_data["id"] = db["next_id"]["cases"]
    db["next_id"]["cases"] += 1
    case_data["created_at"] = datetime.now().isoformat()
    case_data["updated_at"] = datetime.now().isoformat()
    db["cases"].append(case_data)
    save_db(db)
    return case_data

@app.get("/api/cases/{case_id}")
def read_case(case_id: int):
    db = load_db()
    case = next((c for c in db["cases"] if c.get("id") == case_id), None)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@app.put("/api/cases/{case_id}")
def update_case(case_id: int, case_data: dict):
    db = load_db()
    case = next((c for c in db["cases"] if c.get("id") == case_id), None)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    case_data["id"] = case_id
    case_data["updated_at"] = datetime.now().isoformat()
    case.update(case_data)
    save_db(db)
    return case

@app.delete("/api/cases/{case_id}")
def delete_case(case_id: int):
    db = load_db()
    db["cases"] = [c for c in db["cases"] if c.get("id") != case_id]
    save_db(db)
    return {"ok": True}

# === RULES ===

@app.get("/api/rules/")
def read_rules():
    db = load_db()
    return db["rules"]

@app.post("/api/rules/")
def create_rule(rule_data: dict):
    db = load_db()
    rule_data["id"] = db["next_id"]["rules"]
    db["next_id"]["rules"] += 1
    db["rules"].append(rule_data)
    save_db(db)
    return rule_data

@app.put("/api/rules/{rule_id}")
def update_rule(rule_id: int, rule_data: dict):
    db = load_db()
    rule = next((r for r in db["rules"] if r.get("id") == rule_id), None)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    rule_data["id"] = rule_id
    rule.update(rule_data)
    save_db(db)
    return rule

@app.delete("/api/rules/{rule_id}")
def delete_rule(rule_id: int):
    db = load_db()
    db["rules"] = [r for r in db["rules"] if r.get("id") != rule_id]
    save_db(db)
    return {"ok": True}

# === HOLIDAYS ===

@app.get("/api/holidays/")
def read_holidays(year: Optional[int] = None):
    db = load_db()
    holidays = db["holidays"]
    if year:
        holidays = [h for h in holidays if h.get("year") == year]
    return holidays

@app.post("/api/holidays/")
def create_holiday(holiday_data: dict):
    db = load_db()
    holiday_data["id"] = db["next_id"]["holidays"]
    db["next_id"]["holidays"] += 1
    db["holidays"].append(holiday_data)
    save_db(db)
    return holiday_data

@app.post("/api/holidays/bulk")
def create_holidays_bulk(holidays_data: List[dict]):
    db = load_db()
    for h_data in holidays_data:
        h_data["id"] = db["next_id"]["holidays"]
        db["next_id"]["holidays"] += 1
        db["holidays"].append(h_data)
    save_db(db)
    return holidays_data

@app.delete("/api/holidays/{holiday_id}")
def delete_holiday(holiday_id: int):
    db = load_db()
    db["holidays"] = [h for h in db["holidays"] if h.get("id") != holiday_id]
    save_db(db)
    return {"ok": True}

# === PROMPTS ===

@app.get("/api/prompts/")
def read_prompts(active_only: bool = False, type: Optional[str] = None):
    db = load_db()
    prompts = db["prompts"]
    if active_only:
        prompts = [p for p in prompts if p.get("is_active", True)]
    if type:
        prompts = [p for p in prompts if p.get("type") == type]
    return prompts

@app.post("/api/prompts/")
def create_prompt(prompt_data: dict):
    db = load_db()
    prompt_data["id"] = db["next_id"]["prompts"]
    db["next_id"]["prompts"] += 1
    db["prompts"].append(prompt_data)
    save_db(db)
    return prompt_data

@app.put("/api/prompts/{prompt_id}")
def update_prompt(prompt_id: int, prompt_data: dict):
    db = load_db()
    prompt = next((p for p in db["prompts"] if p.get("id") == prompt_id), None)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    prompt_data["id"] = prompt_id
    prompt.update(prompt_data)
    save_db(db)
    return prompt

@app.delete("/api/prompts/{prompt_id}")
def delete_prompt(prompt_id: int):
    db = load_db()
    db["prompts"] = [p for p in db["prompts"] if p.get("id") != prompt_id]
    save_db(db)
    return {"ok": True}

# === DOCUMENTS ===

@app.get("/api/documents/")
def read_documents(case_id: Optional[int] = None):
    db = load_db()
    documents = db["documents"]
    if case_id:
        documents = [d for d in documents if d.get("case_id") == case_id]
    return documents

@app.post("/api/documents/")
def create_document(doc_data: dict):
    db = load_db()
    doc_data["id"] = db["next_id"]["documents"]
    db["next_id"]["documents"] += 1
    doc_data["created_at"] = datetime.now().isoformat()
    db["documents"].append(doc_data)
    save_db(db)
    return doc_data

@app.put("/api/documents/{doc_id}")
def update_document(doc_id: int, doc_data: dict):
    db = load_db()
    doc = next((d for d in db["documents"] if d.get("id") == doc_id), None)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc_data["id"] = doc_id
    doc.update(doc_data)
    save_db(db)
    return doc

@app.delete("/api/documents/{doc_id}")
def delete_document(doc_id: int):
    db = load_db()
    db["documents"] = [d for d in db["documents"] if d.get("id") != doc_id]
    save_db(db)
    return {"ok": True}

# === CALCULATE DEADLINE ===

@app.post("/api/calculate-deadline/")
def calculate_deadline_endpoint(data: dict):
    start_date = datetime.fromisoformat(data["start_date"]).date()
    unit = DeadlineUnit(data["unit"])
    quantity = data["quantity"]
    
    db = load_db()
    year = start_date.year
    holidays = [datetime.fromisoformat(h["date"]).date() for h in db["holidays"] if h.get("year") == year]
    
    result_date = calculate_deadline_date(start_date, unit, quantity, holidays)
    return {"deadline": result_date.isoformat()}

# === SETTINGS ===

@app.get("/api/settings/")
def read_settings():
    db = load_db()
    return db["settings"]

@app.put("/api/settings/")
def update_settings(settings_data: dict):
    db = load_db()
    db["settings"].update(settings_data)
    save_db(db)
    return db["settings"]

# === BACKUP ===

@app.get("/api/backup/export")
def export_backup():
    return load_db()

@app.post("/api/backup/import")
def import_backup(data: dict):
    save_db(data)
    return {"ok": True, "imported": len(data.get("cases", []))}

@app.get("/")
def root():
    return {"message": "PensiónDesk Local API", "version": "1.0", "storage": "JSON"}
