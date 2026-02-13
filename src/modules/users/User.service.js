const User = require('./User.model');

const createUser = async (data) => {
  const user = await User.create(data);
  const obj = user.toObject();
  delete obj.password;
  return obj;
};

const getUsers = async () => {
  return User.find().select('-password');
};

const updateUser = async (id, data) => {

  if (data.password) {
    const error = new Error("Use dedicated route to update password");
    error.status = 400;
    throw error;
  }

  return User.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true
  }).select('-password');
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
