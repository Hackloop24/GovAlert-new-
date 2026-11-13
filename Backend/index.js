import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import InfoModel from "./models/info.js";
import ReportModel from "./models/ReportModel.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { mailConfigured, sendVerificationCode, verifyMailer } from "./mailer.js";

// Load env
dotenv.config();
const IS_PROD = process.env.NODE_ENV === "production";

// ------------------ CONFIG CHECKS ------------------

if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is not set. Copy Backend/.env.example to Backend/.env and fill it in.");
  process.exit(1);
}

// Signing key for login tokens. Never fall back to a fixed value: anyone reading the
// source could then forge admin tokens. In development a random key is generated
// per run (everyone is logged out on restart); in production it is required.
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  if (IS_PROD) {
    console.error("JWT_SECRET must be set to a random string of at least 32 characters in production.");
    process.exit(1);
  }
  JWT_SECRET = crypto.randomBytes(48).toString("hex");
  console.warn("JWT_SECRET missing or too short - using a temporary random secret (sessions reset on restart).");
}

// Frontends allowed to call this API (comma separated)
const CLIENT_ORIGINS = (process.env.CLIENT_ORIGINS || "http://localhost:5110,http://localhost:4000")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

// Init app
const app = express();
app.disable("x-powered-by");
if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY) || 1); // behind a reverse proxy / load balancer

// Reject query objects like { "$gt": "" } in filters (NoSQL injection)
mongoose.set("sanitizeFilter", true);

app.use(
  helmet({
    // uploaded proofs are shown by the frontend, which runs on a different origin
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || CLIENT_ORIGINS.includes(origin)),
    methods: ["GET", "POST", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  })
);
app.use(express.json({ limit: "100kb" }));

// ------------------ RATE LIMITS ------------------

const limiter = (windowMinutes, max, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit: max,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message },
  });

const authLimiter = limiter(15, 20, "Too many sign-in attempts. Please wait 15 minutes and try again.");
const signupLimiter = limiter(60, 10, "Too many sign-up attempts. Please try again later.");
const codeLimiter = limiter(15, 15, "Too many verification attempts. Please wait 15 minutes.");
const reportLimiter = limiter(60, 20, "You've submitted many reports recently. Please try again later.");
const geoLimiter = limiter(1, 30, "Too many address lookups. Please slow down.");
app.use(limiter(15, 600, "Too many requests. Please slow down.")); // overall safety net

// Path fix for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .then(seedAdmin)
  .then(verifyMailer)
  .catch(err => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

// ------------------ UPLOADS ------------------
// Images, videos and PDFs up to 10 MB each, stored in Backend/uploads.
// The stored file name and extension come only from this allow-list (never from the
// uploaded name), and the file's first bytes must match the type - so an HTML/SVG file
// can't be disguised as an image and served as a web page (stored XSS).
const UPLOAD_DIR = path.join(__dirname, "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

const SIGNATURES = {
  jpg: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  png: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  gif: (b) => b.subarray(0, 4).toString("latin1") === "GIF8",
  webp: (b) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP",
  pdf: (b) => b.subarray(0, 5).toString("latin1") === "%PDF-",
  mp4: (b) => b.subarray(4, 8).toString("latin1") === "ftyp",
  mov: (b) => ["ftyp", "moov", "wide", "mdat", "free"].includes(b.subarray(4, 8).toString("latin1")),
  webm: (b) => b.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])),
};

function hasValidSignature(file) {
  const ext = ALLOWED_TYPES[file.mimetype];
  try {
    const fd = fs.openSync(file.path, "r");
    const head = Buffer.alloc(16);
    fs.readSync(fd, head, 0, 16, 0);
    fs.closeSync(fd);
    return Boolean(ext && SIGNATURES[ext](head));
  } catch {
    return false;
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${ALLOWED_TYPES[file.mimetype]}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5, fields: 20, fieldSize: 20 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = Boolean(ALLOWED_TYPES[file.mimetype]);
    cb(ok ? null : new Error("Only JPG, PNG, GIF, WEBP images, MP4/MOV/WEBM videos or PDF files are allowed"), ok);
  },
});
const filePath = (file) => `uploads/${file.filename}`; // forward slashes so the URL works on every OS
app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    dotfiles: "deny",
    index: false,
    setHeaders: (res) => {
      // files are type-checked on upload; the page CSP would stop browsers' built-in PDF viewer
      res.removeHeader("Content-Security-Policy");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cache-Control", "public, max-age=86400");
    },
  })
);

