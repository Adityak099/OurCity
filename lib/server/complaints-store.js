import mongoose from "mongoose";

import { connectToDatabase } from "./mongodb";

const { Schema } = mongoose;

const locationSchema = new Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  { _id: false },
);

const driverLocationSchema = new Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracy: { type: Number },
    updatedAt: { type: Date, required: true },
  },
  { _id: false },
);

const complaintSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    citizenId: { type: String, required: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    severity: { type: String, required: true },
    status: {
      type: String,
      enum: ["Submitted", "Assigned", "In Progress", "Resolved"],
      required: true,
    },
    imageUrl: { type: String, required: true },
    location: { type: locationSchema, required: true },
    assignedDriverId: { type: String, default: null },
    driverLocation: { type: driverLocationSchema, default: null },
    resolutionImageUrl: { type: String, default: null },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  {
    collection: "complaints",
    id: false,
    versionKey: false,
  },
);

complaintSchema.index({ citizenId: 1, createdAt: -1 });
complaintSchema.index({ assignedDriverId: 1, status: 1 });

const Complaint =
  mongoose.models.Complaint ||
  mongoose.model("Complaint", complaintSchema, "complaints");

function toComplaintRecord(document) {
  if (!document) return null;

  const record =
    typeof document.toObject === "function"
      ? document.toObject({ versionKey: false })
      : { ...document };

  delete record._id;
  delete record.__v;

  return record;
}

export async function getComplaints() {
  await connectToDatabase();

  const complaints = await Complaint.find({})
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  return complaints.map(toComplaintRecord);
}

export async function saveComplaint(complaint) {
  await connectToDatabase();

  const savedComplaint = await Complaint.create(complaint);

  return toComplaintRecord(savedComplaint);
}

export async function getComplaintsByCitizen(citizenId) {
  await connectToDatabase();

  const complaints = await Complaint.find({ citizenId })
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  return complaints.map(toComplaintRecord);
}

export async function updateComplaint(id, updates) {
  await connectToDatabase();

  const complaint = await Complaint.findOneAndUpdate(
    { id },
    {
      $set: {
        ...updates,
        updatedAt: new Date(),
      },
    },
    {
      new: true,
      runValidators: true,
    },
  )
    .lean()
    .exec();

  return toComplaintRecord(complaint);
}
