// GitHub Codespaces-Grade Virtual Terminal & Package/Language Runtime for Thư Ký Kim
// Supports Multi-language Runtimes (Python, Node, Rust, Go, Bun, Deno, C++),
// Toolchain Installers (apt, cargo, npm, pip, git, curl, docker), and Virtual Execution

export interface InstalledLanguage {
  id: string;
  name: string;
  command: string;
  version: string;
  installed: boolean;
  category: 'runtime' | 'compiler' | 'tool';
  description: string;
}

export interface InstalledPackage {
  id: string;
  name: string;
  version: string;
  manager: 'npm' | 'pip' | 'cdn' | 'git' | 'cargo' | 'apt' | 'binary';
  description?: string;
  homepage?: string;
  installedAt: string;
  sizeKb?: number;
  status: 'installed' | 'loading' | 'error';
  entryUrl?: string;
}

export interface TerminalOutputLine {
  id: string;
  type: 'stdin' | 'stdout' | 'stderr' | 'info' | 'success' | 'warning' | 'pkg_log' | 'codespace';
  text: string;
  timestamp: string;
}

export interface VirtualFile {
  name: string;
  content: string;
  size: number;
  updatedAt: string;
}

class TerminalService {
  private history: string[] = [];
  private historyIndex: number = -1;
  private logs: TerminalOutputLine[] = [];
  private currentDir: string = '/workspaces/Cat';
  private envVars: Record<string, string> = {
    USER: 'vinh',
    HOME: '/home/vinh',
    SHELL: '/bin/zsh',
    TERM: 'xterm-256color',
    PATH: '/usr/local/bin:/usr/bin:/bin:/home/vinh/.cargo/bin:/home/vinh/.local/bin',
    NODE_ENV: 'development',
    PYTHONUNBUFFERED: '1',
    ASSISTANT_NAME: 'Thư Ký Kim',
  };

  private virtualFiles: Map<string, VirtualFile> = new Map([
    ['main.py', { name: 'main.py', content: '# Thư Ký Kim Python Script\nimport math\n\ndef greet(name):\n    return f"Xin chào {name}, Thư Ký Kim đã sẵn sàng!"\n\nprint(greet("Anh Vinh"))\nprint("Căn bậc hai của 1024 là:", math.sqrt(1024))\n', size: 184, updatedAt: new Date().toLocaleTimeString('vi-VN') }],
    ['index.js', { name: 'index.js', content: '// Thư Ký Kim Node.js Script\nconst os = require("os");\nconsole.log("Thư Ký Kim Node.js Engine v20.14.0");\nconsole.log("Nền tảng:", os.platform(), os.arch());\n', size: 156, updatedAt: new Date().toLocaleTimeString('vi-VN') }],
    ['main.rs', { name: 'main.rs', content: '// Thư Ký Kim Rust Script\nfn main() {\n    println!("Xin chào Anh Vinh từ Rust Engine!");\n}\n', size: 92, updatedAt: new Date().toLocaleTimeString('vi-VN') }],
    ['README.md', { name: 'README.md', content: '# Thư Ký Kim Holographic Assistant OS\nHệ thống trợ lý ảo thông minh với Codespace Terminal, Web Browsing MCP và Multi-API Failover.\n', size: 120, updatedAt: new Date().toLocaleTimeString('vi-VN') }],
  ]);

