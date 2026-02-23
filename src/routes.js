const express = require('express');
const router = express.Router();
const logger = require('./utils/logger')


// Import des routes modules
// const authMiddleware = require('./middlewares/auth.middleware');

const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/User.routes');
const categoryRoutes = require('./modules/categories/Category.routes');

// Montage des sous-routes
// router.use(authMiddleware.checkToken); 
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);

module.exports = router;
