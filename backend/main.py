import os
from datetime import date, datetime, timedelta
from typing import List, Optional, Literal
from enum import Enum
import json

from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Field, Session, SQLModel, create_engine, select, Relationship
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

class Case(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    municipio: str
    tipo: str
    asunto: str
    fecha_recepcion: date
    estado: CaseStatus = CaseStatus.RECIBIDO
    prioridad: Priority = Priority.MEDIA
    
    # Terms
    deadline_rule_id: Optional[int] = None
    fecha_limite_propuesta: Optional[date] = None
    fecha_limite_confirmada: Optional[date] = None
    
    # Content
    hechos: Optional[str] = None
    peticiones: Optional[str] = None
    anexos_json: str = "[]"
    notas: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

class DeadlineRule(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    unit: DeadlineUnit
    quantity: int
    anchor: str = "FECHA_RECEPCION"
    notes: Optional[str] = None

class Holiday(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    date: date
    name: str
    year: int

class Prompt(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    category: str = "General"
    tags_json: str = "[]"
    template_text: str
    variables_schema_json: str
    version: int = 1
    is_active: bool = True
    type: str = "PRODUCCION"  # PRODUCCION | AUDITORIA

class Document(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    case_id: int
    doc_type: DocType
    source: str = "MANUAL"  # LLM | MANUAL
    content_text: str
    version: int = 1
    is_model: bool = False
    title: str
    created_at: datetime = Field(default_factory=datetime.now)

class AppSettings(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    risk_days: int = 2
    firm_alert_days: int = 2

# === DATABASE SETUP ===

sqlite_file_name = "pensiondesk.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"
engine = create_engine(sqlite_url, echo=False)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    # Seed default settings if not exists
    with Session(engine) as session:
        existing = session.exec(select(AppSettings)).first()
        if not existing:
            session.add(AppSettings())
            session.commit()

# === DATE UTILITIES ===

def is_weekend(d: date) -> bool:
    return d.weekday() >= 5  # Saturday = 5, Sunday = 6

def add_business_days(start: date, days: int, holidays: List[date]) -> date:
    """Add business days excluding weekends and holidays"""
    holiday_set = set(holidays)
    current = start
    added = 0
    
    while added < days:
        current += timedelta(days=1)
        if not is_weekend(current) and current not in holiday_set:
            added += 1
    
    return current

def calculate_deadline_date(
    start_date: date,
    unit: DeadlineUnit,
    quantity: int,
    holidays: List[date] = []
) -> date:
    """Calculate deadline based on unit"""
    if unit == DeadlineUnit.DIAS_CALENDARIO:
        return start_date + timedelta(days=quantity)
    elif unit == DeadlineUnit.MESES:
        # Simple month addition
        new_month = start_date.month + quantity
        new_year = start_date.year
        while new_month > 12:
            new_month -= 12
            new_year += 1
        try:
            return date(new_year, new_month, start_date.day)
        except ValueError:
            # Handle month end edge cases
            return date(new_year, new_month, 28)
    elif unit == DeadlineUnit.DIAS_HABILES:
        return add_business_days(start_date, quantity, holidays)
    return start_date

# === API ===

app = FastAPI(title="PensiónDesk Local API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# === CASES ENDPOINTS ===

@app.get("/api/cases/")
def read_cases(
    status: Optional[CaseStatus] = None,
    q: Optional[str] = None
):
    with Session(engine) as session:
        statement = select(Case)
        if status:
            statement = statement.where(Case.estado == status)
        if q:
            statement = statement.where(
                Case.asunto.contains(q) |
                Case.municipio.contains(q) |
                Case.tipo.contains(q)
            )
        results = session.exec(statement.order_by(Case.created_at.desc()))
        return [case.dict() for case in results.all()]

@app.post("/api/cases/")
def create_case(case_data: dict):
    with Session(engine) as session:
        # Convert string dates to date objects
        if 'fecha_recepcion' in case_data and isinstance(case_data['fecha_recepcion'], str):
            case_data['fecha_recepcion'] = datetime.fromisoformat(case_data['fecha_recepcion']).date()
        if 'fecha_limite_propuesta' in case_data and isinstance(case_data['fecha_limite_propuesta'], str):
            case_data['fecha_limite_propuesta'] = datetime.fromisoformat(case_data['fecha_limite_propuesta']).date() if case_data['fecha_limite_propuesta'] else None
        if 'fecha_limite_confirmada' in case_data and isinstance(case_data['fecha_limite_confirmada'], str):
            case_data['fecha_limite_confirmada'] = datetime.fromisoformat(case_data['fecha_limite_confirmada']).date() if case_data['fecha_limite_confirmada'] else None
        
        case = Case(**case_data)
        session.add(case)
        session.commit()
        session.refresh(case)
        return case.dict()

@app.get("/api/cases/{case_id}")
def read_case(case_id: int):
    with Session(engine) as session:
        case = session.get(Case, case_id)
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        return case.dict()

@app.put("/api/cases/{case_id}")
def update_case(case_id: int, case_data: dict):
    with Session(engine) as session:
        db_case = session.get(Case, case_id)
        if not db_case:
            raise HTTPException(status_code=404, detail="Case not found")
        
        # Convert string dates
        for key in ['fecha_recepcion', 'fecha_limite_propuesta', 'fecha_limite_confirmada']:
            if key in case_data and isinstance(case_data[key], str) and case_data[key]:
                case_data[key] = datetime.fromisoformat(case_data[key]).date()
            elif key in case_data and not case_data[key]:
                case_data[key] = None
        
        for key, value in case_data.items():
            if hasattr(db_case, key):
                setattr(db_case, key, value)
        
        db_case.updated_at = datetime.now()
        session.add(db_case)
        session.commit()
        session.refresh(db_case)
        return db_case.dict()

@app.delete("/api/cases/{case_id}")
def delete_case(case_id: int):
    with Session(engine) as session:
        case = session.get(Case, case_id)
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        session.delete(case)
        session.commit()
        return {"ok": True}

# === DEADLINE RULES ENDPOINTS ===

@app.get("/api/rules/")
def read_rules():
    with Session(engine) as session:
        rules = session.exec(select(DeadlineRule).order_by(DeadlineRule.name))
        return [rule.dict() for rule in rules.all()]

@app.post("/api/rules/")
def create_rule(rule_data: dict):
    with Session(engine) as session:
        rule = DeadlineRule(**rule_data)
        session.add(rule)
        session.commit()
        session.refresh(rule)
        return rule.dict()

@app.put("/api/rules/{rule_id}")
def update_rule(rule_id: int, rule_data: dict):
    with Session(engine) as session:
        db_rule = session.get(DeadlineRule, rule_id)
        if not db_rule:
            raise HTTPException(status_code=404, detail="Rule not found")
        for key, value in rule_data.items():
            if hasattr(db_rule, key):
                setattr(db_rule, key, value)
        session.add(db_rule)
        session.commit()
        session.refresh(db_rule)
        return db_rule.dict()

@app.delete("/api/rules/{rule_id}")
def delete_rule(rule_id: int):
    with Session(engine) as session:
        rule = session.get(DeadlineRule, rule_id)
        if not rule:
            raise HTTPException(status_code=404, detail="Rule not found")
        session.delete(rule)
        session.commit()
        return {"ok": True}

# === HOLIDAYS ENDPOINTS ===

@app.get("/api/holidays/")
def read_holidays(year: Optional[int] = None):
    with Session(engine) as session:
        statement = select(Holiday)
        if year:
            statement = statement.where(Holiday.year == year)
        holidays = session.exec(statement.order_by(Holiday.date))
        return [h.dict() for h in holidays.all()]

@app.post("/api/holidays/")
def create_holiday(holiday_data: dict):
    with Session(engine) as session:
        if 'date' in holiday_data and isinstance(holiday_data['date'], str):
            holiday_data['date'] = datetime.fromisoformat(holiday_data['date']).date()
        holiday = Holiday(**holiday_data)
        session.add(holiday)
        session.commit()
        session.refresh(holiday)
        return holiday.dict()

@app.post("/api/holidays/bulk")
def create_holidays_bulk(holidays_data: List[dict]):
    with Session(engine) as session:
        created = []
        for h_data in holidays_data:
            if 'date' in h_data and isinstance(h_data['date'], str):
                h_data['date'] = datetime.fromisoformat(h_data['date']).date()
            holiday = Holiday(**h_data)
            session.add(holiday)
            created.append(holiday)
        session.commit()
        for h in created:
            session.refresh(h)
        return [h.dict() for h in created]

@app.delete("/api/holidays/{holiday_id}")
def delete_holiday(holiday_id: int):
    with Session(engine) as session:
        holiday = session.get(Holiday, holiday_id)
        if not holiday:
            raise HTTPException(status_code=404, detail="Holiday not found")
        session.delete(holiday)
        session.commit()
        return {"ok": True}

# === PROMPTS ENDPOINTS ===

@app.get("/api/prompts/")
def read_prompts(active_only: bool = False, type: Optional[str] = None):
    with Session(engine) as session:
        statement = select(Prompt)
        if active_only:
            statement = statement.where(Prompt.is_active == True)
        if type:
            statement = statement.where(Prompt.type == type)
        prompts = session.exec(statement.order_by(Prompt.name))
        return [p.dict() for p in prompts.all()]

@app.post("/api/prompts/")
def create_prompt(prompt_data: dict):
    with Session(engine) as session:
        prompt = Prompt(**prompt_data)
        session.add(prompt)
        session.commit()
        session.refresh(prompt)
        return prompt.dict()

@app.put("/api/prompts/{prompt_id}")
def update_prompt(prompt_id: int, prompt_data: dict):
    with Session(engine) as session:
        db_prompt = session.get(Prompt, prompt_id)
        if not db_prompt:
            raise HTTPException(status_code=404, detail="Prompt not found")
        for key, value in prompt_data.items():
            if hasattr(db_prompt, key):
                setattr(db_prompt, key, value)
        session.add(db_prompt)
        session.commit()
        session.refresh(db_prompt)
        return db_prompt.dict()

@app.delete("/api/prompts/{prompt_id}")
def delete_prompt(prompt_id: int):
    with Session(engine) as session:
        prompt = session.get(Prompt, prompt_id)
        if not prompt:
            raise HTTPException(status_code=404, detail="Prompt not found")
        session.delete(prompt)
        session.commit()
        return {"ok": True}

# === DOCUMENTS ENDPOINTS ===

@app.get("/api/documents/")
def read_documents(case_id: Optional[int] = None):
    with Session(engine) as session:
        statement = select(Document)
        if case_id:
            statement = statement.where(Document.case_id == case_id)
        documents = session.exec(statement.order_by(Document.created_at.desc()))
        return [d.dict() for d in documents.all()]

@app.post("/api/documents/")
def create_document(doc_data: dict):
    with Session(engine) as session:
        doc = Document(**doc_data)
        session.add(doc)
        session.commit()
        session.refresh(doc)
        return doc.dict()

@app.put("/api/documents/{doc_id}")
def update_document(doc_id: int, doc_data: dict):
    with Session(engine) as session:
        db_doc = session.get(Document, doc_id)
        if not db_doc:
            raise HTTPException(status_code=404, detail="Document not found")
        for key, value in doc_data.items():
            if hasattr(db_doc, key):
                setattr(db_doc, key, value)
        session.add(db_doc)
        session.commit()
        session.refresh(db_doc)
        return db_doc.dict()

@app.delete("/api/documents/{doc_id}")
def delete_document(doc_id: int):
    with Session(engine) as session:
        doc = session.get(Document, doc_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        session.delete(doc)
        session.commit()
        return {"ok": True}

# === CALCULATE DEADLINE ===

@app.post("/api/calculate-deadline/")
def calculate_deadline_endpoint(data: dict):
    """Calculate deadline with holidays"""
    start_date_str = data.get('start_date')
    unit = DeadlineUnit(data.get('unit'))
    quantity = data.get('quantity')
    
    if isinstance(start_date_str, str):
        start_date = datetime.fromisoformat(start_date_str).date()
    else:
        start_date = start_date_str
    
    # Get holidays for the year
    year = start_date.year
    with Session(engine) as session:
        holidays = session.exec(
            select(Holiday).where(Holiday.year == year)
        ).all()
        holiday_dates = [h.date for h in holidays]
    
    result_date = calculate_deadline_date(start_date, unit, quantity, holiday_dates)
    return {"deadline": result_date.isoformat()}

# === SETTINGS ENDPOINTS ===

@app.get("/api/settings/")
def read_settings():
    with Session(engine) as session:
        settings = session.exec(select(AppSettings)).first()
        if not settings:
            settings = AppSettings()
            session.add(settings)
            session.commit()
            session.refresh(settings)
        return settings.dict()

@app.put("/api/settings/")
def update_settings(settings_data: dict):
    with Session(engine) as session:
        settings = session.exec(select(AppSettings)).first()
        if not settings:
            settings = AppSettings()
        for key, value in settings_data.items():
            if hasattr(settings, key):
                setattr(settings, key, value)
        session.add(settings)
        session.commit()
        session.refresh(settings)
        return settings.dict()

# === BACKUP ENDPOINTS ===

@app.get("/api/backup/export")
def export_backup():
    """Export all data as JSON"""
    with Session(engine) as session:
        data = {
            "cases": [c.dict() for c in session.exec(select(Case)).all()],
            "rules": [r.dict() for r in session.exec(select(DeadlineRule)).all()],
            "holidays": [h.dict() for h in session.exec(select(Holiday)).all()],
            "prompts": [p.dict() for p in session.exec(select(Prompt)).all()],
            "documents": [d.dict() for d in session.exec(select(Document)).all()],
            "settings": session.exec(select(AppSettings)).first().dict() if session.exec(select(AppSettings)).first() else {}
        }
        # Convert dates to strings
        def convert_dates(obj):
            if isinstance(obj, dict):
                return {k: convert_dates(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_dates(item) for item in obj]
            elif isinstance(obj, (date, datetime)):
                return obj.isoformat()
            return obj
        return convert_dates(data)

@app.post("/api/backup/import")
def import_backup(data: dict):
    """Import data from JSON"""
    with Session(engine) as session:
        # Clear existing data
        session.exec(select(Case)).all()
        session.exec(select(DeadlineRule)).all()
        session.exec(select(Holiday)).all()
        session.exec(select(Prompt)).all()
        session.exec(select(Document)).all()
        
        # Import cases
        for c_data in data.get('cases', []):
            if 'fecha_recepcion' in c_data and isinstance(c_data['fecha_recepcion'], str):
                c_data['fecha_recepcion'] = datetime.fromisoformat(c_data['fecha_recepcion']).date()
            if 'fecha_limite_propuesta' in c_data and c_data['fecha_limite_propuesta']:
                c_data['fecha_limite_propuesta'] = datetime.fromisoformat(c_data['fecha_limite_propuesta']).date()
            if 'fecha_limite_confirmada' in c_data and c_data['fecha_limite_confirmada']:
                c_data['fecha_limite_confirmada'] = datetime.fromisoformat(c_data['fecha_limite_confirmada']).date()
            if 'created_at' in c_data and isinstance(c_data['created_at'], str):
                c_data['created_at'] = datetime.fromisoformat(c_data['created_at'])
            if 'updated_at' in c_data and isinstance(c_data['updated_at'], str):
                c_data['updated_at'] = datetime.fromisoformat(c_data['updated_at'])
            c_data.pop('id', None)  # Remove ID to create new
            case = Case(**c_data)
            session.add(case)
        
        # Import rules
        for r_data in data.get('rules', []):
            r_data.pop('id', None)
            rule = DeadlineRule(**r_data)
            session.add(rule)
        
        # Import holidays
        for h_data in data.get('holidays', []):
            if 'date' in h_data and isinstance(h_data['date'], str):
                h_data['date'] = datetime.fromisoformat(h_data['date']).date()
            h_data.pop('id', None)
            holiday = Holiday(**h_data)
            session.add(holiday)
        
        # Import prompts
        for p_data in data.get('prompts', []):
            p_data.pop('id', None)
            prompt = Prompt(**p_data)
            session.add(prompt)
        
        # Import documents
        for d_data in data.get('documents', []):
            if 'created_at' in d_data and isinstance(d_data['created_at'], str):
                d_data['created_at'] = datetime.fromisoformat(d_data['created_at'])
            d_data.pop('id', None)
            doc = Document(**d_data)
            session.add(doc)
        
        # Import settings
        if 'settings' in data and data['settings']:
            settings = session.exec(select(AppSettings)).first()
            if not settings:
                settings = AppSettings()
            for key, value in data['settings'].items():
                if hasattr(settings, key):
                    setattr(settings, key, value)
            session.add(settings)
        
        session.commit()
        return {"ok": True, "imported": len(data.get('cases', []))}

@app.get("/")
def root():
    return {"message": "PensiónDesk Local API", "version": "1.0"}
