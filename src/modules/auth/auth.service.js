const jwt = require('jsonwebtoken');
const RefreshToken = require('../refreshToken/RefreshToken.model');

const User = require('../users/User.model');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger')

const createToken = (user, durationnString, secretKey) => {
  return jwt.sign(
    { userId: user._id, role: user.role, email: user.email },
    secretKey,
    { algorithm: "HS256", expiresIn: durationnString }
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
    logger.info("User not found for email:", email); // email essayer
    throw error;
  }

  if (user.status !== 'ACTIVE') {
    const error = new AppError("Account disabled", 403);
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  logger.info(`Password match :, ${isMatch} `); // Debug log

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

const whoAmI = async (token) => {
  logger.info("processing token validation for identity check inside the function whoAmI");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;
    const role = decoded.role;
    return { email, role };

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      try {
        const decodedRefresh = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        const email = decodedRefresh.email;
        const role = decodedRefresh.role;
        return { email, role };
      } catch (error) {
        logger.error("Token verification failed:", error);
        throw new AppError("Invalid token", 401);
      }
    }
    logger.error("Token verification failed:", error);
    throw new AppError("Invalid token", 401);
  }
};


module.exports = {
  loginUser,
  generateTokens,
  createToken,
  whoAmI
};