// ------------------ AUTH HELPERS ------------------

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const isHash = (value) => /^\$2[aby]\$/.test(value || "");

// Checks a password; old plain-text passwords still work once and are upgraded to a hash
async function checkPassword(user, password) {
  if (!user.password || !password) return false; // e.g. Google-only accounts
  if (isHash(user.password)) return bcrypt.compare(password, user.password);
  if (user.password !== password) return false;
  user.password = await bcrypt.hash(password, 10);
  await user.save();
  return true;
}

function sessionFor(user) {
  const payload = { id: user._id.toString(), email: user.email, username: user.username, role: user.role };
  return { token: jwt.sign(payload, JWT_SECRET, { expiresIn: "1d", algorithm: "HS256" }), user: payload };
}

// Returns the signed-in user from the Authorization header, or null
function readUser(req) {
  const token = (req.headers.authorization || "").replace(/^Bearer /, "");
  try {
    return token ? jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }) : null;
  } catch {
    return null;
  }
}

// Loads the account behind the token from the database, so deleted or demoted
// accounts lose access immediately instead of when their token expires.
async function loadUser(req) {
  const claims = readUser(req);
  if (!claims?.id || !mongoose.isValidObjectId(claims.id)) return null;
  const user = await InfoModel.findById(claims.id).select("email username role emailVerified").lean();
  if (!user || user.emailVerified === false) return null;
  return { id: String(user._id), email: user.email, username: user.username, role: user.role };
}

async function requireUser(req, res, next) {
  try {
    req.user = await loadUser(req);
    if (!req.user) return res.status(401).json({ message: "Please sign in to continue" });
    next();
  } catch (err) {
    next(err);
  }
}

async function requireAdmin(req, res, next) {
  try {
    req.user = await loadUser(req);
    if (!req.user) return res.status(401).json({ message: "Please sign in as admin" });
    if (req.user.role !== "admin") return res.status(403).json({ message: "Admin access only" });
    next();
  } catch (err) {
    next(err);
  }
}

const removeFiles = (files = []) => files.forEach((f) => fs.unlink(f.path, () => {}));

// Runs multer, turns its errors into a readable 400 response and rejects
// files whose contents don't match their declared type
const withUpload = (handler) => (req, res, next) =>
  handler(req, res, (err) => {
    const files = [...(req.files || []), ...(req.file ? [req.file] : [])];
    if (err) {
      removeFiles(files);
      const message = err.code === "LIMIT_FILE_SIZE" ? "Each file must be under 10 MB"
        : err.code === "LIMIT_FILE_COUNT" ? "You can attach up to 5 files"
        : err.code === "LIMIT_UNEXPECTED_FILE" ? "Too many files or an unexpected file field"
        : err.code?.startsWith("LIMIT_") ? "The upload is too large"
        : err.message || "File upload failed";
      return res.status(400).json({ message });
    }
    if (files.some((f) => !hasValidSignature(f))) {
      removeFiles(files);
      return res.status(400).json({ message: "One of the files is not a valid image, video or PDF" });
    }
    next();
  });

const str = (v) => (typeof v === "string" ? v : ""); // ignore non-string JSON values

// Creates/updates the admin account from ADMIN_EMAIL / ADMIN_PASSWORD in .env
async function seedAdmin() {
  const email = normalizeEmail(process.env.ADMIN_EMAIL);
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return console.warn("ADMIN_EMAIL / ADMIN_PASSWORD not set - no admin account created");
  if (password.length < 12) {
    if (IS_PROD) {
      console.error("ADMIN_PASSWORD must be at least 12 characters in production - admin account not updated.");
      return;
    }
    console.warn("ADMIN_PASSWORD is shorter than 12 characters - use a stronger one before deploying.");
  }
  const hash = await bcrypt.hash(password, 12);
  await InfoModel.findOneAndUpdate(
    { email },
    { $set: { role: "admin", password: hash, emailVerified: true }, $setOnInsert: { username: "Admin" } },
    { upsert: true }
  );
  console.log(`Admin account ready: ${email}`);
}

// ------------------ EMAIL VERIFICATION ------------------

