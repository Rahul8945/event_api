const { Router } = require('express');
const eventModel = require('../model/eventModel');
const userModel = require('../model/userModel');
const auth = require('../middleware/auth');

const eventRouter = Router();

/**
 * @swagger
 * /events/create:
 *   post:
 *     summary: Create a new event
 *     tags: [Event]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               capacity:
 *                 type: integer
 *               price:
 *                 type: number
 *                 format: double
 *     responses:
 *       201:
 *         description: Event created successfully
 *       500:
 *         description: Error creating event
 */

eventRouter.post('/create', auth, async (req, res) => {
  try {
    const { name, description, date, capacity, price } = req.body;
    const event = await eventModel.create({
      name,
      description,
      date,
      capacity,
      price,
      creator: req.user._id,
    });
    res.status(201).json({ message: 'Event created successfully', event });
  } catch (error) {
    res.status(500).json({ message: 'Error creating event', error });
  }
});

/**
 * @swagger
 * /events/register/{eventId}:
 *   post:
 *     summary: Register for an event
 *     tags: [Event]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the event to register for
 *     responses:
 *       200:
 *         description: Registered successfully
 *       400:
 *         description: Registration failed
 *       500:
 *         description: Error registering for event
 */

eventRouter.post('/register/:eventId', auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const user = req.user;

    const event = await eventModel.findById(eventId);
    if (!event || event.isDeleted) return res.status(404).json({ message: 'Event not found' });

    if (event.attendees.includes(user._id)) {
      return res.status(400).json({ message: 'You have already registered for this event' });
    }

    if (event.attendees.length >= event.capacity) {
      return res.status(400).json({ message: 'Event is sold out' });
    }

    event.attendees.push(user._id);
    await event.save();

    user.registeredEvents.push(event._id);
    await user.save();

    res.status(200).json({ message: 'Registered successfully', event });
  } catch (error) {
    res.status(500).json({ message: 'Error registering for event', error });
  }
});


/**
 * @swagger
 * /events/cancel/{eventId}:
 *   delete:
 *     summary: Cancel an event
 *     tags: [Event]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the event to cancel
 *     responses:
 *       200:
 *         description: Event cancelled successfully
 *       400:
 *         description: Cannot cancel event
 *       500:
 *         description: Error cancelling event
 */
eventRouter.delete('/cancel/:eventId', auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const user = req.user;
    const X = 7;

    const event = await eventModel.findById(eventId);
    if (!event || event.isDeleted) return res.status(404).json({ message: 'Event not found' });

    if (event.attendees.length > 0) {
      return res.status(400).json({ message: 'Cannot cancel event with registered users' });
    }

    const eventDate = new Date(event.date);
    const currentDate = new Date();
    const daysDifference = (eventDate - currentDate) / (1000 * 3600 * 24);

    if (daysDifference <= X) {
      return res.status(400).json({ message: `Cannot cancel event within ${X} days` });
    }

    event.isDeleted = true;
    await event.save();
    res.status(200).json({ message: 'Event cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling event', error });
  }
});

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Get a list of all events
 *     tags: [Event]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of events
 *       500:
 *         description: Error fetching events
 */

eventRouter.get('/', auth, async (req, res) => {
  try {
    const events = await eventModel.find({ isDeleted: false }).populate('attendees', 'username email');
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events', error });
  }
});

/**
 * @swagger
 * /events/created:
 *   get:
 *     summary: Get a list of events created by the logged-in user
 *     tags: [Event]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of events created by the user
 *       500:
 *         description: Error fetching events
 */

eventRouter.get('/created', auth, async (req, res) => {
  try {
    const user = req.user;
    const events = await eventModel.find({ creator: user._id, isDeleted: false });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events', error });
  }
});

eventRouter.get('/registered', auth, async (req, res) => {
  try {
    const user = req.user;
    const events = await eventModel.find({ attendees: user._id, isDeleted: false }).sort({ date: 1 });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching registered events', error });
  }
});



eventRouter.get('/capacity/:eventId', auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await eventModel.findById(eventId);
    if (!event || event.isDeleted) return res.status(404).json({ message: 'Event not found' });

    const percentageFilled = (event.attendees.length / event.capacity) * 100;
    res.status(200).json({ percentageFilled });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating capacity', error });
  }
});

eventRouter.get('/top5', auth, async (req, res) => {
  try {
    const events = await eventModel.aggregate([
      {
        $match: { isDeleted: false }
      },
      {
        $project: {
          name: 1,
          attendeesCount: { $size: '$attendees' },
          averageRating: '$rating',
        },
      },
      { $sort: { attendeesCount: -1, averageRating: -1 } },
      { $limit: 5 },
    ]);
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching top events', error });
  }
});

module.exports = eventRouter;
