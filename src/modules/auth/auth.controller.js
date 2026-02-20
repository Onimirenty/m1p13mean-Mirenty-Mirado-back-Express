const { loginUser } = require('./auth.service');

exports.login = async (req, res, next) => {
  try {
    const { contact, password } = req.body;
    console.log("BODY RECEIVED:", req.body);

    if (!contact || !password) {
      return res.status(400).json({ message: "Missing credentials" });
    }

    const result = await loginUser(contact, password);

    res.json({
      message: "Login successful",
      ...result
    });

  } catch (error) {
    next(error);
  }
};

exports.signup = async (req, res, next) => {
  try {
    const hash = await bcrypt.hash(req.body.password, 10);

    const user = new User({
      email: req.body.email,
      password: hash,
    });

    await user.save();

    return res.status(201).json({
      message: "utilisateur cree",
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message || error,
    });
  }
};