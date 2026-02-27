const jwt = require("jsonwebtoken");
const User = require("./User.model.js");
const UserService = require("./User.service.js");

const protectUser = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Non autorisé" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log(`user : ${decoded.email} ,id ${decoded.id}`);
    const user = await UserService.getUserByEmail(decoded.email);
    if (!user) {
        return res.status(401).json({ message: "protect user : Utilisateur invalide" });
    }
    req.user = user;
    next();
}

module.exports = { protectUser };