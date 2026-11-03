require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();

const jwt = require("jsonwebtoken");
function verifyToken(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).send({ message: "Unauthorized" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); 
    next();
  } catch {
    res.status(401).send({ message: "Invalid or expired token" });
  }
}
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const db = client.db("eventhub");
    const events = db.collection("events");
    const joined = db.collection("joinedEvents");
    console.log("MongoDB connected successfully");

    const today = () => new Date().toISOString().slice(0, 10);

  
    app.post("/events", async (req, res) => {
      const event = req.body;

            if (!event.title || !event.eventDate || !event.creatorEmail) {
        return res.status(400).send({ message: "Missing required fields" });
      }
      if (event.title.trim().length < 5) {
        return res.status(400).send({ message: "Title must be at least 5 characters" });
      }
      if (!event.description || event.description.trim().length < 20) {
        return res.status(400).send({ message: "Description must be at least 20 characters" });
      }
      if (event.eventDate < today()) {
        return res.status(400).send({ message: "Date must be in the future" });
      }
    
      const result = await events.insertOne({ ...event, createdAt: new Date() });
      res.send(result);
    });


    app.get("/events", async (req, res) => {
      const limit = parseInt(req.query.limit) || 0;
      const list = await events
        .find({ eventDate: { $gte: today() } })
        .sort({ eventDate: 1 })
        .limit(limit)
        .toArray();
      res.send(list);
    });


    app.get("/events/:id", async (req, res) => {
      if (!ObjectId.isValid(req.params.id)) return res.status(400).send({ message: "Invalid id" });
      const event = await events.findOne({ _id: new ObjectId(req.params.id) });
      if (!event) return res.status(404).send({ message: "Not found" });
      res.send(event);
    });

  
    app.get("/my-events", async (req, res) => {
      const list = await events
        .find({ creatorEmail: req.query.email })
        .sort({ eventDate: 1 })
        .toArray();
      res.send(list);
    });


    app.put("/events/:id", async (req, res) => {
      const { creatorEmail, _id, ...data } = req.body;
      if (data.eventDate && data.eventDate < today()) {
        return res.status(400).send({ message: "Date must be in the future" });
      }
      const result = await events.updateOne(
        { _id: new ObjectId(req.params.id), creatorEmail: req.query.email },
        { $set: data }
      );
      res.send(result);
    });

  
    app.delete("/events/:id", async (req, res) => {
      const result = await events.deleteOne({
        _id: new ObjectId(req.params.id),
        creatorEmail: req.query.email,
      });
      res.send(result);
    });

 
    app.post("/join", async (req, res) => {
      const { eventId, userEmail } = req.body;

            if (!eventId || !userEmail || !ObjectId.isValid(eventId)) {
        return res.status(400).send({ message: "Valid eventId and userEmail are required" });
      } 


      const exists = await joined.findOne({ eventId, userEmail });
      if (exists) return res.status(409).send({ message: "Already joined" });
      const event = await events.findOne({ _id: new ObjectId(eventId) });
      if (!event) return res.status(404).send({ message: "Event not found" });
      const result = await joined.insertOne({
        eventId,
        userEmail,
        userName: req.body.userName || "",
        eventTitle: event.title,
        thumbnail: event.thumbnail,
        location: event.location,
        eventType: event.eventType,
        eventDate: event.eventDate,
        joinedAt: new Date(),
      });
      res.send(result);
    });

   
    app.get("/joined", async (req, res) => {
      const list = await joined
        .find({ userEmail: req.query.email })
        .sort({ eventDate: 1 })
        .toArray();
      res.send(list);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
  }
}
run();

app.get("/", (req, res) => {

    res.send("EventHub server is running. Try GET /events");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});