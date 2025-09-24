import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IAggregate extends Document {
  sessionId: Types.ObjectId;
  userId: Types.ObjectId; // duplicate for faster per-user queries
  metrics: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const AggregateSchema = new Schema<IAggregate>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
      unique: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    metrics: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

AggregateSchema.index({ userId: 1, sessionId: 1 });

export const Aggregate: Model<IAggregate> =
  mongoose.models.Aggregate || mongoose.model<IAggregate>('Aggregate', AggregateSchema);
