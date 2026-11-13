import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  queryNumber: {
    type: String,
    unique: true,
    default: () => `QR${Date.now()}${Math.floor(Math.random() * 1000)}`,
  },
  description:{type: String, required:true, trim:true},
  state:{type: String, required:true, trim:true},
  district:{type: String, required:true, trim:true},
  taluk:{type: String, required:true, trim:true},
  municipal:{type: String, required:true, trim:true},
  pincode: {type: String, required:true, trim:true},
  // first proof file (kept for older reports/clients); all files are in `proofs`
  proof:{type: String, required:true},
  proofs: { type: [String], default: [] },
  // optional pin on the map
  location: {
    lat: { type: Number, min: -90, max: 90 },
    lng: { type: Number, min: -180, max: 180 },
  },
  // who submitted it (empty for reports made before accounts were linked)
  submittedBy: {
    id: String,
    username: String,
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
    default: 'Pending',
  },
  statusUpdates: { type: [String], default: [] },
  // government response: proof of work uploaded by an admin
  responseProof: String,
  // public fund tracking
  fund: {
    allocated: { type: Number, min: 0, default: 0 },
    utilized: { type: Number, min: 0, default: 0 },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: Date,
});

const ReportModel = mongoose.model('Report', ReportSchema, 'reports');
export default ReportModel;
