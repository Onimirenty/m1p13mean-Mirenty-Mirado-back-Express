const express = require('express');
const router = express.Router();
const logger = require('../../utils/logger')

const controller = require('./User.controller');
const { checkToken } = require('../../middlewares/auth.middleware');
const { checkRole } = require('../../middlewares/role.middleware');
const { protectUser } = require('./change-password.middleware');

router.post('/', checkToken, checkRole('ADMIN'), controller.createUser);
router.get('/', checkToken, checkRole('ADMIN'), controller.getUsers);
router.get('/user/', checkToken, checkRole('ADMIN'), controller.getUserByEmail);
router.put('/:id', checkToken, checkRole('ADMIN'), controller.updateUser);
router.patch('/:id/disable', checkToken, checkRole('ADMIN'), controller.disableUser);
router.patch('/:id/enable', checkToken, checkRole('ADMIN'), controller.enableUser);
router.patch("/change-password", checkToken, protectUser,controller.changePassword);

module.exports = router;
