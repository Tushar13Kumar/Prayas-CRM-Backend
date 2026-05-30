
// const express = require("express")
// const cors = require("cors");
// const app = express()
// app.use(
//   cors({
//    origin: "*",
 
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true,
//   })
// );
const express = require("express");
const cors = require("cors");
const app = express();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/user.model');
const authMiddleware = require('./middleware/auth.middleware');

// SIGNUP
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
    res.status(500).json({ error: "Signup failed." });
  }
});

// LOGIN
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
    res.status(500).json({ error: "Login failed." });
  }
});

// Sahi order: Pehle CORS, fir JSON parsing
app.use(cors({
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"] // Ye line add karo
}));

// CORS ke turant baad ye middleware add karo pre-flight handle karne ke liye
// app.options('*', cors());

app.use(express.json()); // Ye hamesha routes se pehle hona chahiye
const { initializeDatabase } = require("./db/db.connect");
// const fs = require("fs");

const Lead = require("./models/lead.model");
const SalesAgent = require("./models/salesAgent.model")
const Comment = require("./models/comment.model");
const Tag = require("./models/tag.model");

// app.use(cors());
// app.use(express.json())

initializeDatabase();

// const jsonDataLead = fs.readFileSync("./data/lead.json", "utf-8");
// const leadsData = JSON.parse(jsonDataLead);
// const jsonData = fs.readFileSync("./data/salesAgent.json", "utf-8");
// const salesAgentsData = JSON.parse(jsonData)
// const jsonCommentData = fs.readFileSync("./data/comment.json", "utf-8");
// const commentsData = JSON.parse(jsonCommentData);
// const jsonTagData = fs.readFileSync("./data/tag.json", "utf-8");
// const tagsData = JSON.parse(jsonTagData);



// 6. Seed function
// async function seedLeadsData() {
//     try {
//         for (const leadData of leadsData) {

//             // 6.1 Check if SalesAgent exists (to avoid errors)
//             const agentExists = await SalesAgent.findById(leadData.salesAgent);

//             if (!agentExists) {
//                 console.log("❌ SalesAgent not found for ID:", leadData.salesAgent);
//                 continue;  // Skip this lead, move to next
//             }

//             // 6.2 Create new Lead
//             const newLead = new Lead({
//                 name: leadData.name,
//                 source: leadData.source,
//                 salesAgent: leadData.salesAgent,
//                 status: leadData.status,
//                 tags: leadData.tags,
//                 timeToClose: leadData.timeToClose,
//                 priority: leadData.priority
//             });

//             // 6.3 Save Lead
//             await newLead.save();
//         }

//         console.log("✅ Leads seeded successfully!");

//     } catch (error) {
//         console.log("❌ Error in seeding leads:", error);
//     }
// }


// function seedSalesAgentsData(){
//     try{
//         for( const saleAgentData of salesAgentsData){
//             const newSaleAgent = new SalesAgent({
//                 name: saleAgentData.name,
//                 email: saleAgentData.email
//             })
//             newSaleAgent.save()
//         }

//     }catch(error){
//         console.log("Error in seeding data" , error)

//     }

// }

// async function seedCommentsData() {
//   try {
//     for (const commentData of commentsData) {

//       // 🔍 Check Lead exists
//       const leadExists = await Lead.findById(commentData.lead);
//       if (!leadExists) {
//         console.log("❌ Lead not found:", commentData.lead);
//         continue;
//       }

//       // 🔍 Check SalesAgent exists
//       const agentExists = await SalesAgent.findById(commentData.author);
//       if (!agentExists) {
//         console.log("❌ SalesAgent not found:", commentData.author);
//         continue;
//       }

//       // ✅ Create Comment
//       const newComment = new Comment({
//         lead: commentData.lead,
//         author: commentData.author,
//         commentText: commentData.commentText
//       });

//       await newComment.save();
//     }

//     console.log("✅ Comments seeded successfully!");

//   } catch (error) {
//     console.log("❌ Error in seeding comments:", error);
//   }
// }

// async function seedTagsData() {
//   try {
//     for (const tagData of tagsData) {

//       // ❌ Duplicate se bachne ke liye check
//       const tagExists = await Tag.findOne({ name: tagData.name });

//       if (tagExists) {
//         console.log("⚠️ Tag already exists:", tagData.name);
//         continue;
//       }

//       const newTag = new Tag({
//         name: tagData.name
//       });

//       await newTag.save();
//     }

//     console.log("✅ Tags seeded successfully!");

//   } catch (error) {
//     console.log("❌ Error in seeding tags:", error);
//   }
// }



//  seedSalesAgentsData()
 // 7. Call the function
// seedLeadsData();

// seedCommentsData();
// seedTagsData();



