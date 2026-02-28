// simple helper copied from original HTML
//function toggleMobileMenu() {
   // const menu = document.getElementById('tabs-menu');
  //  const btn = document.getElementById('mobile-menu-toggle');
   // if (menu && btn) {
 //       menu.classList.toggle('mobile-open');
 //       btn.classList.toggle('active');
 //   }
    // Fermer le menu si on clique sur un onglet
 //   const tabs = document.querySelectorAll('.tab');
  //  tabs.forEach(tab => {
       // tab.addEventListener('click', () => {
    //        menu.classList.remove('mobile-open');
       //     btn.classList.remove('active');
     //   });
  //  });
//}

// configuration will be provided by the server endpoint /config
//async function loadConfig() {
    //try {
    //    const res = await fetch('/config');
    //    if (!res.ok) throw new Error('Failed to fetch config');
    //    window.FIREBASE_CONFIG = await res.json();
    //    initFirebaseIfConfigured();
  //  } catch (err) {
    //    console.error('Could not load config from server:', err);
   // }
//}

// start fetching configuration as soon as possible
//loadConfig();

// ---------- remaining application logic ----------
// The original versionfinal.html contained a very large inline script
// implementing all of the features (events module, members, payments,
// charts, etc.). To keep the repository clean we moved that logic into
// this file when the HTML was simplified. You can paste the rest of the
// code here (it is available earlier in the conversation or in your
// original copy of versionfinal.html). The code begins with the comment
// "// --- MODULE ÉVÉNEMENTS (LOGIQUE) ---" and ends with the various
// chart-rendering functions at the bottom of the file.

