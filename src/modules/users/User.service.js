const User = require('./User.model');
const AppError = require('../../utils/AppError');

const createUser = async (data) => {
  try {
    const user = await User.create(data);
    const obj = user.toObject();
    delete obj.password;
    return obj;
  } catch (error) {
    if (error.code === 11000) {
      const e = new Error('Contact already exists');
      e.status = 400;
      throw e;
    }

    if (error.name === 'ValidationError') {
      const e = new Error(Object.values(error.errors).map(err => err.message).join(', '));
      e.status = 400;
      throw e;
    }

    throw error;
  }
};


const getUsers = async () => {
  try {
    return await User.find().select('-password');
  } catch (error) {
    const e = new Error('Failed to fetch users');
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
    { status: 'desactive' },
    { new: true }
  ).select('-password');
};

module.exports = {
  createUser,
  getUsers,
  updateUser,
  disableUser
};
