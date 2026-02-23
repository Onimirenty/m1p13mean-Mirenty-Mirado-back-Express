const express = require('express');
const router = express.Router();
const logger = require('../../utils/logger')

const controller = require('./User.controller');
const { checkToken } = require('../../middlewares/auth.middleware');
const { checkRole } = require('../../middlewares/role.middleware');

router.post('/', checkToken, checkRole('admin'), controller.createUser);
router.get('/', checkToken, checkRole('admin'), controller.getUsers);
router.put('/:id', checkToken, checkRole('admin'), controller.updateUser);
router.patch('/:id/disable', checkToken, checkRole('admin'), controller.disableUser);

module.exports = router;
