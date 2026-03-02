const express = require('express');
const router = express.Router();
const logger = require('./utils/logger')


    // Import des routes modules
    ;

const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/User.routes');
const categoryRoutes = require('./modules/categories/Category.routes');
const centreCommercialRoutes = require('./modules/centre_commercial/CentreCommercial.routes');
const boxRoutes = require('./modules/spatial/Box.routes');
const BoutiqueRoutes = require('./modules/boutiques/Boutique.routes');
const DemandeBoutiqueRoutes = require('./modules/boutiques/demande_boutiques/DemandeBoutique.routes');
const ProductRoutes = require('./modules/produits/Produit.routes')
const promotionRoutes = require('./modules/promotions/Promotion.routes')

// Montage des sous-routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/centres', centreCommercialRoutes);
router.use('/boxes', boxRoutes);
router.use('/demandes-creation-boutiques', DemandeBoutiqueRoutes);
router.use('/boutiques', BoutiqueRoutes);
router.use('/produits', ProductRoutes);
router.use('/promotions', promotionRoutes);

module.exports = router;
