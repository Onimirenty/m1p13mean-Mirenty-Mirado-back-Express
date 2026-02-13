const express = require('express');
const router = express.Router();

// Import des routes modules
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/User.routes');

// Montage des sous-routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

module.exports = router;