  private installedLanguages: InstalledLanguage[] = [
    { id: 'python', name: 'Python 3', command: 'python3', version: '3.12.4', installed: true, category: 'runtime', description: 'Trình thông dịch Python 3 kèm pip, numpy, pandas' },
    { id: 'node', name: 'Node.js', command: 'node', version: 'v20.14.0', installed: true, category: 'runtime', description: 'JavaScript/TypeScript V8 Runtime kèm npm, npx' },
    { id: 'rust', name: 'Rust & Cargo', command: 'cargo', version: '1.80.0', installed: true, category: 'compiler', description: 'Trình biên dịch Rust hiệu năng cao kèm Cargo package manager' },
    { id: 'golang', name: 'Go (Golang)', command: 'go', version: '1.22.5', installed: true, category: 'compiler', description: 'Ngôn ngữ lập trình Go cho hệ thống backend siêu tốc' },
    { id: 'bun', name: 'Bun Runtime', command: 'bun', version: '1.1.20', installed: true, category: 'runtime', description: 'All-in-one JavaScript runtime & package manager' },
    { id: 'deno', name: 'Deno', command: 'deno', version: '1.45.0', installed: false, category: 'runtime', description: 'Secure runtime for JavaScript and TypeScript' },
    { id: 'gcc', name: 'C/C++ GCC', command: 'gcc', version: '13.2.0', installed: true, category: 'compiler', description: 'GNU Compiler Collection cho C và C++' },
    { id: 'git', name: 'Git SCM', command: 'git', version: '2.45.2', installed: true, category: 'tool', description: 'Hệ thống quản lý phiên bản phân tán Git' },
    { id: 'docker', name: 'Docker CLI', command: 'docker', version: '27.0.3', installed: true, category: 'tool', description: 'Containerization engine & CLI toolkit' },
    { id: 'ffmpeg', name: 'FFmpeg Audio/Video', command: 'ffmpeg', version: '6.1.1', installed: false, category: 'tool', description: 'Bộ công cụ xử lý đa phương tiện và chuyển mã âm thanh' },
  ];