// (For now this file only contains the menu helper and config loader.)
    // === FONCTION MENU HAMBURGER MOBILE (MINIMALISTE) ===
        function toggleMobileMenu() {
            const menu = document.getElementById('tabs-menu');
            const btn = document.getElementById('mobile-menu-toggle');
            if (menu && btn) {
                menu.classList.toggle('mobile-open');
                btn.classList.toggle('active');
            }
            // Fermer le menu si on clique sur un onglet
            const tabs = document.querySelectorAll('.tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    menu.classList.remove('mobile-open');
                    btn.classList.remove('active');
                });
            });
        }

        // --- FIREBASE CONFIGURATION ---
        window.FIREBASE_CONFIG = {
            apiKey: "AIzaSyBkcnXxfcw4TN3DSmtUeimJ5br7PuBpqVo",
            authDomain: "dahira-kenal.firebaseapp.com",
            databaseURL: "https://dahira-kenal-default-rtdb.firebaseio.com",
            projectId: "dahira-kenal",
            storageBucket: "dahira-kenal.firebasestorage.app",
            messagingSenderId: "363618938352",
            appId: "1:363618938352:web:307a7e87a9571cf08d4135",
            measurementId: "G-MD6F2PKZZY"
        };

        // Global variables for Firebase
        window.firebaseAuth = null;
        window.firebaseDB = null;

        // --- MODULE ÉVÉNEMENTS (LOGIQUE) ---
        // Défini en premier pour être disponible partout
        const eventsModule = (function() {
            let eventsData = [];
            const STORAGE_KEY = 'dk_events';

            // 1. Chargement
            function init() {
                try {
                    const stored = localStorage.getItem(STORAGE_KEY);
                    eventsData = stored ? JSON.parse(stored) : [];
                    console.log('[Events] Module chargé :', eventsData.length, 'événements');
                } catch (e) {
                    console.error('[Events] Erreur chargement', e);
                    eventsData = [];
                }
            }

            function save() {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(eventsData));
                render(); // Mise à jour de l'affichage
            }

            // 2. Rendu (Affichage des cartes)
            function render() {
                const container = document.getElementById('events-container');
                if (!container) return;

                const sorted = [...eventsData].sort((a, b) => new Date(a.date) - new Date(b.date));

                if (sorted.length === 0) {
                    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #6b7280;">Aucun événement prévu.</div>`;
                    return;
                }

                container.innerHTML = sorted.map(evt => {
                    const isPast = new Date(evt.date) < new Date();
                    const feeText = evt.fee > 0 ? `${evt.fee} FCFA` : 'Gratuit';
                    const feeColor = evt.fee > 0 ? 'var(--evt-primary)' : '#888';

                    return `
                    <div class="evt-card ${isPast ? 'past' : ''}" data-id="${evt.id}">
                        <div class="evt-title">${evt.title}</div>
                        <div class="evt-date">${new Date(evt.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        <div class="evt-desc">${evt.desc || ''}</div>
                        <div class="evt-footer">
                            <div class="evt-fee" style="color: ${feeColor}">${feeText}</div>
                            <div class="evt-actions">
                                <button class="evt-btn evt-btn-edit" onclick="eventsModule.openModal('${evt.id}')">✏️ Modifier</button>
                                <button class="evt-btn evt-btn-delete" onclick="eventsModule.del('${evt.id}')">🗑️ Supprimer</button>
                            </div>
                        </div>
                    </div>
                    `;
                }).join('');
            }

            // 3. Actions (Ouvrir modale, Sauvegarder, Supprimer)
            function openEventModal(id = null) {
                document.getElementById('evt-id').value = id || '';
                document.getElementById('evt-title').value = '';
                document.getElementById('evt-date').value = new Date().toISOString().split('T')[0];
                document.getElementById('evt-desc').value = '';
                document.getElementById('evt-fee').value = '0';

                if (id) {
                    const evt = eventsData.find(e => e.id === id);
                    if (evt) {
                        document.getElementById('evt-title').value = evt.title;
                        document.getElementById('evt-date').value = evt.date;
                        document.getElementById('evt-desc').value = evt.desc;
                        document.getElementById('evt-fee').value = evt.fee;
                    }
                }
                document.getElementById('evt-modal').classList.add('active');
            }

            function closeEventModal() {
                document.getElementById('evt-modal').classList.remove('active');
            }

            function saveEvent() {
            logAudit('event_save_attempt', 'Tentative sauvegarde événement', null);
                const id = document.getElementById('evt-id').value;
                const title = document.getElementById('evt-title').value;
                const date = document.getElementById('evt-date').value;
                const desc = document.getElementById('evt-desc').value;
                const fee = parseInt(document.getElementById('evt-fee').value) || 0;

                if (!title || !date) {
                    showMessage('error', 'Le titre et la date sont obligatoires.');
                    return;
                }

                if (id) {
                    const index = eventsData.findIndex(e => e.id === id);
                    if (index !== -1) eventsData[index] = { id, title, date, desc, fee, caisse: eventsData[index].caisse };
                } else {
                    const newId = Date.now().toString();
                    const caisse = 'event-' + newId;
                    eventsData.push({ id: newId, title, date, desc, fee, caisse });
                }

                save();
                logAudit('event_add_or_edit', `Événement enregistré: ${title}`, id || null);
                try { if (window.firebaseAuth && firebaseAuth.currentUser) cloudSaveAll(); } catch (e) { console.warn('cloudSaveAll error', e); }
                closeEventModal();
                showMessage('success', 'Événement enregistré avec succès !');
                // Mettre à jour les statistiques après ajout/modification d'événement
                if (window.updateStats) window.updateStats();
                if (window.renderDashboardCharts) window.renderDashboardCharts();
                if (window.updateEventReportsButtons) window.updateEventReportsButtons();
            }

            function del(id) {
                showConfirm('Voulez-vous vraiment supprimer cet événement ?', () => {
                    const removed = eventsData.find(e=>e.id===id);
                    eventsData = eventsData.filter(e => e.id !== id);
                    save();
                    logAudit('event_delete', `Suppression événement ${removed?removed.title:''}`, id);
                    try { if (window.firebaseAuth && firebaseAuth.currentUser) cloudSaveAll(); } catch (e) { console.warn('cloudSaveAll error', e); }
                    // Mettre à jour les statistiques après suppression d'événement
                    if (window.updateStats) window.updateStats();
                    if (window.renderDashboardCharts) window.renderDashboardCharts();
                    if (window.updateEventReportsButtons) window.updateEventReportsButtons();
                });
            }

            // Initialisation et Exposition
            init();
            
            // On expose les fonctions nécessaires pour le HTML
            return {
                init,
                render,
                openModal: openEventModal,
                closeModal: closeEventModal,
                save: saveEvent,
                del,
                getEvents: () => eventsData
            };

        })();

        // Exposer le module globalement
        window.eventsModule = eventsModule;

        // --- FONCTIONS UTILES & UTILITAIRES ---

        // Helper Debounce pour optimiser la recherche (évite le lag)
        function debounce(func, wait) {
            let timeout;
            return function (...args) {
                const context = this;
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(context, args), wait);
            };
        }

        // Initialize Firebase if FIREBASE_CONFIG provided
        function initFirebaseIfConfigured() {
            try {
                if (window.FIREBASE_CONFIG && window.firebase) {
                    // initialize app if not already
                    let app;
                    try { app = window.firebase.app(); } catch (e) { app = window.firebase.initializeApp(window.FIREBASE_CONFIG); }
                    window.firebaseAuth = window.firebase.auth(app);
                    window.firebaseDB = window.firebase.database(app);

                    // écouter les changements d'auth : importer automatiquement si connecté
                    window.firebaseAuth.onAuthStateChanged(async user => {
                        if (user) {
                            // si prénom non défini, demander
                            const stored = getCurrentUser();
                            if (!stored || stored.includes('@') || stored === 'Utilisateur' || stored === user.email || stored === user.uid) {
                                showPrompt("Entrez votre prénom pour l'historique", "", val => {
                                    const prenom = (val||'').trim() || 'Utilisateur';
                                    setCurrentUser(prenom);
                                    try { importFromCloud(); } catch(e){ console.warn('importFromCloud error', e); }
                                }, () => {
                                    setCurrentUser('Utilisateur');
                                    try { importFromCloud(); } catch(e){ console.warn('importFromCloud error', e); }
                                });
                            } else {
                                setCurrentUser(stored);
                                try { importFromCloud(); } catch(e){ console.warn('importFromCloud error', e); }
                            }
                        } else {
                            setCurrentUser('');
                        }
                    });
                }
            } catch (err) {
                console.warn('initFirebaseIfConfigured error', err);
            }
        }

        
        function openAuth() { console.warn('openAuth called but authentication UI removed'); showMessage('warn','Authentification désactivée'); }

        // === FONCTIONS CLOUD/FIREBASE ===

        /**
         * 🔐 Connexion aux Données - Ouvre la modale de login Firebase
         */
        function connectToCloud() {
            // Charger Firebase SDK si nécessaire
            if (!window.firebase) {
                showMessage('info', 'Initialisation de Firebase...');
                const script = document.createElement('script');
                script.src = 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
                script.onload = () => {
                    const script2 = document.createElement('script');
                    script2.src = 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
                    script2.onload = () => {
                        const script3 = document.createElement('script');
                        script3.src = 'https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js';
                        script3.onload = () => {
                            openModal('firebaseLogin');
                        };
                        document.head.appendChild(script3);
                    };
                    document.head.appendChild(script2);
                };
                document.head.appendChild(script);
            } else {
                openModal('firebaseLogin');
            }
        }

        /**
         * Authentification Firebase et import des données
         */
        async function authenticateAndImport() {
            const email = document.getElementById('firebase-email').value.trim();
            const password = document.getElementById('firebase-password').value;
            const errorDiv = document.getElementById('firebase-error');
            
            if (!email || !password) {
                errorDiv.textContent = 'Email et mot de passe requis';
                errorDiv.style.display = 'block';
                return;
            }

            try {
                errorDiv.style.display = 'none';
                showMessage('info', '🔐 Authentification en cours...');
                
                // Initialiser Firebase si nécessaire
                if (!window.firebase) {
                    errorDiv.textContent = 'Firebase SDK non chargé';
                    errorDiv.style.display = 'block';
                    return;
                }

                // Vérifier si Firebase est déjà initialisé
                let app;
                try {
                    app = window.firebase.app();
                } catch (e) {
                    // App non initialisée, on l'initialise
                    app = window.firebase.initializeApp(window.FIREBASE_CONFIG);
                }

                window.firebaseAuth = window.firebase.auth(app);
                window.firebaseDB = window.firebase.database(app);
                
                console.log('✅ Firebase initialisé:', app.name);

                // Se connecter avec email/password
                const userCredential = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
                console.log('✅ Connecté en tant que:', userCredential.user.email);
                
                showMessage('success', '✅ Authentification réussie!');
                
                // demander le prénom à chaque connexion via modal (inspiré de l'ancien scripte.js)
                showPrompt("Entrez votre prénom pour l'historique", "", val => {
                    let prenom = (val||'').trim();
                    if (prenom) setCurrentUser(prenom);
                    else setCurrentUser('Utilisateur');
                    logAudit('auth_signin', `Connexion ${getCurrentUser()}`, null);
                    // après avoir défini l'utilisateur, fermer modal et importer
                    closeModal('modal-firebase-login');
                    setTimeout(() => importFromCloud(), 500);
                }, () => {
                    setCurrentUser('Utilisateur');
                    logAudit('auth_signin', `Connexion ${getCurrentUser()}`, null);
                    closeModal('modal-firebase-login');
                    setTimeout(() => importFromCloud(), 500);
                });
                
            } catch (error) {
                console.error('Erreur authentification:', error);
                let message = 'Erreur d\'authentification';
                
                if (error.code === 'auth/user-not-found') {
                    message = 'Email non trouvé';
                } else if (error.code === 'auth/wrong-password') {
                    message = 'Mot de passe incorrect';
                } else if (error.code === 'auth/invalid-email') {
                    message = 'Email invalide';
                } else if (error.code === 'auth/weak-password') {
                    message = 'Mot de passe trop faible';
                }
                
                errorDiv.textContent = message;
                errorDiv.style.display = 'block';
                showMessage('error', `❌ ${message}`);
            }
        }

        /**
         * Initialisation interne de Firebase
         */
        function initializeFirebase() {
            try {
                if (window.firebase && window.FIREBASE_CONFIG) {
                    const app = window.firebase.initializeApp(window.FIREBASE_CONFIG);
                    window.firebaseDB = window.firebase.database(app);
                    showMessage('success', '✅ Connexion cloud établie avec succès!');
                    console.log('Firebase initialized:', app);
                }
            } catch (error) {
                showMessage('error', `Erreur initialisation Firebase: ${error.message}`);
                console.error('Firebase init error:', error);
            }
        }

        /**
         * ☁️ Synchro vers le Cloud - Envoie les données locales vers Firebase
         */
        async function syncToCloud() {
            // Vérifier que l'utilisateur est connecté
            if (!window.firebaseAuth || !window.firebaseAuth.currentUser) {
                showMessage('warn', '⚠️ Non connecté. Cliquez d\'abord sur "Connexion aux Données"');
                setSyncStatus('error', 'Non connecté');
                return;
            }

            if (!window.firebaseDB) {
                showMessage('warn', '⚠️ Firebase non connecté. Veuillez rafraîchir et reconnecter');
                setSyncStatus('error', 'Firebase non connecté');
                return;
            }

            const btnSave = document.getElementById('btn-cloud-save');
            const btnLoad = document.getElementById('btn-cloud-load');

            try {
                showMessage('info', '📤 Synchronisation en cours...');
                setSyncStatus('syncing', 'Synchronisation en cours...');
                if (btnSave) btnSave.disabled = true;
                if (btnLoad) btnLoad.disabled = true;

                const userId = window.firebaseAuth.currentUser.uid;
                const userEmail = window.firebaseAuth.currentUser.email;

                const events = window.eventsModule ? window.eventsModule.getEvents() : [];
                const audits = safeGet('dahira-audit', []);

                const clientData = {
                    membres: safeGet('dahira-membres', []),
                    payments: safeGet('dahira-payments', []),
                    expenses: safeGet('dahira-expenses', []),
                    events,
                    audits,
                    params: safeGet('dahira-params', {}),
                    userEmail
                };

                // VALIDATION STRICTE
                const validation = validateSyncData(clientData);
                if (!validation.valid) {
                    showMessage('error', `❌ SYNC REFUSÉE : ${validation.reason}`);
                    setSyncStatus('error', validation.reason);
                    return;
                }

                const ref = window.firebaseDB.ref(`users/${userId}`);
                const snap = await ref.once('value');
                const serverData = snap.val() || { membres: [], payments: [], expenses: [], events: [], audits: [], params: {}, version: 0 };
                const serverVersion = serverData.version || 0;
                const clientVersion = safeGet('dahira-sync-version', 0);

                if (clientVersion < serverVersion) {
                    console.warn('⚠️ CONFLIT VERSION: client=' + clientVersion + ' serveur=' + serverVersion);
                    showMessage('warn', '⚠️ CONFLIT VERSION: Fusion appliquée automatiquement.');
                    const mergedData = mergeData(serverData, clientData);
                    const newVersion = serverVersion + 1;
                    const payload = { ...mergedData, version: newVersion, updatedAt: new Date().toISOString() };
                    await ref.set(payload);
                    safeSet('dahira-sync-version', newVersion);
                    logAudit('sync_to_cloud_merge', `SYNC SÉCURISÉE (merge conflit)`, null);
                } else {
                    const newVersion = serverVersion + 1;
                    const payload = { ...clientData, version: newVersion, updatedAt: new Date().toISOString() };
                    await ref.set(payload);
                    safeSet('dahira-sync-version', newVersion);
                    logAudit('sync_to_cloud_direct', `SYNC DIRECTE`, null);
                }

                console.log('✅ syncToCloud: sync sécurisée réussie');
                showMessage('success', '✅ Données synchronisées (mode sécurisé)');
                setSyncStatus('success', 'Sync réussie');
                setTimeout(() => setSyncStatus('idle', 'Prêt'), 3000);
            } catch (error) {
                console.error('syncToCloud error', error);
                showMessage('error', '❌ Erreur sync : ' + (error.code || '') + ' ' + error.message);
                setSyncStatus('error', 'Erreur lors de la sync');
            } finally {
                if (btnSave) btnSave.disabled = false;
                if (btnLoad) btnLoad.disabled = false;
            }
        }

        /**
         * ⬇️ Importer depuis le Cloud - Récupère les données depuis Firebase
         */
        async function importFromCloud() {
            // Vérifier que l'utilisateur est connecté
            if (!window.firebaseAuth || !window.firebaseAuth.currentUser) {
                showMessage('warn', '⚠️ Non connecté. Cliquez d\'abord sur "Connexion aux Données"');
                setSyncStatus('error', 'Non connecté');
                return;
            }

            if (!window.firebaseDB) {
                showMessage('warn', '⚠️ Firebase non connecté. Veuillez rafraîchir et reconnecter');
                setSyncStatus('error', 'Firebase non connecté');
                return;
            }

            const btnSave = document.getElementById('btn-cloud-save');
            const btnLoad = document.getElementById('btn-cloud-load');
            try {
                showMessage('info', '📥 Importation en cours...');
                setSyncStatus('syncing', 'Import cloud en cours...');
                if (btnSave) btnSave.disabled = true;
                if (btnLoad) btnLoad.disabled = true;

                const userId = window.firebaseAuth.currentUser.uid;
                const ref = window.firebaseDB.ref(`users/${userId}`);
                console.info('importFromCloud: fetching RTDB ref for', userId);
                const snap = await ref.once('value');
                if (!snap.exists()) { 
                    showMessage('warn', 'Aucune donnée cloud trouvée');
                    setSyncStatus('idle', 'Aucune donnée cloud');
                    return; 
                }

                const serverData = snap.val() || {};
                const serverVersion = serverData.version || 0;

                // VALIDATION STRICTE
                const validation = validateSyncData({ membres: serverData.membres, payments: serverData.payments, expenses: serverData.expenses, events: serverData.events, audits: serverData.audits });
                if (!validation.valid) {
                    showMessage('error', '❌ DONNÉES CLOUD CORROMPUES : ' + validation.reason);
                    setSyncStatus('error', 'Données cloud invalides');
                    return;
                }

                // Importer et fusionner automatiquement (sans confirmation)
                try {
                    const events = window.eventsModule ? window.eventsModule.getEvents() : [];
                    const localData = { membres, payments, expenses, events };
                    const mergedData = mergeData(serverData, localData);

                    membres = mergedData.membres || [];
                    payments = mergedData.payments || [];
                    expenses = mergedData.expenses || [];
                    const mergedEvents = mergedData.events || [];

                    safeSet('dahira-membres', membres);
                    safeSet('dahira-payments', payments);
                    safeSet('dahira-expenses', expenses);
                    safeSet('dahira-sync-version', serverVersion);

                    if (window.eventsModule) {
                        localStorage.setItem('dk_events', JSON.stringify(mergedEvents || []));
                        try { window.eventsModule.init(); } catch (e) { console.warn('eventsModule.init error', e); }
                    }

                    renderMembres();
                    renderPayments();
                    renderExpenses();
                    if (window.eventsModule) window.eventsModule.render();
                    updateStats();
                    updateDashboardMetrics();

                    logAudit('cloud_load_merge', `IMPORT SÉCURISÉ (merge appliqué)`, null);
                    renderHistory();
                    console.info('✅ importFromCloud: import + merge automatique réussi');
                    showMessage('success', '✅ Données FUSIONNÉES (import cloud automatique)');
                    setSyncStatus('success', 'Import terminé');
                    setTimeout(() => setSyncStatus('idle', 'Prêt'), 3000);
                } catch (err) {
                    console.error('importFromCloud auto-merge error', err);
                    showMessage('error', 'Erreur lors de l\'import automatique: ' + (err.message || err));
                    setSyncStatus('error', 'Erreur import');
                }
            } catch (error) {
                console.error('importFromCloud error', error);
                showMessage('error', '❌ Erreur import : ' + error.message);
                setSyncStatus('error', 'Erreur lors de l\'import');
            } finally {
                if (btnSave) btnSave.disabled = false;
                if (btnLoad) btnLoad.disabled = false;
            }
        }

        // Anciennes fonctions (conservation pour compatibilité)
        async function signUpFirebase() {
            showMessage('info', 'Utilisez plutôt "Connexion aux Données" > "Synchro vers le Cloud"');
        }

        async function signInFirebase() {
            showMessage('info', 'Utilisez plutôt "Connexion aux Données"');
        }

        async function signOutFirebase() {
            if (!window.firebaseAuth) { showMessage('error', 'Firebase non configuré'); return; }
            try {
                await firebaseAuth.signOut();
                setCurrentUser('');
                showMessage('success', 'Déconnecté');
                logAudit('auth_signout', `Déconnexion`, null);
            } catch (err) { showMessage('error', err.message); }
        }

        // === SYSTÈME DE SYNCHRONISATION SÛR ===
        
        // Fonction de merge : fusionner les données du client avec le serveur
        function mergeData(serverData, clientData) {
            const merged = { ...serverData };
            const mergeArray = (serverArray = [], clientArray = []) => {
                const map = {};
                serverArray.forEach(item => { if (item && item.id) map[item.id] = item; });
                clientArray.forEach(item => { if (item && item.id) map[item.id] = item; });
                return Object.values(map);
            };
            merged.membres = mergeArray(serverData.membres, clientData.membres);
            merged.payments = mergeArray(serverData.payments, clientData.payments);
            merged.expenses = mergeArray(serverData.expenses, clientData.expenses);
            merged.events = mergeArray(serverData.events, clientData.events);
            merged.audits = mergeArray(serverData.audits, clientData.audits);
            return merged;
        }
        
        // Validation stricte : refuser les données vides
        function validateSyncData(data) {
            if (!data || typeof data !== 'object') return { valid: false, reason: 'Données invalides' };
            const { membres = [], payments = [], expenses = [], events = [], audits = [] } = data;
            if (membres.length === 0 && payments.length === 0 && expenses.length === 0 && events.length === 0 && audits.length === 0) {
                return { valid: false, reason: 'Données vides : synchronisation refusée' };
            }
            const hasNoId = (arr) => arr.some(item => !item || !item.id);
            if (hasNoId(membres) || hasNoId(payments) || hasNoId(expenses) || hasNoId(events) || hasNoId(audits)) {
                return { valid: false, reason: 'Certains objets n\'ont pas d\'ID unique' };
            }
            return { valid: true };
        }
        
        // Cloud sync helpers - Maintenant actifs, calls les nouvelles fonctions
        async function cloudSaveAll() {
            // Appelle syncToCloud si connecté
            if (window.firebaseDB) {
                await syncToCloud();
            }
        }

        async function cloudLoadAll() {
            // Appelle importFromCloud si connecté
            if (window.firebaseDB) {
                await importFromCloud();
            }
        }

        // Helpers: safe localStorage access with error handling
        function safeGet(key, fallback) {
            try {
                const raw = localStorage.getItem(key);
                return raw ? JSON.parse(raw) : fallback;
            } catch (err) {
                showMessage('error', `Erreur lecture localStorage (${key}): ${err.message}`);
                return fallback;
            }
        }

        function safeSet(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (err) {
                if (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                    showMessage('error', 'Espace localStorage insuffisant. Sauvegarde impossible.');
                } else {
                    showMessage('error', `Erreur écriture localStorage: ${err.message}`);
                }
                return false;
            }
        }

        // Simple in-UI message (toast/banner)
        function showMessage(type, text, timeout = 4000) {
            let container = document.getElementById('app-messages');
            if (!container) {
                container = document.createElement('div');
                container.id = 'app-messages';
                container.style.position = 'fixed';
                container.style.top = '1rem';
                container.style.right = '1rem';
                container.style.zIndex = 2000;
                document.body.appendChild(container);
            }
            const el = document.createElement('div');
            el.style.marginBottom = '0.5rem';
            el.style.padding = '0.75rem 1rem';
            el.style.borderRadius = '0.5rem';
            el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
            el.style.color = 'white';
            el.style.fontWeight = '600';
            el.textContent = text;
            if (type === 'error') el.style.background = '#dc2626';
            else if (type === 'warn') el.style.background = '#f59e0b';
            else el.style.background = '#059669';
            container.appendChild(el);
            setTimeout(() => {
                el.style.transition = 'opacity 300ms';
                el.style.opacity = '0';
                setTimeout(() => el.remove(), 300);
            }, timeout);
        }

        // Sync status UI
        function setSyncStatus(state, text) {
            const el = document.getElementById('sync-status');
            if (!el) return;
            el.className = 'sync-status ' + state;
            if (state === 'syncing') {
                el.innerHTML = '<span class="sync-spinner"></span>' + (text ? (' ' + text) : ' Synchronisation...');
            } else if (state === 'success') {
                el.textContent = (text || 'Succès');
            } else if (state === 'error') {
                el.textContent = (text || 'Erreur');
            } else { // idle
                el.textContent = (text || 'Idle');
            }
        }

        // --- NOUVEAU: MODE SOMBRE ---
        function initDarkMode() {
            const isDark = safeGet('dahira-dark-mode', false);
            if (isDark) document.body.classList.add('dark-mode');
        }

        function toggleDarkMode() {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            safeSet('dahira-dark-mode', isDark);
            const btn = document.getElementById('btn-theme');
            if (btn) btn.textContent = isDark ? '☀️ Mode Clair' : '🌙 Mode Sombre';
        }

        // --- NOUVEAU: EXPORT EXCEL (CSV) ---
        function exportExcel() {
            // Créer l'en-tête CSV
            let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // \uFEFF pour Excel UTF-8
            csvContent += "ID,Nom,Prenom,Sexe,Telephone,Email,Date Adhesion,Total Cotisations\n";

            // Ajouter les données
            membres.forEach(m => {
                const stats = getMemberStats(m.id);
                const row = [
                    m.id,
                    `"${m.nom}"`,
                    `"${m.prenom}"`,
                    m.sexe === 'M' ? 'Masculin' : 'Féminin',
                    `"${m.telephone || ''}"`,
                    `"${m.email || ''}"`,
                    m.dateAdhesion,
                    stats.total
                ].join(",");
                csvContent += row + "\n";
            });

            // Télécharger
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "dahira_membres_" + getTodayDateString() + ".csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showMessage('success', '✅ Fichier Excel (CSV) généré !');
        }

        // Current user helpers and audit logging
        function getCurrentUser() {
            try {
                const u = safeGet('dahira-current-user', '');
                return u || '';
            } catch (err) { return ''; }
        }

        function setCurrentUser(name) {
            try {
                safeSet('dahira-current-user', name || '');
                window.__currentUser = name || '';
            } catch (err) { console.warn('setCurrentUser error', err); }
        }

        function logAudit(action, details, relatedVersionId = null) {
            try {
                // some actions are purely technical and clutter the history; ignore them entirely
                const suppressed = ['auth-login','auth_login_import','cloud_save_direct','cloud_save_merge','cloud_load_merge'];
                if (suppressed.includes(action)) return;

                // strip sensitive info from details for a few actions
                if (action === 'auth-login') {
                    details = 'Connexion';
                }

                const user = window.__currentUser || (window.firebaseAuth && window.firebaseAuth.currentUser && (window.firebaseAuth.currentUser.email || window.firebaseAuth.currentUser.uid)) || 'anonymous';
                const audits = safeGet('dahira-audit', []);
                const entry = { id: Date.now().toString(), date: new Date().toISOString(), user, action, details, relatedVersionId };
                audits.unshift(entry);
                // keep a reasonable cap
                if (audits.length > 500) audits.pop();
                safeSet('dahira-audit', audits);
                // update UI if visible
                if (document.getElementById('tab-historique')?.classList.contains('active')) renderHistory();
            } catch (err) {
                console.warn('logAudit error', err);
            }
        }

        // Affiche le journal d'historique dans l'onglet
        function renderHistory() {
            const listEl = document.getElementById('history-list');
            if (!listEl) return;
            const audits = safeGet('dahira-audit', []);
            if (audits.length === 0) {
                listEl.innerHTML = '<p style="text-align:center; color:#6b7280;">Aucun historique disponible.</p>';
                return;
            }
            listEl.innerHTML = '<table style="width:100%; border-collapse: collapse;">' +
                '<thead><tr><th>Date</th><th>Utilisateur</th><th>Action</th><th>Détails</th></tr></thead>' +
                '<tbody>' +
                audits.map(a => {
                    let user = a.user || '';
                    if (user.includes('@') || user.match(/^[0-9a-fA-F]{6,}$/)) user = 'Utilisateur';
                    return `<tr>` +
                        `<td style="padding:0.5rem;border-bottom:1px solid #e5e7eb;">${new Date(a.date).toLocaleString('fr-FR')}</td>` +
                        `<td style="padding:0.5rem;border-bottom:1px solid #e5e7eb;">${user}</td>` +
                        `<td style="padding:0.5rem;border-bottom:1px solid #e5e7eb;">${a.action}</td>` +
                        `<td style="padding:0.5rem;border-bottom:1px solid #e5e7eb;">${a.details}</td>` +
                    `</tr>`;
                }).join('') +
                '</tbody></table>';
        }

        function ensureMasterPassword() {
            return;
        }

        function showConfirm(message, onConfirm, onCancel) {
            const id = 'confirm-modal';
            let modal = document.getElementById(id);
            if (!modal) {
                modal = document.createElement('div');
                modal.id = id;
                modal.className = 'modal active';
                modal.innerHTML = `
                    <div class="modal-content">
                        <div class="modal-header"><h3>Confirmation</h3></div>
                        <div class="modal-body" style="padding:1.25rem;"></div>
                        <div style="display:flex; gap:0.5rem; padding:1rem; justify-content:flex-end;">
                            <button id="confirm-no" class="btn-secondary">Annuler</button>
                            <button id="confirm-yes" class="btn-primary">Confirmer</button>
                        </div>
                    </div>`;
                document.body.appendChild(modal);
            }
            modal.querySelector('.modal-body').textContent = message;
            modal.classList.add('active');
            modal.querySelector('#confirm-no').onclick = () => {
                modal.classList.remove('active');
                try { if (typeof onCancel === 'function') onCancel(); } catch (e) { console.warn('onCancel error', e); }
            };
            modal.querySelector('#confirm-yes').onclick = () => {
                modal.classList.remove('active');
                try { onConfirm(); } catch (e) { console.warn('onConfirm error', e); }
            };
        }

        // simple text-input modal (non-blocking) used for entering prenom
        function showPrompt(message, defaultValue, onResult, onCancel) {
            const id = 'prompt-modal';
            let modal = document.getElementById(id);
            if (!modal) {
                modal = document.createElement('div');
                modal.id = id;
                modal.className = 'modal active';
                modal.innerHTML = `
                    <div class="modal-content">
                        <div class="modal-header"><h3>Entrée</h3></div>
                        <div class="modal-body" style="padding:1rem;">
                            <input type="text" id="prompt-input" class="form-input" style="width:100%;" />
                        </div>
                        <div style="display:flex; gap:0.5rem; padding:1rem; justify-content:flex-end;">
                            <button id="prompt-cancel" class="btn-secondary">Annuler</button>
                            <button id="prompt-ok" class="btn-primary">OK</button>
                        </div>
                    </div>`;
                document.body.appendChild(modal);
            }
            const input = modal.querySelector('#prompt-input');
            input.value = defaultValue || '';
            modal.querySelector('.modal-header h3').textContent = message;
            modal.classList.add('active');
            input.focus();
            modal.querySelector('#prompt-cancel').onclick = () => {
                modal.classList.remove('active');
                if (typeof onCancel === 'function') onCancel();
            };
            modal.querySelector('#prompt-ok').onclick = () => {
                const val = input.value;
                modal.classList.remove('active');
                if (typeof onResult === 'function') onResult(val);
            };
        }

        window.chartInstances = {};

        let membres = safeGet('dahira-membres', []);
        let payments = safeGet('dahira-payments', []);
        let expenses = safeGet('dahira-expenses', []);
        let editingMembreId = null;
        let currentMembreId = null;

        // Helper: Date du jour en YYYY-MM-DD local
        function getTodayDateString() {
            const date = new Date();
            const offset = date.getTimezoneOffset() * 60000;
            return new Date(date.getTime() - offset).toISOString().split('T')[0];
        }

        // ========== SYSTÈME DE CARTES MEMBRES ==========
        let memberPhotos = {};

        // ========== CHARGEMENT DES PHOTOS DES MEMBRES ==========
        async function loadMemberPhotos() {
            try {
                memberPhotos = safeGet('dahira-member-photos', {});
                console.log('Photos des membres chargées depuis localStorage:', Object.keys(memberPhotos).length);
            } catch (error) {
                console.error('Erreur chargement photos locales:', error);
                memberPhotos = {};
            }
        }

        function deleteMemberPhoto(memberId) {
            if (memberPhotos[memberId]) {
                delete memberPhotos[memberId];
                safeSet('dahira-member-photos', memberPhotos);
                showMessage('success', 'Photo supprimée');
                // remove preview inside modal if present
                const preview = document.getElementById('membre-photo-preview');
                if (preview) preview.remove();
                const deleteBtn = document.getElementById('membre-photo-delete');
                if (deleteBtn) deleteBtn.remove();
                const photoInput = document.getElementById('membre-photo');
                if (photoInput) photoInput.value = '';
                renderCartes();
            } else {
                showMessage('warn', 'Aucune photo trouvée pour ce membre');
            }
        }

        async function uploadMemberPhoto(memberId) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';

            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) {
                    showMessage('error', 'La photo ne doit pas dépasser 5MB');
                    return;
                }
                if (!file.type.startsWith('image/')) {
                    showMessage('error', 'Fichier invalide. Sélectionnez une image.');
                    return;
                }
                try {
                    showMessage('info', 'Traitement de la photo...');
                    setSyncStatus('syncing', 'Sauvegarde photo...');
                    const reader = new FileReader();
                    reader.onload = function (event) {
                        const base64Data = event.target.result;
                        memberPhotos[memberId] = {
                            url: base64Data,
                            uploadedAt: new Date().toISOString(),
                            fileName: file.name,
                            fileSize: file.size,
                            local: true
                        };
                        if (safeSet('dahira-member-photos', memberPhotos)) {
                            showMessage('success', 'Photo sauvegardée localement avec succès');
                            setSyncStatus('success', 'Photo sauvegardée');
                            setTimeout(() => setSyncStatus('idle', 'Prêt'), 2000);
                            renderCartes();
                            try { if (window.firebaseAuth && firebaseAuth.currentUser) cloudSaveAll(); } catch (e) { console.warn('cloudSaveAll error', e); }
                        } else {
                            showMessage('error', 'Erreur lors de la sauvegarde locale');
                            setSyncStatus('error', 'Erreur sauvegarde');
                        }
                    };
                    reader.onerror = function () {
                        showMessage('error', 'Erreur lors de la lecture du fichier');
                        setSyncStatus('error', 'Erreur lecture');
                    };
                    reader.readAsDataURL(file);
                } catch (err) {
                    console.error('Erreur traitement photo:', err);
                    showMessage('error', 'Erreur lors du traitement: ' + err.message);
                    setSyncStatus('error', 'Erreur traitement');
                }
            };
            input.click();
        }

        function generateQRCode(memberId, containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;
            container.innerHTML = '';
            
            // Toujours utiliser l'URL GitHub Pages pour que le QR code soit utilisable partout
            const profileUrl = `https://dahirakenal1-ops.github.io/DARA/profil.html?id=${memberId}`;
            
            new QRCode(container, {
                text: profileUrl,
                width: 150,
                height: 150,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }

        function createMemberCard(membre) {
            const photoData = memberPhotos[membre.id];
            const photoUrl = photoData?.url || '';
            const qrId = `qr-${membre.id}`;
            
            // Préparer la catégorie d'âge
            const categorieAge = membre.categorieAge || 'adulte';
            const categorieLabel = categorieAge === 'enfant' ? '👶 Enfant' : 
                                   categorieAge === '3eme-age' ? '👴 3ème âge' : 
                                   '👤 Adulte';
            
            // Préparer les rôles
            const roles = membre.roles || [];
            const rolesDisplay = roles.length > 0 ? 
                roles.map(r => {
                    const roleLabels = {
                        'membre-simple': 'Simple',
                        'membre-finance': 'Finance',
                        'membre-bureau': 'Bureau',
                        'membre-audiovisuel': 'Audio-Visuel',
                        'membre-culturel': 'Culturel',
                        'membre-kourel': 'Kourel',
                        'membre-organisation': 'Organisation'
                    };
                    return roleLabels[r] || r;
                }).join(', ') : 'Aucun rôle';

            return `
                <div class="member-card-digital" id="card-${membre.id}">
                    <div class="card-header">
                        <div class="card-logo">🕌 Dahira Kenal</div>
                        <div class="card-id">ID: ${membre.id.slice(-6)}</div>
                    </div>
                    
                    <div class="card-photo-section">
                        <div class="card-photo-wrapper">
                            ${photoUrl ?
                    `<img src="${photoUrl}" alt="${membre.prenom} ${membre.nom}" class="card-photo">` :
                    `<div class="card-photo">👤</div>`
                }
                        </div>
                        <div class="card-info">
                            <div class="card-name">${membre.prenom} ${membre.nom}</div>
                            <div class="card-date">📅 Membre depuis le ${new Date(membre.dateAdhesion).toLocaleDateString('fr-FR')}</div>
                            <div class="card-date" style="margin-top: 0.5rem;">🔖 ${membre.sexe === 'F' ? 'Femme' : 'Homme'}</div>
                            <div class="card-date" style="margin-top: 0.5rem; color: #6b7280;">${categorieLabel}</div>
                            <div class="card-date" style="margin-top: 0.5rem; color: #059669; font-weight: 500; font-size: 0.9rem;">🎯 ${rolesDisplay}</div>
                        </div>
                    </div>
                    
                    <div class="card-qr-section">
                        <div id="${qrId}" class="card-qr-code"></div>
                    </div>
                    
                    <div class="card-actions">
                        <button class="card-action-btn" onclick="uploadMemberPhoto('${membre.id}')">
                            📸 Photo
                        </button>
                        ${photoUrl ? `<button class="card-action-btn" onclick="deleteMemberPhoto('${membre.id}')" style="background: #dc2626;">
                            🗑️ Supp. Photo
                        </button>` : ''}
                        <button class="card-action-btn" onclick="viewCardFullscreen('${membre.id}')">
                            🔍 Voir
                        </button>
                        <button class="card-action-btn" data-print="member-card" data-print-id="${membre.id}" onclick="printMemberCard('${membre.id}')">
                            🖨️ Imprimer
                        </button>
                    </div>
                </div>
            `;
        }

        function renderCartes(searchTerm = '') {
            const container = document.getElementById('carte-list');
            if (!container) return;
            let filteredMembres = membres;
            if (searchTerm.trim()) {
                const term = searchTerm.toLowerCase().trim();
                filteredMembres = membres.filter(m => {
                    const fullName = `${m.prenom} ${m.nom}`.toLowerCase();
                    return fullName.includes(term);
                });
            }
            if (filteredMembres.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>Aucun membre trouvé</p></div>';
                return;
            }
            const sorted = [...filteredMembres].sort((a, b) => {
                const nameA = `${a.nom} ${a.prenom}`.toLowerCase();
                const nameB = `${b.nom} ${b.prenom}`.toLowerCase();
                return nameA.localeCompare(nameB);
            });
            container.innerHTML = sorted.map(m => createMemberCard(m)).join('');
            setTimeout(() => {
                sorted.forEach(m => {
                    generateQRCode(m.id, `qr-${m.id}`);
                });
            }, 100);
        }

        function viewCardFullscreen(memberId) {
            const membre = membres.find(m => m.id === memberId);
            if (!membre) return;
            const modal = document.getElementById('card-modal');
            const modalBody = document.getElementById('card-modal-body');
            modalBody.innerHTML = createMemberCard(membre);
            modal.classList.add('active');
            setTimeout(() => {
                generateQRCode(membre.id, `qr-${membre.id}`);
            }, 100);
        }

        function closeCardModal() {
            document.getElementById('card-modal').classList.remove('active');
        }

        function printMemberCard(memberId, doPrint = true) {
            const membre = membres.find(m => m.id === memberId);
            if (!membre) return;
            const printArea = document.getElementById('print-area');
            if (!printArea) return;
            const qrId = `qr-print-${memberId}`;
            const photoData = memberPhotos[memberId];
            const photoUrl = photoData?.url || '';
            
            // Préparer la catégorie d'âge
            const categorieAge = membre.categorieAge || 'adulte';
            const categorieLabel = categorieAge === 'enfant' ? '👶 Enfant' : 
                                   categorieAge === '3eme-age' ? '👴 3ème âge' : 
                                   '👤 Adulte';
            
            // Préparer les rôles
            const roles = membre.roles || [];
            const rolesDisplay = roles.length > 0 ? 
                roles.map(r => {
                    const roleLabels = {
                        'membre-simple': 'Simple',
                        'membre-finance': 'Finance',
                        'membre-bureau': 'Bureau',
                        'membre-audiovisuel': 'Audio-Visuel',
                        'membre-culturel': 'Culturel',
                        'membre-kourel': 'Kourel',
                        'membre-organisation': 'Organisation'
                    };
                    return roleLabels[r] || r;
                }).join(', ') : 'Aucun rôle';
                
            printArea.innerHTML = `
                <div class="card-print-area" style="padding: 2rem; max-width: 600px; margin: 0 auto;">
                    <div class="member-card-digital" style="break-inside: avoid;">
                        <div class="card-header">
                            <div class="card-logo">🕌 Dahira Kenal</div>
                            <div class="card-id">ID: ${membre.id.slice(-6)}</div>
                        </div>
                        <div class="card-photo-section">
                            <div class="card-photo-wrapper">
                                ${photoUrl ?
                    `<img src="${photoUrl}" alt="${membre.prenom} ${membre.nom}" class="card-photo">` :
                    `<div class="card-photo">👤</div>`
                }
                            </div>
                            <div class="card-info">
                                <div class="card-name">${membre.prenom} ${membre.nom}</div>
                                <div class="card-date">📅 Membre depuis le ${new Date(membre.dateAdhesion).toLocaleDateString('fr-FR')}</div>
                                <div class="card-date" style="margin-top: 0.5rem;">🔖 ${membre.sexe === 'F' ? 'Femme' : 'Homme'}</div>
                                <div class="card-date" style="margin-top: 0.5rem; color: #6b7280;">${categorieLabel}</div>
                                <div class="card-date" style="margin-top: 0.5rem; color: #059669; font-weight: 500;">🎯 ${rolesDisplay}</div>
                            </div>
                        </div>
                        <div class="card-qr-section">
                            <div id="${qrId}" class="card-qr-code"></div>
                        </div>
                    </div>
                </div>
            `;
            printArea.style.display = 'block';
            setTimeout(() => {
                generateQRCode(membre.id, qrId);
                setTimeout(() => {
                    if (doPrint) {
                        window.print();
                        setTimeout(() => printArea.style.display = 'none', 1000);
                    }
                }, 500);
            }, 100);
        }

        document.addEventListener('click', (e) => {
            const modal = document.getElementById('card-modal');
            if (e.target === modal) closeCardModal();
        });

        function showTab(tabName, event) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            if (event) {
                event.target.classList.add('active');
            } else {
                const tabs = document.querySelectorAll('.tab');
                tabs.forEach(t => {
                    if (t.getAttribute('onclick').includes(`'${tabName}'`)) {
                        t.classList.add('active');
                    }
                });
            }

            document.getElementById('tab-' + tabName).classList.add('active');
            if (tabName === 'historique' && window.renderHistory) renderHistory();
            
            if (tabName === 'evenements') {
                eventsModule.render(); // Afficher les événements quand on clique sur l'onglet
            }
            if (tabName === 'stats') updateStats();
            if (tabName === 'calculateur') loadCalculatorData();
            if (tabName === 'rapports') {
                initRapportDates();
                updateEventReportsButtons();
            }
            if (tabName === 'dashboard') initDashboard();
            if (tabName === 'parametre') renderParameterForm();
            if (tabName === 'paiements') renderPayments();
            if (tabName === 'depenses') renderExpenses();
            if (tabName === 'carte') {
                loadMemberPhotos().then(() => {
                    const searchTerm = document.getElementById('carte-search-input').value;
                    renderCartes(searchTerm);
                });
            }
        }

        function openWhatsApp(phoneNumber, memberName, memberId) {
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();
            const currentMonthPayments = payments.filter(p => {
                const paymentDate = new Date(p.date);
                return p.memberId === memberId &&
                    paymentDate.getMonth() === currentMonth &&
                    paymentDate.getFullYear() === currentYear;
            });
            const hebdoPaid = currentMonthPayments
                .filter(p => p.type === 'hebdomadaire')
                .reduce((sum, p) => sum + p.montant, 0);
            const mensuelPaid = currentMonthPayments
                .filter(p => p.type === 'mensuelle')
                .reduce((sum, p) => sum + p.montant, 0);
            const member = membres.find(m => m.id === memberId);
            const sexe = member && member.sexe ? member.sexe : 'all';
            const hebdoRequired = getAmount('hebdomadaire', sexe, true);
            const mensuelRequired = getAmount('mensuelle', sexe);
            const hebdoRemaining = Math.max(0, hebdoRequired - hebdoPaid);
            const mensuelRemaining = Math.max(0, mensuelRequired - mensuelPaid);
            const totalRemaining = hebdoRemaining + mensuelRemaining;
            let cleanNumber = phoneNumber.replace(/\s+/g, '').replace(/[^\d]/g, '');
            if (cleanNumber.startsWith('77') || cleanNumber.startsWith('78') || cleanNumber.startsWith('76') || cleanNumber.startsWith('70')) {
                cleanNumber = '221' + cleanNumber;
            } else if (!cleanNumber.startsWith('221') && cleanNumber.length === 9) {
                cleanNumber = '221' + cleanNumber;
            }
            let message = `Assalamou aleykoum ${memberName}, ceci est un message de la Dahira Kenal.`;
            if (totalRemaining > 0) {
                message += `\n\n Il vous reste des ADIYA ce mois-ci :\n`;
                if (hebdoRemaining > 0) message += `• Hebdomadaire : ${hebdoRemaining} FCFA\n`;
                if (mensuelRemaining > 0) message += `• Mensuelle : ${mensuelRemaining} FCFA\n`;
                message += `• Total restant : ${totalRemaining} FCFA\n\n Vous pouvez régler votre ADIYA en nous contactant directement ou via Wave en cliquant sur ce lien https://pay.wave.com/m/M_sn__iXmGOL_WZTs/c/sn/ . `;
            } else {
                message += `\n\n✅ Alhamdoulilah ! Vous êtes à jour pour ce mois-ci.\n\nBarakallahu fik pour votre engagement. `;
            }
            const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        }

        function openModal(type, membreId = null) {
            if (type === 'firebaseLogin') {
                // Ouvrir la modale Firebase login
                document.getElementById('firebase-email').value = '';
                document.getElementById('firebase-password').value = '';
                document.getElementById('firebase-error').style.display = 'none';
                document.getElementById('modal-firebase-login').classList.add('active');
            } else if (type === 'addMember') {
                document.getElementById('modal-membre-title').textContent = 'Nouveau Membre';
                document.getElementById('membre-nom').value = '';
                document.getElementById('membre-prenom').value = '';
                document.getElementById('membre-sexe').value = 'M';
                document.getElementById('membre-tel').value = '';
                document.getElementById('membre-date').value = getTodayDateString();
                document.getElementById('membre-categorie-age').value = 'adulte';
                // Décocher toutes les checkboxes de rôles
                document.getElementById('role-simple').checked = false;
                document.getElementById('role-finance').checked = false;
                document.getElementById('role-bureau').checked = false;
                document.getElementById('role-audiovisuel').checked = false;
                document.getElementById('role-culturel').checked = false;
                document.getElementById('role-kourel').checked = false;
                document.getElementById('role-organisation').checked = false;
                editingMembreId = null;
                // clear photo input and preview
                const photoInput = document.getElementById('membre-photo');
                if (photoInput) photoInput.value = '';
                const oldPreview = document.getElementById('membre-photo-preview');
                if (oldPreview) oldPreview.remove();
                document.getElementById('modal-membre').classList.add('active');
            } else if (type === 'editMember') {
                const membre = membres.find(m => m.id === membreId);
                document.getElementById('modal-membre-title').textContent = 'Modifier le Membre';
                document.getElementById('membre-nom').value = membre.nom;
                document.getElementById('membre-prenom').value = membre.prenom;
                document.getElementById('membre-sexe').value = membre.sexe || 'M';
                document.getElementById('membre-tel').value = membre.telephone || ''; // handle undefined
                document.getElementById('membre-email').value = membre.email || '';
                document.getElementById('membre-date').value = membre.dateAdhesion;
                document.getElementById('membre-categorie-age').value = membre.categorieAge || 'adulte';
                // Cocher les rôles du membre
                const roles = membre.roles || [];
                document.getElementById('role-simple').checked = roles.includes('membre-simple');
                document.getElementById('role-finance').checked = roles.includes('membre-finance');
                document.getElementById('role-bureau').checked = roles.includes('membre-bureau');
                document.getElementById('role-audiovisuel').checked = roles.includes('membre-audiovisuel');
                document.getElementById('role-culturel').checked = roles.includes('membre-culturel');
                document.getElementById('role-kourel').checked = roles.includes('membre-kourel');
                document.getElementById('role-organisation').checked = roles.includes('membre-organisation');
                // reset photo input / show preview if exists
                const photoInput = document.getElementById('membre-photo');
                if (photoInput) photoInput.value = '';
                const existingPhoto = memberPhotos[membreId] ? memberPhotos[membreId].url : null;
                let preview = document.getElementById('membre-photo-preview');
                if (existingPhoto) {
                    if (!preview) {
                        preview = document.createElement('img');
                        preview.id = 'membre-photo-preview';
                        preview.style.width = '120px';
                        preview.style.height = '120px';
                        preview.style.objectFit = 'cover';
                        preview.style.display = 'block';
                        preview.style.marginTop = '0.5rem';
                        photoInput.parentNode.appendChild(preview);
                    }
                    preview.src = existingPhoto;
                    // add small delete button next to preview
                    let deleteBtn = document.getElementById('membre-photo-delete');
                    if (!deleteBtn) {
                        deleteBtn = document.createElement('button');
                        deleteBtn.id = 'membre-photo-delete';
                        deleteBtn.className = 'btn-secondary';
                        deleteBtn.style.marginLeft = '0.5rem';
                        deleteBtn.style.display = 'inline-block';
                        deleteBtn.textContent = 'Supprimer la photo';
                        deleteBtn.onclick = function () {
                            deleteMemberPhoto(membreId);
                        };
                        photoInput.parentNode.appendChild(deleteBtn);
                    }
                } else if (preview) {
                    preview.remove();
                    const deleteBtn = document.getElementById('membre-photo-delete');
                    if (deleteBtn) deleteBtn.remove();
                }

                editingMembreId = membreId;
                document.getElementById('modal-membre').classList.add('active');
            } else if (type === 'addPayment') {
                currentMembreId = membreId;
                // determine gender for the current member (fallback 'all')
                let sexe = 'all';
                const member = membres.find(m=>m.id===currentMembreId);
                if (member && member.sexe) sexe = member.sexe;
                // build the select options using configured amounts for that gender
                document.getElementById('payment-type').innerHTML = `
                    <option value="hebdomadaire">Hebdomadaire (${getAmount('hebdomadaire', sexe)} FCFA)</option>
                    <option value="mensuelle">Mensuelle (${getAmount('mensuelle', sexe)} FCFA)</option>
                    <option value="social">Caisse sociale (${getAmount('social', sexe)} FCFA)</option>
                    <option value="diayante">Diayante (${getAmount('diayante', sexe)} FCFA)</option>
                    ${eventsModule.getEvents().map(evt => `<option value="${evt.caisse}">${evt.title} (${evt.fee} FCFA)</option>`).join('')}
                `;
                document.getElementById('payment-date').value = getTodayDateString();
                document.getElementById('payment-type').value = 'hebdomadaire';
                // set montant using gender-specific amount
                updatePaymentAmount();
                document.getElementById('payment-methode').value = 'espèces';
                document.getElementById('modal-paiement').classList.add('active');
            }
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
        }

        function openCardModal(memberId) {
            const membre = membres.find(m => m.id === memberId);
            if (!membre) return;
            const stats = getMemberStats(memberId);
            const photoData = memberPhotos[memberId];
            const photoUrl = photoData?.url || 'https://via.placeholder.com/150x150?text=Photo';
            const categorieAge = membre.categorieAge || 'adulte';
            const categorieLabel = categorieAge === 'enfant' ? '👶 Enfant' : 
                                   categorieAge === '3eme-age' ? '👴 3ème âge' : 
                                   '👤 Adulte';
            const roles = membre.roles || [];
            const rolesDisplay = roles.length > 0 ? 
                roles.map(r => {
                    const roleLabels = {
                        'membre-simple': '👥 Simple',
                        'membre-finance': '💰 Finance',
                        'membre-bureau': '🏢 Bureau',
                        'membre-audiovisuel': '🎥 Audio-Visuel',
                        'membre-culturel': '📚 Culturel',
                        'membre-kourel': '🕌 Kourel',
                        'membre-organisation': '📋 Organisation'
                    };
                    return roleLabels[r] || r;
                }).join(', ') : 'Aucun rôle';
                
            const modalBody = document.getElementById('card-modal-body');
            modalBody.innerHTML = `
                <div class="member-card-digital large">
                    <div class="card-header">
                        <div class="card-photo">
                            <img src="${photoUrl}" alt="Photo de ${membre.prenom} ${membre.nom}" onerror="this.src='https://via.placeholder.com/150x150?text=Photo'">
                        </div>
                        <div class="card-info">
                            <h2>${membre.prenom} ${membre.nom}</h2>
                            <p>📅 ${new Date(membre.dateAdhesion).toLocaleDateString('fr-FR')}</p>
                            <p>📞 ${membre.telephone || 'Non fourni'}</p>
                            <p>✉️ ${membre.email || 'Non fourni'}</p>
                            <p style="color: #6b7280; margin-top: 0.5rem;">${categorieLabel}</p>
                            <p style="color: #059669; font-weight: 500; margin-top: 0.25rem;">${rolesDisplay}</p>
                        </div>
                    </div>
                    <div class="card-stats">
                        <div class="stat-item">
                            <span class="stat-label">Hebdo</span>
                            <span class="stat-value">${stats.hebdo} F</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Mensuel</span>
                            <span class="stat-value">${stats.mensuel} F</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Total</span>
                            <span class="stat-value">${stats.total} F</span>
                        </div>
                    </div>
                    <div class="card-qr large">
                        <div id="modal-qr-${membre.id}" class="qr-code"></div>
                    </div>
                </div>
            `;
            setTimeout(() => {
                const qrContainer = document.getElementById(`modal-qr-${membre.id}`);
                if (qrContainer && window.QRCode) {
                    let profileUrl;
                    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                        profileUrl = `https://dahirakenal1-ops.github.io/DARA/profil.html?id=${membre.id}`;
                    } else {
                        const pathParts = window.location.pathname.split('/').filter(p => p);
                        const repoName = pathParts.length > 0 && window.location.hostname.includes('github.io') ? pathParts[0] : '';
                        const baseUrl = repoName ? `${window.location.origin}/${repoName}` : window.location.origin;
                        profileUrl = `${baseUrl}/profil.html?id=${membre.id}`;
                    }
                    new QRCode(qrContainer, {
                        text: profileUrl,
                        width: 150,
                        height: 150
                    });
                }
            }, 100);
            document.getElementById('card-modal').classList.add('active');
        }

        function closeCardModal() {
            document.getElementById('card-modal').classList.remove('active');
        }

        async function saveMembre() {
            logAudit('member_save_attempt', 'Tentative d\'enregistrement membre', null);
            const nom = document.getElementById('membre-nom').value.trim();
            const prenom = document.getElementById('membre-prenom').value.trim();
            const sexe = document.getElementById('membre-sexe').value;
            let telephone = document.getElementById('membre-tel').value.trim();
            const email = document.getElementById('membre-email').value.trim();
            const dateAdhesion = document.getElementById('membre-date').value;
            const categorieAge = document.getElementById('membre-categorie-age').value;

            // Récupérer les rôles sélectionnés
            const roles = [];
            if (document.getElementById('role-simple').checked) roles.push('membre-simple');
            if (document.getElementById('role-finance').checked) roles.push('membre-finance');
            if (document.getElementById('role-bureau').checked) roles.push('membre-bureau');
            if (document.getElementById('role-audiovisuel').checked) roles.push('membre-audiovisuel');
            if (document.getElementById('role-culturel').checked) roles.push('membre-culturel');
            if (document.getElementById('role-kourel').checked) roles.push('membre-kourel');
            if (document.getElementById('role-organisation').checked) roles.push('membre-organisation');

            if (!nom || !prenom) {
                showMessage('error', 'Veuillez remplir au moins le nom et le prénom');
                return;
            }

            // identifier ou créer un id en avance pour la photo
            const isEdit = !!editingMembreId;
            const memberId = isEdit ? editingMembreId : Date.now().toString();

            // photo du membre (optionnel)
            const photoInput = document.getElementById('membre-photo');
            if (photoInput && photoInput.files && photoInput.files[0]) {
                const file = photoInput.files[0];
                if (file.size > 5 * 1024 * 1024) {
                    showMessage('error', 'La photo ne doit pas dépasser 5MB');
                    return;
                }
                if (!file.type.startsWith('image/')) {
                    showMessage('error', 'Fichier invalide. Sélectionnez une image.');
                    return;
                }
                try {
                    const base64 = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = e => resolve(e.target.result);
                        reader.onerror = e => reject(e);
                        reader.readAsDataURL(file);
                    });
                    memberPhotos[memberId] = {
                        url: base64,
                        uploadedAt: new Date().toISOString(),
                        fileName: file.name,
                        fileSize: file.size,
                        local: true
                    };
                    safeSet('dahira-member-photos', memberPhotos);
                } catch (err) {
                    console.error('photo read error', err);
                    showMessage('error', 'Erreur lors de la lecture de la photo');
                }
            }

            if (telephone && !validatePhone(telephone)) {
                showFieldError('membre-tel-error', 'Numéro invalide. Exemple: 77 123 45 67');
                document.getElementById('membre-tel').classList.add('input-invalid');
                return;
            } else {
                hideFieldError('membre-tel-error');
                document.getElementById('membre-tel').classList.remove('input-invalid');
            }

            if (email && !validateEmail(email)) {
                showFieldError('membre-email-error', 'Email invalide');
                document.getElementById('membre-email').classList.add('input-invalid');
                return;
            } else {
                hideFieldError('membre-email-error');
                document.getElementById('membre-email').classList.remove('input-invalid');
            }

            if (isEdit) {
                const index = membres.findIndex(m => m.id === memberId);
                membres[index] = { id: memberId, nom, prenom, sexe, telephone, email, dateAdhesion, categorieAge, roles };
                logAudit('member_edit', `Édité membre ${prenom} ${nom}`, memberId);
            } else {
                logAudit('member_add', `Ajouté membre ${prenom} ${nom}`, memberId);
                membres.push({
                    id: memberId,
                    nom,
                    prenom,
                    sexe,
                    telephone,
                    email,
                    dateAdhesion,
                    categorieAge,
                    roles
                });
            }

            if (safeSet('dahira-membres', membres)) {
                showMessage('success', 'Membre enregistré');
            }
            renderMembres();
            loadCalculatorData();
            // also refresh cartes in case user is viewing that tab
            loadMemberPhotos().then(() => renderCartes());
            try { if (window.firebaseAuth && firebaseAuth.currentUser) cloudSaveAll(); } catch (e) { console.warn('cloudSaveAll error', e); }
            updateDashboardMetrics();
            // reset photo input for next time
            const photoInput2 = document.getElementById('membre-photo');
            if (photoInput2) photoInput2.value = '';
            closeModal('modal-membre');
        }

        // --- PARAMÈTRES CONFIGURABLES ---
        // montant par type (hebdo, mensuel...) avec déclinaisons par sexe
        let dahiraParams = safeGet('dahira-params', {
            amounts: {
                hebdomadaire: { all: 250, M: 250, F: 250 },
                mensuelle:    { all: 500, M: 500, F: 500 },
                social:       { all: 500, M: 500, F: 500 },
                diayante:     { all: 10000, M: 10000, F: 10000 }
            }
        });

        function saveParameters() {
            // read values from inputs (only male/female) and persist
            ['hebdomadaire','mensuelle','social','diayante'].forEach(type => {
                if (!dahiraParams.amounts[type]) dahiraParams.amounts[type] = {};
                ['M','F'].forEach(gender => {
                    const el = document.getElementById(`param-${type}-${gender}`);
                    if (el) {
                        const val = parseInt(el.value) || 0;
                        dahiraParams.amounts[type][gender] = val;
                    }
                });
                // remove any legacy 'all' key so it doesn't override gender-specific values
                if ('all' in dahiraParams.amounts[type]) {
                    delete dahiraParams.amounts[type].all;
                }
            });
            safeSet('dahira-params', dahiraParams);
            showMessage('success','Paramètres enregistrés');
            // force re-render of anything that depends on these values
            renderMembres();
            renderPayments();
            updateDashboardMetrics();
            renderCartes();
            calculateIndividual();
            calculateGlobal();
        }

        function renderParameterForm() {
            ['hebdomadaire','mensuelle','social','diayante'].forEach(type => {
                ['M','F'].forEach(gender => {
                    const el = document.getElementById(`param-${type}-${gender}`);
                    if (el && dahiraParams.amounts[type]) {
                        el.value = dahiraParams.amounts[type][gender] || 0;
                    }
                });
            });
        }

        function getAmount(type, sexe, isMonthly = false) {
            let value = 0;
            if (dahiraParams.amounts[type]) {
                if (sexe === 'all') {
                    // try explicit all
                    if (dahiraParams.amounts[type].all !== undefined) {
                        value = dahiraParams.amounts[type].all;
                    } else {
                        // average M and F if both defined
                        const m = dahiraParams.amounts[type].M;
                        const f = dahiraParams.amounts[type].F;
                        if (m !== undefined && f !== undefined) {
                            value = Math.round((m + f) / 2);
                        } else if (m !== undefined) {
                            value = m;
                        } else if (f !== undefined) {
                            value = f;
                        }
                    }
                } else {
                    // prefer explicit gender value; only fallback to all if gender unspecified
                    if (dahiraParams.amounts[type][sexe] !== undefined) {
                        value = dahiraParams.amounts[type][sexe];
                    } else if (dahiraParams.amounts[type].all !== undefined) {
                        // legacy fallback
                        value = dahiraParams.amounts[type].all;
                    }
                }
            }
            if (isMonthly && type === 'hebdomadaire') return value * 4;
            return value;
        }

        function deleteMembre(id) {
            showConfirm('Êtes-vous sûr de vouloir supprimer ce membre ?', () => {
                membres = membres.filter(m => m.id !== id);
                payments = payments.filter(p => p.memberId !== id);
                safeSet('dahira-membres', membres);
                safeSet('dahira-payments', payments);
                renderMembres();
                renderPayments();
                updateDashboardMetrics();
                try { if (window.firebaseAuth && firebaseAuth.currentUser) cloudSaveAll(); } catch (e) { console.warn('cloudSaveAll error', e); }
                showMessage('success', 'Membre supprimé');
                logAudit('member_delete', `Suppression membre ${id}`, id);
            });
        }

        function deletePayment(id) {
            showConfirm('Êtes-vous sûr de vouloir supprimer ce paiement ?', () => {
                const removed = payments.find(p=>p.id===id);
                const member = removed ? membres.find(m=>m.id===removed.memberId) : null;
                const name = member ? `${member.prenom} ${member.nom}` : (removed?removed.memberId:'');
                payments = payments.filter(p => p.id !== id);
                safeSet('dahira-payments', payments);
                renderMembres();
                renderPayments();
                updateStats();
                updateDashboardMetrics();
                try { if (window.firebaseAuth && firebaseAuth.currentUser) cloudSaveAll(); } catch (e) { console.warn('cloudSaveAll error', e); }
                showMessage('success', 'Paiement supprimé');
                logAudit('payment_delete', `Suppression paiement ${removed?removed.montant:''} pour ${name}`, id);
            });
        }

        function savePayment() {
            logAudit('payment_attempt', 'Tentative enregistrement paiement', null);
            const montant = parseFloat(document.getElementById('payment-montant').value);
            const type = document.getElementById('payment-type').value;
            const date = document.getElementById('payment-date').value;
            const methode = document.getElementById('payment-methode').value;
            if (!montant || isNaN(montant) || montant <= 0) {
                showFieldError('payment-montant-error', 'Montant invalide');
                document.getElementById('payment-montant').classList.add('input-invalid');
                return;
            }
            hideFieldError('payment-montant-error');
            document.getElementById('payment-montant').classList.remove('input-invalid');

            payments.push({
                id: Date.now().toString(),
                memberId: currentMembreId,
                montant,
                type,
                date,
                methode
            });
            const member = membres.find(m=>m.id===currentMembreId);
            const name = member ? `${member.prenom} ${member.nom}` : currentMembreId;
            logAudit('payment_add', `Ajout paiement ${montant}FCFA pour ${name}`, null);

            if (safeSet('dahira-payments', payments)) {
                showMessage('success', 'Paiement enregistré');
            }
            renderMembres();
            renderPayments();
            try { if (window.firebaseAuth && firebaseAuth.currentUser) cloudSaveAll(); } catch (e) { console.warn('cloudSaveAll error', e); }
            updateDashboardMetrics();
            closeModal('modal-paiement');
        }

        function updatePaymentAmount() {
            const type = document.getElementById('payment-type').value;
            let sexe = 'all';
            if (currentMembreId) {
                const member = membres.find(m => m.id === currentMembreId);
                if (member && member.sexe) sexe = member.sexe;
            }
            let amount = getAmount(type, sexe).toString();
            if (type.startsWith('event-')) {
                const eventsData = eventsModule.getEvents();
                const evt = eventsData.find(e => e.caisse === type);
                if (evt) amount = evt.fee.toString();
            }
            document.getElementById('payment-montant').value = amount;
        }

        function getMemberStats(memberId) {
            const memberPayments = payments.filter(p => p.memberId === memberId);
            const hebdo = memberPayments.filter(p => p.type === 'hebdomadaire').reduce((sum, p) => sum + p.montant, 0);
            const mensuel = memberPayments.filter(p => p.type === 'mensuelle').reduce((sum, p) => sum + p.montant, 0);
            const diayante = memberPayments.filter(p => p.type === 'diayante').reduce((sum, p) => sum + p.montant, 0);
            const social = memberPayments.filter(p => p.type === 'social').reduce((sum, p) => sum + p.montant, 0);
            return { hebdo, mensuel, diayante, social, total: hebdo + mensuel + diayante + social };
        }

        function getPaymentStatus(memberId) {
            const member = membres.find(m => m.id === memberId);
            const sexe = member ? member.sexe : 'all';

            const currentDate = new Date();
            const currentMonth = currentDate.getMonth();
            const currentMonthPayments = payments.filter(p => {
                const paymentDate = new Date(p.date);
                return p.memberId === memberId && paymentDate.getMonth() === currentMonth;
            });
            const hebdoTotal = currentMonthPayments
                .filter(p => p.type === 'hebdomadaire')
                .reduce((sum, p) => sum + p.montant, 0);
            const mensuelTotal = currentMonthPayments
                .filter(p => p.type === 'mensuelle')
                .reduce((sum, p) => sum + p.montant, 0);

            const hebdoRequired = getAmount('hebdomadaire', sexe, true);
            const mensuelRequired = getAmount('mensuelle', sexe);
            return (hebdoTotal >= hebdoRequired && mensuelTotal >= mensuelRequired) ? 'À jour' : 'En retard';
        }

        function renderMembres() {
            const list = document.getElementById('membres-list');
            if (!list) return;
            
            const searchInputEl = document.getElementById('search-input');
            const filterOkEl = document.getElementById('filter-ok');
            const filterLateEl = document.getElementById('filter-late');
            const filterSexeEl = document.querySelector('input[name="filter-sexe"]:checked');
            
            const searchTerm = searchInputEl ? searchInputEl.value.toLowerCase() : '';
            const filterOk = filterOkEl ? filterOkEl.checked : true;
            const filterLate = filterLateEl ? filterLateEl.checked : true;
            const filterSexe = filterSexeEl ? filterSexeEl.value : '';

            let filtered = membres.filter(m => {
                const fullName = `${m.prenom} ${m.nom}`.toLowerCase();
                const matchesSearch = fullName.includes(searchTerm);
                const status = getPaymentStatus(m.id);
                const matchesFilter = (status === 'À jour' && filterOk) || (status === 'En retard' && filterLate);
                const matchesSexe = filterSexe === '' || (m.sexe || 'M') === filterSexe;
                return matchesSearch && matchesFilter && matchesSexe;
            });

            filtered.sort((a, b) => {
                const nameA = `${a.nom} ${a.prenom}`.toLowerCase();
                const nameB = `${b.nom} ${b.prenom}`.toLowerCase();
                return nameA.localeCompare(nameB);
            });

            const membreCount = document.getElementById('membre-count');
            if (membreCount) {
                membreCount.textContent = filtered.length;
            }

            if (filtered.length === 0) {
                list.innerHTML = '<div class="empty-state"><p>Aucun membre trouvé</p></div>';
                return;
            }

            list.innerHTML = filtered.map(m => {
                const stats = getMemberStats(m.id);
                const status = getPaymentStatus(m.id);
                const categorieAge = m.categorieAge || 'adulte';
                const categorieLabel = categorieAge === 'enfant' ? '👶 Enfant' : 
                                       categorieAge === '3eme-age' ? '👴 3ème âge' : 
                                       '👤 Adulte';
                const roles = m.roles || [];
                const rolesDisplay = roles.length > 0 ? 
                    roles.map(r => {
                        const roleLabels = {
                            'membre-simple': '👥 Simple',
                            'membre-finance': '💰 Finance',
                            'membre-bureau': '🏢 Bureau',
                            'membre-audiovisuel': '🎥 Audio-Visuel',
                            'membre-culturel': '📚 Culturel',
                            'membre-kourel': '🕌 Kourel',
                            'membre-organisation': '📋 Organisation'
                        };
                        return roleLabels[r] || r;
                    }).join(', ') : 'Aucun rôle';
                // photo thumbnail support
                const photoData = memberPhotos[m.id];
                const photoUrl = photoData ? photoData.url : '';
                    
                return `
                    <div class="member-card">
                        <div class="member-header" style="display:flex; align-items:center; gap:1rem;">
                            <div class="member-photo-thumb">
                                ${photoUrl ? `<img src="${photoUrl}" alt="${m.prenom} ${m.nom}" />` : `<div class="member-photo-placeholder">👤</div>`}
                            </div>
                            <div>
                                <div class="member-name">${m.prenom} ${m.nom}</div>
                                <div class="member-date">📅 ${new Date(m.dateAdhesion).toLocaleDateString('fr-FR')}</div>
                                <div style="font-size: 0.85rem; color: #6b7280; margin-top: 0.25rem;">${categorieLabel}</div>
                                <div style="font-size: 0.85rem; color: #059669; margin-top: 0.25rem; font-weight: 500;">${rolesDisplay}</div>
                                <span class="status-badge ${status === 'À jour' ? 'status-ok' : 'status-late'}">${status}</span>
                            </div>
                            <div class="member-actions">
                                ${m.telephone ? `<a href="tel:${m.telephone}" class="btn-icon btn-call">📞</a>` : ''}
                                ${m.telephone ? `<button class=\"btn-icon btn-whatsapp\" onclick=\"openWhatsApp('${m.telephone}', '${m.prenom} ${m.nom}', '${m.id}')\"><img src=\"https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg\" alt=\"WA\" style=\"width:1em;height:1em;\"/></button>` : ''}
                                <button class="btn-icon btn-edit" onclick="openModal('editMember', '${m.id}')">✏️</button>
                                <button class="btn-icon btn-delete" onclick="deleteMembre('${m.id}')">🗑️</button>
                            </div>
                        </div>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <div class="stat-label">Hebdo</div>
                                <div class="stat-value">${stats.hebdo} F</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-label">Mensuel</div>
                                <div class="stat-value">${stats.mensuel} F</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-label">Total</div>
                                <div class="stat-value">${stats.total} F</div>
                            </div>
                        </div>
                        <button class="btn-primary" style="width: 100%; margin-top: 1rem;" onclick="openModal('addPayment', '${m.id}')">
                            Ajouter un ADIYA
                        </button>
                    </div>
                `;
            }).join('');
        }

        function renderPayments() {
            const list = document.getElementById('payments-list');
            // read search term if present
            const searchEl = document.getElementById('payments-search-input');
            const searchTerm = searchEl ? (searchEl.value || '').toLowerCase().trim() : '';

            if (payments.length === 0) {
                list.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">Aucun paiement</td></tr>';
                document.getElementById('payment-count').textContent = '0';
                return;
            }

            const sorted = [...payments].sort((a, b) => new Date(b.date) - new Date(a.date));
            // apply search filter
            let displayList = sorted;
            if (searchTerm) {
                displayList = sorted.filter(p => {
                    const membre = membres.find(m => m.id === p.memberId);
                    if (!membre) return false;
                    const prenom = (membre.prenom || '').toLowerCase();
                    const nom = (membre.nom || '').toLowerCase();
                    // filter only by prenom or nom (partial match)
                    return prenom.includes(searchTerm) || nom.includes(searchTerm);
                });
            }
            document.getElementById('payment-count').textContent = displayList.length;
            list.innerHTML = displayList.map(p => {
                const membre = membres.find(m => m.id === p.memberId);
                let displayType = p.type;
                let typeClass = '';
                if (p.type === 'hebdomadaire') { typeClass = 'hebdo'; displayType = 'Hebdomadaire'; }
                else if (p.type === 'mensuelle') { typeClass = 'mensuel'; displayType = 'Mensuelle'; }
                else if (p.type === 'diayante') { typeClass = 'diayante'; displayType = 'Diayante'; }
                else if (p.type === 'social') { typeClass = 'social'; displayType = 'Sociale'; }
                else if (p.type.startsWith('event-')) {
                    const eventsData = eventsModule.getEvents();
                    const evt = eventsData.find(e => e.caisse === p.type);
                    if (evt) {
                        displayType = evt.title;
                        typeClass = 'event';
                    } else {
                        typeClass = 'unknown';
                    }
                } else {
                    typeClass = 'unknown';
                }

                return `
                    <tr>
                        <td>${new Date(p.date).toLocaleDateString('fr-FR')}</td>
                        <td><strong>${membre ? `${membre.prenom} ${membre.nom}` : 'Inconnu'}</strong></td>
                        <td><span class="payment-type type-${typeClass}">${displayType}</span></td>
                        <td><span class="payment-method">${p.methode || 'Espèces'}</span></td>
                        <td style="text-align: right; font-weight: bold;">${p.montant} FCFA</td>
                        <td>
                            <button class="btn-icon btn-print" data-print="receipt" data-print-id="${p.id}" onclick="generateReceipt('${p.id}')">🖨️</button>
                            <button class="btn-icon btn-delete" onclick="deletePayment('${p.id}')">🗑️</button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        function openExpenseModal() {
            document.getElementById('expense-label').value = '';
            document.getElementById('expense-montant').value = '';
            document.getElementById('expense-caisse').innerHTML = `
                <option value="hebdomadaire">Hebdomadaire</option>
                <option value="mensuelle">Mensuelle</option>
                <option value="social">Sociale</option>
                <option value="diayante">Diayante</option>
                ${eventsModule.getEvents().map(evt => `<option value="${evt.caisse}">${evt.title}</option>`).join('')}
            `;
            document.getElementById('expense-caisse').value = 'hebdomadaire';
            document.getElementById('expense-date').value = getTodayDateString();
            document.getElementById('modal-depense').classList.add('active');
        }

        function saveExpense() {
            logAudit('expense_save_attempt', 'Tentative d\'enregistrement dépense', null);
            const label = document.getElementById('expense-label').value.trim();
            const montant = parseFloat(document.getElementById('expense-montant').value);
            const caisse = document.getElementById('expense-caisse').value;
            const date = document.getElementById('expense-date').value;
            if (!label) { showMessage('error', 'Entrez un libellé pour la dépense'); return; }
            if (!montant || isNaN(montant) || montant <= 0) { showFieldError('expense-montant-error', 'Montant invalide'); document.getElementById('expense-montant').classList.add('input-invalid'); return; }
            hideFieldError('expense-montant-error'); document.getElementById('expense-montant').classList.remove('input-invalid');

            const balance = getBalanceForCaisse(caisse);
            if (montant > balance) {
                showMessage('error', '⚠️ Fonds insuffisants ! Vous ne pouvez pas dépenser plus que ce qui est disponible dans cette caisse.');
                return;
            }

            expenses.push({ id: Date.now().toString(), label, montant, caisse, date });
            logAudit('expense_add', `Ajout dépense ${label} ${montant}FCFA`, null);
            if (safeSet('dahira-expenses', expenses)) { showMessage('success', 'Dépense enregistrée'); }
            renderExpenses();
            updateStats();
            renderDashboardCharts();
            try { if (window.firebaseAuth && firebaseAuth.currentUser) cloudSaveAll(); } catch (e) { console.warn('cloudSaveAll error', e); }
            updateDashboardMetrics();
            closeModal('modal-depense');
        }

        function deleteExpense(id) {
            showConfirm('Êtes-vous sûr de vouloir supprimer cette dépense ?', () => {
                const removed = expenses.find(e=>e.id===id);
                expenses = expenses.filter(e => e.id !== id);
                safeSet('dahira-expenses', expenses);
                renderExpenses();
                updateStats();
                renderDashboardCharts();
                try { if (window.firebaseAuth && firebaseAuth.currentUser) cloudSaveAll(); } catch (e) { console.warn('cloudSaveAll error', e); }
                updateDashboardMetrics();
                showMessage('success', 'Dépense supprimée');
                logAudit('expense_delete', `Suppression dépense ${removed?removed.label:''}`, id);
            });
        }

        function renderExpenses() {
            const list = document.getElementById('expenses-list');
            document.getElementById('expense-count').textContent = expenses.length;
            if (expenses.length === 0) {
                list.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">Aucune dépense</td></tr>';
                return;
            }
            const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
            list.innerHTML = sorted.map(e => {
                let displayCaisse = e.caisse;
                let caisseClass = '';
                if (e.caisse === 'hebdomadaire') { caisseClass = 'hebdo'; displayCaisse = 'Hebdomadaire'; }
                else if (e.caisse === 'mensuelle') { caisseClass = 'mensuel'; displayCaisse = 'Mensuelle'; }
                else if (e.caisse === 'diayante') { caisseClass = 'diayante'; displayCaisse = 'Diayante'; }
                else if (e.caisse === 'social') { caisseClass = 'social'; displayCaisse = 'Sociale'; }
                else if (e.caisse.startsWith('event-')) {
                    const eventsData = eventsModule.getEvents();
                    const evt = eventsData.find(ev => ev.caisse === e.caisse);
                    if (evt) {
                        displayCaisse = evt.title;
                        caisseClass = 'event';
                    } else {
                        caisseClass = 'unknown';
                    }
                } else {
                    caisseClass = 'unknown';
                }

                return `
                    <tr>
                        <td>${new Date(e.date).toLocaleDateString('fr-FR')}</td>
                        <td>${e.label}</td>
                        <td><span class="payment-type type-${caisseClass}">${displayCaisse}</span></td>
                        <td style="text-align:right; font-weight:bold;">${e.montant} FCFA</td>
                        <td><button class="btn-icon btn-delete" onclick="deleteExpense('${e.id}')">🗑️</button></td>
                    </tr>
                `;
            }).join('');
        }

        function getBalanceForCaisse(caisse) {
            const incomes = payments.filter(p => p.type === caisse).reduce((s, p) => s + p.montant, 0);
            const expensesSum = expenses.filter(e => e.caisse === caisse).reduce((s, e) => s + e.montant, 0);
            return incomes - expensesSum;
        }

        function updateStats() {
            const hebdo = payments.filter(p => p.type === 'hebdomadaire').reduce((s, p) => s + p.montant, 0);
            const mensuel = payments.filter(p => p.type === 'mensuelle').reduce((s, p) => s + p.montant, 0);
            const diayante = payments.filter(p => p.type === 'diayante').reduce((s, p) => s + p.montant, 0);
            const social = payments.filter(p => p.type === 'social').reduce((s, p) => s + p.montant, 0);

            const expenseHebdo = expenses.filter(e => e.caisse === 'hebdomadaire').reduce((s, e) => s + e.montant, 0);
            const expenseMensuel = expenses.filter(e => e.caisse === 'mensuelle').reduce((s, e) => s + e.montant, 0);
            const expenseDiayante = expenses.filter(e => e.caisse === 'diayante').reduce((s, e) => s + e.montant, 0);
            const expenseSocial = expenses.filter(e => e.caisse === 'social').reduce((s, e) => s + e.montant, 0);
            const totalExpenses = expenseHebdo + expenseMensuel + expenseDiayante + expenseSocial;

            const netHebdo = hebdo - expenseHebdo;
            const netMensuel = mensuel - expenseMensuel;
            const netSocial = social - expenseSocial;
            const netDiayante = diayante - expenseDiayante;
            const netGlobal = netHebdo + netMensuel + netSocial + netDiayante;

            document.getElementById('total-hebdo').textContent = netHebdo;
            document.getElementById('total-mensuel').textContent = netMensuel;
            document.getElementById('total-social').textContent = netSocial;
            document.getElementById('total-diayante').textContent = netDiayante;
            document.getElementById('total-global').textContent = netGlobal;

            const eHeb = document.getElementById('expense-hebdo'); if (eHeb) eHeb.textContent = expenseHebdo;
            const eMen = document.getElementById('expense-mensuel'); if (eMen) eMen.textContent = expenseMensuel;
            const eSoc = document.getElementById('expense-social'); if (eSoc) eSoc.textContent = expenseSocial;
            const eDia = document.getElementById('expense-diayante'); if (eDia) eDia.textContent = expenseDiayante;
            const eTot = document.getElementById('total-expenses'); if (eTot) eTot.textContent = totalExpenses;

            // Add event stats cards
            // Remove existing event cards first
            document.querySelectorAll('.event-stats-card').forEach(card => card.remove());
            const eventsData = eventsModule.getEvents();
            let eventNetTotal = 0;
            let eventExpenseTotal = 0;
            eventsData.forEach(evt => {
                const revenues = payments.filter(p => p.type === evt.caisse).reduce((s, p) => s + p.montant, 0);
                const expensesEvt = expenses.filter(e => e.caisse === evt.caisse).reduce((s, e) => s + e.montant, 0);
                const net = revenues - expensesEvt;
                eventNetTotal += net;
                eventExpenseTotal += expensesEvt;
                const card = document.createElement('div');
                card.className = 'stats-card event-stats-card';
                card.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
                card.innerHTML = `
                    <h3>${evt.title}</h3>
                    <p class="big-number">${net}</p>
                    <p style="opacity: 0.8;">FCFA</p>
                    <p style="margin-top:0.5rem; font-size:0.9rem; color:#b91c1c;">Dépenses: ${expensesEvt} FCFA</p>
                `;
                document.querySelector('.stats-cards').appendChild(card);
            });

            // Update global totals to include events
            const updatedNetGlobal = netGlobal + eventNetTotal;
            const updatedTotalExpenses = totalExpenses + eventExpenseTotal;
            document.getElementById('total-global').textContent = updatedNetGlobal;
            if (eTot) eTot.textContent = updatedTotalExpenses;

            const details = document.getElementById('stats-details');
            details.innerHTML = `
                <div class="member-card">
                    <h3 style="margin-bottom: 1rem;">Détails par Membre</h3>
                    ${membres.map(m => {
                const stats = getMemberStats(m.id);
                return `
                            <div style="border-left: 4px solid #059669; padding: 1rem; margin-bottom: 1rem;">
                                <h4 style="font-weight: bold;">${m.prenom} ${m.nom}</h4>
                                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-top: 0.5rem;">
                                    <div><span style="color: #6b7280;">Hebdo:</span> <strong>${stats.hebdo} F</strong></div>
                                    <div><span style="color: #6b7280;">Mensuel:</span> <strong>${stats.mensuel} F</strong></div>
                                    <div><span style="color: #6b7280;">Diayante:</span> <strong>${stats.diayante} F</strong></div>
                                    <div><span style="color: #6b7280;">Total:</span> <strong style="color: #059669;">${stats.total} F</strong></div>
                                </div>
                            </div>
                        `;
            }).join('')}
                </div>
            `;
        }

        function exportData() {
            const data = {
                membres,
                payments,
                expenses,
                params: dahiraParams,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dahira-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showMessage('success', '✅ Données exportées avec succès !');
        }

        function importData(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const data = JSON.parse(e.target.result);
                    if (!data.membres || !data.payments) {
                        showMessage('error', '❌ Fichier invalide !');
                        return;
                    }
                    showConfirm('⚠️ Cela va remplacer toutes vos données. Continuer ?', () => {
                        membres = data.membres;
                        payments = data.payments;
                        expenses = data.expenses || [];
                        if (data.params) {
                            dahiraParams = data.params;
                            safeSet('dahira-params', dahiraParams);
                        }
                        safeSet('dahira-membres', membres);
                        safeSet('dahira-payments', payments);
                        safeSet('dahira-expenses', expenses);
                        renderMembres();
                        renderPayments();
                        renderExpenses();
                        updateDashboardMetrics();
                        showMessage('success', '✅ Données importées !');
                    });
                } catch (error) {
                    showMessage('error', '❌ Erreur: ' + error.message);
                }
            };
            reader.readAsText(file);
            event.target.value = '';
        }

        function generateReceipt(paymentId, doPrint = true) {
            const payment = payments.find(p => p.id === paymentId);
            if (!payment) return;
            const membre = membres.find(m => m.id === payment.memberId);
            if (!membre) return;

            let displayType = payment.type;
            if (payment.type === 'hebdomadaire') displayType = 'Hebdomadaire';
            else if (payment.type === 'mensuelle') displayType = 'Mensuelle';
            else if (payment.type === 'diayante') displayType = 'Diayante';
            else if (payment.type === 'social') displayType = 'Sociale';
            else if (payment.type.startsWith('event-')) {
                const eventsData = eventsModule.getEvents();
                const evt = eventsData.find(e => e.caisse === payment.type);
                if (evt) displayType = evt.title;
            }

            const printArea = document.getElementById('print-area');
            printArea.innerHTML = `
                <div style="max-width: 600px; margin: 2rem auto; padding: 2rem; border: 2px solid #059669; border-radius: 1rem;">
                    <div style="text-align: center; border-bottom: 2px solid #059669; padding-bottom: 1rem; margin-bottom: 1rem;">
                        <h1 style="color: #059669; margin-bottom: 0.5rem;">🕌 Dahira</h1>
                        <p style="color: #6b7280;">Reçu de Cotisation</p>
                    </div>
                    <div style="margin-bottom: 1.5rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <strong>Membre:</strong> <span>${membre.prenom} ${membre.nom}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <strong>Type:</strong> <span>${displayType}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <strong>Méthode:</strong> <span>${payment.methode || 'Espèces'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <strong>Date:</strong> <span>${new Date(payment.date).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <strong>Référence:</strong> <span>${payment.id}</span>
                        </div>
                    </div>
                    <div style="text-align: center; font-size: 1.5rem; font-weight: bold; color: #059669; border-top: 2px solid #e5e7eb; padding-top: 1rem;">
                        Montant: ${payment.montant} FCFA
                    </div>
                    <div style="text-align: center; color: #6b7280; font-size: 0.875rem; margin-top: 1rem; border-top: 1px solid #e5e7eb; padding-top: 1rem;">
                        Généré le ${new Date().toLocaleDateString('fr-FR')}
                    </div>
                </div>
            `;
            printArea.style.display = 'block';
            if (doPrint) {
                window.print();
                setTimeout(() => printArea.style.display = 'none', 1000);
            }
        }

        function initRapportDates() {
            const today = getTodayDateString();
            const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            const firstDayOffset = firstDay.getTimezoneOffset() * 60000;
            const firstDayStr = new Date(firstDay.getTime() - firstDayOffset).toISOString().split('T')[0];

            document.getElementById('rapport-start').value = firstDayStr;
            document.getElementById('rapport-end').value = today;
        }

        function generateRapportHebdo() {
            generateRapport('hebdomadaire', 'Rapport Hebdomadaire');
        }

        function generateRapportMensuel() {
            generateRapport('mensuelle', 'Rapport Mensuel');
        }

        function generateRapportDiayante() {
            generateRapport('diayante', 'Rapport Diayante');
        }

        function generateRapportSocial() {
            generateRapport('social', 'Rapport Social');
        }

        function generateRapportGlobal() {
            generateRapport('all', 'Rapport Global');
        }

        function generateRapportHommes() {
            const hommes = membres.filter(m => m.sexe === 'M');
            const total = hommes.length;
            const content = document.getElementById('rapport-content');
            content.innerHTML = `
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h2 style="color: #059669; margin-bottom: 0.5rem;">Rapport Membres Hommes</h2>
                    <p>Total des hommes: ${total}</p>
                </div>
                <div style="background: #f0fdf4; padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 2rem; text-align: center;">
                    <h3 style="font-size: 2rem; color: #059669; margin-bottom: 0.5rem;">${total}</h3>
                    <p style="color: #6b7280;">Hommes inscrits</p>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f3f4f6;">
                            <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #e5e7eb;">Nom</th>
                            <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #e5e7eb;">Prénom</th>
                            <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #e5e7eb;">Téléphone</th>
                            <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #e5e7eb;">Date d'adhésion</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${hommes.map(m => `
                            <tr>
                                <td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">${m.nom}</td>
                                <td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">${m.prenom}</td>
                                <td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">${m.tel || m.telephone || '-'}</td>
                                <td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">${new Date(m.dateAdhesion).toLocaleDateString('fr-FR')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            document.getElementById('rapport-preview').style.display = 'block';
            document.getElementById('rapport-preview').scrollIntoView({ behavior: 'smooth' });
        }

        function generateRapportFemmes() {
            const femmes = membres.filter(m => m.sexe === 'F');
            const total = femmes.length;
            const content = document.getElementById('rapport-content');
            content.innerHTML = `
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h2 style="color: #ec4899; margin-bottom: 0.5rem;">Rapport Membres Femmes</h2>
                    <p>Total des femmes: ${total}</p>
                </div>
                <div style="background: #fdf2f8; padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 2rem; text-align: center;">
                    <h3 style="font-size: 2rem; color: #ec4899; margin-bottom: 0.5rem;">${total}</h3>
                    <p style="color: #6b7280;">Femmes inscrites</p>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f3f4f6;">
                            <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #e5e7eb;">Nom</th>
                            <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #e5e7eb;">Prénom</th>
                            <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #e5e7eb;">Téléphone</th>
                            <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #e5e7eb;">Date d'adhésion</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${femmes.map(m => `
                            <tr>
                                <td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">${m.nom}</td>
                                <td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">${m.prenom}</td>
                                <td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">${m.tel || m.telephone || '-'}</td>
                                <td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">${new Date(m.dateAdhesion).toLocaleDateString('fr-FR')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            document.getElementById('rapport-preview').style.display = 'block';
            document.getElementById('rapport-preview').scrollIntoView({ behavior: 'smooth' });
        }

        function generateRapportTousMembres() {
            const hommes = membres.filter(m => m.sexe === 'M');
            const femmes = membres.filter(m => m.sexe === 'F');
            const total = membres.length;
            const content = document.getElementById('rapport-content');
            content.innerHTML = `
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h2 style="color: #059669; margin-bottom: 0.5rem;">Rapport Tous les Membres</h2>
                    <p>Total des membres: ${total}</p>
                </div>
                <div style="display: flex; gap: 2rem; margin-bottom: 2rem;">
                    <div style="flex: 1; background: #f0fdf4; padding: 1.5rem; border-radius: 0.5rem; text-align: center;">
                        <h3 style="font-size: 2rem; color: #059669; margin-bottom: 0.5rem;">${hommes.length}</h3>
                        <p style="color: #6b7280;">Hommes</p>
                    </div>
                    <div style="flex: 1; background: #fdf2f8; padding: 1.5rem; border-radius: 0.5rem; text-align: center;">
                        <h3 style="font-size: 2rem; color: #ec4899; margin-bottom: 0.5rem;">${femmes.length}</h3>
                        <p style="color: #6b7280;">Femmes</p>
                    </div>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f3f4f6;">
                            <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #e5e7eb;">Nom</th>
                            <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #e5e7eb;">Prénom</th>
                            <th style="padding: 1rem; text-align: center; border-bottom: 2px solid #e5e7eb;">Sexe</th>
                            <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #e5e7eb;">Téléphone</th>
                            <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #e5e7eb;">Date d'adhésion</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${membres.map(m => `
                            <tr>
                                <td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">${m.nom}</td>
                                <td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">${m.prenom}</td>
                                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #e5e7eb;">${m.sexe === 'M' ? 'Homme' : 'Femme'}</td>
                                <td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">${m.tel || m.telephone || '-'}</td>
                                <td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">${new Date(m.dateAdhesion).toLocaleDateString('fr-FR')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            document.getElementById('rapport-preview').style.display = 'block';
            document.getElementById('rapport-preview').scrollIntoView({ behavior: 'smooth' });
        }

        function generateRapportDepenses() {
            const start = new Date(document.getElementById('rapport-start').value);
            const end = new Date(document.getElementById('rapport-end').value);
            const filtered = expenses.filter(e => {
                const d = new Date(e.date);
                return d >= start && d <= end;
            }).sort((a, b) => new Date(b.date) - new Date(a.date));
            const total = filtered.reduce((s, e) => s + e.montant, 0);
            const byCaisse = {};
            filtered.forEach(e => {
                if (!byCaisse[e.caisse]) byCaisse[e.caisse] = { total: 0, count: 0 };
                byCaisse[e.caisse].total += e.montant;
                byCaisse[e.caisse].count += 1;
            });
            const content = document.getElementById('rapport-content');
            content.innerHTML = `
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h2 style="color: #b91c1c; margin-bottom: 0.5rem;">Rapport Dépenses</h2>
                    <p>Du ${start.toLocaleDateString('fr-FR')} au ${end.toLocaleDateString('fr-FR')}</p>
                </div>
                <div style="background: #fff7ed; padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 2rem; text-align: center;">
                    <h3 style="font-size: 2rem; color: #b91c1c; margin-bottom: 0.5rem;">${total} FCFA</h3>
                    <p style="color: #6b7280;">Total des dépenses - ${filtered.length} opérations</p>
                </div>
                <div style="display:flex; gap:1rem; margin-bottom:1rem;">
                    ${Object.keys(byCaisse).map(c => `
                        <div style="flex:1; background:#fff7ed; padding:1rem; border-radius:0.5rem; text-align:center;">
                            <div style="font-size:0.9rem; color:#6b7280;">${c}</div>
                            <div style="font-weight:700; font-size:1.25rem; color:#b91c1c;">${byCaisse[c].total} FCFA</div>
                            <div style="color:#6b7280; font-size:0.85rem;">${byCaisse[c].count} ops</div>
                        </div>
                    `).join('')}
                </div>
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="background:#f9fafb;">
                            <th style="padding:0.75rem; text-align:left; border-bottom:1px solid #eee;">Date</th>
                            <th style="padding:0.75rem; text-align:left; border-bottom:1px solid #eee;">Libellé</th>
                            <th style="padding:0.75rem; text-align:left; border-bottom:1px solid #eee;">Caisse</th>
                            <th style="padding:0.75rem; text-align:right; border-bottom:1px solid #eee;">Montant</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.map(e => `
                            <tr>
                                <td style="padding:0.5rem; border-bottom:1px solid #f1f5f9;">${new Date(e.date).toLocaleDateString('fr-FR')}</td>
                                <td style="padding:0.5rem; border-bottom:1px solid #f1f5f9;">${e.label}</td>
                                <td style="padding:0.5rem; border-bottom:1px solid #f1f5f9;">${e.caisse}</td>
                                <td style="padding:0.5rem; text-align:right; border-bottom:1px solid #f1f5f9; font-weight:700;">${e.montant} FCFA</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            document.getElementById('rapport-preview').style.display = 'block';
            document.getElementById('rapport-preview').scrollIntoView({ behavior: 'smooth' });
        }

        function generateRapportCaisses() {
            const start = new Date(document.getElementById('rapport-start').value);
            const end = new Date(document.getElementById('rapport-end').value);
            const content = document.getElementById('rapport-content');
            
            const caisses = ['hebdomadaire', 'mensuelle', 'social', 'diayante'];
            const eventsData = eventsModule.getEvents();
            
            let html = `
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h2 style="color: #059669; margin-bottom: 0.5rem;">Rapport des Caisses</h2>
                    <p>Du ${start.toLocaleDateString('fr-FR')} au ${end.toLocaleDateString('fr-FR')}</p>
                </div>
            `;
            
            // Pour chaque caisse fixe (hebdo, mensuelle, sociale, diayante)
            caisses.forEach(caisse => {
                const revenus = payments
                    .filter(p => p.type === caisse && new Date(p.date) >= start && new Date(p.date) <= end)
                    .reduce((sum, p) => sum + p.montant, 0);
                const depenses = expenses
                    .filter(e => e.caisse === caisse && new Date(e.date) >= start && new Date(e.date) <= end)
                    .reduce((sum, e) => sum + e.montant, 0);
                const solde = revenus - depenses;
                const paiementCount = payments.filter(p => p.type === caisse && new Date(p.date) >= start && new Date(p.date) <= end).length;
                const depenseCount = expenses.filter(e => e.caisse === caisse && new Date(e.date) >= start && new Date(e.date) <= end).length;
                
                const caisseName = caisse === 'hebdomadaire' ? 'Hebdomadaire' : 
                                  caisse === 'mensuelle' ? 'Mensuelle' :
                                  caisse === 'social' ? 'Caisse Sociale' : 'Diayante';
                
                html += `
                    <div style="margin-bottom: 2rem; padding: 1.5rem; border: 2px solid #059669; border-radius: 0.5rem;">
                        <h3 style="color: #059669; margin-bottom: 1rem;">${caisseName}</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                            <div style="background: #f0fdf4; padding: 1rem; border-radius: 0.5rem; text-align: center;">
                                <p style="color: #6b7280; font-size: 0.85rem; margin: 0;">Revenus</p>
                                <p style="color: #059669; font-size: 1.5rem; font-weight: bold; margin: 0.5rem 0 0 0;">${revenus} FCFA</p>
                                <p style="color: #6b7280; font-size: 0.75rem; margin: 0.25rem 0 0 0;">${paiementCount} paiements</p>
                            </div>
                            <div style="background: #fee2e2; padding: 1rem; border-radius: 0.5rem; text-align: center;">
                                <p style="color: #6b7280; font-size: 0.85rem; margin: 0;">Dépenses</p>
                                <p style="color: #dc2626; font-size: 1.5rem; font-weight: bold; margin: 0.5rem 0 0 0;">${depenses} FCFA</p>
                                <p style="color: #6b7280; font-size: 0.75rem; margin: 0.25rem 0 0 0;">${depenseCount} dépenses</p>
                            </div>
                            <div style="background: ${solde >= 0 ? '#f0fdf4' : '#fee2e2'}; padding: 1rem; border-radius: 0.5rem; text-align: center;">
                                <p style="color: #6b7280; font-size: 0.85rem; margin: 0;">Solde</p>
                                <p style="color: ${solde >= 0 ? '#059669' : '#dc2626'}; font-size: 1.5rem; font-weight: bold; margin: 0.5rem 0 0 0;">${solde} FCFA</p>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            // Pour les événements s'il en existe
            if (eventsData.length > 0) {
                html += `<h3 style="color: #059669; margin-top: 2rem; margin-bottom: 1rem;">Événements</h3>`;
                eventsData.forEach(evt => {
                    const revenus = payments
                        .filter(p => p.type === evt.caisse && new Date(p.date) >= start && new Date(p.date) <= end)
                        .reduce((sum, p) => sum + p.montant, 0);
                    const depenses = expenses
                        .filter(e => e.caisse === evt.caisse && new Date(e.date) >= start && new Date(e.date) <= end)
                        .reduce((sum, e) => sum + e.montant, 0);
                    const solde = revenus - depenses;
                    const paiementCount = payments.filter(p => p.type === evt.caisse && new Date(p.date) >= start && new Date(p.date) <= end).length;
                    const depenseCount = expenses.filter(e => e.caisse === evt.caisse && new Date(e.date) >= start && new Date(e.date) <= end).length;
                    
                    html += `
                        <div style="margin-bottom: 1.5rem; padding: 1.5rem; border: 2px solid #8b5cf6; border-radius: 0.5rem;">
                            <h4 style="color: #8b5cf6; margin-bottom: 1rem;">${evt.title}</h4>
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
                                <div style="background: #f5f3ff; padding: 1rem; border-radius: 0.5rem; text-align: center;">
                                    <p style="color: #6b7280; font-size: 0.85rem; margin: 0;">Revenus</p>
                                    <p style="color: #8b5cf6; font-size: 1.3rem; font-weight: bold; margin: 0.5rem 0 0 0;">${revenus} FCFA</p>
                                    <p style="color: #6b7280; font-size: 0.75rem; margin: 0.25rem 0 0 0;">${paiementCount} paiements</p>
                                </div>
                                <div style="background: #fee2e2; padding: 1rem; border-radius: 0.5rem; text-align: center;">
                                    <p style="color: #6b7280; font-size: 0.85rem; margin: 0;">Dépenses</p>
                                    <p style="color: #dc2626; font-size: 1.3rem; font-weight: bold; margin: 0.5rem 0 0 0;">${depenses} FCFA</p>
                                    <p style="color: #6b7280; font-size: 0.75rem; margin: 0.25rem 0 0 0;">${depenseCount} dépenses</p>
                                </div>
                                <div style="background: ${solde >= 0 ? '#f0fdf4' : '#fee2e2'}; padding: 1rem; border-radius: 0.5rem; text-align: center;">
                                    <p style="color: #6b7280; font-size: 0.85rem; margin: 0;">Solde</p>
                                    <p style="color: ${solde >= 0 ? '#059669' : '#dc2626'}; font-size: 1.3rem; font-weight: bold; margin: 0.5rem 0 0 0;">${solde} FCFA</p>
                                </div>
                            </div>
                        </div>
                    `;
                });
            }
            
            content.innerHTML = html;
            document.getElementById('rapport-preview').style.display = 'block';
            document.getElementById('rapport-preview').scrollIntoView({ behavior: 'smooth' });
        }

        function generateRapport(type, title) {
            const start = new Date(document.getElementById('rapport-start').value);
            const end = new Date(document.getElementById('rapport-end').value);
            // genre : "" = tous, "M" = hommes, "F" = femmes
            const gender = document.getElementById('rapport-gender')
                ? document.getElementById('rapport-gender').value
                : '';

            const filtered = payments.filter(p => {
                const date = new Date(p.date);
                const matchesType = type === 'all' || p.type === type;
                if (!matchesType || date < start || date > end) return false;
                if (gender) {
                    // retrouver le membre et vérifier son sexe
                    const membre = membres.find(m => m.id === p.memberId);
                    if (!membre || membre.sexe !== gender) return false;
                }
                return true;
            });

            const total = filtered.reduce((s, p) => s + p.montant, 0);
            const byMember = {};

            filtered.forEach(p => {
                if (!byMember[p.memberId]) {
                    const membre = membres.find(m => m.id === p.memberId);
                    byMember[p.memberId] = {
                        nom: membre ? `${membre.prenom} ${membre.nom}` : 'Inconnu',
                        total: 0,
                        count: 0
                    };
                }
                byMember[p.memberId].total += p.montant;
                byMember[p.memberId].count++;
            });

            const content = document.getElementById('rapport-content');
            // ajuster le titre si un filtre de genre est sélectionné
            let effectiveTitle = title;
            if (gender === 'M') effectiveTitle += ' - Hommes';
            else if (gender === 'F') effectiveTitle += ' - Femmes';
            content.innerHTML = `
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h2 style="color: #059669; margin-bottom: 0.5rem;">${effectiveTitle}</h2>
                    <p>Du ${start.toLocaleDateString('fr-FR')} au ${end.toLocaleDateString('fr-FR')}</p>
                </div>
                <div style="background: #f0fdf4; padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 2rem; text-align: center;">
                    <h3 style="font-size: 2rem; color: #059669; margin-bottom: 0.5rem;">${total} FCFA</h3>
                    <p style="color: #6b7280;">Total collecté - ${filtered.length} ADIYA</p>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f3f4f6;">
                            <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #e5e7eb;">Membre</th>
                            <th style="padding: 1rem; text-align: center; border-bottom: 2px solid #e5e7eb;">ADIYA</th>
                            <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.values(byMember).map(m => `
                            <tr>
                                <td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">${m.nom}</td>
                                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #e5e7eb;">${m.count}</td>
                                <td style="padding: 0.75rem; text-align: right; font-weight: bold; border-bottom: 1px solid #e5e7eb;">${m.total} FCFA</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            document.getElementById('rapport-preview').style.display = 'block';
            document.getElementById('rapport-preview').scrollIntoView({ behavior: 'smooth' });
        }

        function updateEventReportsButtons() {
            const container = document.getElementById('event-reports-buttons');
            if (!container) return;
            const eventsData = eventsModule.getEvents();
            container.innerHTML = eventsData.map(evt => `<button class="btn-primary" onclick="generateRapportEvenement('${evt.id}')">📄 Rapport ${evt.title}</button>`).join('');
        }

        function generateRapportEvenement(id) {
            const evt = eventsModule.getEvents().find(e => e.id === id);
            if (!evt) return;
            const start = new Date(document.getElementById('rapport-start').value);
            const end = new Date(document.getElementById('rapport-end').value);
            const filtered = payments.filter(p => {
                const date = new Date(p.date);
                const matchesType = p.type === evt.caisse;
                return matchesType && date >= start && date <= end;
            });
            const total = filtered.reduce((s, p) => s + p.montant, 0);
            const byMember = {};
            filtered.forEach(p => {
                if (!byMember[p.memberId]) {
                    const membre = membres.find(m => m.id === p.memberId);
                    byMember[p.memberId] = {
                        nom: membre ? `${membre.prenom} ${membre.nom}` : 'Inconnu',
                        total: 0,
                        count: 0
                    };
                }
                byMember[p.memberId].total += p.montant;
                byMember[p.memberId].count++;
            });
            const content = document.getElementById('rapport-content');
            content.innerHTML = `
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h2 style="color: #8b5cf6; margin-bottom: 0.5rem;">Rapport ${evt.title}</h2>
                    <p>Du ${start.toLocaleDateString('fr-FR')} au ${end.toLocaleDateString('fr-FR')}</p>
                </div>
                <div style="background: #f3e8ff; padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 2rem; text-align: center;">
                    <h3 style="font-size: 2rem; color: #8b5cf6; margin-bottom: 0.5rem;">${total} FCFA</h3>
                    <p style="color: #6b7280;">Total collecté - ${filtered.length} ADIYA</p>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f3f4f6;">
                            <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #e5e7eb;">Membre</th>
                            <th style="padding: 1rem; text-align: center; border-bottom: 2px solid #e5e7eb;">Cotisations</th>
                            <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.values(byMember).map(m => `
                            <tr>
                                <td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">${m.nom}</td>
                                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #e5e7eb;">${m.count}</td>
                                <td style="padding: 0.75rem; text-align: right; font-weight: bold; border-bottom: 1px solid #e5e7eb;">${m.total} FCFA</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            document.getElementById('rapport-preview').style.display = 'block';
            document.getElementById('rapport-preview').scrollIntoView({ behavior: 'smooth' });
        }

        function printRapport(doPrint = true) {
            const content = document.getElementById('rapport-content');
            const printArea = document.getElementById('print-area');
            printArea.innerHTML = `
                <div style="padding: 2rem;">
                    <div style="text-align: center; margin-bottom: 2rem;">
                        <h1 style="color: #059669;">🕌 Dahira</h1>
                    </div>
                    ${content.innerHTML}
                    <div style="margin-top: 3rem; text-align: center; color: #6b7280; font-size: 0.875rem;">
                        Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
                    </div>
                </div>
            `;
            printArea.style.display = 'block';
            if (doPrint) {
                window.print();
                setTimeout(() => printArea.style.display = 'none', 1000);
            }
        }

        function populateCalculatorTypes() {
            const typeSelect = document.getElementById('calc-type-global');
            if (!typeSelect) return;
            // provide an "all" option first
            let html = `
                <option value="all">Toutes les caisses</option>
                <option value="hebdomadaire">Hebdomadaire</option>
                <option value="mensuelle">Mensuelle</option>
                <option value="social">Caisse sociale</option>
                <option value="diayante">Diayante</option>
            `;
            // add event options dynamically
            const eventsData = eventsModule.getEvents();
            eventsData.forEach(evt => {
                html += `<option value="${evt.caisse}">${evt.title}</option>`;
            });
            typeSelect.innerHTML = html;
            // default select first option
            typeSelect.value = 'all';
        }

        function loadCalculatorData() {
            const select = document.getElementById('calc-member');
            if (!select) return;
            select.innerHTML = '<option value="">Sélectionner...</option>';
            membres.forEach(m => {
                const option = document.createElement('option');
                option.value = m.id;
                option.textContent = `${m.prenom} ${m.nom}`;
                select.appendChild(option);
            });
            // default total to current members count
            const totalInput = document.getElementById('calc-total');
            if (totalInput) totalInput.value = membres.length;
            populateCalculatorTypes();
            calculateGlobal();
        }

        function calculateIndividual() {
            const memberId = document.getElementById('calc-member').value;
            const period = parseInt(document.getElementById('calc-period').value) || 1;
            const result = document.getElementById('calc-result');
            if (!memberId) {
                result.innerHTML = '<p style="color: #6b7280;">Sélectionnez un membre</p>';
                return;
            }
            const membre = membres.find(m => m.id === memberId);
            const stats = getMemberStats(memberId);
            const hebdoDue = getAmount('hebdomadaire', membre.sexe, true) * period;
            const mensuelDue = getAmount('mensuelle', membre.sexe) * period;
            const totalDue = hebdoDue + mensuelDue;
            const balance = totalDue - stats.total;
            result.innerHTML = `
                <h4 style="color: #059669; margin-bottom: 1rem;">${membre.prenom} ${membre.nom}</h4>
                <div style="margin-bottom: 0.5rem;"><strong>Période:</strong> ${period} mois</div>
                <div style="margin-bottom: 0.5rem;"><strong>Total payé:</strong> ${stats.total} FCFA</div>
                <div style="margin-bottom: 0.5rem;"><strong>Dû:</strong> ${totalDue} FCFA</div>
                <div style="margin-top: 1rem; padding: 1rem; background: ${balance > 0 ? '#fef2f2' : '#f0fdf4'}; border-radius: 0.5rem;">
                    <strong style="color: ${balance > 0 ? '#dc2626' : '#059669'};">
                        ${balance > 0 ? `Reste à payer: ${balance} FCFA` : 'À jour ✓'}
                    </strong>
                </div>
                <div style="margin-top:1rem; text-align:center;">
                    <button class="btn-primary" onclick="sendIndividualMessage('${membre.id}', ${period})">📩 Envoyer message</button>
                </div>
            `;
        }

        function sendIndividualMessage(memberId, period) {
            // reuse openWhatsApp formatting but include period/dues
            const membre = membres.find(m => m.id === memberId);
            if (!membre) return;
            const phone = membre.telephone || '';
            // compute totals for period
            const hebdoDue = getAmount('hebdomadaire', membre.sexe, true) * period;
            const mensuelDue = getAmount('mensuelle', membre.sexe) * period;
            const totalDue = hebdoDue + mensuelDue;
            // compute already paid overall
            const stats = getMemberStats(memberId);
            const balance = totalDue - stats.total;

            let message = `Assalamou aleykoum ${membre.prenom} ${membre.nom}, ceci est un message de la Dahira.`;
            message += `\n\nPériode: ${period} mois`;
            message += `\nTotal dû pour cette période: ${totalDue} FCFA`;
            if (balance > 0) {
                message += `\nReste à payer: ${balance} FCFA`;
            } else {
                message += `\n✅ Votre compte est à jour.j`;
            }
            message += `\n\nBarakallahu fik.`;

            const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        }

        function calculateGlobal() {
            const total = parseInt(document.getElementById('calc-total').value) || membres.length || 0;
            const period = parseInt(document.getElementById('calc-global-period').value) || 1;
            const type = document.getElementById('calc-type-global') ? document.getElementById('calc-type-global').value : 'all';
            const result = document.getElementById('calc-global-result');
            let grandTotal = 0;
            if (type === 'all') {
                // sum all fixed amounts (hebdo->monthly*4, mens, social, diayante) per member
                const hebdo = getAmount('hebdomadaire','all',true);
                const mens = getAmount('mensuelle','all');
                const soc = getAmount('social','all');
                const dia = getAmount('diayante','all');
                grandTotal = total * ((hebdo + mens + soc + dia) * period);
            } else if (type.startsWith('event-')) {
                const eventsData = eventsModule.getEvents();
                const evt = eventsData.find(e => e.caisse === type);
                const amount = evt ? evt.fee : 0;
                grandTotal = total * amount;
            } else {
                const isMonthly = type === 'hebdomadaire';
                const amount = getAmount(type, 'all', isMonthly);
                grandTotal = total * amount * period;
            }
            result.innerHTML = `
                <h4 style="color: #059669; margin-bottom: 1rem;">Projection Globale</h4>
                <div style="margin-bottom: 0.5rem;"><strong>Type:</strong> ${type === 'all' ? 'Toutes' : type.replace('event-','')}</div>
                <div style="margin-bottom: 0.5rem;"><strong>Membres:</strong> ${total}</div>
                <div style="margin-bottom: 0.5rem;"><strong>Période:</strong> ${period} mois</div>
                <div style="margin-top: 1rem; padding: 1rem; background: #f0fdf4; border-radius: 0.5rem; text-align: center;">
                    <strong style="font-size: 1.5rem; color: #059669;">${grandTotal} FCFA</strong>
                    <p style="color: #6b7280; font-size: 0.875rem; margin-top: 0.5rem;">Total projeté</p>
                </div>
            `;
        }

        // PROTECTION CONTRE LES APPELS DANGEREUX
        // Wrapper sécurisé : empêcher les écrasages
        function protectDataWrite(data, operationName = 'unknown') {
            if (!data || typeof data !== 'object') {
                console.error('❌ PROTÉGÉ: Tentative d\'écriture invalide -', operationName);
                return false;
            }
            const totalItems = (data.membres || []).length + (data.payments || []).length + (data.expenses || []).length;
            if (totalItems === 0) {
                console.error('❌ PROTÉGÉ: Tentative d\'écriture de données VIDES -', operationName);
                showMessage('error', '❌ REFUSÉ : Impossible d\'écrire des données vides.');
                return false;
            }
            console.info('✅ VALIDÉ: Écriture autorisée -', operationName);
            return true;
        }
        
        // Override des fonctions exportData/importData pour sécuriser aussi les exports/imports locaux
        const originalExportData = window.exportData;
        window.exportData = function() {
            const audits = safeGet('dahira-audit', []);
            const data = { membres, payments, expenses, audits, exportDate: new Date().toISOString(), version: safeGet('dahira-sync-version', 0) };
            if (!protectDataWrite(data, 'exportData')) return;
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dahira-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showMessage('success', '✅ Données exportées avec succès !');
            logAudit('export_local', 'Export local de données', null);
        };
        
        const originalImportData = window.importData;
        window.importData = function(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // VALIDATION STRICTE
                    const validation = validateSyncData(data);
                    if (!validation.valid) {
                        showMessage('error', '❌ Fichier invalide : ' + validation.reason);
                        return;
                    }
                    
                    showConfirm('⚠️ FUSIONNER (pas remplacer) les données du fichier ?', () => {
                        const localData = { membres, payments, expenses, audits: safeGet('dahira-audit', []) };
                        const mergedData = mergeData(data, localData);
                        
                        membres = mergedData.membres;
                        payments = mergedData.payments;
                        expenses = mergedData.expenses;
                        const mergedAudits = mergedData.audits || [];
                        safeSet('dahira-audit', mergedAudits);
                        
                        safeSet('dahira-membres', membres);
                        safeSet('dahira-payments', payments);
                        safeSet('dahira-expenses', expenses);
                        renderMembres();
                        renderPayments();
                        renderExpenses();
                        updateDashboardMetrics();
                        showMessage('success', '✅ Données FUSIONNÉES (import local sécurisé) !');
                        logAudit('import_local_merge', 'Import local avec merge', null);
                    });
                } catch (error) {
                    showMessage('error', '❌ Erreur : ' + error.message);
                }
            };
            reader.readAsText(file);
            event.target.value = '';
        };
        
        function showFieldError(id, msg) {
            const el = document.getElementById(id);
            if (el) { el.textContent = msg; el.style.display = 'block'; }
        }
        
        function hideFieldError(id) {
            const el = document.getElementById(id);
            if (el) { el.textContent = ''; el.style.display = 'none'; }
        }

        function validateEmail(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        }

        function validatePhone(tel) {
            const cleaned = tel.replace(/\D/g, '');
            const rest = cleaned.startsWith('221') ? cleaned.slice(3) : cleaned;
            return rest.length === 9 && /^7\d{8}$/.test(rest);
        }




        function resetAllData() {
            if (confirm("ATTENTION: Cette action va effacer TOUTES les données (membres, paiements, etc). Êtes-vous vraiment sûr ?")) {
                if (confirm("Dernière chance: Cela est irréversible. Confirmer la suppression ?")) {
                    localStorage.clear();
                    location.reload();
                }
            }
        }

        function generateBulkReminder() {
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();

            const lateMembers = membres.filter(m => {
                const status = getPaymentStatus(m.id);
                return status === 'En retard';
            });

            if (lateMembers.length === 0) {
                showMessage('success', 'Tout le monde est à jour ! Alhamdoulilah.');
                return;
            }

            let message = `🕌 *DAHIRA - Rappel Adiya* 🕌\n\n`;
            message += `Assalamou aleykoum chers talibés. Voici la liste des membres qui ont des cotisations en retard pour ce mois-ci:\n\n`;

            lateMembers.forEach(m => {
                const stats = getMemberStats(m.id);
                const memberPayments = payments.filter(p => {
                    const d = new Date(p.date);
                    return p.memberId === m.id && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                });

                const hebdoPaid = memberPayments.filter(p => p.type === 'hebdomadaire').reduce((s, p) => s + p.montant, 0);
                const mensuelPaid = memberPayments.filter(p => p.type === 'mensuelle').reduce((s, p) => s + p.montant, 0);

                const requiredHebdo = getAmount('hebdomadaire', m.sexe, true);
                const requiredMensuel = getAmount('mensuelle', m.sexe);
                const hebdoDue = Math.max(0, requiredHebdo - hebdoPaid);
                const mensuelDue = Math.max(0, requiredMensuel - mensuelPaid);
                const total = hebdoDue + mensuelDue;

                const phone = m.telephone ? ` (${m.telephone})` : '';
                message += `• ${m.prenom} ${m.nom}${phone}: ${total} FCFA\n`;
            });

            message += `\nQue Allah vous facilite si barké serigne bi. Barakallahu fikoum.`;

            document.getElementById('reminder-text').value = message;
            document.getElementById('bulk-reminder-area').style.display = 'block';
            document.getElementById('bulk-reminder-area').scrollIntoView({ behavior: 'smooth' });
        }

        function copyToClipboard() {
            const copyText = document.getElementById("reminder-text");
            copyText.select();
            copyText.setSelectionRange(0, 99999);
            navigator.clipboard.writeText(copyText.value).then(() => {
                showMessage('success', 'Texte copié dans le presse-papier !');
            });
        }

        // OPTIMISATION RECHERCHE: Formatage téléphone auto
        document.getElementById('membre-tel').addEventListener('input', function (e) {
            let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,3})(\d{0,2})(\d{0,2})/);
            if (x) {
                e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? ' ' + x[3] : '') + (x[4] ? ' ' + x[4] : '');
            }
            const v = e.target.value.replace(/\D/g, '');
            if (v.length > 0 && !validatePhone(v)) {
                showFieldError('membre-tel-error', 'Numéro invalide (doit commencer par 7)');
                e.target.classList.add('input-invalid');
            } else {
                hideFieldError('membre-tel-error');
                e.target.classList.remove('input-invalid');
            }
        });

        document.getElementById('membre-email').addEventListener('input', (e) => {
            const v = e.target.value.trim();
            if (!v) { hideFieldError('membre-email-error'); e.target.classList.remove('input-invalid'); return; }
            if (!validateEmail(v)) { showFieldError('membre-email-error', 'Email invalide'); e.target.classList.add('input-invalid'); }
            else { hideFieldError('membre-email-error'); e.target.classList.remove('input-invalid'); }
        });

        document.getElementById('payment-montant').addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            if (!v || isNaN(v) || v <= 0) { showFieldError('payment-montant-error', 'Montant invalide'); e.target.classList.add('input-invalid'); }
            else { hideFieldError('payment-montant-error'); e.target.classList.remove('input-invalid'); }
        });

        // OPTIMISATION: Debounce sur la recherche pour éviter de recalculer à chaque frappe
        const debouncedRenderMembres = debounce(renderMembres, 300);
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', debouncedRenderMembres);
        }

        const filterOk = document.getElementById('filter-ok');
        const filterLate = document.getElementById('filter-late');
        if (filterOk) filterOk.addEventListener('change', renderMembres);
        if (filterLate) filterLate.addEventListener('change', renderMembres);

        document.querySelectorAll('input[name="filter-sexe"]').forEach(radio => {
            radio.addEventListener('change', renderMembres);
        });

        // OPTIMISATION RECHERCHE CARTE: Debounce
        const debouncedRenderCartes = debounce((e) => {
            const searchTerm = e.target.value;
            renderCartes(searchTerm);
        }, 300);
        const carteSearchInput = document.getElementById('carte-search-input');
        if (carteSearchInput) {
            carteSearchInput.addEventListener('input', debouncedRenderCartes);
        }



        setTimeout(() => {
            initDarkMode(); // Initialiser le thème
            const firebaseOk = testFirebaseConfig();
            console.log('✅ Stockage des photos configuré en local');
            
            // Pré-charger Firebase SDK pour connexion plus rapide
            if (!window.firebase) {
                const script = document.createElement('script');
                script.src = 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
                script.onload = () => {
                    const script2 = document.createElement('script');
                    script2.src = 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
                    script2.onload = () => {
                        const script3 = document.createElement('script');
                        script3.src = 'https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js';
                        document.head.appendChild(script3);
                    };
                    document.head.appendChild(script2);
                };
                document.head.appendChild(script);
            }
        }, 1000);

        loadMemberPhotos();
        renderMembres();
        renderPayments();
        loadCalculatorData();
        initRapportDates();
        renderHistory();
        // add live hooks on parameter inputs so changes apply immediately
        ['hebdomadaire','mensuelle','social','diayante'].forEach(type => {
            ['M','F'].forEach(gender => {
                const el = document.getElementById(`param-${type}-${gender}`);
                if (el) {
                    el.addEventListener('input', debounce(saveParameters, 300));
                }
            });
        });
        // live search for payments: type in prenom or nom to filter immediately
        const paymentsSearch = document.getElementById('payments-search-input');
        if (paymentsSearch) {
            paymentsSearch.addEventListener('input', debounce(() => {
                renderPayments();
            }, 150));
        }

        function testFirebaseConfig() {
            console.log('=== STOCKAGE LOCAL ACTIF ===');
            console.log('✅ Stockage des photos en localStorage');
            console.log('✅ Pas de dépendance Firebase pour les photos');
            return true;
        }

        function initDashboard() {
            updateDashboardMetrics();
            renderDashboardCharts();
        }

        function updateDashboardMetrics() {
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

            const currentMonthPayments = payments.filter(p => {
                const paymentDate = new Date(p.date);
                return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
            });

            const cotisationsMois = currentMonthPayments.reduce((sum, p) => sum + p.montant, 0);

            const currentMonthExpenses = expenses.filter(e => {
                const expenseDate = new Date(e.date);
                return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
            });

            const depensesMois = currentMonthExpenses.reduce((sum, e) => sum + e.montant, 0);
            const solde = cotisationsMois - depensesMois;

            const lastMonthPayments = payments.filter(p => {
                const paymentDate = new Date(p.date);
                return paymentDate.getMonth() === lastMonth && paymentDate.getFullYear() === lastMonthYear;
            });

            const cotisationsLastMonth = lastMonthPayments.reduce((sum, p) => sum + p.montant, 0);
            const soldeTrend = cotisationsLastMonth > 0 ? ((solde - cotisationsLastMonth) / cotisationsLastMonth * 100).toFixed(1) : 0;

            const nouveauxMembres = membres.filter(m => {
                const adhesionDate = new Date(m.dateAdhesion);
                return adhesionDate.getMonth() === currentMonth && adhesionDate.getFullYear() === currentYear;
            }).length;

            const anneePayments = payments.filter(p => {
                const paymentDate = new Date(p.date);
                return paymentDate.getFullYear() === currentYear;
            });

            const cotisationsAnnee = anneePayments.reduce((sum, p) => sum + p.montant, 0);
            const ratioDepenses = cotisationsMois > 0 ? ((depensesMois / cotisationsMois) * 100).toFixed(1) : 0;

            let membresAJour = 0;
            membres.forEach(membre => {
                const memberPayments = payments.filter(p => {
                    const paymentDate = new Date(p.date);
                    return p.memberId === membre.id &&
                        paymentDate.getMonth() === currentMonth &&
                        paymentDate.getFullYear() === currentYear;
                });

                const hebdoTotal = memberPayments
                    .filter(p => p.type === 'hebdomadaire')
                    .reduce((sum, p) => sum + p.montant, 0);

                const mensuelTotal = memberPayments
                    .filter(p => p.type === 'mensuelle')
                    .reduce((sum, p) => sum + p.montant, 0);

                const requiredHebdo = getAmount('hebdomadaire', membre.sexe, true);
                const requiredMensuel = getAmount('mensuelle', membre.sexe);
                if (hebdoTotal >= requiredHebdo && mensuelTotal >= requiredMensuel) {
                    membresAJour++;
                }
            });

            const tauxPaiement = membres.length > 0 ? ((membresAJour / membres.length) * 100).toFixed(1) : 0;
            const moyenneMembre = membres.length > 0 ? (cotisationsMois / membres.length).toFixed(0) : 0;

            const lastMonthNouveaux = membres.filter(m => {
                const adhesionDate = new Date(m.dateAdhesion);
                return adhesionDate.getMonth() === lastMonth && adhesionDate.getFullYear() === lastMonthYear;
            }).length;

            const croissance = lastMonthNouveaux > 0 ? (((nouveauxMembres - lastMonthNouveaux) / lastMonthNouveaux) * 100).toFixed(1) : (nouveauxMembres > 0 ? 100 : 0);

            const troisMoisAgo = new Date();
            troisMoisAgo.setMonth(troisMoisAgo.getMonth() - 3);

            const membresActifs = new Set();
            payments.forEach(p => {
                const paymentDate = new Date(p.date);
                if (paymentDate >= troisMoisAgo) {
                    membresActifs.add(p.memberId);
                }
            });

            const tauxActivite = membres.length > 0 ? ((membresActifs.size / membres.length) * 100).toFixed(1) : 0;

            const totalRevenus = cotisationsMois;
            const ratioEquilibre = totalRevenus > 0 ? ((depensesMois / totalRevenus) * 100).toFixed(1) : 0;

            const objectifMensuel = membres.length * (getAmount('hebdomadaire','all',true) + getAmount('mensuelle','all'));
            const performance = objectifMensuel > 0 ? ((cotisationsMois / objectifMensuel) * 100).toFixed(1) : 0;

            document.getElementById('dashboard-total-membres').textContent = membres.length;
            document.getElementById('dashboard-cotisations-mois').textContent = cotisationsMois + ' FCFA';
            document.getElementById('dashboard-depenses-mois').textContent = depensesMois + ' FCFA';
            document.getElementById('dashboard-solde').textContent = solde + ' FCFA';
            document.getElementById('dashboard-nouveaux-membres').textContent = nouveauxMembres;
            document.getElementById('dashboard-cotisations-mois').textContent = cotisationsMois.toLocaleString('fr-FR') + ' FCFA';
            document.getElementById('dashboard-cotisations-annee').textContent = cotisationsAnnee.toLocaleString('fr-FR');
            document.getElementById('dashboard-depenses-mois').textContent = depensesMois.toLocaleString('fr-FR') + ' FCFA';
            document.getElementById('dashboard-ratio-depenses').textContent = ratioDepenses + '%';
            document.getElementById('dashboard-solde').textContent = solde.toLocaleString('fr-FR') + ' FCFA';
            document.getElementById('dashboard-solde-trend').innerHTML = (soldeTrend >= 0 ? '↗️ +' : '↘️ ') + soldeTrend + '%';

            document.getElementById('kpi-taux-paiement').textContent = tauxPaiement + '%';
            document.getElementById('kpi-membres-ajour').textContent = membresAJour;
            document.getElementById('kpi-moyenne-membre').textContent = moyenneMembre + ' FCFA';
            document.getElementById('kpi-croissance').textContent = (croissance >= 0 ? '+' : '') + croissance + '%';
            document.getElementById('kpi-activite').textContent = tauxActivite + '%';
            document.getElementById('kpi-equilibre').textContent = ratioEquilibre + '%';
            document.getElementById('kpi-performance').textContent = performance + '%';
        }

        // Correction Bug Graphiques: Gestion de la mémoire
        function destroyChart(key) {
            if (window.chartInstances[key]) {
                window.chartInstances[key].destroy();
                delete window.chartInstances[key];
            }
        }

        function renderDashboardCharts() {
            if (typeof Chart === 'undefined') {
                console.warn('Chart.js n\'est pas chargé');
                return;
            }
            renderChartSexe();
            renderChartEvolution();
            renderChartPaiementsCaisse();
            renderChartStatutPaiements();
            renderChartDepensesCaisse();
            renderChartTopContributeurs();
        }

        function renderChartSexe() {
            const ctx = document.getElementById('chart-sexe');
            if (!ctx) return;
            destroyChart('sexe');

            const hommes = membres.filter(m => m.sexe === 'M').length;
            const femmes = membres.filter(m => m.sexe === 'F').length;

            window.chartInstances['sexe'] = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Hommes', 'Femmes'],
                    datasets: [{
                        data: [hommes, femmes],
                        backgroundColor: ['#059669', '#ec4899'],
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    animation: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }

        function renderChartEvolution() {
            const ctx = document.getElementById('chart-evolution');
            if (!ctx) return;
            destroyChart('evolution');

            const monthlyData = {};
            membres.forEach(membre => {
                const date = new Date(membre.dateAdhesion);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
            });

            const sortedMonths = Object.keys(monthlyData).sort();
            const labels = sortedMonths.map(month => {
                const [year, monthNum] = month.split('-');
                return new Date(year, monthNum - 1).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
            });
            const data = sortedMonths.map(month => monthlyData[month]);

            window.chartInstances['evolution'] = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Nouveaux membres',
                        data: data,
                        borderColor: '#059669',
                        backgroundColor: 'rgba(5, 150, 105, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    animation: false,
                    scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 1 } }
                    }
                }
            });
        }

        function renderChartPaiementsCaisse() {
            const ctx = document.getElementById('chart-paiements-caisse');
            if (!ctx) return;
            destroyChart('paiements-caisse');

            const months = [];
            const now = new Date();
            for (let i = 5; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                months.push({
                    label: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
                    year: date.getFullYear(),
                    month: date.getMonth()
                });
            }

            const datasets = [
                {
                    label: 'Hebdomadaire',
                    data: months.map(m => payments.filter(p =>
                        p.type === 'hebdomadaire' &&
                        new Date(p.date).getFullYear() === m.year &&
                        new Date(p.date).getMonth() === m.month
                    ).reduce((sum, p) => sum + p.montant, 0)),
                    backgroundColor: '#059669'
                },
                {
                    label: 'Mensuelle',
                    data: months.map(m => payments.filter(p =>
                        p.type === 'mensuelle' &&
                        new Date(p.date).getFullYear() === m.year &&
                        new Date(p.date).getMonth() === m.month
                    ).reduce((sum, p) => sum + p.montant, 0)),
                    backgroundColor: '#3b82f6'
                },
                {
                    label: 'Social',
                    data: months.map(m => payments.filter(p =>
                        p.type === 'social' &&
                        new Date(p.date).getFullYear() === m.year &&
                        new Date(p.date).getMonth() === m.month
                    ).reduce((sum, p) => sum + p.montant, 0)),
                    backgroundColor: '#f59e0b'
                },
                {
                    label: 'Diayante',
                    data: months.map(m => payments.filter(p =>
                        p.type === 'diayante' &&
                        new Date(p.date).getFullYear() === m.year &&
                        new Date(p.date).getMonth() === m.month
                    ).reduce((sum, p) => sum + p.montant, 0)),
                    backgroundColor: '#7c3aed'
                }
            ];

            window.chartInstances['paiements-caisse'] = new Chart(ctx, {
                type: 'bar',
                data: { labels: months.map(m => m.label), datasets: datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    animation: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { callback: function (value) { return value + ' FCFA'; } }
                        }
                    }
                }
            });
        }

        function renderChartStatutPaiements() {
            const ctx = document.getElementById('chart-statut-paiements');
            if (!ctx) return;
            destroyChart('statut-paiements');

            const currentDate = new Date();
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();

            let aJour = 0;
            let enRetard = 0;

            membres.forEach(membre => {
                const memberPayments = payments.filter(p => {
                    const paymentDate = new Date(p.date);
                    return p.memberId === membre.id &&
                        paymentDate.getMonth() === currentMonth &&
                        paymentDate.getFullYear() === currentYear;
                });

                const hebdoTotal = memberPayments
                    .filter(p => p.type === 'hebdomadaire')
                    .reduce((sum, p) => sum + p.montant, 0);

                const mensuelTotal = memberPayments
                    .filter(p => p.type === 'mensuelle')
                    .reduce((sum, p) => sum + p.montant, 0);

                const requiredHebdo = getAmount('hebdomadaire', membre.sexe, true);
                const requiredMensuel = getAmount('mensuelle', membre.sexe);
                if (hebdoTotal >= requiredHebdo && mensuelTotal >= requiredMensuel) {
                    aJour++;
                } else {
                    enRetard++;
                }
            });

            window.chartInstances['statut-paiements'] = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['À jour', 'En retard'],
                    datasets: [{
                        data: [aJour, enRetard],
                        backgroundColor: ['#059669', '#dc2626'],
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    animation: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        function renderChartDepensesCaisse() {
            const ctx = document.getElementById('chart-depenses-caisse');
            if (!ctx) return;
            destroyChart('depenses-caisse');

            // Calculer les 6 derniers mois
            const months = [];
            const now = new Date();
            for (let i = 5; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                months.push({
                    label: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
                    year: date.getFullYear(),
                    month: date.getMonth()
                });
            }

            const datasets = [
                {
                    label: 'Hebdomadaire',
                    data: months.map(m => expenses.filter(e =>
                        e.caisse === 'hebdomadaire' &&
                        new Date(e.date).getFullYear() === m.year &&
                        new Date(e.date).getMonth() === m.month
                    ).reduce((sum, e) => sum + e.montant, 0)),
                    backgroundColor: '#dc2626'
                },
                {
                    label: 'Mensuelle',
                    data: months.map(m => expenses.filter(e =>
                        e.caisse === 'mensuelle' &&
                        new Date(e.date).getFullYear() === m.year &&
                        new Date(e.date).getMonth() === m.month
                    ).reduce((sum, e) => sum + e.montant, 0)),
                    backgroundColor: '#ea580c'
                },
                {
                    label: 'Social',
                    data: months.map(m => expenses.filter(e =>
                        e.caisse === 'social' &&
                        new Date(e.date).getFullYear() === m.year &&
                        new Date(e.date).getMonth() === m.month
                    ).reduce((sum, e) => sum + e.montant, 0)),
                    backgroundColor: '#d97706'
                },
                {
                    label: 'Diayante',
                    data: months.map(m => expenses.filter(e =>
                        e.caisse === 'diayante' &&
                        new Date(e.date).getFullYear() === m.year &&
                        new Date(e.date).getMonth() === m.month
                    ).reduce((sum, e) => sum + e.montant, 0)),
                    backgroundColor: '#c2410c'
                },
                {
                    label: 'Événements',
                    data: months.map(m => expenses.filter(e =>
                        e.caisse.startsWith('event-') &&
                        new Date(e.date).getFullYear() === m.year &&
                        new Date(e.date).getMonth() === m.month
                    ).reduce((sum, e) => sum + e.montant, 0)),
                    backgroundColor: '#7c3aed'
                }
            ];

            window.chartInstances['depenses-caisse'] = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: months.map(m => m.label),
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    animation: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function (value) {
                                    return value + ' FCFA';
                                }
                            }
                        }
                    }
                }
            });
        }

        function renderChartTopContributeurs() {
            const ctx = document.getElementById('chart-top-contributeurs');
            if (!ctx) return;
            destroyChart('top-contributeurs');

            // Calculer le total des contributions par membre
            const contributions = {};
            membres.forEach(membre => {
                const total = payments
                    .filter(p => p.memberId === membre.id)
                    .reduce((sum, p) => sum + p.montant, 0);
                contributions[membre.id] = {
                    nom: `${membre.prenom} ${membre.nom}`,
                    total: total
                };
            });

            // Trier et prendre les top 5
            const top5 = Object.values(contributions)
                .sort((a, b) => b.total - a.total)
                .slice(0, 5);

            window.chartInstances['top-contributeurs'] = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: top5.map(c => c.nom),
                    datasets: [{
                        label: 'Total contribué',
                        data: top5.map(c => c.total),
                        backgroundColor: '#059669',
                        borderWidth: 1,
                        borderColor: '#047857'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    animation: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function (value) {
                                    return value + ' FCFA';
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }

        // appeler l'initialisation Firebase automatiquement si possible
        try { initFirebaseIfConfigured(); } catch(e) { console.warn('init call error', e); }