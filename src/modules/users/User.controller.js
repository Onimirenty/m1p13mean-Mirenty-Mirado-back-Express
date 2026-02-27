const service = require('./User.service');
const logger = require('../../utils/logger')

exports.createUser = async (req, res, next) => {
  try {
    const user = await service.createUser(req.body);
    res.status(201).json({ message: "User created", user });
  } catch (error) {
    next(error);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const users = await service.getUsers();
    res.json({ message: "Users fetched", users });
  } catch (error) {
    next(error);
  }
};

exports.getUserByEmail = async (req, res, next) => {
  try {
    const user = await service.getUserByEmail(req.body.email)
    res.json({ message: "User fetched", user });

  } catch (error) {
    next(error);
  }

};

exports.updateUser = async (req, res, next) => {
  try {
    const user = await service.updateUser(req.params.id, req.body);
    res.json({ message: "User updated", user });
  } catch (error) {
    next(error);
  }
};

exports.disableUser = async (req, res, next) => {
  try {
    const user = await service.disableUser(req.params.id);
    res.json({ message: "User disabled", user });
  } catch (error) {
    next(error);
  }
};

exports.enableUser = async (req, res, next) => {
  try {
    const user = await service.enableUser(req.params.id);
    res.json({ message: "User enabled", user });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await service.changePassword(
      req.user.id,
      currentPassword,
      newPassword
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
