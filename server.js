const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware para procesar datos de formularios y JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Servir los archivos HTML de la carpeta public (tu maqueta)
app.use(express.static(path.join(__dirname, 'public')));

// 1. Configuración de la Sesión y Cookies (Requerimiento de Seguridad)
app.use(session({
    secret: 'clave_secreta_universidad', // Clave para firmar la cookie
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true, // Protege contra robos de cookies por scripts maliciosos (XSS)
        secure: false,  // Se deja en false para pruebas locales (HTTP), en producción con HTTPS va en true
        maxAge: 1000 * 60 * 10 // La sesión expira en 10 minutos
    }
}));

// Middleware para registrar eventos en la consola (Requerimiento de Logs/Evidencias)
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleString()}] Módulo Seguridad: ${req.method} en ${req.url}`);
    next();
});

// Credenciales simuladas (Usuario y contraseña para la prueba)
const USER_DATABASE = {
    username: "admin",
    password: "password123"
};

// 2. Middleware de Control de Acceso (Autorización)
function verificarSesion(req, res, next) {
    if (req.session && req.session.usuario) {
        console.log(`[LOG - ACCESO PERMITIDO] El usuario '${req.session.usuario}' ingresó a zona protegida.`);
        return next(); // Continúa a la página privada
    } else {
        console.log(`[LOG - ACCESO DENEGADO] Intento de acceso no autorizado detectado.`);
        res.redirect('/login.html?error=no-auth');
    }
}

// --- RUTAS API ---

// Procesar el Login (Autenticación)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (username === USER_DATABASE.username && password === USER_DATABASE.password) {
        req.session.usuario = username; // Guardamos el usuario en la sesión
        console.log(`[LOG - AUTENTICACIÓN] Login exitoso para el usuario: ${username}`);
        res.json({ success: true, redirect: '/dashboard.html' });
    } else {
        console.log(`[LOG - AUTENTICACIÓN] Intento fallido con usuario: ${username}`);
        res.status(401).json({ success: false, message: "Usuario o contraseña incorrectos" });
    }
});

// Ruta Protegida (Control de acceso)
app.get('/dashboard.html', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Cerrar sesión
app.get('/api/logout', (req, res) => {
    const user = req.session.usuario;
    req.session.destroy(() => {
        console.log(`[LOG - SESIÓN] Sesión destruida para el usuario: ${user}`);
        res.redirect('/login.html?logout=true');
    });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo con éxito en http://localhost:${PORT}`);
});