// GET ALL LEADS
async function readAllLeads(filters = {}) {
  try {
    const leads = await Lead.find(filters).populate("salesAgent");
    return leads;
  } catch (error) {
    throw error;
  }
}

// CREATE LEAD
async function createLead(newLead) {
  try {
    const lead = new Lead(newLead);
    return await lead.save();
  } catch (error) {
    throw error;
  }
}

// GET LEAD BY ID
async function readLeadById(leadId) {
  try {
    return await Lead.findById(leadId).populate("salesAgent");
  } catch (error) {
    throw error;
  }
}

// UPDATE LEAD
async function updateLeadById(leadId, updatedData) {
  try {
    return await Lead.findByIdAndUpdate(leadId, updatedData, { new: true })
      .populate("salesAgent");
  } catch (error) {
    throw error;
  }
}

// DELETE LEAD
async function deleteLeadById(leadId) {
  try {
    return await Lead.findByIdAndDelete(leadId);
  } catch (error) {
    throw error;
  }
}

// CREATE LEAD
app.post("/leads", async (req, res) => {
  try {
    const lead = await createLead(req.body);
    res.status(201).json(lead);
  } catch (error) {
    res.status(500).json({ error: "Failed to create lead" });
  }
});

// GET ALL LEADS (with filters)
app.get("/leads", async (req, res) => {
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

// GET LEAD BY ID
app.get("/leads/:id", async (req, res) => {
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

// UPDATE LEAD
app.put("/leads/:id", async (req, res) => {
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

// UPDATE LEAD (PATCH method support)
app.patch("/leads/:id", async (req, res) => {
  try {
    // updateLeadById function wahi use hoga jo aapne pehle se banaya hai
    const updatedLead = await updateLeadById(req.params.id, req.body);
    
    if (updatedLead) {
      res.json(updatedLead);
    } else {
      res.status(404).json({ error: "Lead not found" });
    }
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ error: "Failed to update lead" });
  }
});

// DELETE LEAD
app.delete("/leads/:id", async (req, res) => {
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


//sales api 


async function createSalesAgent(agentData) {
  try {
    const agent = new SalesAgent(agentData);
    return await agent.save();
  } catch (error) {
    throw error;
  }
}

async function readAllSalesAgents() {
  try {
    return await SalesAgent.find();
  } catch (error) {
    throw error;
  }
}

// GET ALL AGENTS
app.get("/agents", async (req, res) => {
  try {
    const agents = await readAllSalesAgents(); // Ye function aapne pehle se banaya hua hai
    if (agents) {
      res.json(agents);
    } else {
      res.status(404).json({ error: "No agents found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch agents" });
  }
});

app.post("/agents", async (req, res) => {
  try {
    const agent = await createSalesAgent(req.body);
    res.status(201).json(agent);
  } catch (error) {
    res.status(500).json({ error: "Failed to create sales agent" });
  }
});

// DELETE SALES AGENT
app.delete("/agents/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Delete request received for ID:", id); // Console check ke liye

    const deletedAgent = await SalesAgent.findByIdAndDelete(id);
    
    if (deletedAgent) {
      // Leads update logic
      await Lead.updateMany({ salesAgent: id }, { $set: { salesAgent: null } });
      return res.json({ message: "Agent successfully deleted" });
    } else {
      console.log("Agent not found in DB");
      return res.status(404).json({ error: "Agent ID not found in database" });
    }
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ error: "Internal Server Error during deletion" });
  }
});





async function addCommentToLead(leadId, commentData) {
  try {
    const comment = new Comment({ ...commentData, lead: leadId });
    return await comment.save();
  } catch (error) {
    throw error;
  }
}

async function readCommentsByLeadId(leadId) {
  try {
    return await Comment.find({ lead: leadId });
  } catch (error) {
    throw error;
  }
}

app.post("/leads/:id/comments", async (req, res) => {
  try {
    const { authorId, text } = req.body; // Expecting ID from frontend
    
    const newComment = new Comment({
      lead: req.params.id,
      author: authorId, // Must be the MongoDB _id
      commentText: text
    });

    const savedComment = await newComment.save();
    
    // To send back the updated list of comments to the frontend:
    const allComments = await Comment.find({ lead: req.params.id }).populate("author");
    res.status(201).json(allComments); 
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

app.get("/leads/:id/comments", async (req, res) => {
  try {
    const comments = await readCommentsByLeadId(req.params.id);
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});


// Leads closed last week
app.get("/report/last-week", async (req, res) => {
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

// Pipeline count
app.get("/report/pipeline", async (req, res) => {
  try {
    const count = await Lead.countDocuments({ status: { $ne: "Closed" } });
    res.json({ totalLeadsInPipeline: count });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch pipeline data" });
  }
});





const PORT = process.env.PORT
app.listen(PORT , () => {
    console.log(`server is running on ${PORT}`)
})
