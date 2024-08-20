const { Router } = require('express');
const userModel = require('../model/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const userRouter = Router();
/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Error while registering
 */

userRouter.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const checkUser = await userModel.findOne({ email: email });
    if (checkUser && !checkUser.isDeleted) {
      return res.status(200).json({ message: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await userModel.create({
      username,
      email,
      password: hash,
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error while registering', error });
  }
});

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: User login
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       400:
 *         description: Invalid email or password
 *       404:
 *         description: Error while login
 */

userRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const checkUser = await userModel.findOne({ email: email });
    if (!checkUser || checkUser.isDeleted) {
      return res.status(400).json({ message: 'Email not registered' });
    }

    const result = await bcrypt.compare(password, checkUser.password);
    if (result) {
      const payload = { email: checkUser.email, role: checkUser.role };
      const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: '1h' });
      return res.status(200).json({ token });
    } else {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error while logging in', error });
  }
});

userRouter.patch('/delete/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await userModel.findById(userId);
    if (!user || user.isDeleted) return res.status(404).json({ message: 'User not found' });

    user.isDeleted = true;
    await user.save();

    res.status(200).json({ message: 'User account deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deactivating user account', error });
  }
});

module.exports = userRouter;