const CODE_TTL_MS = 10 * 60 * 1000; // code valid for 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // at most one email per minute
const MAX_CODE_ATTEMPTS = 5;

// Accounts made before verification existed have no flag and count as verified
const isVerified = (user) => user.emailVerified !== false;

const cooldownLeft = (user) =>
  user.verifyCodeSentAt ? Math.max(0, RESEND_COOLDOWN_MS - (Date.now() - user.verifyCodeSentAt.getTime())) : 0;

// Creates a new 6-digit code, stores its hash and emails it
async function issueVerificationCode(user) {
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  user.verifyCodeHash = await bcrypt.hash(code, 10);
  user.verifyCodeExpires = new Date(Date.now() + CODE_TTL_MS);
  user.verifyCodeSentAt = new Date();
  user.verifyAttempts = 0;
  await user.save();
  try {
    return await sendVerificationCode({ email: user.email, username: user.username, code });
  } catch (err) {
    console.error("Sending verification email failed:", err.message);
    user.verifyCodeSentAt = undefined; // allow an immediate retry
    await user.save();
    throw Object.assign(new Error("mail"), { mailError: true });
  }
}

// Shared catch for routes that send a code
const mailFailure = (res, err, fallback) =>
  err.mailError
    ? res.status(502).json({ message: "We couldn't send the verification email right now. Please try again shortly." })
    : res.status(500).json({ message: fallback });

const verificationResponse = (email, delivered, message) => ({
  needsVerification: true,
  email,
  message,
  devMode: !delivered, // true when SMTP isn't set up and the code was printed to the backend console
});

// ------------------ GOOGLE SIGN-IN ------------------

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Public settings the frontend needs (the Google client ID is not secret)
app.get("/auth/config", (req, res) => {
  res.json({ googleClientId: GOOGLE_CLIENT_ID || null });
});

// Sign in / sign up with a Google ID token from the "Continue with Google" button
app.post("/auth/google", authLimiter, async (req, res) => {
  if (!GOOGLE_CLIENT_ID) return res.status(503).json({ message: "Google sign-in is not configured" });

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: str(req.body.credential), audience: GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ message: "Google sign-in failed. Please try again." });
  }
  if (!payload?.email || !payload.email_verified)
    return res.status(400).json({ message: "Your Google account's email is not verified" });

  try {
    const email = normalizeEmail(payload.email);
    let user = await InfoModel.findOne({ $or: [{ googleId: payload.sub }, { email }] });
    let created = false;

    if (!user) {
      user = new InfoModel({
        username: (payload.name || email.split("@")[0]).slice(0, 50),
        email,
        googleId: payload.sub,
        role: "user",
        emailVerified: true,
      });
      created = true;
    } else {
      // Link Google to an existing account with the same (Google-verified) email.
      // If that account never proved it owns the email, its password may have been
      // set by someone else (pre-registration takeover) - so drop it.
      if (!isVerified(user)) user.password = undefined;
      user.googleId = user.googleId || payload.sub;
      user.emailVerified = true;
      user.verifyCodeHash = undefined;
      user.verifyCodeExpires = undefined;
    }
    await user.save();

    res.status(created ? 201 : 200).json({ message: created ? "Account created" : "Login successful", ...sessionFor(user) });
  } catch (err) {
    console.error("Google sign-in error:", err);
    res.status(500).json({ message: "Google sign-in failed, please try again" });
  }
});

// ------------------ ROUTES ------------------

// User login
app.post("/login", authLimiter, async (req, res) => {
  const email = normalizeEmail(str(req.body.email));
  const password = str(req.body.password);

  try {
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const user = await InfoModel.findOne({ email });
    if (user && !user.password && user.googleId)
      return res.status(401).json({ message: "This account uses Google sign-in. Please use \"Continue with Google\"." });
    if (!user || !(await checkPassword(user, password)))
      return res.status(401).json({ message: "Invalid email or password" });

    if (!isVerified(user)) {
      // send a fresh code unless one was sent very recently
      const { delivered } = cooldownLeft(user) ? { delivered: mailConfigured() } : await issueVerificationCode(user);
      return res.status(403).json(
        verificationResponse(user.email, delivered, "Please verify your email first. We've sent you a verification code.")
      );
    }

    res.json({ message: "Login successful", ...sessionFor(user) });
  } catch (err) {
    console.error("Login error:", err);
    mailFailure(res, err, "Login failed, please try again");
  }
});

