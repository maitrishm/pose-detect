import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ISession extends Document {
  userId: Types.ObjectId;
  mode: 'partner' | 'solo';
  startedAt: Date;
  endedAt?: Date;
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mode: { type: String, enum: ['partner', 'solo'], required: true },
    startedAt: { type: Date, required: true, default: () => new Date() },
    endedAt: { type: Date },
    config: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

SessionSchema.index({ userId: 1, startedAt: -1 });

export const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);
