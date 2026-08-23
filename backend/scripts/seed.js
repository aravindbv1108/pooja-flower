/**
 * OPTIONAL development seed script.
 * Not run automatically - run manually with: npm run seed
 * Creates one demo user, one master, one task with a few days, and a payment,
 * purely to make local development/testing easier. Safe to skip entirely.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Master = require('../models/Master');
const Task = require('../models/Task');
const DailyRecord = require('../models/DailyRecord');
const Payment = require('../models/Payment');
const { generateTaskName } = require('../utils/taskNaming');
const { calculateDailyAmount } = require('../utils/calculations');

const run = async () => {
  await connectDB();

  const email = 'demo@poojaflower.test';
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name: 'Demo Owner',
      email,
      password: 'password123',
      businessName: 'Pooja Flower',
      ownerName: 'Demo Owner',
    });
    console.log('Created demo user:', email, '/ password123');
  } else {
    console.log('Demo user already exists:', email);
  }

  let master = await Master.findOne({ owner: user._id, name: 'Jasmine Garland' });
  if (!master) {
    master = await Master.create({ owner: user._id, name: 'Jasmine Garland', price: 20, unit: 'Piece', createdBy: user._id });
  }

  const existingTask = await Task.findOne({ owner: user._id, master: master._id });
  if (!existingTask) {
    const start = new Date();
    const totalDays = 7;
    const end = new Date(start); end.setDate(end.getDate() + totalDays - 1);

    const task = await Task.create({
      owner: user._id,
      taskName: generateTaskName(master.name, start, end),
      master: master._id,
      masterNameSnapshot: master.name,
      price: master.price,
      unit: master.unit,
      startDate: start,
      endDate: end,
      totalDays,
      status: 'ACTIVE',
      createdBy: user._id,
    });

    const records = [];
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(start); date.setDate(date.getDate() + i);
      const quantity = i < 3 ? 20 + i * 5 : 0;
      records.push({
        owner: user._id,
        task: task._id,
        dayNumber: i + 1,
        date,
        quantity,
        unit: master.unit,
        rate: master.price,
        amount: calculateDailyAmount(quantity, master.price),
        status: i < 3 ? 'COMPLETED' : 'NOT_STARTED',
        createdBy: user._id,
      });
    }
    await DailyRecord.insertMany(records);

    await Payment.create({
      owner: user._id,
      task: task._id,
      amount: 500,
      paymentDate: new Date(),
      paymentMethod: 'UPI',
      createdBy: user._id,
    });

    console.log('Seeded a demo task, daily records, and payment.');
  } else {
    console.log('Demo task already exists, skipping.');
  }

  await mongoose.connection.close();
  console.log('Seed complete.');
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
