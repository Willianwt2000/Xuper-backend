import mongoose, {
  type Document,
  type Model,
} from "mongoose";

export interface IEmailVerification extends Document {
  email: string;
  codeHash: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const { Schema } = mongoose;

const emailVerificationSchema = new Schema<IEmailVerification>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    codeHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: {
        expires: 0,
      },
    },
  },
  {
    timestamps: true,
  },
);

const EmailVerification: Model<IEmailVerification> =
  mongoose.models.EmailVerification ??
  mongoose.model<IEmailVerification>(
    "EmailVerification",
    emailVerificationSchema,
  );

export { EmailVerification };
export default EmailVerification;

