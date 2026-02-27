const User = require('./User.model');
const AppError = require('../../utils/AppError');
const mongoose = require('mongoose');
const logger = require('../../utils/logger')

const createUser = async (data) => {
  try {
    const user = await User.create(data);
    const obj = user.toObject();
    delete obj.password;
    return obj;
  } catch (error) {
    throw error;
  }
};


const getUsers = async () => {
  try {
    return await User.find().select('-password');
  } catch (error) {
    const e = new AppError('Failed to fetch users');
    e.status = 500;
    throw e;
  }
};


const getUserByEmail = async (email) => {

  const user = await User.findOne({ email })
    .select('-password');

  if (!user) {
    const error = new AppError("Email  incorrect", 401);
    logger.info("User not found for email:", email); // email essayer
    throw error;
  }

  if (user.status !== 'ACTIVE') {
    const error = new AppError("Account disabled", 403);
    throw error;
  }
  return user;
};

const getUserById = async (id) => {

  const user = await User.findOne({ id })
    .select('-password');

  if (!user) {
    const error = new AppError("Email  incorrect", 401);
    logger.info("User not found "); // email essayer
    throw error;
  }

  if (user.status !== 'ACTIVE') {
    const error = new AppError("Account disabled", 403);
    throw error;
  }
  return user;
};

const updateUser = async (id, data) => {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid user ID', 400);
  }

  if (data.password) {
    throw new AppError('Use dedicated route to update password', 400);
  }

  const user = await User.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true
  }).select('-password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};


const disableUser = async (id) => {
  return User.findByIdAndUpdate(id,
    { status: 'INACTIVE' },
    { new: true }
  ).select('-password');
};

const enableUser = async (id) => {
  return User.findByIdAndUpdate(id,
    { status: 'ACTIVE' },
    { new: true }
  ).select('-password');
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw new AppError("Utilisateur introuvable", 404);
  }
  const isValid = await user.comparePassword(currentPassword);
  if (!isValid) {
    throw new AppError("Mot de passe actuel incorrect", 401);
  }
  if (currentPassword === newPassword) {
    throw new AppError("Le nouveau mot de passe doit être différent", 400);
  }

  user.password = newPassword;
  await user.save();

  return { message: "Mot de passe mis à jour avec succès" };
}

module.exports = {
  createUser,
  getUsers,
  getUserByEmail,
  getUserById,
  updateUser,
  disableUser,
  enableUser,
  changePassword
};
