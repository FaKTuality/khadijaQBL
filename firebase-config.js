// ============================================================
// REPLACE THIS with the config object from your Firebase project.
//
// How to get it:
// 1. Go to https://console.firebase.google.com
// 2. Create a project (or open an existing one)
// 3. Click the "</>" (web app) icon to register a web app
// 4. Firebase will show you a config object like the one below —
//    copy/paste it here, replacing everything inside firebaseConfig.
// 5. In the Firebase console, go to Build > Firestore Database
//    and click "Create database" (start in test mode is fine
//    while you're building — see README.md for production rules).
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyAucPQNbWc3QItgEDXDFSlN0V09vyVXzuw",
  authDomain: "khadijaqbl-2f249.firebaseapp.com",
  projectId: "khadijaqbl-2f249",
  storageBucket: "khadijaqbl-2f249.firebasestorage.app",
  messagingSenderId: "370767601881",
  appId: "1:370767601881:web:90f6fe6e24b8f26245dec8"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();


