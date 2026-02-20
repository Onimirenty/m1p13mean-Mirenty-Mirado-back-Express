const User = require('../users/User.model');
const jwt = require('jsonwebtoken');

const loginUser = async (contact, password) => {

  const user = await User.findOne({ contact })
    .select('+password');
  // console.log("Password in DB:", user.password);
  // console.log("Password received:", password);
  if (!user) {
    const error = new Error("Invalid credentials");
    error.status = 401;
    throw error;
  }

  if (user.status === 'desactive') {
    const error = new Error("Account disabled");
    error.status = 403;
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  console.log("Password match:", isMatch); // Debug log

  if (!isMatch) {
    const error = new Error("Invalid credentials");
    error.status = 401;
    throw error;
  }

  const token = jwt.sign(
    { userId: user._id, role: user.role ,email: user.email},
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  return {
    token,
    user: {
      id: user._id,
      role: user.role,
      email: user.email
    }
  }

};

module.exports = { loginUser };
