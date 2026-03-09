import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function seedSuperadmin() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI environment variable is not set");
    process.exit(1);
  }

  const username = process.env.SUPERADMIN_USERNAME || "akhanal";
  const password = process.env.SUPERADMIN_PASSWORD || "Ankit@000";
  const email = process.env.SUPERADMIN_EMAIL || "admin@bandhaki.com";

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const UserModel = mongoose.models.User || mongoose.model("User", new mongoose.Schema({
      username: { type: String, required: true, unique: true },
      password: { type: String, required: false, select: false },
      email: { type: String, required: true, unique: true },
      role: { type: String, enum: ["superadmin", "tenant"], default: "tenant", required: true },
      isActive: { type: Boolean, default: true },
      expiryDate: { type: Date },
      passwordResetToken: { type: String },
      passwordResetExpires: { type: Date },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    }, { timestamps: true }));

    const existing = await UserModel.findOne({ username });
    if (existing) {
      console.log(`⚠️  Superadmin "${username}" already exists. Skipping.`);
    } else {
      const hashedPassword = await bcrypt.hash(password, 12);
      await UserModel.create({
        username,
        password: hashedPassword,
        email,
        role: "superadmin",
        isActive: true,
      });
      console.log(`✅ Superadmin "${username}" created successfully`);
    }
  } catch (error) {
    console.error("❌ Seed error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

seedSuperadmin();
