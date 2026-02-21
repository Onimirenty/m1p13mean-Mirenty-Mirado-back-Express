const express = require('express');
const router = express.Router();

// Import des routes modules
// const authMiddleware = require('./middlewares/auth.middleware');

const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/User.routes');

// Montage des sous-routes
// router.use(authMiddleware.checkToken); 
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

module.exports = router;
