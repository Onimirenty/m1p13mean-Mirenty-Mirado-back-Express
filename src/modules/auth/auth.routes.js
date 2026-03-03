const express = require('express');
const router = express.Router();

const { login, signup, refresh, logout, my_indentity } = require('./auth.controller');
const { requireMultipart, uploadDocumentsLegaux } = require('../../middlewares/upload.middleware');
const { checkToken } = require('../../middlewares/auth.middleware');
const DemandeController = require('../boutiques/demande_boutiques/DemandeBoutique.controller');


router.post('/login', login);
router.post('/signup', signup);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/me', my_indentity);

router.post('/register-client', signup);
router.post('/register-boutique', checkToken, requireMultipart, uploadDocumentsLegaux, DemandeController.create);

module.exports = router;