  private installedPackages: InstalledPackage[] = [
    {
      id: 'pkg_react',
      name: 'react',
      version: '^18.3.1',
      manager: 'npm',
      description: 'The library for web and native user interfaces',
      homepage: 'https://react.dev',
      installedAt: new Date(Date.now() - 86400000 * 3).toLocaleString('vi-VN'),
      sizeKb: 312,
      status: 'installed',
    },
    {
      id: 'pkg_framer_motion',
      name: 'framer-motion',
      version: '^11.15.0',
      manager: 'npm',
      description: 'Production-ready animation library for React',
      homepage: 'https://motion.dev',
      installedAt: new Date(Date.now() - 86400000 * 3).toLocaleString('vi-VN'),
      sizeKb: 890,
      status: 'installed',
    },
    {
      id: 'pkg_lucide_react',
      name: 'lucide-react',
      version: '^0.468.0',
      manager: 'npm',
      description: 'Beautiful & consistent icon toolkit',
      homepage: 'https://lucide.dev',
      installedAt: new Date(Date.now() - 86400000 * 2).toLocaleString('vi-VN'),
      sizeKb: 640,
      status: 'installed',
    },
    {
      id: 'pkg_requests',
      name: 'requests',
      version: '2.32.3',
      manager: 'pip',
      description: 'Python HTTP for Humans',
      homepage: 'https://requests.readthedocs.io',
      installedAt: new Date(Date.now() - 86400000).toLocaleString('vi-VN'),
      sizeKb: 420,
      status: 'installed',
    },
    {
      id: 'pkg_pandas',
      name: 'pandas',
      version: '2.2.2',
      manager: 'pip',
      description: 'Powerful data structures for data analysis and statistics',
      homepage: 'https://pandas.pydata.org',
      installedAt: new Date(Date.now() - 86400000).toLocaleString('vi-VN'),
      sizeKb: 1450,
      status: 'installed',
    },
  ];

  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadPackages();
    this.addLog('codespace', '┌─────────────────────────────────────────────────────────────┐');
    this.addLog('codespace', '│  THƯ KÝ KIM CODESPACE TERMINAL v3.8 (GitHub Workspace)     │');
    this.addLog('codespace', '│  Runtimes: Node.js v20 • Python 3.12 • Rust 1.80 • Go 1.22 │');
    this.addLog('codespace', '│  Package Managers: npm, pip, cargo, apt, git, cdn, curl    │');
    this.addLog('codespace', '└─────────────────────────────────────────────────────────────┘');
    this.addLog('success', '✔ Đã khởi tạo môi trường container codespace-linux-x86_64 thành công.');
    this.addLog('info', '💡 Gõ "help", "tool list", "pkg list" hoặc "neofetch" để xem chi tiết.');
  }

  private loadPackages() {
    try {
      const savedPkgs = localStorage.getItem('kim_installed_packages');
      if (savedPkgs) {
        const parsed = JSON.parse(savedPkgs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.installedPackages = parsed;
        }
      }
      const savedLangs = localStorage.getItem('kim_installed_languages');
      if (savedLangs) {
        const parsed = JSON.parse(savedLangs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.installedLanguages = parsed;
        }
      }
    } catch {
      // Ignore
    }
  }

  private saveState() {
    try {
      localStorage.setItem('kim_installed_packages', JSON.stringify(this.installedPackages));
      localStorage.setItem('kim_installed_languages', JSON.stringify(this.installedLanguages));
    } catch {
      // Ignore
    }
  }

  public getLogs(): TerminalOutputLine[] {
    return [...this.logs];
  }

  public getInstalledPackages(): InstalledPackage[] {
    return [...this.installedPackages];
  }

  public getInstalledLanguages(): InstalledLanguage[] {
    return [...this.installedLanguages];
  }

  public getVirtualFiles(): VirtualFile[] {
    return Array.from(this.virtualFiles.values());
  }

  public getCurrentDir(): string {
    return this.currentDir;
  }

  public clearLogs() {
    this.logs = [];
    this.notify();
  }

  public addLog(type: TerminalOutputLine['type'], text: string) {
    this.logs.push({
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      type,
      text,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour12: false }),
    });
    if (this.logs.length > 600) {
      this.logs.shift();
    }
    this.notify();
  }

  /**
   * Search for packages in NPM registry
   */
  public async searchNpmPackage(query: string): Promise<any> {
    try {
      const res = await fetch(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=6`);
      if (res.ok) {
        const data = await res.json();
        return data.objects?.map((obj: any) => ({
          name: obj.package?.name,
          version: obj.package?.version,
          description: obj.package?.description,
          links: obj.package?.links,
          publisher: obj.package?.publisher?.username,
          date: obj.package?.date,
        })) || [];
      }
    } catch {
      // Fallback
    }
    return [];
  }

  /**
   * Search for packages in PyPI
   */
  public async searchPypiPackage(pkgName: string): Promise<any> {
    try {
      const res = await fetch(`https://pypi.org/pypi/${encodeURIComponent(pkgName)}/json`);
      if (res.ok) {
        const data = await res.json();
        return {
          name: data.info?.name,
          version: data.info?.version,
          summary: data.info?.summary,
          homepage: data.info?.home_page || data.info?.project_url,
          author: data.info?.author,
          license: data.info?.license,
        };
      }
    } catch {
      // Fallback
    }
    return null;
  }

  /**
   * Install or enable a language/compiler/tool
   */
  public async installToolOrLanguage(toolId: string): Promise<{ success: boolean; message: string }> {
    const cleanId = toolId.trim().toLowerCase();
    this.addLog('stdin', `$ apt-get install -y ${cleanId}`);
    this.addLog('pkg_log', `Reading package lists... Done`);
    this.addLog('pkg_log', `Building dependency tree... Done`);
    this.addLog('pkg_log', `The following NEW packages will be installed: ${cleanId}`);

    const existing = this.installedLanguages.find(l => l.id === cleanId || l.name.toLowerCase().includes(cleanId) || l.command === cleanId);

    if (existing) {
      existing.installed = true;
      this.saveState();
      this.addLog('success', `✔ Setting up ${existing.name} (${existing.version})... Done!`);
      this.notify();
      return { success: true, message: `Đã cài đặt và kích hoạt thành công ${existing.name} (${existing.version}) vào môi trường Codespace!` };
    }

    // Add new tool
    const newTool: InstalledLanguage = {
      id: cleanId,
      name: cleanId.toUpperCase() + ' Toolchain',
      command: cleanId,
      version: '1.0.0',
      installed: true,
      category: 'tool',
      description: `Công cụ dòng lệnh ${cleanId} đã được cài vào Codespace`,
    };

    this.installedLanguages.push(newTool);
    this.saveState();
    this.addLog('success', `✔ Setting up ${newTool.name} (v1.0.0)... Done!`);
    this.notify();
    return { success: true, message: `Đã cài đặt thành công công cụ "${cleanId}" vào Codespace!` };
  }

  /**
   * Install package from NPM, PyPI, Cargo, CDN, APT
   */
  public async installPackage(
    pkgName: string,
    manager: 'npm' | 'pip' | 'cdn' | 'git' | 'cargo' | 'apt' = 'npm',
    version: string = 'latest'
  ): Promise<{ success: boolean; message: string; package?: InstalledPackage }> {
    const cleanName = pkgName.trim().toLowerCase();
    if (!cleanName) {
      return { success: false, message: 'Tên gói thư viện không được để trống.' };
    }

    if (manager === 'apt') {
      return this.installToolOrLanguage(cleanName);
    }

    this.addLog('stdin', `$ ${manager} install ${cleanName}@${version}`);
    this.addLog('info', `[Codespace Package Manager] Đang tải "${cleanName}" từ kho ${manager.toUpperCase()}...`);

    let resolvedVersion = version === 'latest' ? '1.0.0' : version;
    let description = `Gói thư viện ${cleanName} cho ${manager.toUpperCase()}`;
    let homepage = '';
    let sizeKb = Math.floor(Math.random() * 400) + 60;

    if (manager === 'npm') {
      try {
        const npmData = await this.searchNpmPackage(cleanName);
        if (npmData.length > 0) {
          const match = npmData.find((p: any) => p.name === cleanName) || npmData[0];
          resolvedVersion = match.version || resolvedVersion;
          description = match.description || description;
          homepage = match.links?.npm || match.links?.homepage || `https://www.npmjs.com/package/${cleanName}`;
          sizeKb = Math.floor(Math.random() * 600) + 120;
        }
      } catch {
        // Fallback
      }
    } else if (manager === 'pip') {
      try {
        const pypiData = await this.searchPypiPackage(cleanName);
        if (pypiData) {
          resolvedVersion = pypiData.version || resolvedVersion;
          description = pypiData.summary || description;
          homepage = pypiData.homepage || `https://pypi.org/project/${cleanName}`;
          sizeKb = Math.floor(Math.random() * 800) + 200;
        }
      } catch {
        // Fallback
      }
    }

    this.addLog('pkg_log', `fetching ${cleanName}@${resolvedVersion}...`);
    this.addLog('pkg_log', `resolving package dependency tree (100%)...`);
    this.addLog('pkg_log', `extracted ${sizeKb} KB to workspace modules`);

    const newPkg: InstalledPackage = {
      id: `pkg_${manager}_${cleanName.replace(/[^a-z0-9]/g, '_')}_${Date.now()}`,
      name: cleanName,
      version: resolvedVersion.startsWith('^') ? resolvedVersion : `^${resolvedVersion}`,
      manager,
      description,
      homepage,
      installedAt: new Date().toLocaleString('vi-VN'),
      sizeKb,
      status: 'installed',
      entryUrl: manager === 'cdn' ? `https://esm.sh/${cleanName}` : undefined,
    };

    const existingIdx = this.installedPackages.findIndex(p => p.name.toLowerCase() === cleanName && p.manager === manager);
    if (existingIdx !== -1) {
      this.installedPackages[existingIdx] = newPkg;
      this.addLog('success', `✔ Đã cập nhật thành công "${cleanName}" lên ${resolvedVersion}`);
    } else {
      this.installedPackages.push(newPkg);
      this.addLog('success', `✔ Đã cài đặt thành công "${cleanName}@${resolvedVersion}" (+${sizeKb} KB)`);
    }

    this.saveState();
    this.notify();

    return {
      success: true,
      message: `Đã cài đặt thành công thư viện "${cleanName}@${resolvedVersion}" (${manager.toUpperCase()}) vào Codespace!`,
      package: newPkg,
    };
  }

  /**
   * Uninstall package
   */
  public uninstallPackage(name: string, manager: string = 'npm'): boolean {
    const cleanName = name.trim().toLowerCase();
    const idx = this.installedPackages.findIndex(p => p.name.toLowerCase() === cleanName);
    if (idx !== -1) {
      this.installedPackages.splice(idx, 1);
      this.saveState();
      this.addLog('warning', `✔ Đã gỡ bỏ gói "${cleanName}" khỏi Codespace.`);
      this.notify();
      return true;
    }
    return false;
  }

  /**
   * Execute raw shell command with full Codespace emulation
   */
  public async executeCommand(rawCmd: string): Promise<string> {
    const trimmed = rawCmd.trim();
    if (!trimmed) return '';

    this.history.push(trimmed);
    this.historyIndex = this.history.length;
    this.addLog('stdin', `vinh@codespace:${this.currentDir.replace('/workspaces/Cat', '~')}$ ${trimmed}`);

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    // 1. Python Execution & REPL
    if (cmd === 'python' || cmd === 'python3' || cmd === 'py') {
      if (args[0] === '-c') {
        const code = args.slice(1).join(' ').replace(/^["']|["']$/g, '');
        this.addLog('info', `[Python 3.12.4 Sandbox Execution]`);
        try {
          // Safe Math/Logic expression execution
          let evalCode = code
            .replace(/print\((.*?)\)/g, '$1')
            .replace(/math\.sqrt/g, 'Math.sqrt')
            .replace(/math\.pi/g, 'Math.PI')
            .replace(/math\.pow/g, 'Math.pow')
            .replace(/math\.sin/g, 'Math.sin');

          let res: any;
          try {
            res = Function(`"use strict"; return (${evalCode})`)();
          } catch {
            res = `Thực thi thành công script Python: "${code}"`;
          }
          const out = String(res);
          this.addLog('stdout', out);
          return out;
        } catch (e: any) {
          this.addLog('stderr', `Traceback (most recent call last):\n  File "<stdin>", line 1, in <module>\nNameError: ${e.message}`);
          return `Error: ${e.message}`;
        }
      }

      if (args[0] && this.virtualFiles.has(args[0])) {
        const file = this.virtualFiles.get(args[0])!;
        this.addLog('info', `[Running ${file.name} with Python 3.12.4...]`);
        const out = `Xin chào Anh Vinh, Thư Ký Kim đã sẵn sàng!\nCăn bậc hai của 1024 là: 32\n[Process completed with exit code 0]`;
        this.addLog('stdout', out);
        return out;
      }

      const out = `Python 3.12.4 (main, Jun 12 2024, 18:20:00) [GCC 13.2.0] on linux\nType "help", "copyright", "credits" or "license" for more information.\n>>> Thư Ký Kim Python REPL sẵn sàng. Dùng python -c "code" để chạy lệnh.`;
      this.addLog('stdout', out);
      return out;
    }

    // 2. Node.js & JavaScript Execution
    if (cmd === 'node' || cmd === 'js') {
      if (args[0] === '-e' || args[0] === '--eval') {
        const code = args.slice(1).join(' ').replace(/^["']|["']$/g, '');
        this.addLog('info', `[Node.js v20.14.0 V8 Execution]`);
        try {
          const res = Function(`"use strict"; return (${code})`)();
          const out = res !== undefined ? String(res) : 'undefined';
          this.addLog('stdout', out);
          return out;
        } catch (e: any) {
          this.addLog('stderr', `Uncaught ReferenceError: ${e.message}`);
          return `Error: ${e.message}`;
        }
      }

      if (args[0] && this.virtualFiles.has(args[0])) {
        const file = this.virtualFiles.get(args[0])!;
        this.addLog('info', `[Running ${file.name} with Node.js v20.14.0...]`);
        const out = `Thư Ký Kim Node.js Engine v20.14.0\nNền tảng: linux x64\n[Process exited with 0]`;
        this.addLog('stdout', out);
        return out;
      }

      const out = `Welcome to Node.js v20.14.0.\nType ".help" for more information.`;
      this.addLog('stdout', out);
      return out;
    }

    // 3. Rust & Cargo
    if (cmd === 'cargo' || cmd === 'rustc') {
      if (args[0] === 'run') {
        this.addLog('pkg_log', `   Compiling codespace-app v0.1.0 (/workspaces/Cat)`);
        this.addLog('pkg_log', `    Finished dev [unoptimized + debuginfo] target(s) in 0.42s`);
        this.addLog('pkg_log', `     Running \`target/debug/codespace-app\``);
        const out = `Xin chào Anh Vinh từ Rust Engine!\n[Execution finished]`;
        this.addLog('stdout', out);
        return out;
      }
      if (args[0] === 'add') {
        const crate = args[1];
        if (!crate) return 'Lỗi: thiếu tên crate';
        return this.installPackage(crate, 'cargo');
      }
      this.addLog('stdout', `cargo 1.80.0 (38449e9 2024-07-16)`);
      return 'cargo 1.80.0';
    }

    // 4. Golang
    if (cmd === 'go') {
      if (args[0] === 'run') {
        this.addLog('pkg_log', `[Go 1.22.5 Compiler] Building ${args[1] || 'main.go'}...`);
        const out = `[Go Runtime] Chương trình thực thi thành công (Exit Code: 0)`;
        this.addLog('stdout', out);
        return out;
      }
      if (args[0] === 'version') {
        this.addLog('stdout', `go version go1.22.5 linux/amd64`);
        return 'go version 1.22.5';
      }
      this.addLog('stdout', `Go is a tool for managing Go source code.\nUsage: go <command> [arguments]`);
      return 'go 1.22.5';
    }

    // 5. APT Package Manager
    if (cmd === 'apt' || cmd === 'apt-get') {
      const sub = args[0]?.toLowerCase();
      if (sub === 'install' || sub === 'add') {
        const tool = args[1];
        if (!tool) {
          this.addLog('stderr', 'Cú pháp: apt install <tên_công_cụ>');
          return 'Lỗi: thiếu tên công cụ';
        }
        const res = await this.installToolOrLanguage(tool);
        return res.message;
      }
      if (sub === 'update') {
        this.addLog('pkg_log', `Hit:1 http://archive.ubuntu.com/ubuntu jammy InRelease`);
        this.addLog('pkg_log', `Get:2 http://security.ubuntu.com/ubuntu jammy-security InRelease [110 kB]`);
        this.addLog('success', `Reading package lists... Done (All packages are up to date).`);
        return 'APT Update thành công';
      }
      if (sub === 'list') {
        const langs = this.installedLanguages.map(l => `  • ${l.name} (${l.command} ${l.version}) [${l.installed ? 'ĐÃ CÀI' : 'CHƯA CÀI'}]`).join('\n');
        this.addLog('stdout', `Danh sách công cụ & ngôn ngữ hỗ trợ:\n${langs}`);
        return 'Danh sách công cụ';
      }
    }

    // 6. Tools list
    if (cmd === 'tool' || cmd === 'tools') {
      const sub = args[0]?.toLowerCase();
      if (sub === 'install' && args[1]) {
        return this.installToolOrLanguage(args[1]);
      }
      const list = this.installedLanguages.map(l => `  [${l.installed ? '✔' : ' '}] ${l.name.padEnd(20)} ${l.version.padEnd(10)} — ${l.description}`).join('\n');
      const out = `BỘ CÔNG CỤ & NGÔN NGỮ LẬP TRÌNH CODESPACE:\n${list}\n\n💡 Cài thêm công cụ bằng lệnh: apt install <tên_công_cụ>`;
      this.addLog('stdout', out);
      return out;
    }

    // 7. Neofetch / System Info
    if (cmd === 'neofetch' || cmd === 'sysinfo') {
      const out = `
   /\\_/\\    vinh@codespace-thu-ky-kim
  ( o.o )   ------------------------
   > ^ <    OS: Holographic Codespace Linux x86_64
            Host: GitHub Codespaces Cloud Container
            Kernel: 6.5.0-1025-azure
            Uptime: ${Math.floor(performance.now() / 60000)} mins
            Packages: ${this.installedPackages.length} (npm/pip/cargo)
            Shell: zsh 5.9
            Terminal: Thư Ký Kim VSCode Terminal
            CPU: AMD EPYC 7763 64-Core Processor (4) @ 2.44GHz
            Memory: 58.4MiB / 8192MiB
            AI Engine: Gwen 3.8 max (Xkiro Gateway + Failover)`;
      this.addLog('codespace', out);
      return out;
    }

    // 8. File System Commands (ls, cat, touch, mkdir, rm, pwd, echo)
    if (cmd === 'ls' || cmd === 'dir') {
      const fileList = Array.from(this.virtualFiles.values()).map(f => `  ${f.name.padEnd(16)} (${f.size} B)  ${f.updatedAt}`).join('\n');
      const out = `Tổng số ${this.virtualFiles.size} tệp trong ${this.currentDir}:\n${fileList}`;
      this.addLog('stdout', out);
      return out;
    }

    if (cmd === 'cat') {
      const fname = args[0];
      if (!fname) {
        this.addLog('stderr', 'Cú pháp: cat <tên_tệp>');
        return 'Lỗi: thiếu tên tệp';
      }
      if (this.virtualFiles.has(fname)) {
        const file = this.virtualFiles.get(fname)!;
        this.addLog('stdout', file.content);
        return file.content;
      }
      this.addLog('stderr', `cat: ${fname}: No such file or directory`);
      return `Không tìm thấy tệp ${fname}`;
    }

    if (cmd === 'touch') {
      const fname = args[0];
      if (fname) {
        this.virtualFiles.set(fname, {
          name: fname,
          content: '',
          size: 0,
          updatedAt: new Date().toLocaleTimeString('vi-VN'),
        });
        this.addLog('success', `✔ Đã tạo tệp "${fname}"`);
        this.notify();
        return `Đã tạo ${fname}`;
      }
    }

    if (cmd === 'echo') {
      const rawText = args.join(' ');
      const redirectMatch = rawText.match(/^(.*?)\s*>\s*([a-zA-Z0-9_.-]+)$/);
      if (redirectMatch) {
        const content = redirectMatch[1].replace(/^["']|["']$/g, '');
        const fname = redirectMatch[2];
        this.virtualFiles.set(fname, {
          name: fname,
          content,
          size: content.length,
          updatedAt: new Date().toLocaleTimeString('vi-VN'),
        });
        this.addLog('success', `✔ Đã ghi ${content.length} bytes vào "${fname}"`);
        this.notify();
        return `Đã ghi vào ${fname}`;
      }
      this.addLog('stdout', rawText);
      return rawText;
    }

    // 9. Standard Package Managers (npm, pip, cdn, git)
    if (cmd === 'npm' || cmd === 'yarn' || cmd === 'pnpm') {
      const sub = args[0]?.toLowerCase();
      if (sub === 'i' || sub === 'install' || sub === 'add') {
        const pkg = args[1];
        if (!pkg) {
          this.addLog('stderr', `Cú pháp: ${cmd} install <tên_thư_viện>`);
          return 'Lỗi: thiếu tên thư viện';
        }
        const res = await this.installPackage(pkg, 'npm');
        return res.message;
      }
      if (sub === 'ls' || sub === 'list') {
        return this.executeCommand('pkg list');
      }
      if (sub === 'remove' || sub === 'uninstall') {
        const pkg = args[1];
        if (this.uninstallPackage(pkg, 'npm')) return `Đã gỡ ${pkg}`;
        this.addLog('stderr', `Không tìm thấy gói "${pkg}"`);
        return `Lỗi gỡ gói ${pkg}`;
      }
      this.addLog('stdout', `npm v10.8.2 (Thư Ký Kim Node Environment)`);
      return 'npm v10.8.2';
    }

    if (cmd === 'pip' || cmd === 'pip3') {
      const sub = args[0]?.toLowerCase();
      if (sub === 'install') {
        const pkg = args[1];
        if (!pkg) {
          this.addLog('stderr', `Cú pháp: pip install <tên_thư_viện>`);
          return 'Lỗi: thiếu tên thư viện';
        }
        const res = await this.installPackage(pkg, 'pip');
        return res.message;
      }
      if (sub === 'list') {
        const pipPkgs = this.installedPackages.filter(p => p.manager === 'pip');
        const out = `Danh sách gói Python (${pipPkgs.length}):\n` + pipPkgs.map(p => `  • ${p.name} (${p.version})`).join('\n');
        this.addLog('stdout', out);
        return out;
      }
      this.addLog('stdout', `pip 24.1.2 from /usr/lib/python3.12 (Python 3.12.4)`);
      return 'pip 24.1.2';
    }

    if (cmd === 'pkg') {
      const sub = args[0]?.toLowerCase();
      if (sub === 'list') {
        const out = `CÁC THƯ VIỆN & GÓI ĐANG HOẠT ĐỘNG (${this.installedPackages.length}):\n` +
          this.installedPackages.map(p => `  [${p.manager.toUpperCase()}] ${p.name}@${p.version} — ${p.description || ''} (${p.sizeKb || 0} KB)`).join('\n');
        this.addLog('stdout', out);
        return out;
      }
      if (sub === 'install' || sub === 'add') {
        const pkg = args[1];
        const manager = (args[2] as any) || 'npm';
        if (!pkg) return 'Lỗi: thiếu tên gói';
        const res = await this.installPackage(pkg, manager);
        return res.message;
      }
      if (sub === 'search') {
        const q = args.slice(1).join(' ');
        this.addLog('info', `Đang tra cứu gói "${q}" trên kho lưu trữ...`);
        const results = await this.searchNpmPackage(q);
        if (results.length > 0) {
          const out = `Kết quả tìm kiếm cho "${q}":\n` + results.map((r: any) => `  • ${r.name}@${r.version} — ${r.description || ''}`).join('\n');
          this.addLog('stdout', out);
          return out;
        }
        this.addLog('warning', `Không tìm thấy gói phù hợp cho "${q}".`);
        return 'Không tìm thấy';
      }
    }

    // 10. Help
    if (cmd === 'help' || cmd === '?') {
      const out = `CÁC LỆNH CODESPACE TERMINAL ĐƯỢC HỖ TRỢ:
  • python -c "<code>" / python <file.py> : Chạy code hoặc script Python 3.12
  • node -e "<code>" / node <file.js>     : Chạy code JavaScript V8
  • cargo run / cargo add <crate>         : Biên dịch và chạy mã Rust
  • go run <file.go> / go version         : Biên dịch và chạy mã Golang
  • apt install <tool> / apt list         : Cài đặt công cụ và ngôn ngữ mới
  • npm i <pkg> / pip install <pkg>       : Cài đặt thư viện Node.js / Python
  • tool list / pkg list                  : Xem danh sách công cụ và thư viện
  • ls / cat <file> / echo "text" > file  : Thao tác tệp tin trên Codespace
  • git clone <url> / git status          : Quản lý kho mã nguồn Git
  • curl <url> / fetch <url>              : Tải dữ liệu từ web
  • neofetch / sysinfo / clear            : Thông số hệ thống / Xóa màn hình`;
      this.addLog('stdout', out);
      return out;
    }

    if (cmd === 'clear' || cmd === 'cls') {
      this.clearLogs();
      return '';
    }

    if (cmd === 'pwd') {
      this.addLog('stdout', this.currentDir);
      return this.currentDir;
    }

    if (cmd === 'whoami') {
      this.addLog('stdout', 'vinh (Vinh_Admin) — Codespace Master Developer');
      return 'vinh';
    }

    if (cmd === 'date') {
      const out = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      this.addLog('stdout', out);
      return out;
    }

    // Fallback
    this.addLog('stderr', `zsh: command not found: ${cmd}. Gõ "help" hoặc "tool list" để xem danh sách lệnh.`);
    return `zsh: command not found: ${cmd}`;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }
}

export const terminalService = new TerminalService();
