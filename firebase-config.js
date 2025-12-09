// Firebase Configuration - SIGCPEF
const firebaseConfig = {
    apiKey: "AIzaSyDkTXnh6HL7-TMbWVs5t_W_frm7XHO6r-w",
    authDomain: "sigcpef.firebaseapp.com",
    projectId: "sigcpef",
    storageBucket: "sigcpef.firebasestorage.app",
    messagingSenderId: "256038460446",
    appId: "1:256038460446:web:0a86193cda22110036220f"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

// Enable Firestore offline persistence
db.enablePersistence()
  .catch((err) => {
      console.log("Firestore offline persistence error:", err.code);
  });

// Make available globally
window.firebaseApp = {
    auth: auth,
    db: db,
    firestore: firebase.firestore
};