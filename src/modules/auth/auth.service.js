const User = require('../users/User.model');
const jwt = require('jsonwebtoken');
const AppError = require('../../utils/AppError');
const RefreshToken = require('../refreshToken/RefreshToken.model')
  ;

const createToken = (user, durationnString, secretKey) => {
  return jwt.sign(
    { userId: user._id, role: user.role, email: user.email },
    secretKey,
    { algorithm: "HS256", expiresIn: durationnString },
    { expiresIn: durationnString }
  );
}


const generateTokens = async (user, refreshTokenDurationInDays) => {

  const accessToken = createToken(user, `${process.env.ACCES_TOKEN_DURATION_IN_MINUTES}m`, process.env.JWT_SECRET);
  const refreshToken = createToken(user, `${refreshTokenDurationInDays}d`, process.env.JWT_REFRESH_SECRET);

  await RefreshToken.create({
    user: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + refreshTokenDurationInDays * 24 * 60 * 60 * 1000)
  });
  return { accessToken, refreshToken };
};

const loginUser = async (email, password) => {

  const user = await User.findOne({ email })
    .select('+password');

  if (!user) {
    const error = new AppError("Email or password incorrect", 401);
    console.log("User not found for email:", email); // email essayer
    throw error;
  }

  if (user.status !== 'active') {
    const error = new AppError("Account disabled", 403);
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  console.log("Password match:", isMatch); // Debug log

  if (!isMatch) {
    const error = new AppError('Email or password incorrect', 401);
    throw error;
  }

  const { accessToken, refreshToken } = await generateTokens(user, process.env.REFRESH_TOKEN_DURATION_IN_DAYS);


  return {
    refreshToken: refreshToken,
    accessToken: accessToken,
    role: user.role,
    email: user.email
  }

};

module.exports = {
  loginUser,
  generateTokens,
  createToken
};
