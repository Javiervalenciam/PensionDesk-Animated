import os
from datetime import date, datetime
from typing import List, Optional, Literal
from enum import Enum
import json

from fastapi import FastAPI, HTTPException, Query
from sqlmodel import Field, Session, SQLModel, create_engine, select
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

class Prompt(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    template_text: str
    variables_schema_json: str
    is_active: bool = True

# === DATABASE SETUP ===

sqlite_file_name = "pensiondesk.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"
engine = create_engine(sqlite_url)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

# === API ===

app = FastAPI(title="PensiónDesk Local API")

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/cases/", response_model=List[Case])
def read_cases(status: Optional[CaseStatus] = None, q: Optional[str] = None):
    with Session(engine) as session:
        statement = select(Case)
        if status:
            statement = statement.where(Case.estado == status)
        if q:
            statement = statement.where(Case.asunto.contains(q))
        results = session.exec(statement)
        return results.all()

@app.post("/cases/", response_model=Case)
def create_case(case: Case):
    with Session(engine) as session:
        session.add(case)
        session.commit()
        session.refresh(case)
        return case

@app.get("/cases/{case_id}", response_model=Case)
def read_case(case_id: int):
    with Session(engine) as session:
        case = session.get(Case, case_id)
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        return case

@app.put("/cases/{case_id}", response_model=Case)
def update_case(case_id: int, case: Case):
    with Session(engine) as session:
        db_case = session.get(Case, case_id)
        if not db_case:
            raise HTTPException(status_code=404, detail="Case not found")
        case_data = case.dict(exclude_unset=True)
        for key, value in case_data.items():
            setattr(db_case, key, value)
        db_case.updated_at = datetime.now()
        session.add(db_case)
        session.commit()
        session.refresh(db_case)
        return db_case

# === DATE LOGIC (Simple Implementation) ===
# In a real file this would be in services/dates.py

@app.post("/calculate-deadline/")
def calculate_deadline(start_date: date, quantity: int, unit: DeadlineUnit):
    # This is a simplified version. Real version includes holidays.
    from datetime import timedelta
    
    if unit == DeadlineUnit.DIAS_CALENDARIO:
        return start_date + timedelta(days=quantity)
    # ... other logic
    return start_date

