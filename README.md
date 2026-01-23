# PensiónDesk Local

## MVP1 - Sistema de Gestión Pensional

### Modo Browser (Demo)
Esta aplicación corre por defecto en modo "Simulación Local" dentro del navegador. Usa `localStorage` para persistir datos. No requiere instalación de backend para probar la UI.

### Modo Full Stack (Producción Local)
Para ejecutar la arquitectura real con Python y SQLite:

1. **Backend:**
   ```bash
   cd backend
   pip install fastapi uvicorn sqlmodel
   uvicorn main:app --reload
   ```

2. **Frontend:**
   Configurar variable de entorno `VITE_USE_API=true` para conectar con localhost:8000.

### Backup
Ve a Configuración -> Backup para descargar tu base de datos JSON completa.
