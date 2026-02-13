const service = require('./User.service');

exports.createUser = async (req, res, next) => {
  try {
    const user = await service.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const users = await service.getUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const user = await service.updateUser(req.params.id, req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

exports.disableUser = async (req, res, next) => {
  try {
    const user = await service.disableUser(req.params.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
};
