# PensiónDesk Local

## MVP1 - Sistema de Gestión Pensional

Aplicación local-first, offline, para gestión de casos pensionales con control de términos, biblioteca de prompts y gestión documental.

### Características Principales

- ✅ **CRUD Completo de Casos** con estados y prioridades
- ✅ **Bandeja de Gestión** con filtros, semáforo de términos y resaltado de casos críticos
- ✅ **Detalle de Caso** con tabs: Resumen | Términos | Documentos | Prompts | Checklist | Actividad
- ✅ **Gestión de Términos** con cálculo de días hábiles (excluyendo sábados/domingos/festivos)
- ✅ **Biblioteca de Prompts** parametrizados para LLMs externos
- ✅ **Gestión Documental** con editor, versionado, exportación y conversión a prompts
- ✅ **Reglas de Término** configurables por tipo de requerimiento
- ✅ **Festivos** por año con importación masiva
- ✅ **Backup/Import** completo de datos
- ✅ **100% Offline** - Sin dependencias externas ni APIs

### Modo Browser (Demo - localStorage)

Por defecto, la aplicación funciona en modo "Simulación Local" usando `localStorage` del navegador. No requiere backend.

```bash
npm install
npm run dev
```

Abre `http://localhost:3000` en tu navegador.

### Modo Full Stack (Producción Local - SQLite)

Para usar la arquitectura completa con backend Python y SQLite:

#### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

El backend estará disponible en `http://localhost:8000`

#### 2. Frontend

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_USE_API=true
```

Luego ejecuta:

```bash
npm install
npm run dev
```

El frontend se conectará automáticamente al backend en `localhost:8000`.

### Estructura del Proyecto

```
PensionDesk-Animated/
├── backend/
│   ├── main.py              # FastAPI backend con SQLite
│   └── requirements.txt     # Dependencias Python
├── components/              # Componentes React reutilizables
├── services/
│   ├── api.ts              # Servicio de integración (localStorage/API)
│   └── localDb.ts          # Base de datos localStorage
├── views/                   # Vistas principales
│   ├── Dashboard.tsx        # Bandeja de casos
│   ├── CaseDetail.tsx      # Detalle de caso
│   ├── Settings.tsx         # Configuración y backup
│   └── PromptsLibrary.tsx   # Biblioteca de prompts
├── utils/                   # Utilidades
└── types.ts                # Tipos TypeScript
```

### Funcionalidades Detalladas

#### Casos
- Crear, editar, eliminar casos
- Filtros por estado, búsqueda por texto
- Semáforo de vencimiento (Vencido, Hoy, En Riesgo, Esta Semana, OK)
- Resaltado de casos "PENDIENTE_FIRMA"

#### Términos
- Reglas configurables (días hábiles, calendario, meses)
- Cálculo automático excluyendo fines de semana y festivos
- Confirmación manual de fecha límite

#### Prompts
- Biblioteca de prompts parametrizados
- Variables con tipos (string, text, date, enum)
- Soporte Producción/Auditoría
- Generación y copia al portapapeles

#### Documentos
- Editor de texto completo
- Tipos: Borrador, Final, Parcial
- Versionado automático
- Exportación a TXT/MD
- Conversión de documentos FINAL a Prompts
- Duplicación de documentos

#### Backup
- Exportación completa a JSON
- Importación con reemplazo de datos
- Incluye: casos, prompts, reglas, festivos, documentos, configuración

### Tecnologías

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion
- **Backend**: FastAPI, SQLModel, SQLite
- **Persistencia**: localStorage (modo demo) o SQLite (modo producción)

### Notas

- La aplicación funciona completamente offline
- No requiere conexión a internet ni APIs externas
- Todos los datos se almacenan localmente
- El backup permite migrar datos entre instalaciones

### Desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo frontend
npm run dev

# Build producción
npm run build

# Backend (en otra terminal)
cd backend
uvicorn main:app --reload
```

### Licencia

Uso interno - Sistema Local
