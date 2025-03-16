const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user.model');  // Asegúrate de que la importación es correcta

// Función para hashear la contraseña
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Crear Usuario
exports.createUser = async (req, res) => {
    try {
        const { Cedula, Telefono, Nombre, Funcion, User: username, Password } = req.body;
        
        // Hash de la contraseña antes de guardar
        const hashedPassword = hashPassword(Password);

        const newUser = await User.create({
            Cedula,
            Telefono,
            Nombre,
            Funcion,
            User: username,  // Usamos username para evitar conflicto con la palabra reservada User
            Password: hashedPassword
        });

        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ message: "Error al crear usuario", error: error.message });
    }
};

// Login
exports.login = async (req, res) => {
    try {
        const { user, password } = req.body;

        const userRecord = await User.findOne({ where: { User: user } });
        if (!userRecord) return res.status(404).json({ message: 'Usuario no encontrado' });

        if (userRecord.Password !== hashPassword(password)) {
            return res.status(401).json({ message: 'Contraseña incorrecta' });
        }

        const token = jwt.sign({ id: userRecord.ID }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ message: "Error al intentar iniciar sesión", error: err.message });
    }
};
