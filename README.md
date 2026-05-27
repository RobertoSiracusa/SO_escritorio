# SimulOS — Sistema Operativo de Escritorio Simulado

Sistema operativo de escritorio simulado desarrollado con **HTML**, **CSS**, **JavaScript** y **Electron**. Replica la experiencia de un entorno de escritorio completo con gestor de ventanas estilo macOS, aplicaciones integradas, juegos y monitoreo de recursos del sistema en tiempo real.

![Electron](https://img.shields.io/badge/Electron-31-47848F?logo=electron&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-blue)

## Características

### Escritorio y Gestor de Ventanas
- Gestor de ventanas estilo **macOS** (arrastrar, redimensionar, minimizar, maximizar, cerrar)
- **Dock** inferior con animaciones hover e indicadores de apps activas
- **Barra de menú** superior con menú Apple, reloj y bandeja del sistema (CPU/RAM)
- **Menú contextual** (clic derecho) para crear carpetas, cambiar fondo, abrir terminal
- **Iconos de escritorio** arrastrables con posición persistente
- **10 fondos de pantalla** intercambiables desde configuración o clic derecho

### Sistema
- **Monitor del Sistema** — gráficos en tiempo real de CPU, RAM, GPU y tabla de procesos
- **Detección de dispositivos** — entrada (teclado, mouse), salida (audio, pantallas), red, USB, almacenamiento
- **Inicio de sesión** — pantalla de login con selección de usuario y contraseña
- **Cambio de usuarios** — múltiples usuarios con configuración independiente
- **Fecha y hora** — reloj en pantalla de login y barra de menú

### Aplicaciones
| App | Descripción |
|-----|-------------|
| 📁 **Gestor de Archivos** | Navegación, crear carpetas/archivos, importar, abrir por tipo |
| 🌐 **Navegador Web** | Navegador completo con webview, barra de URL, historial |
| ⬛ **Terminal** | 20+ comandos personalizados (ls, cd, mkdir, cat, neofetch, sysinfo, etc.) |
| 🧮 **Calculadora** | Estilo macOS con operaciones básicas |
| 📝 **Bloc de Notas** | Editor de texto con guardar/abrir en sistema de archivos virtual |
| 🖼️ **Galería** | Visor de imágenes con grid de miniaturas e importación |
| 🎬 **Reproductor de Video** | Reproductor con controles e importación de archivos |
| 🔌 **Dispositivos** | Detección de dispositivos de entrada y salida del sistema |
| 🛡️ **Antivirus** | Escáner simulado con progreso, log y detección de amenazas ficticias |
| ⚙️ **Preferencias** | Cambiar fondo de pantalla, gestionar usuarios |

### Juegos
| Juego | Descripción |
|-------|-------------|
| 🏓 **Pong** | 2 jugadores (W/S y ↑/↓) |
| 💣 **Buscaminas** | 10x10 con 15 minas, banderas con clic derecho |
| 🐍 **Snake** | Controles con flechas o WASD, velocidad progresiva |

### Terminal — Comandos Disponibles
```
help, clear, ls, cd, mkdir, touch, cat, echo, write, rm, pwd,
whoami, date, sysinfo, cpuinfo, meminfo, processes, neofetch,
calc, history, exit
```

## Requisitos

- **Node.js** 18+
- **npm** 8+

## Instalación y Ejecución

```bash
# Clonar repositorio
git clone <url-del-repo>
cd SO_escritorio

# Instalar dependencias
npm install

# Ejecutar
npm start
```

## Credenciales por Defecto

| Usuario | Contraseña |
|---------|------------|
| `admin` | `admin` |
| `guest` | *(sin contraseña)* |

Se pueden crear usuarios adicionales desde **Preferencias del Sistema > Usuarios**.

## Estructura del Proyecto

```
SO_escritorio/
├── main.js                  # Proceso principal de Electron
├── preload.js               # Context bridge (IPC)
├── package.json
└── src/
    ├── index.html           # HTML principal
    ├── css/
    │   ├── main.css         # Estilos base
    │   ├── login.css        # Pantalla de login
    │   ├── desktop.css      # Escritorio y menú contextual
    │   ├── taskbar.css      # Barra superior y dock
    │   ├── windows.css      # Gestor de ventanas
    │   └── apps.css         # Estilos de todas las apps
    └── js/
        ├── windowManager.js # Gestor de ventanas (drag/resize/z-order)
        ├── login.js         # Autenticación y cambio de usuario
        ├── desktop.js       # Iconos, wallpaper, menú contextual
        ├── taskbar.js       # Menú, reloj, bandeja del sistema
        └── apps/
            ├── filemanager.js
            ├── browser.js
            ├── terminal.js
            ├── calculator.js
            ├── notepad.js
            ├── gallery.js
            ├── videoplayer.js
            ├── sysmonitor.js
            ├── devices.js
            ├── antivirus.js
            ├── pong.js
            ├── minesweeper.js
            ├── snake.js
            └── settings.js
```

## Tecnologías

- **Electron** — Framework de aplicación de escritorio
- **systeminformation** — Lectura de recursos nativos (CPU, RAM, GPU, dispositivos)
- **HTML/CSS/JS** puro — Sin frameworks frontend

## Autor

Roberto Siracusa — 2026
