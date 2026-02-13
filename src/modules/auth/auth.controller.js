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
