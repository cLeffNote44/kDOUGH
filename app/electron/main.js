const { app, BrowserWindow, shell, dialog } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const http = require("http");
const net = require("net");

let mainWindow;
let nextProcess;
const DEFAULT_PORT = 3847;
let activePort = DEFAULT_PORT;
const isDev = !app.isPackaged;

// ============================================
// PORT DETECTION
// ============================================

/**
 * Check if a port is available. Returns true if free.
 */
function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "localhost");
  });
}

/**
 * Find a free port starting from the preferred port.
 */
async function findFreePort(preferred, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const port = preferred + i;
    if (await isPortFree(port)) return port;
  }
  throw new Error(`No free port found near ${preferred}`);
}

// ============================================
// SERVER HEALTH CHECK
// ============================================

function waitForServer(port, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    function check() {
      const req = http.get(`http://localhost:${port}`, (res) => {
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - start > timeout) {
          reject(new Error("Server startup timeout"));
        } else {
          setTimeout(check, 300);
        }
      });
      req.end();
    }

    check();
  });
}

// ============================================
// STANDALONE PATH RESOLUTION
// ============================================

/**
 * Locate server.js inside the standalone directory. With outputFileTracingRoot
 * set to the project directory, server.js should be at standalone/server.js.
 * As a safety net, we also search one level deeper in case the tracing root
 * produces a nested structure (e.g. standalone/<subfolder>/server.js).
 */
function resolveStandalonePaths() {
  const base = path.join(process.resourcesPath, "standalone");
  const flat = path.join(base, "server.js");

  if (fs.existsSync(flat)) {
    return { standalonePath: base, serverPath: flat };
  }

  // Fallback: walk up to 4 levels deep to find server.js
  function findServerJs(dir, depth) {
    if (depth > 4) return null;
    try {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isFile() && entry.name === "server.js") {
          return dir;
        }
        if (entry.isDirectory() && entry.name !== "node_modules") {
          const found = findServerJs(path.join(dir, entry.name), depth + 1);
          if (found) return found;
        }
      }
    } catch {
      // Permission or read error — skip
    }
    return null;
  }

  const nested = findServerJs(base, 0);
  if (nested) {
    console.log(`[Electron] Found server.js at nested path: ${nested}`);
    return {
      standalonePath: nested,
      serverPath: path.join(nested, "server.js"),
    };
  }

  // Nothing found — return the expected flat path so the error is clear
  return { standalonePath: base, serverPath: flat };
}

// ============================================
// NEXT.JS SERVER MANAGEMENT
// ============================================

function startNextServer() {
  if (isDev) {
    // In development, use `next dev`
    nextProcess = spawn("npx", ["next", "dev", "-p", String(activePort)], {
      cwd: path.join(__dirname, ".."),
      env: { ...process.env, PORT: String(activePort) },
      shell: true,
    });
  } else {
    // Use Electron's bundled Node.js (no system Node.js dependency)
    // CWD must be the directory containing server.js so Next.js resolves
    // .next/static and public/ correctly.
    const { standalonePath, serverPath } = resolveStandalonePaths();

    if (!fs.existsSync(serverPath)) {
      dialog.showErrorBox(
        "kDOUGH",
        `Could not find the application server at:\n${serverPath}\n\nPlease reinstall the application.`
      );
      app.quit();
      return;
    }

    nextProcess = spawn(process.execPath, ["--no-warnings", serverPath], {
      cwd: standalonePath,
      env: {
        ...process.env,
        PORT: String(activePort),
        HOSTNAME: "localhost",
        // Electron sets this; Next.js standalone needs it unset to run as plain Node
        ELECTRON_RUN_AS_NODE: "1",
      },
    });
  }

  nextProcess.stdout?.on("data", (data) => {
    console.log(`[Next.js] ${data}`);
  });

  nextProcess.stderr?.on("data", (data) => {
    console.error(`[Next.js] ${data}`);
  });

  nextProcess.on("exit", (code) => {
    console.log(`[Next.js] Server exited with code ${code}`);
    nextProcess = null;
  });
}

