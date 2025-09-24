import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWaitlist extends Document {
  email: string;
  createdAt: Date;
}

const WaitlistSchema = new Schema<IWaitlist>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

WaitlistSchema.index({ email: 1 }, { unique: true });

export const Waitlist: Model<IWaitlist> =
  mongoose.models.Waitlist || mongoose.model<IWaitlist>('Waitlist', WaitlistSchema);