// Admin login - only accounts with role "admin"
app.post("/admin/login", authLimiter, async (req, res) => {
  const email = normalizeEmail(str(req.body.email));
  const password = str(req.body.password);

  try {
    const user = await InfoModel.findOne({ email });
    if (!user || !(await checkPassword(user, password)))
      return res.status(401).json({ message: "Invalid admin email or password" });
    if (user.role !== "admin")
      return res.status(403).json({ message: "This account does not have admin access" });

    res.json({ message: "Login successful", ...sessionFor(user) });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ message: "Login failed, please try again" });
  }
});

// Register (always creates a normal user; admins come from .env)
app.post("/register", signupLimiter, async (req, res) => {
  const username = str(req.body.username).trim();
  const email = normalizeEmail(str(req.body.email));
  const password = str(req.body.password);

  try {
    if (!username || !email || !password)
      return res.status(400).json({ message: "All fields are required" });
    if (username.length > 50)
      return res.status(400).json({ message: "Username must be 50 characters or fewer" });
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ message: "Please enter a valid email" });
    if (password.length < 8 || password.length > 72)
      return res.status(400).json({ message: "Password must be 8 to 72 characters" });

    let user = await InfoModel.findOne({ email });
    if (user && isVerified(user))
      return res.status(409).json({ message: "An account with this email already exists" });

    const hash = await bcrypt.hash(password, 10);
    if (user) {
      // signing up again before verifying: refresh the details and send a new code
      if (cooldownLeft(user))
        return res.status(429).json({ message: "A code was just sent. Please wait a minute before trying again." });
      Object.assign(user, { username, password: hash });
    } else {
      user = new InfoModel({ username, email, password: hash, role: "user", emailVerified: false });
    }

    const { delivered } = await issueVerificationCode(user);
    res.status(201).json(
      verificationResponse(email, delivered, `We've sent a 6-digit verification code to ${email}.`)
    );
  } catch (err) {
    console.error("Register error:", err);
    mailFailure(res, err, "Registration failed, please try again");
  }
});

// Confirm the emailed code; signs the user in on success
app.post("/verify-email", codeLimiter, async (req, res) => {
  const email = normalizeEmail(str(req.body.email));
  const code = str(req.body.code).trim();

  try {
    const user = await InfoModel.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or code" });
    if (isVerified(user)) return res.status(400).json({ message: "This email is already verified. Please sign in." });
    if (!/^\d{6}$/.test(code)) return res.status(400).json({ message: "Enter the 6-digit code from the email" });

    if (!user.verifyCodeHash || !user.verifyCodeExpires || user.verifyCodeExpires < new Date())
      return res.status(400).json({ message: "This code has expired. Please request a new one.", expired: true });
    if (user.verifyAttempts >= MAX_CODE_ATTEMPTS)
      return res.status(429).json({ message: "Too many wrong attempts. Please request a new code.", expired: true });

    if (!(await bcrypt.compare(code, user.verifyCodeHash))) {
      user.verifyAttempts += 1;
      await user.save();
      const left = MAX_CODE_ATTEMPTS - user.verifyAttempts;
      return res.status(400).json({
        message: left > 0 ? `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} left.` : "Too many wrong attempts. Please request a new code.",
        expired: left <= 0,
      });
    }

    user.emailVerified = true;
    user.verifyCodeHash = undefined;
    user.verifyCodeExpires = undefined;
    user.verifyAttempts = 0;
    await user.save();
    res.json({ message: "Email verified", ...sessionFor(user) });
  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ message: "Verification failed, please try again" });
  }
});

// Send a new code
app.post("/resend-verification", codeLimiter, async (req, res) => {
  const email = normalizeEmail(str(req.body.email));
  try {
    const user = await InfoModel.findOne({ email });
    // same answer whether or not the account exists, so emails can't be probed
    if (!user || isVerified(user))
      return res.json(verificationResponse(email, mailConfigured(), "If this account needs verification, a new code has been sent."));

    const wait = cooldownLeft(user);
    if (wait) return res.status(429).json({ message: `Please wait ${Math.ceil(wait / 1000)} seconds before requesting another code.`, retryAfter: Math.ceil(wait / 1000) });

    const { delivered } = await issueVerificationCode(user);
    res.json(verificationResponse(email, delivered, `A new code has been sent to ${email}.`));
  } catch (err) {
    console.error("Resend error:", err);
    mailFailure(res, err, "Could not send the code, please try again");
  }
});

