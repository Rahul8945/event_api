const { Schema, model } = require('mongoose');

const userSchema = new Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    registeredEvents: [{ type: Schema.Types.ObjectId, ref: 'events' }],
    isDeleted: { type: Boolean, default: false }, 
  },
  {
    versionKey: false,
  }
);

const userModel = model('users', userSchema);

module.exports = userModel;
