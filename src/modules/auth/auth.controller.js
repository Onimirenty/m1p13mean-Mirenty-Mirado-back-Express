const bcrypt = require('bcrypt');
const User = require('../users/User.model');
const { loginUser, createToken, generateTokens } = require('./auth.service');

exports.signup = async (req, res, next) => {
  try {
    const user = new User({
      email: req.body.email,
      password: req.body.password,
    });

    await user.save();

    return res.status(201).json({
      message: "utilisateur cree",
    });

  } catch (error) {
    next(error);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "Missing refresh token" });
    }

    
    const stored = await RefreshToken.findOne({ token: refreshToken });
    
    if (!stored) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    const newAccessToken = createToken(
      { _id: decoded.userId, role: decoded.role, email: decoded.email },
      `${process.env.ACCES_TOKEN_DURATION_IN_MINUTES}m`,
      process.env.JWT_SECRET
    );
    res.status(200).json({ message: "New access token generated", accessToken: newAccessToken });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // console.log("BODY RECEIVED:", req.body);

    if (!email || !password) {
      return res.status(400).json({ message: "Missing credentials" });
      // next(error);
    }

    const result = await loginUser(email, password);

    res.json({
      message: "Login successful",
      ...result
    });

  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    await RefreshToken.deleteOne({ token: refreshToken });

    res.json({ message: "Logout successful" });

  } catch (error) {
    next(error);
  }
};