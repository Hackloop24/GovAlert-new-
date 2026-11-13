import mongoose from 'mongoose';

const InfoSchema = new mongoose.Schema({
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    // bcrypt hash (older accounts may still hold a plain-text password; it is upgraded on next login).
    // Accounts created with Google have no password.
    password: { type: String, required: function () { return !this.googleId; } },
    googleId: { type: String, index: true, sparse: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    // Email verification. Accounts created before verification existed have no
    // `emailVerified` field and are treated as verified.
    emailVerified: { type: Boolean },
    verifyCodeHash: String,
    verifyCodeExpires: Date,
    verifyCodeSentAt: Date,
    verifyAttempts: { type: Number, default: 0 },
})
const InfoModel = mongoose.model("information", InfoSchema)
export default InfoModel;
