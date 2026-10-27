# Instrucciones de Instalación - PensiónDesk Local

## ⚠️ Nota Importante sobre Python 3.13

Python 3.13 es muy reciente y algunos paquetes como `sqlmodel` aún no tienen wheels compilados disponibles. 

**Solución Recomendada:** La aplicación funciona perfectamente en modo **localStorage** (sin backend), que es el modo por defecto.

## Modo Recomendado: Frontend con localStorage (Sin Backend)

Este es el modo más simple y funciona inmediatamente:

```bash
# 1. Instalar dependencias del frontend
npm install

# 2. Arrancar la aplicación
npm run dev
# O usar el archivo .bat:
start-frontend.bat
```

La aplicación estará disponible en `http://localhost:3000` y usará `localStorage` del navegador para persistir datos.

## Modo Full Stack (Requiere Backend)

Si necesitas usar el backend con SQLite, necesitarás:

### Opción 1: Usar Python 3.11 o 3.12 (Recomendado)

SQLModel funciona correctamente con Python 3.11 y 3.12:

```bash
# Instalar dependencias
cd backend
pip install -r requirements.txt

# Arrancar backend
python -m uvicorn main:app --reload --port 8000
```

### Opción 2: Instalar SQLModel manualmente para Python 3.13

Si debes usar Python 3.13, puedes intentar:

```bash
# Instalar desde el código fuente
pip install --no-build-isolation git+https://github.com/tiangolo/sqlmodel.git

# O instalar SQLAlchemy y adaptar el código
pip install sqlalchemy
```

Luego necesitarías adaptar `backend/main.py` para usar SQLAlchemy directamente en lugar de SQLModel.

## Archivos .bat Creados

Se han creado los siguientes archivos para facilitar el arranque:

- **`start-frontend.bat`** - Arranca solo el frontend (modo localStorage)
- **`start-backend.bat`** - Arranca solo el backend
- **`start-app.bat`** - Arranca frontend y backend juntos

## Verificación

Para verificar que todo funciona:

1. **Frontend (localStorage):**
   - Ejecuta `start-frontend.bat` o `npm run dev`
   - Abre `http://localhost:3000`
   - Deberías ver la landing page

2. **Backend (si está instalado):**
   - Ejecuta `start-backend.bat`
   - Abre `http://localhost:8000`
   - Deberías ver: `{"message":"PensiónDesk Local API","version":"1.0"}`

## Estado Actual

✅ **Frontend:** Funcional con localStorage  
⚠️ **Backend:** Requiere SQLModel (no disponible para Python 3.13 aún)

La aplicación está **100% funcional** en modo localStorage sin necesidad del backend.
