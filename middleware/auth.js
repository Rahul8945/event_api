const jwt = require('jsonwebtoken');
const userModel = require('../model/userModel');

require('dotenv').config();

const auth = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ message: 'Token header not found' });
  }

  const token = header.split(' ')[1];
  try {
    const decode = jwt.verify(token, process.env.SECRET_KEY);
    req.user = await userModel.findOne({ email: decode.email });
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = auth;
