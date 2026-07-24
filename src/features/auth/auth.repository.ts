import UserModel, { IUser } from "../../models/user.model";

export class AuthRepository {
  async findByUsernameOrEmail(identifier: string): Promise<IUser | null> {
    return UserModel.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    }).select("+password");
  }

  async findById(userId: string): Promise<IUser | null> {
    return UserModel.findById(userId).select("-password").lean() as Promise<IUser | null>;
  }

  async findByResetToken(token: string): Promise<IUser | null> {
    return UserModel.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, {
      password: hashedPassword,
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
    });
  }
}
