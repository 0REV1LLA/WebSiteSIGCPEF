// Authentication Check - Include this in EVERY protected page
document.addEventListener('DOMContentLoaded', function() {
    // Check if firebaseApp is available
    if (!window.firebaseApp || !window.firebaseApp.auth) {
        console.error('Firebase not initialized. Redirecting to login...');
        window.location.href = '../login/login.html';
        return;
    }
    
    // Check authentication state
    firebaseApp.auth.onAuthStateChanged((user) => {
        if (!user) {
            // User is not logged in, redirect to login
            console.log('No user logged in. Redirecting...');
            window.location.href = '../login/login.html';
        } else {
            // User is logged in, update UI
            console.log('User logged in:', user.email);
            updateUserUI(user);
            
            // Load additional user data from Firestore
            loadUserData(user.uid);
        }
    });
    
    // Logout functionality
    const logoutButtons = document.querySelectorAll('[data-logout], .btn-logout');
    logoutButtons.forEach(button => {
        button.addEventListener('click', async function(e) {
            e.preventDefault();
            console.log('Logout clicked');
            try {
                await firebaseApp.auth.signOut();
                console.log('User signed out successfully');
                window.location.href = '../login/login.html';
            } catch (error) {
                console.error('Logout error:', error);
                alert('Error al cerrar sesión: ' + error.message);
            }
        });
    });
    
    // Update UI with user info
    function updateUserUI(user) {
        // Update email display
        const userEmailElements = document.querySelectorAll('[data-user-email]');
        userEmailElements.forEach(el => {
            el.textContent = user.email;
        });
        
        // Show user info in console
        console.log('User UID:', user.uid);
        console.log('User Email:', user.email);
    }
    
    // Load additional user data from Firestore
    async function loadUserData(userId) {
        try {
            console.log('Loading user data for UID:', userId);
            const userDoc = await firebaseApp.db.collection('users').doc(userId).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                console.log('User data loaded:', userData);
                
                // Store in session storage for easy access
                sessionStorage.setItem('userData', JSON.stringify(userData));
                
                // Update username display
                const userNameElements = document.querySelectorAll('[data-user-name]');
                userNameElements.forEach(el => {
                    el.textContent = userData.username || userData.email;
                });
                
                // Update last login timestamp
                await firebaseApp.db.collection('users').doc(userId).update({
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                // Check permissions based on role
                checkUserPermissions(userData);
                
            } else {
                console.log('No additional user data found in Firestore');
            }
            
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }
    
    // Check user permissions for specific modules
    function checkUserPermissions(userData) {
        console.log('Checking permissions for role:', userData.role || 'user');
        
        // Get current page
        const currentPage = window.location.pathname;
        console.log('Current page:', currentPage);
        
        // Example: Restrict ICAP access to admins only
        if (currentPage.includes('icap') && userData.role !== 'admin') {
            console.warn('User does not have permission to access ICAP');
            // You could redirect or hide elements here
        }
        
        // Example: Hide admin-only buttons
        const adminButtons = document.querySelectorAll('[data-admin-only]');
        if (userData.role !== 'admin') {
            adminButtons.forEach(button => {
                button.style.display = 'none';
            });
        }
    }
    
    // Create default admin on first load (runs once per session)
    async function checkAndCreateDefaultAdmin() {
        const adminEmail = 'admin@sigcpef.com';
        const adminPassword = 'Admin123';
        
        // Check if we already tried this session
        if (sessionStorage.getItem('adminChecked') === 'true') {
            return;
        }
        
        try {
            console.log('Checking for default admin...');
            
            // Try to sign in with admin credentials
            await firebaseApp.auth.signInWithEmailAndPassword(adminEmail, adminPassword);
            console.log('Default admin exists and logged in');
            
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                // Admin doesn't exist, create it
                console.log('Creating default admin user...');
                try {
                    const userCredential = await firebaseApp.auth.createUserWithEmailAndPassword(adminEmail, adminPassword);
                    
                    await firebaseApp.db.collection('users').doc(userCredential.user.uid).set({
                        username: 'Administrador SIGCPEF',
                        email: adminEmail,
                        role: 'admin',
                        permissions: ['rr-hh', 'operaciones', 'icap', 'admin', 'users'],
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    
                    console.log('✅ Default admin user created successfully');
                    
                    // Sign out after creating
                    await firebaseApp.auth.signOut();
                    console.log('Signed out after creating admin');
                    
                    // Redirect to login
                    window.location.href = '../login/login.html';
                    
                } catch (createError) {
                    console.error('❌ Error creating admin user:', createError);
                }
            } else if (error.code === 'auth/wrong-password') {
                console.log('Admin exists but wrong password in check');
            } else {
                console.error('Error checking admin:', error);
            }
        } finally {
            sessionStorage.setItem('adminChecked', 'true');
        }
    }
    
    // Run admin check on page load (only once)
    checkAndCreateDefaultAdmin();
    
    // Helper to check if user has specific permission
    window.hasPermission = function(permission) {
        const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
        return userData.permissions && userData.permissions.includes(permission);
    };
    
    // Helper to get user role
    window.getUserRole = function() {
        const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
        return userData.role || 'user';
    };
});