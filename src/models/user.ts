import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  name: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    expiresAt: { type: Number, required: true },
  },
  { timestamps: true }
);

console.log("mongoose.models:", mongoose.model);

const User = mongoose.models?.User || mongoose.model<IUser>("User", UserSchema);
export default User;