// ------------------ REVERSE GEOCODING ------------------
// Turns map coordinates into State / District / Taluk / Municipality / Pincode
// using OpenStreetMap Nominatim (free; max ~1 request per second, so results are cached).

const geoCache = new Map();
let lastGeoRequest = 0;

const pick = (addr, keys) => keys.map((k) => addr[k]).find(Boolean) || "";

function toReportAddress(addr = {}) {
  return {
    state: pick(addr, ["state", "union_territory", "territory"]),
    district: pick(addr, ["state_district", "district", "county"]).replace(/\s+district$/i, ""),
    // Indian "county" in OSM is usually the taluk / tehsil
    taluk: pick(addr, ["county", "subdistrict", "municipality", "city_district"]).replace(/\s+(taluk|taluka|tehsil|mandal)$/i, ""),
    municipal: pick(addr, ["city", "town", "municipality", "village", "suburb", "hamlet"]),
    pincode: String(addr.postcode || "").replace(/\s+/g, "").slice(0, 6),
  };
}

app.get("/api/geocode/reverse", geoLimiter, requireUser, async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180)
    return res.status(400).json({ message: "Invalid coordinates" });

  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`; // ~10 m grid
  if (geoCache.has(key)) return res.json(geoCache.get(key));

  // respect Nominatim's 1 request/second limit
  const wait = Math.max(0, 1100 - (Date.now() - lastGeoRequest));
  if (wait) await new Promise((r) => setTimeout(r, wait));
  lastGeoRequest = Date.now();

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&accept-language=en&lat=${lat}&lon=${lng}`;
    const response = await fetch(url, {
      headers: { "User-Agent": "GovAlert-grievance-portal/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`Nominatim responded ${response.status}`);
    const data = await response.json();
    if (data.error) return res.status(404).json({ message: "No address found for this spot" });

    const result = { address: toReportAddress(data.address), displayName: data.display_name || "" };
    if (geoCache.size > 1000) geoCache.clear();
    geoCache.set(key, result);
    res.json(result);
  } catch (err) {
    console.error("Reverse geocode error:", err.message);
    res.status(502).json({ message: "Couldn't look up the address right now. Please fill it in manually." });
  }
});

// ------------------ REPORTS ------------------

const STATUSES = ["Pending", "In Progress", "Resolved", "Rejected"];
const REQUIRED_FIELDS = ["description", "state", "district", "taluk", "municipal", "pincode"];
const toNumber = (v) => (v === undefined || v === null || String(v).trim() === "" ? undefined : Number(v));

// Submit a report (signed-in users; 1-5 proof files)
app.post("/report", reportLimiter, requireUser, withUpload(upload.array("proof", 5)), async (req, res) => {
  const files = req.files || [];
  const fail = (code, message) => {
    removeFiles(files);
    res.status(code).json({ message });
  };

  try {
    const body = Object.fromEntries(REQUIRED_FIELDS.map((f) => [f, str(req.body[f]).trim()]));
    const missing = REQUIRED_FIELDS.filter((f) => !body[f]);
    if (missing.length) return fail(400, `Please fill in: ${missing.join(", ")}`);
    if (body.description.length > 2000) return fail(400, "Description must be 2000 characters or fewer");
    if (["state", "district", "taluk", "municipal"].some((f) => body[f].length > 100))
      return fail(400, "Location fields must be 100 characters or fewer");
    if (!/^\d{6}$/.test(body.pincode)) return fail(400, "Pincode must be 6 digits");
    if (!files.length) return fail(400, "Please attach at least one proof file");

    const lat = toNumber(req.body.lat);
    const lng = toNumber(req.body.lng);
    const hasLocation = Number.isFinite(lat) && Number.isFinite(lng);

    const proofs = files.map(filePath);
    const report = await ReportModel.create({
      ...body,
      proof: proofs[0],
      proofs,
      location: hasLocation ? { lat, lng } : undefined,
      submittedBy: { id: req.user.id, username: req.user.username },
      statusUpdates: [`${new Date().toLocaleDateString("en-IN")} - Pending: Report submitted`],
    });

    res.status(201).json({ message: "Report submitted", queryNumber: report.queryNumber, report });
  } catch (err) {
    console.error("Report error:", err);
    fail(500, "Failed to save report, please try again");
  }
});

