const { Schema, model } = require('mongoose');

const eventSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    capacity: { type: Number, required: true },
    price: { type: Number, required: true },
    attendees: [{ type: Schema.Types.ObjectId, ref: 'users' }],
    rating: { type: Number, default: 0 },
    creator: { type: Schema.Types.ObjectId, ref: 'users' }, 
    isDeleted: { type: Boolean, default: false }, 
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const eventModel = model('events', eventSchema);

module.exports = eventModel;
