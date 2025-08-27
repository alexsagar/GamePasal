// backend/scripts/fix-software-platform.js
/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');

const Product = require('../models/Product');

async function run() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI in .env');
    process.exit(1);
  }

  await mongoose.connect(uri, { autoIndex: false });
  console.log('Connected');

  const res = await Product.updateMany(
    { category: 'Software', platform: { $exists: true } },
    { $unset: { platform: '' } }
  );
  console.log(`Matched: ${res.matchedCount || res.n}, Modified: ${res.modifiedCount || res.nModified}`);

  await mongoose.disconnect();
  console.log('Done');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});