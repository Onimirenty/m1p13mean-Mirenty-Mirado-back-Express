const bcrypt = require('bcrypt');
const User = require('../users/User.model');
const RefreshToken = require('../refreshToken/RefreshToken.model');
const { loginUser, createToken, generateTokens } = require('./auth.service');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');
const jwt = require('jsonwebtoken');

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
// NOUVEAU : registerClient = signup enrichi qui retourne un token directement
// Même logique que signup mais :
//   - accepte nom, genre, dateNaissance en plus
//   - retourne { token, role, email } comme demandé dans le PDF
exports.registerClient = async (req, res, next) => {
  try {
    const { nom, genre, dateNaissance, email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email et mot de passe requis', 400);
    }

    const user = new User({
      name: nom,
      email,
      password,
      role: 'CUSTOMER',
      // genre et dateNaissance sont ignorés par le modèle User actuel
      // → à ajouter dans User.model.js si nécessaire plus tard
    });

    await user.save();

    // Contrairement à signup, on génère et retourne un token directement
    const { accessToken } = await generateTokens(
      user,
      process.env.REFRESH_TOKEN_DURATION_IN_DAYS
    );

    return res.status(200).json({
      token: accessToken,
      role: user.role,
      email: user.email,
    });

  } catch (error) {
    next(error);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AppError("Missing refresh token", 400);
    }

    const stored = await RefreshToken.findOne({ token: refreshToken });

    if (!stored) {
      throw new AppError("Invalid refresh token", 401);
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
    // logger.info("BODY RECEIVED:", req.body);

    if (!email || !password) {
      throw new AppError("Missing credentials", 400);
    }

    const result = await loginUser(email, password);

    // if (process.env.NODE_ENV === 'development') {
    //   const { writeJsonFile, formatTimestamp } = require('../../utils/Utils');
    //   let DirPath = '/home/mirenty/Documents/tech_project/Node/express_js/m1p13mean-Mirenty-Mirado-back-Express/Test/httpTest/loged_user_test/';
    //   let filename = `${result.email}_${formatTimestamp(Date.now())}`;
    //   await writeJsonFile(DirPath, filename, '.json', result);
    // }

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

    res.json({ message: "succes de la deconexion " });

  } catch (error) {
    next(error);
  }
};

exports.my_indentity = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("wrong authorization type, token not provided", 401);
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError("Missing token", 401);
    }
    logger.info(`Token received for identity check: ${token}`);

    const whoAmI = require('./auth.service').whoAmI;
    const result = await whoAmI(token);
    res.status(200).json(result);


  } catch (error) {
    next(error);
  }
};