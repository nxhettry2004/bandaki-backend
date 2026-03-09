/**
 * Seed script to create the initial superadmin user
 * Run this script once to set up the superadmin account
 * 
 * Usage: node scripts/seed-superadmin.js
 * or: npx ts-node scripts/seed-superadmin.ts
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL || '';
const SUPERADMIN_USERNAME = 'akhanal';
const SUPERADMIN_PASSWORD = 'Ankit@000';
const SUPERADMIN_EMAIL = 'superadmin@bandhaki.local';

async function seedSuperadmin() {
  if (!MONGODB_URI) {
    console.error('Error: MongoDB connection string is not set.');
    console.error(`Expected in: ${envPath}`);
    console.error('Set either MONGODB_URI or MONGODB_URL.');
    console.error('Example: MONGODB_URI=mongodb://127.0.0.1:27017/bandhaki');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Define User schema inline for the script
    const UserSchema = new mongoose.Schema(
      {
        username: { type: String, required: true, unique: true },
        password: { type: String },
        email: { type: String, required: true, unique: true },
        role: { 
          type: String, 
          enum: ['superadmin', 'tenant'], 
          default: 'tenant',
          required: true 
        },
        isActive: { type: Boolean, default: true },
        expiryDate: { type: Date },
        passwordResetToken: { type: String },
        passwordResetExpires: { type: Date },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
      { timestamps: true }
    );

    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    // Check if superadmin already exists
    const existingSuperadmin = await User.findOne({ 
      username: SUPERADMIN_USERNAME,
      role: 'superadmin'
    });

    if (existingSuperadmin) {
      console.log('Superadmin user already exists. Updating password...');
      const hashedPassword = await bcrypt.hash(SUPERADMIN_PASSWORD, 10);
      existingSuperadmin.password = hashedPassword;
      existingSuperadmin.isActive = true;
      await existingSuperadmin.save();
      console.log('Superadmin password updated successfully!');
    } else {
      console.log('Creating superadmin user...');
      const hashedPassword = await bcrypt.hash(SUPERADMIN_PASSWORD, 10);
      
      await User.create({
        username: SUPERADMIN_USERNAME,
        email: SUPERADMIN_EMAIL,
        password: hashedPassword,
        role: 'superadmin',
        isActive: true,
      });
      
      console.log('Superadmin user created successfully!');
    }

    console.log('\n=== SUPERADMIN CREDENTIALS ===');
    console.log(`Username: ${SUPERADMIN_USERNAME}`);
    console.log(`Password: ${SUPERADMIN_PASSWORD}`);
    console.log(`Login URL: /dev`);
    console.log('=============================\n');

  } catch (error) {
    console.error('Error seeding superadmin:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedSuperadmin();
