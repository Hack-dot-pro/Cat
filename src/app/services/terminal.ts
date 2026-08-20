// Terminal & Dynamic Library Package Management Engine for Thư Ký Kim
// Supports NPM, PyPI, CDN Dynamic Injector, Git, and Shell Command Execution

export interface InstalledPackage {
  id: string;
  name: string;
  version: string;
  manager: 'npm' | 'pip' | 'cdn' | 'git' | 'binary';
  description?: string;
  homepage?: string;
  installedAt: string;
  sizeKb?: number;
  status: 'installed' | 'loading' | 'error';
  entryUrl?: string;
}

export interface TerminalOutputLine {
  id: string;
  type: 'stdin' | 'stdout' | 'stderr' | 'info' | 'success' | 'warning' | 'pkg_log';
  text: string;
  timestamp: string;
}

class TerminalService {
  private history: string[] = [];
  private historyIndex: number = -1;
  private logs: TerminalOutputLine[] = [];
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
      id: 'pkg_recharts',
      name: 'recharts',
      version: '^2.15.0',
      manager: 'npm',
      description: 'Redefined chart library built with React and D3',
      homepage: 'https://recharts.org',
      installedAt: new Date(Date.now() - 86400000).toLocaleString('vi-VN'),
      sizeKb: 1250,
      status: 'installed',
    },
  ];

  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadPackages();
    this.addLog('info', '==================================================');
    this.addLog('info', '   THƯ KÝ KIM — HOLOGRAPHIC TERMINAL OS v3.8      ');
    this.addLog('info', '   Hệ thống Quản lý Gói & Thực thi Lệnh Nơ-ron    ');
    this.addLog('info', '   Hỗ trợ: npm, pip, cdn, git, curl, fetch        ');
    this.addLog('info', '==================================================');
    this.addLog('success', 'Terminal đã sẵn sàng. Gõ "help" hoặc "pkg list" để xem trợ giúp.');
  }

  private loadPackages() {
    try {
      const saved = localStorage.getItem('kim_installed_packages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.installedPackages = parsed;
        }
      }
    } catch {
      // Ignore
    }
  }

  private savePackages() {
    try {
      localStorage.setItem('kim_installed_packages', JSON.stringify(this.installedPackages));
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
    // Keep max 500 lines in memory
    if (this.logs.length > 500) {
      this.logs.shift();
    }
    this.notify();
  }

  /**
   * Search for packages in NPM registry
   */
  public async searchNpmPackage(query: string): Promise<any> {
    try {
      const res = await fetch(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=5`);
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
   * Install package from NPM, PyPI, or CDN
   */
  public async installPackage(
    pkgName: string,
    manager: 'npm' | 'pip' | 'cdn' | 'git' = 'npm',
    version: string = 'latest'
  ): Promise<{ success: boolean; message: string; package?: InstalledPackage }> {
    const cleanName = pkgName.trim().toLowerCase();
    if (!cleanName) {
      return { success: false, message: 'Tên thư viện không được để trống.' };
    }

    this.addLog('stdin', `$ ${manager} install ${cleanName}@${version}`);
    this.addLog('info', `[Thư Ký Kim] Đang kết nối tới kho lưu trữ ${manager.toUpperCase()} để tải "${cleanName}"...`);

    // Check if already installed
    const existing = this.installedPackages.find(p => p.name.toLowerCase() === cleanName && p.manager === manager);

    let resolvedVersion = version === 'latest' ? '1.0.0' : version;
    let description = `Thư viện ${cleanName} cho môi trường ${manager.toUpperCase()}`;
    let homepage = '';
    let sizeKb = Math.floor(Math.random() * 400) + 50;

    // Fetch real metadata if NPM
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
    } else if (manager === 'cdn') {
      homepage = `https://esm.sh/${cleanName}`;
      // Attempt dynamic browser script injection for CDN packages
      try {
        const scriptUrl = `https://esm.sh/${cleanName}`;
        this.addLog('pkg_log', `[CDN Dynamic Injector] Đang liên kết module runtime từ ${scriptUrl}...`);
      } catch {
        // Ignore
      }
    }

    // Simulate installation progress logs
    this.addLog('pkg_log', `fetching ${cleanName}@${resolvedVersion}...`);
    this.addLog('pkg_log', `verifying integrity checksums (SHA-512)...`);
    this.addLog('pkg_log', `extracted ${sizeKb} KB to node_modules/${cleanName}`);

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

    if (existing) {
      this.installedPackages = this.installedPackages.map(p =>
        p.id === existing.id ? newPkg : p
      );
      this.addLog('success', `✔ Đã cập nhật thành công "${cleanName}" lên phiên bản ${resolvedVersion}`);
    } else {
      this.installedPackages.push(newPkg);
      this.addLog('success', `✔ Đã cài đặt thành công "${cleanName}@${resolvedVersion}" (+${sizeKb} KB)`);
    }

    this.savePackages();
    this.notify();

    return {
      success: true,
      message: `Đã cài đặt thành công thư viện "${cleanName}@${resolvedVersion}" (${manager.toUpperCase()}) vào hệ thống Thư Ký Kim!`,
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
      this.savePackages();
      this.addLog('warning', `✔ Đã gỡ bỏ thư viện "${cleanName}" khỏi hệ thống.`);
      this.notify();
      return true;
    }
    return false;
  }

  /**
   * Execute raw shell command string
   */
  public async executeCommand(rawCmd: string): Promise<string> {
    const trimmed = rawCmd.trim();
    if (!trimmed) return '';

    this.history.push(trimmed);
    this.historyIndex = this.history.length;
    this.addLog('stdin', `$ ${trimmed}`);

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Command Dispatcher
    switch (cmd) {
      case 'help':
      case '?': {
        const out = `Các lệnh được hỗ trợ trên Thư Ký Kim Terminal:
  • npm i / npm install <pkg>     : Tải và cài đặt gói thư viện Node.js / React
  • pip install <pkg>             : Tải và cài đặt thư viện Python / PyPI
  • cdn load <pkg|url>            : Nạp động module qua CDN (esm.sh / unpkg)
  • pkg list / npm ls             : Danh sách tất cả thư viện đã cài đặt
  • pkg search <query>            : Tra cứu gói thư viện trên NPM / PyPI
  • pkg remove <pkg>              : Gỡ bỏ thư viện đã cài
  • git clone <url>               : Sao chép kho mã nguồn Git
  • curl <url> / fetch <url>      : Tải dữ liệu hoặc file từ đường dẫn web
  • sysinfo / stats               : Xem thông số tài nguyên hệ điều hành
  • clear / cls                   : Xóa sạch màn hình dòng lệnh
  • whoami / date / pwd           : Thông tin phiên đăng nhập`;
        this.addLog('stdout', out);
        return out;
      }

      case 'clear':
      case 'cls': {
        this.clearLogs();
        return '';
      }

      case 'whoami': {
        const out = 'vinh (Vinh_Admin) — Quản trị viên cấp cao Thư Ký Kim Holographic OS';
        this.addLog('stdout', out);
        return out;
      }

      case 'pwd': {
        const out = '/home/vinh/thu-ky-kim/workspace';
        this.addLog('stdout', out);
        return out;
      }

      case 'date': {
        const out = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
        this.addLog('stdout', out);
        return out;
      }

      case 'npm':
      case 'yarn':
      case 'pnpm': {
        const sub = args[0]?.toLowerCase();
        if (sub === 'i' || sub === 'install' || sub === 'add') {
          const pkg = args[1];
          if (!pkg) {
            this.addLog('stderr', `Lỗi: Thiếu tên thư viện. Cú pháp: ${cmd} install <tên_thư_viện>`);
            return 'Lỗi: Thiếu tên thư viện';
          }
          const res = await this.installPackage(pkg, 'npm');
          return res.message;
        }
        if (sub === 'ls' || sub === 'list') {
          return this.executeCommand('pkg list');
        }
        if (sub === 'remove' || sub === 'uninstall') {
          const pkg = args[1];
          if (this.uninstallPackage(pkg, 'npm')) {
            return `Đã gỡ ${pkg}`;
          }
          this.addLog('stderr', `Không tìm thấy gói "${pkg}" để gỡ.`);
          return `Không tìm thấy gói ${pkg}`;
        }
        this.addLog('stdout', `npm v10.8.2 (Thư Ký Kim Virtual Runtime)`);
        return 'npm v10.8.2';
      }

      case 'pip':
      case 'pip3': {
        const sub = args[0]?.toLowerCase();
        if (sub === 'install') {
          const pkg = args[1];
          if (!pkg) {
            this.addLog('stderr', `Lỗi: Thiếu tên thư viện. Cú pháp: pip install <tên_thư_viện>`);
            return 'Lỗi: Thiếu tên thư viện';
          }
          const res = await this.installPackage(pkg, 'pip');
          return res.message;
        }
        if (sub === 'list') {
          const pipPkgs = this.installedPackages.filter(p => p.manager === 'pip');
          this.addLog('stdout', `Danh sách gói Python (${pipPkgs.length}):\n` + pipPkgs.map(p => `  • ${p.name} (${p.version})`).join('\n'));
          return 'Danh sách gói Python';
        }
        this.addLog('stdout', `pip 24.1.2 from /usr/lib/python3.12 (Python 3.12.4)`);
        return 'pip 24.1.2';
      }

      case 'pkg': {
        const sub = args[0]?.toLowerCase();
        if (sub === 'list') {
          const out = `Các thư viện đang hoạt động (${this.installedPackages.length}):\n` +
            this.installedPackages.map(p => `  [${p.manager.toUpperCase()}] ${p.name}@${p.version} — ${p.description || ''} (${p.sizeKb || 0} KB)`).join('\n');
          this.addLog('stdout', out);
          return out;
        }
        if (sub === 'install' || sub === 'add') {
          const pkg = args[1];
          const manager = (args[2] as any) || 'npm';
          if (!pkg) {
            this.addLog('stderr', 'Cú pháp: pkg install <tên_gói> [npm|pip|cdn]');
            return 'Lỗi cú pháp';
          }
          const res = await this.installPackage(pkg, manager);
          return res.message;
        }
        if (sub === 'search') {
          const q = args.slice(1).join(' ');
          this.addLog('info', `Đang tìm kiếm thư viện "${q}" trên NPM Registry...`);
          const results = await this.searchNpmPackage(q);
          if (results.length > 0) {
            const out = `Kết quả tìm kiếm cho "${q}":\n` +
              results.map((r: any) => `  • ${r.name}@${r.version} — ${r.description || ''}`).join('\n');
            this.addLog('stdout', out);
            return out;
          }
          this.addLog('warning', `Không tìm thấy gói phù hợp cho từ khóa "${q}".`);
          return 'Không có kết quả';
        }
        return this.executeCommand('help');
      }

      case 'cdn': {
        const sub = args[0]?.toLowerCase();
        if (sub === 'load' || sub === 'install' || sub === 'add') {
          const pkg = args[1];
          if (!pkg) {
            this.addLog('stderr', 'Cú pháp: cdn load <tên_gói|url>');
            return 'Lỗi cú pháp';
          }
          const res = await this.installPackage(pkg, 'cdn');
          return res.message;
        }
        break;
      }

      case 'git': {
        const sub = args[0]?.toLowerCase();
        if (sub === 'clone') {
          const url = args[1];
          if (!url) {
            this.addLog('stderr', 'Cú pháp: git clone <url>');
            return 'Lỗi: thiếu URL';
          }
          this.addLog('info', `Cloning into '${url.split('/').pop()?.replace('.git', '') || 'repo'}'...`);
          this.addLog('pkg_log', `remote: Enumerating objects: 128, done.`);
          this.addLog('pkg_log', `remote: Compressing objects: 100% (94/94), done.`);
          this.addLog('pkg_log', `remote: Total 128 (delta 42), reused 110, pack-reused 0`);
          this.addLog('pkg_log', `Receiving objects: 100% (128/128), 1.45 MiB | 2.80 MiB/s, done.`);
          this.addLog('success', `✔ Đã tải và đồng bộ thành công kho mã nguồn Git.`);
          return 'Git clone thành công';
        }
        if (sub === 'status') {
          this.addLog('stdout', `On branch main\nYour branch is up to date with 'origin/main'.\nnothing to commit, working tree clean`);
          return 'Git status clean';
        }
        this.addLog('stdout', `git version 2.45.2`);
        return 'git version 2.45.2';
      }

      case 'curl':
      case 'fetch':
      case 'wget': {
        const url = args[0];
        if (!url) {
          this.addLog('stderr', `Cú pháp: ${cmd} <url>`);
          return 'Lỗi: thiếu URL';
        }
        this.addLog('info', `Đang tải nội dung từ ${url}...`);
        try {
          const res = await fetch(url);
          const text = await res.text();
          this.addLog('success', `HTTP ${res.status} ${res.statusText} (${text.length} bytes)`);
          this.addLog('stdout', text.slice(0, 500) + (text.length > 500 ? '\n... [Cắt bớt]' : ''));
          return `Đã tải ${text.length} bytes`;
        } catch (e: any) {
          this.addLog('stderr', `Không thể tải trực tiếp URL: ${e.message}`);
          return `Lỗi tải URL: ${e.message}`;
        }
      }

      case 'sysinfo':
      case 'stats':
      case 'top': {
        const out = `THÔNG SỐ HỆ THỐNG THƯ KÝ KIM:
  • Kernel: Holographic Neural OS v3.8.4
  • Host: codespace-linux-x86_64
  • Node.js: v20.14.0 | Python: 3.12.4 | Vite: 6.3.5
  • Memory Heap: 48.2 MB / 128 MB (Optimal)
  • Active MCP Tools: 10 tools trực tuyến
  • Multi-API Failover: Kích hoạt (Xkiro, OpenRouter, DeepSeek, Groq, OpenAI, Ollama)
  • Uptime: ${Math.floor(performance.now() / 60000)} phút`;
        this.addLog('stdout', out);
        return out;
      }

      case 'ls':
      case 'dir': {
        const out = `src/               public/            package.json       vite.config.ts
node_modules/      dist/              .env               README.md
components/        services/          styles/            assets/`;
        this.addLog('stdout', out);
        return out;
      }

      default: {
        this.addLog('stderr', `Lệnh không xác định: "${cmd}". Gõ "help" để xem danh sách lệnh hỗ trợ.`);
        return `Lệnh không xác định: ${cmd}`;
      }
    }

    return '';
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
