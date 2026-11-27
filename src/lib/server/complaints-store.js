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
    citizenId: { type: String, default: null },
    reporterSessionId: { type: String, default: null },
    reporterName: { type: String, default: "" },
    contactNumber: { type: String, default: "" },
    city: { type: String, default: "" },
    area: { type: String, default: "" },
    ward: { type: String, default: "", trim: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    severity: { type: String, required: true },
    status: {
      type: String,
      enum: ["Submitted", "Assigned", "Reported", "In Progress", "Resolved", "Cleaned"],
      required: true,
    },
    imageUrl: { type: String, required: true },
    beforePhoto: { type: String, default: null },
    location: { type: locationSchema, required: true },
    assignedDriverId: { type: String, default: null },
    driverLocation: { type: driverLocationSchema, default: null },
    resolutionImageUrl: { type: String, default: null },
    afterPhoto: { type: String, default: null },
    cleanedAt: { type: Date, default: null },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  {
    collection: "complaints",
    id: false,
    versionKey: false,
  },
);

const collectionInfoSchema = new Schema({
  city: { type: String, required: true, trim: true },
  area: { type: String, required: true, trim: true },
  driverName: { type: String, required: true, trim: true },
  contactNumber: { type: String, required: true, trim: true },
  vehicleNumber: { type: String, default: "", trim: true },
  collectionTiming: { type: String, required: true, trim: true },
}, { collection: "collection_info", timestamps: true, versionKey: false });

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  phone: { type: String, trim: true, unique: true, sparse: true, maxlength: 16 },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, required: true, enum: ["citizen", "admin", "driver"], default: "citizen" },
  vehicleNumber: { type: String, default: "" },
  assignedWard: { type: String, default: "" },
  isActive: { type: Boolean, default: true },
}, { collection: "users", timestamps: true, versionKey: false });

complaintSchema.index({ citizenId: 1, createdAt: -1 });
complaintSchema.index({ city: 1, area: 1, status: 1 });
complaintSchema.index({ assignedDriverId: 1, status: 1 });
complaintSchema.index({ ward: 1, status: 1, assignedDriverId: 1, createdAt: -1 });

if (mongoose.models.Complaint && !mongoose.models.Complaint.schema.path("ward")) {
  mongoose.deleteModel("Complaint");
}
const Complaint =
  mongoose.models.Complaint ||
  mongoose.model("Complaint", complaintSchema, "complaints");
const CollectionInfo = mongoose.models.CollectionInfo || mongoose.model("CollectionInfo", collectionInfoSchema, "collection_info");
// Next.js dev reloads can retain a Mongoose model compiled before this field existed.
if (mongoose.models.User && !mongoose.models.User.schema.path("phone")) {
  mongoose.deleteModel("User");
}
const User = mongoose.models.User || mongoose.model("User", userSchema, "users");

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

export async function getComplaintByReferenceAndContact(id, contactNumber) {
  await connectToDatabase();
  const complaint = await Complaint.findOne({ id, contactNumber }).lean().exec();
  return toComplaintRecord(complaint);
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

export async function claimReportedSpot(id, driverId, driverName, driverLocation, ward) {
  await connectToDatabase();
  const complaint = await Complaint.findOneAndUpdate(
    { id, ward, status: { $in: ["Reported", "Submitted"] }, $or: [{ assignedDriverId: null }, { assignedDriverId: { $exists: false } }] },
    { $set: { status: "In Progress", assignedDriverId: driverId, driverName, driverLocation, updatedAt: new Date() } },
    { new: true, runValidators: true },
  ).lean().exec();
  return toComplaintRecord(complaint);
}

export async function getCollectionInfo() {
  await connectToDatabase();
  return CollectionInfo.find({}).sort({ city: 1, area: 1 }).lean().exec();
}

export async function saveCollectionInfo(record) {
  await connectToDatabase();
  return CollectionInfo.findOneAndUpdate({ _id: record.id || new mongoose.Types.ObjectId() }, { $set: { city: record.city, area: record.area, driverName: record.driverName, contactNumber: record.contactNumber, vehicleNumber: record.vehicleNumber || "", collectionTiming: record.collectionTiming } }, { upsert: true, new: true, runValidators: true }).lean().exec();
}

export async function deleteCollectionInfo(id) {
  await connectToDatabase();
  return CollectionInfo.findByIdAndDelete(id).lean().exec();
}

export async function findUserByEmail(email) {
  await connectToDatabase();
  return User.findOne({ email: email.toLowerCase().trim() }).select("+passwordHash").lean().exec();
}

export async function findUserByPhone(phone) {
  await connectToDatabase();
  return User.findOne({ phone }).select("+passwordHash").lean().exec();
}

export async function findUserById(id) {
  await connectToDatabase();
  return User.findById(id).lean().exec();
}

export async function createUser(user) {
  await connectToDatabase();
  return User.create(user);
}

export async function getUsersByRole(role) {
  await connectToDatabase();
  return User.find({ role, isActive: true }).select("name phone role vehicleNumber assignedWard").sort({ name: 1 }).lean().exec();
}

export async function getUserById(id) {
  await connectToDatabase();
  return User.findById(id).select("name phone role vehicleNumber assignedWard isActive").lean().exec();
}
