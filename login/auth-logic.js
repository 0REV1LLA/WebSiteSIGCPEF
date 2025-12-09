// Authentication Logic for Login Page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth logic loaded for login page');
    
    // Check if user is already logged in
    firebaseApp.auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('User already logged in, redirecting to home...');
            window.location.href = '../home/home.html';
        }
    });
    
    // Get forms
    const loginForm = document.querySelector('.form-box.login form');
    const registerForm = document.querySelector('.form-box.register form');
    
    // LOGIN FUNCTION
    if (loginForm) {
        console.log('Login form found');
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Login form submitted');
            
            // Get form values
            const email = this.querySelector('input[type="text"]').value;
            const password = this.querySelector('input[type="password"]').value;
            
            console.log('Attempting login with:', email);
            
            // Basic validation
            if (!email || !password) {
                alert('Por favor completa todos los campos');
                return;
            }
            
            // Show loading state
            const submitBtn = this.querySelector('.btn');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Iniciando...';
            submitBtn.disabled = true;
            
            try {
                // Firebase authentication
                const userCredential = await firebaseApp.auth.signInWithEmailAndPassword(email, password);
                console.log('✅ Login successful:', userCredential.user.email);
                
                // Update user data in Firestore
                try {
                    await firebaseApp.db.collection('users').doc(userCredential.user.uid).update({
                        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } catch (firestoreError) {
                    console.log('Note: Could not update last login:', firestoreError);
                }
                
                // Success message
                alert('Inicio de sesión exitoso. Redirigiendo...');
                
                // Redirect to home page
                window.location.href = '../home/home.html';
                
            } catch (error) {
                console.error('❌ Login error:', error);
                
                // Reset button
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                
                // Show user-friendly error
                const errorMessage = translateFirebaseError(error.code);
                alert('Error en inicio de sesión: ' + errorMessage);
            }
        });
    }
    
    // REGISTER FUNCTION
    if (registerForm) {
        console.log('Register form found');
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Register form submitted');
            
            // Get form values
            const username = this.querySelector('input[type="text"]').value;
            const email = this.querySelector('input[type="email"]').value;
            const password = this.querySelector('input[type="password"]').value;
            
            console.log('Attempting registration:', email);
            
            // Basic validation
            if (!username || !email || !password) {
                alert('Por favor completa todos los campos');
                return;
            }
            
            if (password.length < 6) {
                alert('La contraseña debe tener al menos 6 caracteres');
                return;
            }
            
            // Show loading state
            const submitBtn = this.querySelector('.btn');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Registrando...';
            submitBtn.disabled = true;
            
            try {
                // Create user in Firebase Auth
                const userCredential = await firebaseApp.auth.createUserWithEmailAndPassword(email, password);
                console.log('✅ User created in Auth:', userCredential.user.uid);
                
                // Save additional user data to Firestore
                await firebaseApp.db.collection('users').doc(userCredential.user.uid).set({
                    username: username,
                    email: email,
                    role: 'user', // Default role
                    permissions: ['rr-hh', 'operaciones'], // Default permissions
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'active'
                });
                
                console.log('✅ User data saved to Firestore');
                
                // Success message
                alert('✅ Usuario registrado exitosamente. Ahora puedes iniciar sesión.');
                
                // Reset form
                this.reset();
                
                // Switch to login form automatically
                setTimeout(() => {
                    document.querySelector('.container').classList.remove('active');
                }, 1000);
                
            } catch (error) {
                console.error('❌ Registration error:', error);
                
                // Reset button
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                
                // Show user-friendly error
                const errorMessage = translateFirebaseError(error.code);
                alert('Error en registro: ' + errorMessage);
                
            } finally {
                // Reset button state after 2 seconds
                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }, 2000);
            }
        });
    }
    
    // FORGOT PASSWORD LINK
    const forgotLink = document.querySelector('.forgot-link a');
    if (forgotLink) {
        forgotLink.addEventListener('click', function(e) {
            e.preventDefault();
            const email = prompt('Por favor ingresa tu correo electrónico para restablecer la contraseña:');
            
            if (email) {
                firebaseApp.auth.sendPasswordResetEmail(email)
                    .then(() => {
                        alert('Se ha enviado un correo para restablecer tu contraseña. Revisa tu bandeja de entrada.');
                    })
                    .catch(error => {
                        console.error('Password reset error:', error);
                        alert('Error: ' + translateFirebaseError(error.code));
                    });
            }
        });
    }
    
    // Google Sign-In (Optional - if you want to add later)
    const googleBtn = document.querySelector('.social-icons a');
    if (googleBtn) {
        googleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            alert('Inicio con Google no configurado aún. Usa el formulario de registro.');
        });
    }
    
    // Helper function to translate Firebase errors to Spanish
    function translateFirebaseError(errorCode) {
        const errors = {
            'auth/email-already-in-use': 'El correo electrónico ya está registrado.',
            'auth/invalid-email': 'Correo electrónico inválido.',
            'auth/operation-not-allowed': 'Esta operación no está permitida.',
            'auth/weak-password': 'La contraseña es muy débil. Debe tener al menos 6 caracteres.',
            'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
            'auth/user-not-found': 'Usuario no encontrado. Verifica tu correo.',
            'auth/wrong-password': 'Contraseña incorrecta. Intenta nuevamente.',
            'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde.',
            'auth/network-request-failed': 'Error de red. Verifica tu conexión.',
            'auth/popup-closed-by-user': 'La ventana de inicio de sesión fue cerrada.',
            'auth/requires-recent-login': 'Esta acción requiere un inicio de sesión reciente.'
        };
        
        return errors[errorCode] || 'Error desconocido. Por favor, intenta nuevamente.';
    }
    
    // Make function available globally
    window.translateFirebaseError = translateFirebaseError;
    
    // Test Firebase connection
    console.log('Firebase Auth available:', !!firebaseApp.auth);
    console.log('Firestore available:', !!firebaseApp.db);
});