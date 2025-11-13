import mongoose, {
  type Document,
  type Model,
  type Types,
} from "mongoose";

export interface IDownload extends Document {
  userId: Types.ObjectId;
  fileName: string;
  fileVersion: string;
  downloadDate: Date;
  ipAddress?: string;
  deviceType?: string;
  status: "success" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

const { Schema } = mongoose;

const downloadSchema = new Schema<IDownload>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileVersion: {
      type: String,
      required: true,
      trim: true,
    },
    downloadDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    deviceType: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["success", "failed"],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const DownloadModel: Model<IDownload> =
  mongoose.models.Download ??
  mongoose.model<IDownload>("Download", downloadSchema);

export { DownloadModel as Download };
export default DownloadModel;

