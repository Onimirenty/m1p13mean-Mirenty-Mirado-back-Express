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
    next(error);
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
    { status: 'Inactive' },
    { new: true }
  ).select('-password');
};

module.exports = {
  createUser,
  getUsers,
  updateUser,
  disableUser
};
