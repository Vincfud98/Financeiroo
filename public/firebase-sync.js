(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyDnV7xQvU2oPCjnREoNmcUno65mnjAfv0w",
    authDomain: "financeiro-cccab.firebaseapp.com",
    projectId: "financeiro-cccab",
    storageBucket: "financeiro-cccab.firebasestorage.app",
    messagingSenderId: "831315971378",
    appId: "1:831315971378:web:e389a3957e8222db215b2b",
    measurementId: "G-RSC6DWT74T",
  };

  const allowedEmails = new Set([
    "vincfud1910@gmail.com",
    "carolmarinho0706@gmail.com",
  ]);
  const collectionNames = [
    "transactions",
    "goals",
    "goalMovements",
    "wishlist",
    "budgets",
    "debts",
    "accounts",
  ];
  const settingsFields = [
    "monthlyPlans",
    "recurringStops",
    "reserveAnchor",
    "recurringSeriesVersion",
  ];
  const familyRefPath = "families/shared";
  const authGate = document.querySelector("#authGate");
  const authMessage = document.querySelector("#authMessage");
  const loginButton = document.querySelector("#googleLoginButton");
  const logoutButton = document.querySelector("#logoutButton");
  const userSession = document.querySelector("#userSession");
  const userEmail = document.querySelector("#userEmail");

  let auth;
  let db;
  let currentUser = null;
  let cloudReady = false;
  let applyingRemote = false;
  let saveTimer = null;
  let listeners = [];
  let remoteIds = Object.fromEntries(collectionNames.map((name) => [name, new Set()]));
  let liveState = Object.fromEntries(collectionNames.map((name) => [name, []]));
  let liveSettings = {};
  let listenerReady = new Set();
  let writeQueue = Promise.resolve();

  function setMessage(message, isError = false) {
    authMessage.textContent = message;
    authMessage.classList.toggle("is-error", isError);
  }

  function showApp(user) {
    authGate.classList.add("is-hidden");
    userSession.hidden = false;
    userEmail.textContent = user.email;
  }

  function showLogin(message = "Entre com uma das contas autorizadas.") {
    authGate.classList.remove("is-hidden");
    userSession.hidden = true;
    loginButton.disabled = false;
    setMessage(message);
  }

  function preserveLocalBackup() {
    const storageKey = window.financeApp.getLocalStorageKey();
    const backupKey = `${storageKey}-backup-before-cloud`;
    if (localStorage.getItem(backupKey) !== null) return;
    const currentData = localStorage.getItem(storageKey);
    if (currentData !== null) localStorage.setItem(backupKey, currentData);
  }

  function cleanForFirestore(value) {
    if (Array.isArray(value)) {
      return value.map(cleanForFirestore).filter((item) => item !== undefined);
    }
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value)
          .filter(([, item]) => item !== undefined)
          .map(([key, item]) => [key, cleanForFirestore(item)])
      );
    }
    if (typeof value === "number" && !Number.isFinite(value)) return 0;
    return value;
  }

  function cleanupListeners() {
    listeners.forEach((unsubscribe) => unsubscribe());
    listeners = [];
    listenerReady = new Set();
  }

  function buildRemoteData() {
    const base = {};
    collectionNames.forEach((name) => {
      base[name] = liveState[name] || [];
    });
    settingsFields.forEach((field) => {
      if (liveSettings[field] !== undefined) base[field] = liveSettings[field];
    });
    return base;
  }

  function applyLiveStateWhenReady() {
    if (listenerReady.size < collectionNames.length + 1 || applyingRemote) return;
    applyingRemote = true;
    window.financeApp.applyRemoteData(buildRemoteData());
    applyingRemote = false;
  }

  async function readCloudData() {
    const results = await Promise.all([
      ...collectionNames.map((name) => db.collection(`${familyRefPath}/${name}`).get()),
      db.doc(`${familyRefPath}/settings/app`).get(),
      db.doc(`${familyRefPath}/meta/state`).get(),
    ]);
    const data = {};
    collectionNames.forEach((name, index) => {
      data[name] = results[index].docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      remoteIds[name] = new Set(results[index].docs.map((doc) => doc.id));
    });
    const settingsDoc = results[collectionNames.length];
    const metaDoc = results[collectionNames.length + 1];
    if (settingsDoc.exists) Object.assign(data, settingsDoc.data());
    return { data, initialized: metaDoc.exists && metaDoc.data().initialized === true };
  }

  async function commitInChunks(operations) {
    for (let index = 0; index < operations.length; index += 450) {
      const batch = db.batch();
      operations.slice(index, index + 450).forEach((operation) => operation(batch));
      await batch.commit();
    }
  }

  async function writeSnapshot(snapshot) {
    if (!currentUser) return;
    const operations = [];

    collectionNames.forEach((name) => {
      const records = Array.isArray(snapshot[name]) ? snapshot[name] : [];
      const nextIds = new Set(records.map((record) => String(record.id)));
      remoteIds[name].forEach((id) => {
        if (!nextIds.has(id)) {
          const ref = db.doc(`${familyRefPath}/${name}/${id}`);
          operations.push((batch) => batch.delete(ref));
        }
      });
      records.forEach((record) => {
        const id = String(record.id);
        const ref = db.doc(`${familyRefPath}/${name}/${id}`);
        const payload = cleanForFirestore({ ...record });
        delete payload.id;
        operations.push((batch) => batch.set(ref, payload));
      });
      remoteIds[name] = nextIds;
    });

    const settings = {};
    settingsFields.forEach((field) => {
      if (snapshot[field] !== undefined) settings[field] = snapshot[field];
    });
    settings.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    settings.updatedBy = currentUser.email;
    operations.push((batch) => batch.set(db.doc(`${familyRefPath}/settings/app`), settings));
    operations.push((batch) => batch.set(db.doc(`${familyRefPath}/meta/state`), {
      initialized: true,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: currentUser.email,
    }, { merge: true }));

    await commitInChunks(operations);
  }

  function attachRealtimeListeners() {
    cleanupListeners();
    collectionNames.forEach((name) => {
      const unsubscribe = db.collection(`${familyRefPath}/${name}`).onSnapshot((snapshot) => {
        liveState[name] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        remoteIds[name] = new Set(snapshot.docs.map((doc) => doc.id));
        listenerReady.add(name);
        applyLiveStateWhenReady();
      }, handleRealtimeError);
      listeners.push(unsubscribe);
    });
    listeners.push(db.doc(`${familyRefPath}/settings/app`).onSnapshot((snapshot) => {
      liveSettings = snapshot.exists ? snapshot.data() : {};
      listenerReady.add("settings");
      applyLiveStateWhenReady();
    }, handleRealtimeError));
  }

  function handleRealtimeError(error) {
    console.error("Falha na sincronizacao em tempo real:", error);
    setMessage("A sincronizacao com a nuvem foi interrompida.", true);
  }

  async function initializeCloud(user) {
    setMessage("Carregando dados financeiros...");
    const cloud = await readCloudData();
    if (!cloud.initialized) {
      setMessage("Migrando os dados deste navegador...");
      await writeSnapshot(window.financeApp.getData());
    } else {
      preserveLocalBackup();
      applyingRemote = true;
      window.financeApp.applyRemoteData(cloud.data);
      applyingRemote = false;
    }
    cloudReady = true;
    attachRealtimeListeners();
    showApp(user);
  }

  window.firebaseSync = {
    scheduleSave() {
      if (!cloudReady || applyingRemote || !currentUser) return;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        writeQueue = writeQueue
          .then(() => writeSnapshot(window.financeApp.getData()))
          .catch((error) => {
            console.error("Falha ao sincronizar com o Firebase:", error);
          });
      }, 350);
    },
  };

  try {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    db.enablePersistence({ synchronizeTabs: true }).catch(() => {});

    loginButton.addEventListener("click", async () => {
      loginButton.disabled = true;
      setMessage("Abrindo login Google...");
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        await auth.signInWithPopup(provider);
      } catch (error) {
        loginButton.disabled = false;
        setMessage("Nao foi possivel entrar com Google. Tente novamente.", true);
      }
    });

    logoutButton.addEventListener("click", () => auth.signOut());

    auth.onAuthStateChanged(async (user) => {
      cleanupListeners();
      cloudReady = false;
      currentUser = null;
      if (!user) {
        showLogin();
        return;
      }
      const email = String(user.email || "").toLowerCase();
      if (!allowedEmails.has(email)) {
        await auth.signOut();
        showLogin("Esta conta Google nao possui acesso ao aplicativo.");
        return;
      }
      currentUser = user;
      try {
        await initializeCloud(user);
      } catch (error) {
        console.error("Falha ao carregar o Firebase:", error);
        showLogin("Nao foi possivel carregar o Firestore. Verifique a configuracao do projeto.");
      }
    });
  } catch (error) {
    console.error("Falha ao iniciar Firebase:", error);
    setMessage("Firebase indisponivel. Verifique sua conexao.", true);
  }
})();
