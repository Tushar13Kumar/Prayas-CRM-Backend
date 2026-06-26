const express = require("express");
const cors = require("cors");
const app = express();

// ✅ PEHLE CORS AUR JSON — PHIR BAAKI SAB
app.use(cors({
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

const { initializeDatabase } = require("./db/db.connect");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/user.model');
const authMiddleware = require('./middleware/auth.middleware');
const Lead = require("./models/lead.model");
const SalesAgent = require("./models/salesAgent.model");
const Comment = require("./models/comment.model");
const Tag = require("./models/tag.model");

initializeDatabase();

// ── AUTH ROUTES ──────────────────────────

app.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({ token, user: { name: user.name, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Signup failed." });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password." });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password." });
    }
    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { name: user.name, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login failed." });
  }
});

// ── LEADS ────────────────────────────────

async function readAllLeads(filters = {}) {
  try {
    const leads = await Lead.find(filters).populate("salesAgent");
    return leads;
  } catch (error) { throw error; }
}

async function createLead(newLead) {
  try {
    const lead = new Lead(newLead);
    return await lead.save();
  } catch (error) { throw error; }
}

async function readLeadById(leadId) {
  try {
    return await Lead.findById(leadId).populate("salesAgent");
  } catch (error) { throw error; }
}

async function updateLeadById(leadId, updatedData) {
  try {
    return await Lead.findByIdAndUpdate(leadId, updatedData, { new: true }).populate("salesAgent");
  } catch (error) { throw error; }
}

async function deleteLeadById(leadId) {
  try {
    return await Lead.findByIdAndDelete(leadId);
  } catch (error) { throw error; }
}

app.post("/leads", authMiddleware , async (req, res) => {
  try {
    const lead = await createLead(req.body);
    res.status(201).json(lead);
  } catch (error) {
    res.status(500).json({ error: "Failed to create lead" });
  }
});

app.get("/leads", authMiddleware, async (req, res) => {
  try {
    const leads = await readAllLeads(req.query);
    if (leads.length !== 0) {
      res.json(leads);
    } else {
      res.status(404).json({ error: "No leads found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

app.get("/leads/:id",authMiddleware, async (req, res) => {
  try {
    const lead = await readLeadById(req.params.id);
    if (lead) {
      res.json(lead);
    } else {
      res.status(404).json({ error: "Lead not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch lead" });
  }
});

app.put("/leads/:id",authMiddleware, async (req, res) => {
  try {
    const updatedLead = await updateLeadById(req.params.id, req.body);
    if (updatedLead) {
      res.json(updatedLead);
    } else {
      res.status(404).json({ error: "Lead not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to update lead" });
  }
});

app.patch("/leads/:id", authMiddleware, async (req, res) => {
  try {
    const updatedLead = await updateLeadById(req.params.id, req.body);
    if (updatedLead) {
      res.json(updatedLead);
    } else {
      res.status(404).json({ error: "Lead not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to update lead" });
  }
});

app.delete("/leads/:id", authMiddleware, async (req, res) => {
  try {
    const deletedLead = await deleteLeadById(req.params.id);
    if (deletedLead) {
      res.json({ message: "Lead deleted successfully" });
    } else {
      res.status(404).json({ error: "Lead not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to delete lead" });
  }
});

// ── AGENTS ───────────────────────────────

app.get("/agents", authMiddleware, async (req, res) => {
  try {
    const agents = await SalesAgent.find();
    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch agents" });
  }
});

app.post("/agents", authMiddleware, async (req, res) => {
  try {
    const agent = new SalesAgent(req.body);
    await agent.save();
    res.status(201).json(agent);
  } catch (error) {
    res.status(500).json({ error: "Failed to create sales agent" });
  }
});

app.delete("/agents/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedAgent = await SalesAgent.findByIdAndDelete(id);
    if (deletedAgent) {
      await Lead.updateMany({ salesAgent: id }, { $set: { salesAgent: null } });
      return res.json({ message: "Agent successfully deleted" });
    } else {
      return res.status(404).json({ error: "Agent ID not found in database" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error during deletion" });
  }
});

// ── COMMENTS ─────────────────────────────

app.post("/leads/:id/comments", authMiddleware, async (req, res) => {
  try {
    const { authorId, text } = req.body;
    const newComment = new Comment({
      lead: req.params.id,
      author: authorId,
      commentText: text
    });
    await newComment.save();
    const allComments = await Comment.find({ lead: req.params.id }).populate("author");
    res.status(201).json(allComments);
  } catch (error) {
    res.status(500).json({ error: "Failed to add comment" });
  }
});

app.get("/leads/:id/comments", authMiddleware, async (req, res) => {
  try {
    const comments = await Comment.find({ lead: req.params.id });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// ── REPORTS ──────────────────────────────

app.get("/report/last-week", authMiddleware, async (req, res) => {
  try {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const leads = await Lead.find({
      status: "Closed",
      closedAt: { $gte: lastWeek }
    }).populate("salesAgent", "name");
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch report" });
  }
});

app.get("/report/pipeline", authMiddleware, async (req, res) => {
  try {
    const count = await Lead.countDocuments({ status: { $ne: "Closed" } });
    res.json({ totalLeadsInPipeline: count });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch pipeline data" });
  }
});

// ── SERVER ───────────────────────────────

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`server is running on ${PORT}`);
});