// All reports (public, newest first)
app.get("/api/reports", async (req, res) => {
  try {
    // public list hides who submitted each report; admins see the submitter's name
    const viewer = await loadUser(req);
    const hidden = viewer?.role === "admin" ? "-submittedBy.id -__v" : "-submittedBy -__v";
    res.json(await ReportModel.find().select(hidden).sort({ createdAt: -1 }).limit(1000));
  } catch (err) {
    res.status(500).json({ message: "Error fetching reports" });
  }
});

// Reports submitted by the signed-in user
app.get("/api/reports/mine", requireUser, async (req, res) => {
  try {
    res.json(await ReportModel.find({ "submittedBy.id": req.user.id }).sort({ createdAt: -1 }));
  } catch (err) {
    res.status(500).json({ message: "Error fetching your reports" });
  }
});

// Public numbers for the Transparency page
app.get("/api/stats", async (req, res) => {
  try {
    const [byStatus, funds] = await Promise.all([
      ReportModel.aggregate([{ $group: { _id: { $ifNull: ["$status", "Pending"] }, count: { $sum: 1 } } }]),
      ReportModel.aggregate([{ $group: { _id: null, allocated: { $sum: "$fund.allocated" }, utilized: { $sum: "$fund.utilized" } } }]),
    ]);
    const status = Object.fromEntries(STATUSES.map((s) => [s, byStatus.find((b) => b._id === s)?.count || 0]));
    const total = Object.values(status).reduce((a, b) => a + b, 0);
    res.json({
      total,
      status,
      resolvedRate: total ? Math.round((status.Resolved / total) * 100) : 0,
      funds: { allocated: funds[0]?.allocated || 0, utilized: funds[0]?.utilized || 0 },
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching statistics" });
  }
});

// Admin: respond to a report - status, note, response proof and fund figures
app.patch("/api/reports/:id", requireAdmin, withUpload(upload.single("responseProof")), async (req, res) => {
  const files = req.file ? [req.file] : [];
  const fail = (code, message) => {
    removeFiles(files);
    res.status(code).json({ message });
  };

  try {
    if (!mongoose.isValidObjectId(req.params.id)) return fail(404, "Report not found");
    const report = await ReportModel.findById(req.params.id);
    if (!report) return fail(404, "Report not found");

    const status = str(req.body.status);
    const note = str(req.body.note).trim();
    if (status && !STATUSES.includes(status)) return fail(400, "Invalid status");
    if (note.length > 1000) return fail(400, "Note must be 1000 characters or fewer");

    const allocated = toNumber(req.body.fundAllocated) ?? report.fund?.allocated ?? 0;
    const utilized = toNumber(req.body.fundUtilized) ?? report.fund?.utilized ?? 0;
    if (![allocated, utilized].every((n) => Number.isFinite(n) && n >= 0))
      return fail(400, "Fund amounts must be positive numbers");
    if (utilized > allocated) return fail(400, "Funds utilized cannot be more than funds allocated");

    const statusChanged = status && status !== (report.status || "Pending");
    if (status) report.status = status;
    report.fund = { allocated, utilized };
    if (req.file) report.responseProof = filePath(req.file);

    if (statusChanged || note || req.file) {
      const parts = [note, req.file ? "proof of work attached" : ""].filter(Boolean).join(" - ");
      report.statusUpdates.push(`${new Date().toLocaleDateString("en-IN")} - ${report.status}${parts ? `: ${parts}` : ""}`);
    }
    report.updatedAt = new Date();
    await report.save();
    res.json(report);
  } catch (err) {
    console.error("Update report error:", err);
    fail(400, "Could not update the report");
  }
});

// ------------------ FALLBACKS ------------------

app.use((req, res) => res.status(404).json({ message: "Not found" }));

// Never send stack traces or internal error details to clients
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === "entity.too.large") return res.status(413).json({ message: "Request is too large" });
  if (err.type === "entity.parse.failed") return res.status(400).json({ message: "Invalid request body" });
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Something went wrong. Please try again." });
});

// Server start
const PORT = process.env.PORT || 5003;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
