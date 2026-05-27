const TerminalApp = {
  open() {
    const win = wm.createWindow('terminal', 'Terminal', '⬛', { width: 700, height: 450 });
    const fs = {
      currentDir: '/',
      history: [],
      commandHistory: [],
      historyIndex: -1
    };

    win.body.innerHTML = `
      <div class="terminal-app">
        <div class="terminal-output"></div>
        <div class="terminal-input-line">
          <span class="terminal-prompt">${LoginManager.currentUser?.username || 'user'}@simulos:~$ </span>
          <input class="terminal-input" autofocus spellcheck="false">
        </div>
      </div>
    `;

    const output = win.body.querySelector('.terminal-output');
    const input = win.body.querySelector('.terminal-input');
    const prompt = win.body.querySelector('.terminal-prompt');

    const print = (text, color = '#0f0') => {
      const line = document.createElement('div');
      line.style.color = color;
      line.textContent = text;
      output.appendChild(line);
      win.body.querySelector('.terminal-app').scrollTop = win.body.querySelector('.terminal-app').scrollHeight;
    };

    const printHTML = (html) => {
      const line = document.createElement('div');
      line.innerHTML = html;
      output.appendChild(line);
      win.body.querySelector('.terminal-app').scrollTop = win.body.querySelector('.terminal-app').scrollHeight;
    };

    const updatePrompt = () => {
      prompt.textContent = `${LoginManager.currentUser?.username || 'user'}@simulos:${fs.currentDir}$ `;
    };

    const commands = {
      help: () => {
        print('Comandos disponibles:', '#5af');
        print('  help          - Muestra esta ayuda');
        print('  clear / cls   - Limpia la terminal');
        print('  ls            - Lista archivos del directorio actual');
        print('  cd <dir>      - Cambia de directorio');
        print('  mkdir <name>  - Crea un directorio');
        print('  touch <name>  - Crea un archivo vacío');
        print('  cat <file>    - Muestra contenido de un archivo');
        print('  echo <text>   - Imprime texto');
        print('  write <file> <text> - Escribe texto en archivo');
        print('  rm <path>     - Elimina archivo o carpeta');
        print('  pwd           - Muestra directorio actual');
        print('  whoami        - Muestra usuario actual');
        print('  date          - Muestra fecha y hora');
        print('  sysinfo       - Información del sistema');
        print('  cpuinfo       - Uso de CPU');
        print('  meminfo       - Uso de memoria');
        print('  processes     - Lista procesos');
        print('  neofetch      - Info del sistema estilo neofetch');
        print('  calc <expr>   - Calculadora rápida');
        print('  history       - Historial de comandos');
        print('  exit          - Cierra la terminal');
      },

      clear: () => { output.innerHTML = ''; },
      cls: () => { output.innerHTML = ''; },

      ls: async (args) => {
        const path = args[0] ? resolvePath(args[0]) : fs.currentDir;
        const items = await window.electronAPI.fsReadDir(path);
        if (items.length === 0) {
          print('(directorio vacío)', '#888');
        } else {
          items.forEach(item => {
            const prefix = item.isDirectory ? '📁 ' : '📄 ';
            const color = item.isDirectory ? '#5af' : '#0f0';
            print(`  ${prefix}${item.name}`, color);
          });
        }
      },

      cd: async (args) => {
        if (!args[0] || args[0] === '~') {
          fs.currentDir = '/';
          updatePrompt();
          return;
        }
        const target = resolvePath(args[0]);
        const items = await window.electronAPI.fsReadDir(target);
        fs.currentDir = target;
        updatePrompt();
      },

      mkdir: async (args) => {
        if (!args[0]) { print('Uso: mkdir <nombre>', '#f55'); return; }
        const path = resolvePath(args[0]);
        await window.electronAPI.fsCreateDir(path);
        print(`Directorio creado: ${path}`, '#5f5');
      },

      touch: async (args) => {
        if (!args[0]) { print('Uso: touch <nombre>', '#f55'); return; }
        const path = resolvePath(args[0]);
        await window.electronAPI.fsWriteFile(path, '');
        print(`Archivo creado: ${path}`, '#5f5');
      },

      cat: async (args) => {
        if (!args[0]) { print('Uso: cat <archivo>', '#f55'); return; }
        const path = resolvePath(args[0]);
        const content = await window.electronAPI.fsReadFile(path);
        if (content === null) {
          print(`Error: archivo no encontrado: ${path}`, '#f55');
        } else {
          print(content || '(archivo vacío)', '#fff');
        }
      },

      echo: (args) => {
        print(args.join(' '), '#fff');
      },

      write: async (args) => {
        if (args.length < 2) { print('Uso: write <archivo> <contenido>', '#f55'); return; }
        const path = resolvePath(args[0]);
        const content = args.slice(1).join(' ');
        await window.electronAPI.fsWriteFile(path, content);
        print(`Escrito en: ${path}`, '#5f5');
      },

      rm: async (args) => {
        if (!args[0]) { print('Uso: rm <ruta>', '#f55'); return; }
        const path = resolvePath(args[0]);
        const result = await window.electronAPI.fsDelete(path);
        if (result) print(`Eliminado: ${path}`, '#5f5');
        else print(`No encontrado: ${path}`, '#f55');
      },

      pwd: () => print(fs.currentDir, '#fff'),
      whoami: () => print(LoginManager.currentUser?.username || 'unknown', '#fff'),

      date: () => {
        print(new Date().toLocaleString('es-ES', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        }), '#fff');
      },

      sysinfo: async () => {
        const info = await window.electronAPI.getSystemInfo();
        print('═══ Información del Sistema ═══', '#5af');
        print(`  OS: ${info.osInfo.distro} ${info.osInfo.release}`, '#fff');
        print(`  CPU: ${info.cpu.brand}`, '#fff');
        print(`  Cores: ${info.cpu.cores} (${info.cpu.physicalCores} físicos)`, '#fff');
        print(`  RAM: ${(info.mem.total / 1073741824).toFixed(1)} GB`, '#fff');
        if (info.graphics.controllers.length > 0) {
          print(`  GPU: ${info.graphics.controllers[0].model}`, '#fff');
          if (info.graphics.controllers[0].vram) {
            print(`  VRAM: ${info.graphics.controllers[0].vram} MB`, '#fff');
          }
        }
      },

      cpuinfo: async () => {
        const load = await window.electronAPI.getCpuUsage();
        print(`CPU Total: ${load.currentLoad.toFixed(1)}%`, '#ff5');
        load.cpus.forEach((cpu, i) => {
          const bar = '█'.repeat(Math.round(cpu.load / 5)) + '░'.repeat(20 - Math.round(cpu.load / 5));
          print(`  Core ${i}: [${bar}] ${cpu.load.toFixed(1)}%`);
        });
      },

      meminfo: async () => {
        const mem = await window.electronAPI.getMemUsage();
        const used = (mem.used / 1073741824).toFixed(1);
        const total = (mem.total / 1073741824).toFixed(1);
        const pct = ((mem.used / mem.total) * 100).toFixed(1);
        print(`RAM: ${used}GB / ${total}GB (${pct}%)`, '#ff5');
        const bar = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));
        print(`  [${bar}]`);
      },

      processes: async () => {
        const procs = await window.electronAPI.getProcesses();
        print('  PID      CPU%   MEM%   Nombre', '#5af');
        print('  ─────────────────────────────────', '#444');
        procs.list.slice(0, 20).sort((a, b) => b.cpu - a.cpu).forEach(p => {
          const pid = String(p.pid).padEnd(8);
          const cpu = p.cpu.toFixed(1).padStart(5);
          const mem = p.mem.toFixed(1).padStart(5);
          print(`  ${pid} ${cpu}  ${mem}  ${p.name}`);
        });
      },

      neofetch: async () => {
        const info = await window.electronAPI.getSystemInfo();
        const mem = info.mem;
        printHTML(`<pre style="color:#5af">
   ███████╗██╗███╗   ███╗██╗   ██╗██╗      ██████╗ ███████╗
   ██╔════╝██║████╗ ████║██║   ██║██║     ██╔═══██╗██╔════╝
   ███████╗██║██╔████╔██║██║   ██║██║     ██║   ██║███████╗
   ╚════██║██║██║╚██╔╝██║██║   ██║██║     ██║   ██║╚════██║
   ███████║██║██║ ╚═╝ ██║╚██████╔╝███████╗╚██████╔╝███████║
   ╚══════╝╚═╝╚═╝     ╚═╝ ╚═════╝ ╚══════╝ ╚═════╝ ╚══════╝</pre>`);
        print(`  User: ${LoginManager.currentUser?.username}@simulos`, '#fff');
        print(`  OS: SimulOS 1.0 (${info.osInfo.platform})`, '#fff');
        print(`  Host: ${info.osInfo.hostname}`, '#fff');
        print(`  CPU: ${info.cpu.brand}`, '#fff');
        print(`  RAM: ${(mem.used / 1073741824).toFixed(1)}GB / ${(mem.total / 1073741824).toFixed(1)}GB`, '#fff');
        if (info.graphics.controllers[0]) {
          print(`  GPU: ${info.graphics.controllers[0].model}`, '#fff');
        }
      },

      calc: (args) => {
        if (!args.length) { print('Uso: calc <expresión>', '#f55'); return; }
        try {
          const expr = args.join(' ').replace(/[^0-9+\-*/.()% ]/g, '');
          const result = Function('"use strict"; return (' + expr + ')')();
          print(`  = ${result}`, '#ff5');
        } catch(e) {
          print('Error en la expresión', '#f55');
        }
      },

      history: () => {
        fs.commandHistory.forEach((cmd, i) => {
          print(`  ${i + 1}  ${cmd}`, '#888');
        });
      },

      exit: () => {
        wm.closeWindow('terminal');
      }
    };

    const resolvePath = (p) => {
      if (p.startsWith('/')) return p;
      if (p === '..') {
        const parts = fs.currentDir.split('/').filter(Boolean);
        parts.pop();
        return '/' + parts.join('/');
      }
      const base = fs.currentDir === '/' ? '' : fs.currentDir;
      return base + '/' + p;
    };

    const execute = async (cmdLine) => {
      const promptText = prompt.textContent;
      print(promptText + cmdLine, '#888');
      fs.commandHistory.push(cmdLine);
      fs.historyIndex = fs.commandHistory.length;

      const parts = cmdLine.trim().split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1);

      if (commands[cmd]) {
        await commands[cmd](args);
      } else if (cmd) {
        print(`Comando no encontrado: ${cmd}. Escribe 'help' para ver los comandos.`, '#f55');
      }
    };

    input.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        const cmdLine = input.value;
        input.value = '';
        await execute(cmdLine);
      } else if (e.key === 'ArrowUp') {
        if (fs.historyIndex > 0) {
          fs.historyIndex--;
          input.value = fs.commandHistory[fs.historyIndex];
        }
      } else if (e.key === 'ArrowDown') {
        if (fs.historyIndex < fs.commandHistory.length - 1) {
          fs.historyIndex++;
          input.value = fs.commandHistory[fs.historyIndex];
        } else {
          fs.historyIndex = fs.commandHistory.length;
          input.value = '';
        }
      }
    });

    win.body.querySelector('.terminal-app').addEventListener('click', () => input.focus());

    print('SimulOS Terminal v1.0', '#5af');
    print('Escribe "help" para ver los comandos disponibles.\n', '#888');
    input.focus();
  }
};