// ============================================
// PROCESS CLEANUP
// ============================================

function killNextProcess() {
  if (!nextProcess) return;
  try {
    // On macOS/Linux, kill the process group to catch child processes
    if (process.platform !== "win32") {
      process.kill(-nextProcess.pid, "SIGTERM");
    } else {
      nextProcess.kill("SIGTERM");
    }
  } catch {
    // Process may already be dead
    try {
      nextProcess.kill("SIGKILL");
    } catch {
      // Truly gone
    }
  }
  nextProcess = null;
}

// ============================================
// SPLASH SCREEN
// ============================================

function createSplashWindow() {
  const splash = new BrowserWindow({
    width: 360,
    height: 240,
    frame: false,
    transparent: false,
    resizable: false,
    alwaysOnTop: true,
    backgroundColor: "#fafaf9", // stone-50 to match app theme
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Resolve icon path — use the same standalone resolution logic
  let iconFile;
  if (isDev) {
    iconFile = path.join(__dirname, "..", "public", "icon-192.png");
  } else {
    const { standalonePath } = resolveStandalonePaths();
    iconFile = path.join(standalonePath, "public", "icon-192.png");
  }

  let iconHtml = "";
  try {
    const iconBase64 = fs.readFileSync(iconFile).toString("base64");
    iconHtml = `<img class="icon" src="data:image/png;base64,${iconBase64}" />`;
  } catch {
    // Icon not found — show splash without icon
    console.warn("[Electron] Splash icon not found:", iconFile);
  }

  splash.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          background: #fafaf9;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          color: #44403c;
          -webkit-app-region: drag;
          user-select: none;
        }
        .icon {
          width: 72px;
          height: 72px;
          border-radius: 16px;
          margin-bottom: 12px;
        }
        .title {
          font-size: 28px;
          font-weight: 700;
          color: #b45309;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }
        .subtitle {
          font-size: 13px;
          color: #78716c;
          margin-bottom: 24px;
        }
        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid #e7e5e4;
          border-top-color: #d97706;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      </style>
    </head>
    <body>
      ${iconHtml}
      <div class="title">kDOUGH</div>
      <div class="subtitle">Starting up…</div>
      <div class="spinner"></div>
    </body>
    </html>
  `)}`);

  return splash;
}

// ============================================
// MAIN WINDOW
// ============================================

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 400,
    minHeight: 600,
    title: "kDOUGH",
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 16 },
    show: false, // Don't show until ready (avoids white flash)
    backgroundColor: "#fafaf9",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(`http://localhost:${activePort}`);

  // Show window once content is painted
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ============================================
// APP LIFECYCLE
// ============================================

app.whenReady().then(async () => {
  // Find a free port before starting the server
  try {
    activePort = await findFreePort(DEFAULT_PORT);
  } catch {
    dialog.showErrorBox(
      "kDOUGH",
      `Could not find a free port near ${DEFAULT_PORT}. Please close other applications and try again.`
    );
    app.quit();
    return;
  }

  // Show splash screen while the server boots
  const splash = createSplashWindow();

  startNextServer();

  try {
    await waitForServer(activePort);
  } catch (err) {
    splash.close();
    dialog.showErrorBox(
      "kDOUGH",
      "Failed to start the application server. Please restart the app."
    );
    console.error("Failed to start Next.js server:", err);
    killNextProcess();
    app.quit();
    return;
  }

  // Server is ready — show main window, close splash
  createWindow();
  splash.close();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Clean up server process on all exit paths
app.on("before-quit", killNextProcess);
app.on("will-quit", killNextProcess);

process.on("SIGTERM", () => {
  killNextProcess();
  app.quit();
});

process.on("SIGINT", () => {
  killNextProcess();
  app.quit();
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  killNextProcess();
  app.quit();
});
