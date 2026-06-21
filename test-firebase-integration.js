const { chromium } = require("playwright");

const appUrl = "http://127.0.0.1:8765/index.html";
const chromePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const fakeFirebase = `
(() => {
  const records = new Map(Object.entries(window.__remoteSeed || {}));
  const collectionListeners = new Map();
  const documentListeners = new Map();
  let authListener = null;
  let currentUser = null;

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const documentSnapshot = (path) => ({
    id: path.split("/").pop(),
    exists: records.has(path),
    data: () => clone(records.get(path)),
  });
  const collectionSnapshot = (path) => {
    const prefix = path + "/";
    const docs = [...records.keys()]
      .filter((key) => key.startsWith(prefix) && !key.slice(prefix.length).includes("/"))
      .map(documentSnapshot);
    return { docs };
  };
  const emitAll = () => {
    collectionListeners.forEach((callback, path) => callback(collectionSnapshot(path)));
    documentListeners.forEach((callback, path) => callback(documentSnapshot(path)));
  };
  const db = {
    collection(path) {
      return {
        get: async () => collectionSnapshot(path),
        onSnapshot(success) {
          collectionListeners.set(path, success);
          setTimeout(() => success(collectionSnapshot(path)), 0);
          return () => collectionListeners.delete(path);
        },
      };
    },
    doc(path) {
      return {
        path,
        get: async () => documentSnapshot(path),
        onSnapshot(success) {
          documentListeners.set(path, success);
          setTimeout(() => success(documentSnapshot(path)), 0);
          return () => documentListeners.delete(path);
        },
      };
    },
    batch() {
      const operations = [];
      return {
        set(ref, value, options) {
          operations.push(() => {
            const previous = options && options.merge && records.has(ref.path) ? records.get(ref.path) : {};
            records.set(ref.path, { ...clone(previous), ...clone(value) });
          });
        },
        delete(ref) {
          operations.push(() => records.delete(ref.path));
        },
        async commit() {
          operations.forEach((operation) => operation());
          emitAll();
        },
      };
    },
    enablePersistence: async () => {},
  };
  const auth = {
    onAuthStateChanged(callback) {
      authListener = callback;
      setTimeout(() => callback(currentUser), 0);
    },
    async signInWithPopup() {
      currentUser = { email: window.__testLoginEmail || "carolmarinho0706@gmail.com" };
      await authListener(currentUser);
      return { user: currentUser };
    },
    async signOut() {
      currentUser = null;
      await authListener(null);
    },
  };
  class GoogleAuthProvider {
    setCustomParameters() {}
  }
  window.firebase = {
    initializeApp() {},
    auth: Object.assign(() => auth, { GoogleAuthProvider }),
    firestore: Object.assign(() => db, {
      FieldValue: { serverTimestamp: () => "SERVER_TIMESTAMP" },
    }),
  };
  window.__fakeFirestore = records;
})();
`;

async function preparePage(browser, { email, localData, remoteSeed = {} }) {
  const context = await browser.newContext();
  await context.addInitScript(({ email, localData, remoteSeed }) => {
    window.__testLoginEmail = email;
    window.__remoteSeed = remoteSeed;
    if (localData) {
      localStorage.setItem("financa-pessoal-app-v1", JSON.stringify(localData));
    }
  }, { email, localData, remoteSeed });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("https://www.gstatic.com/firebasejs/**", async (route) => {
    const isAppScript = route.request().url().includes("firebase-app-compat");
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: isAppScript ? fakeFirebase : "",
    });
  });
  await page.goto(appUrl, { waitUntil: "domcontentloaded" });
  return { context, page, errors };
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  try {
    const localData = {
    accounts: [],
    transactions: [{
      id: "local-transaction",
      date: "2026-06-20",
      type: "expense",
      category: "Mercado",
      description: "Teste local",
      payment: "Pix",
      amount: 10,
    }],
    goals: [],
    goalMovements: [],
    wishlist: [],
    budgets: [],
    debts: [],
    monthlyPlans: {},
  };

    const migration = await preparePage(browser, {
    email: "carolmarinho0706@gmail.com",
    localData,
  });
    await migration.page.locator("#googleLoginButton").click();
    await migration.page.waitForFunction(() => document.querySelector("#authGate").classList.contains("is-hidden"));
    const migrated = await migration.page.evaluate(() => ({
    email: document.querySelector("#userEmail").textContent,
    hasMeta: window.__fakeFirestore.has("families/shared/meta/state"),
    localTransactions: [...window.__fakeFirestore.keys()]
      .filter((key) => key.startsWith("families/shared/transactions/")).length,
    fileInputs: document.querySelectorAll('input[type="file"]').length,
  }));
    if (migration.errors.length) throw new Error(migration.errors.join("\n"));
    if (migrated.email !== "carolmarinho0706@gmail.com" || !migrated.hasMeta) {
      throw new Error("Login autorizado ou migracao falhou.");
    }
    if (migrated.localTransactions !== 1 || migrated.fileInputs !== 0) {
      throw new Error("Migracao duplicada ou upload local ainda ativo.");
    }
    await migration.context.close();

    const unauthorized = await preparePage(browser, {
    email: "outra-conta@example.com",
    localData,
  });
    await unauthorized.page.locator("#googleLoginButton").click();
    await unauthorized.page.getByText("Esta conta Google nao possui acesso ao aplicativo.").waitFor();
    if (await unauthorized.page.locator("#authGate").evaluate((element) => element.classList.contains("is-hidden"))) {
      throw new Error("Conta nao autorizada conseguiu abrir o aplicativo.");
    }
    if (unauthorized.errors.length) throw new Error(unauthorized.errors.join("\n"));
    await unauthorized.context.close();

    const remoteData = {
    "families/shared/meta/state": { initialized: true },
    "families/shared/settings/app": { monthlyPlans: {}, recurringStops: {} },
    "families/shared/transactions/remote-transaction": {
      date: "2026-06-20",
      type: "income",
      category: "Outros",
      description: "Teste remoto",
      payment: "Pix",
      amount: 25,
    },
  };
    const cloud = await preparePage(browser, {
    email: "vincfud1910@gmail.com",
    localData,
    remoteSeed: remoteData,
  });
    await cloud.page.locator("#googleLoginButton").click();
    await cloud.page.waitForFunction(() => document.querySelector("#authGate").classList.contains("is-hidden"));
    const cloudResult = await cloud.page.evaluate(() => ({
    descriptions: window.financeApp.getData().transactions.map((item) => item.description),
    backup: JSON.parse(localStorage.getItem("financa-pessoal-app-v1-backup-before-cloud")),
  }));
    if (!cloudResult.descriptions.includes("Teste remoto") || cloudResult.descriptions.includes("Teste local")) {
      throw new Error("Os dados remotos nao assumiram a fonte principal.");
    }
    if (!cloudResult.backup.transactions.some((item) => item.description === "Teste local")) {
      throw new Error("O backup local anterior a nuvem nao foi preservado.");
    }
    if (cloud.errors.length) throw new Error(cloud.errors.join("\n"));
    await cloud.context.close();

    console.log(JSON.stringify({ migration: migrated, unauthorized: true, cloudBackup: true }));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
