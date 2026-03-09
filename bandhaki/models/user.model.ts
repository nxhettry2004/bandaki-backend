import mongoose, { Document, Schema } from "mongoose";

export type UserRole = "superadmin" | "tenant";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  password: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  expiryDate?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: false, select: false }, // Not required initially for invited users
    email: { type: String, required: true, unique: true },
    role: { 
      type: String, 
      enum: ["superadmin", "tenant"], 
      default: "tenant",
      required: true 
    },
    isActive: { type: Boolean, default: true },
    expiryDate: { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Index for password reset token lookup
UserSchema.index({ passwordResetToken: 1 });

// Check if user subscription is expired
UserSchema.methods.isExpired = function(): boolean {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
};

const UserModel =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default UserModel;
