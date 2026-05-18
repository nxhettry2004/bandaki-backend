/**
 * Seed script to create tenant users
 * Add tenant records to the TENANTS array below, then run:
 *
 * Usage: npm run seed:tenants
 */

import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// ─── Add tenant records here ──────────────────────────────────────────────────
const TENANTS = [
  {
    username: "Hari Bahadur",
    email: "hari@gmail.com",
    password: "Hari@123",
    isActive: true,
    expiryDate: "2027-01-01",
  },
  // {
  //   username: "tenant2",
  //   email: "tenant2@bandhaki.local",
  //   password: "Tenant@002",
  //   isActive: true,
  //   expiryDate: "2027-01-01",
  // },
];
// ─────────────────────────────────────────────────────────────────────────────

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: false, select: false },
    email: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: ["superadmin", "tenant"],
      default: "tenant",
      required: true,
    },
    isActive: { type: Boolean, default: true },
    expiryDate: { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

async function seedTenants() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI environment variable is not set");
    process.exit(1);
  }

  if (TENANTS.length === 0) {
    console.log("No tenants defined in the TENANTS array. Nothing to seed.");
    process.exit(0);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const UserModel =
      mongoose.models.User || mongoose.model("User", UserSchema);

    for (const tenant of TENANTS) {
      const existing = await UserModel.findOne({ username: tenant.username });

      if (existing) {
        console.log(
          `⚠️  "${tenant.username}" already exists — updating password...`
        );
        const hashedPassword = await bcrypt.hash(tenant.password, 12);
        existing.set("password", hashedPassword);
        existing.set("isActive", tenant.isActive ?? true);
        if (tenant.expiryDate)
          existing.set("expiryDate", new Date(tenant.expiryDate));
        await existing.save();
        console.log(`✅ "${tenant.username}" password updated.`);
      } else {
        const hashedPassword = await bcrypt.hash(tenant.password, 12);
        await UserModel.create({
          username: tenant.username,
          email: tenant.email,
          password: hashedPassword,
          role: "tenant",
          isActive: tenant.isActive ?? true,
          expiryDate: tenant.expiryDate
            ? new Date(tenant.expiryDate)
            : undefined,
        });
        console.log(`✅ "${tenant.username}" (${tenant.email}) created.`);
      }
    }

    console.log("\n=== SEEDED TENANT CREDENTIALS ===");
    for (const tenant of TENANTS) {
      console.log(
        `  Username: ${tenant.username} | Password: ${tenant.password} | Expiry: ${tenant.expiryDate ?? "none"}`
      );
    }
    console.log("=================================\n");
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

seedTenants();
