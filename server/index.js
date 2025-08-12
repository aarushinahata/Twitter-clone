const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const cors = require("cors");

// MongoDB connection string - you need to add your own
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const port = 5000;

const app = express();
app.use(cors());
app.use(express.json());

// In-memory storage for testing (temporary solution)
const inMemoryPosts = [];
const inMemoryUsers = [];
const inMemoryFollows = []; // New: track follow relationships
const inMemoryDailyPosts = []; // New: track daily post counts

let client = null;
let isMongoConnected = false;

async function connectToMongo() {
  try {
    client = new MongoClient(uri);
    await client.connect();
    isMongoConnected = true;
    console.log("✅ Connected to MongoDB successfully!");
  } catch (error) {
    console.log("❌ MongoDB connection failed:", error.message);
    console.log("⚠️  Using in-memory storage for testing");
    isMongoConnected = false;
  }
}

// Helper function to check if user can post
function canUserPost(userEmail) {
  const now = new Date();
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)); // Convert to IST
  const currentHour = istTime.getHours();
  const currentMinute = istTime.getMinutes();
  
  // Check if current time is between 10:00 AM and 10:30 AM IST
  const isWithinPostingWindow = (currentHour === 10 && currentMinute >= 0 && currentMinute <= 30);
  
  // Get user's followers count
  const userFollowers = inMemoryFollows.filter(f => f.following === userEmail).length;
  
  // Get today's post count for this user
  const today = new Date().toDateString();
  const userDailyPosts = inMemoryDailyPosts.filter(p => 
    p.userEmail === userEmail && p.date === today
  ).length;
  
  // Apply posting rules
  if (userFollowers === 0) {
    // No followers: can only post once between 10:00-10:30 AM
    return isWithinPostingWindow && userDailyPosts === 0;
  } else if (userFollowers >= 2 && userFollowers < 10) {
    // 2+ followers: can post 2 times per day
    return userDailyPosts < 2;
  } else if (userFollowers >= 10) {
    // 10+ followers: can post multiple times per day
    return true;
  }
  
  return false;
}

// Helper function to record a post
function recordUserPost(userEmail) {
  const today = new Date().toDateString();
  inMemoryDailyPosts.push({
    userEmail,
    date: today,
    timestamp: new Date()
  });
}

async function run() {
  try {
    await connectToMongo();
    
    if (isMongoConnected) {
      const postcollection = client.db("database").collection("posts");
      const usercollection = client.db("database").collection("users");
      const followscollection = client.db("database").collection("follows");
      const dailypostscollection = client.db("database").collection("dailyposts");
      
      app.post("/register", async (req, res) => {
        const user = req.body;
        const result = await usercollection.insertOne(user);
        res.send(result);
      });
      
      app.get("/loggedinuser", async (req, res) => {
        const email = req.query.email;
        const user = await usercollection.find({ email: email }).toArray();
        res.send(user);
      });
      
      app.post("/post", async (req, res) => {
        const post = req.body;
        const result = await postcollection.insertOne(post);
        res.send(result);
      });
      
      app.get("/post", async (req, res) => {
        const post = (await postcollection.find().toArray()).reverse();
        res.send(post);
      });
      
      app.get("/userpost", async (req, res) => {
        const email = req.query.email;
        const post = (await postcollection.find({ email: email }).toArray()).reverse();
        res.send(post);
      });
      
      app.get("/user", async (req, res) => {
        const user = await usercollection.find().toArray();
        res.send(user);
      });
      
      app.patch("/userupdate/:email", async (req, res) => {
        const filter = req.params;
        const profile = req.body;
        const options = { upsert: true };
        const updateDoc = { $set: profile };
        const result = await usercollection.updateOne(filter, updateDoc, options);
        res.send(result);
      });

      // New endpoints for public space feature
      app.post("/follow", async (req, res) => {
        const { follower, following } = req.body;
        const result = await followscollection.insertOne({ follower, following, timestamp: new Date() });
        res.send(result);
      });

      app.delete("/unfollow", async (req, res) => {
        const { follower, following } = req.body;
        const result = await followscollection.deleteOne({ follower, following });
        res.send(result);
      });

      app.get("/followers/:email", async (req, res) => {
        const email = req.params.email;
        const followers = await followscollection.find({ following: email }).toArray();
        res.send(followers);
      });

      app.get("/following/:email", async (req, res) => {
        const email = req.params.email;
        const following = await followscollection.find({ follower: email }).toArray();
        res.send(following);
      });

      app.post("/publicspace/post", async (req, res) => {
        const post = req.body;
        
        // Check if user can post
        if (!canUserPost(post.email)) {
          const now = new Date();
          const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
          const currentHour = istTime.getHours();
          const currentMinute = istTime.getMinutes();
          
          if (currentHour === 10 && currentMinute >= 0 && currentMinute <= 30) {
            return res.status(403).json({ 
              error: "Posting limit reached for today",
              reason: "You have already posted your daily limit"
            });
          } else {
            return res.status(403).json({ 
              error: "Posting not allowed at this time",
              reason: "You can only post between 10:00 AM - 10:30 AM IST if you don't follow anyone"
            });
          }
        }
        
        // Record the post
        recordUserPost(post.email);
        
        // Save to database
        const result = await postcollection.insertOne(post);
        res.send(result);
      });

      app.get("/publicspace/posts", async (req, res) => {
        const posts = (await postcollection.find().toArray()).reverse();
        res.send(posts);
      });

      app.get("/publicspace/userstats/:email", async (req, res) => {
        const email = req.params.email;
        const followers = await followscollection.find({ following: email }).count();
        const today = new Date().toDateString();
        const todayPosts = await dailypostscollection.find({ 
          userEmail: email, 
          date: today 
        }).count();
        
        res.send({
          followers,
          todayPosts,
          canPost: canUserPost(email),
          postingRules: {
            timeWindow: "10:00 AM - 10:30 AM IST (if no followers)",
            dailyLimit: followers >= 10 ? "Unlimited" : followers >= 2 ? "2 posts" : "1 post"
          }
        });
      });
      
    } else {
      // Fallback to in-memory storage
      app.post("/register", async (req, res) => {
        const user = req.body;
        user.id = Date.now().toString();
        inMemoryUsers.push(user);
        res.send({ insertedId: user.id });
      });
      
      app.get("/loggedinuser", async (req, res) => {
        const email = req.query.email;
        const user = inMemoryUsers.filter(u => u.email === email);
        res.send(user);
      });
      
      app.post("/post", async (req, res) => {
        const post = req.body;
        post._id = Date.now().toString();
        inMemoryPosts.push(post);
        res.send({ insertedId: post._id });
      });
      
      app.get("/post", async (req, res) => {
        res.send([...inMemoryPosts].reverse());
      });
      
      app.get("/userpost", async (req, res) => {
        const email = req.query.email;
        const posts = inMemoryPosts.filter(p => p.email === email);
        res.send([...posts].reverse());
      });
      
      app.get("/user", async (req, res) => {
        res.send(inMemoryUsers);
      });
      
      app.patch("/userupdate/:email", async (req, res) => {
        const email = req.params.email;
        const profile = req.body;
        const userIndex = inMemoryUsers.findIndex(u => u.email === email);
        if (userIndex !== -1) {
          inMemoryUsers[userIndex] = { ...inMemoryUsers[userIndex], ...profile };
        } else {
          inMemoryUsers.push({ email, ...profile });
        }
        res.send({ modifiedCount: 1 });
      });

      // In-memory endpoints for public space feature
      app.post("/follow", async (req, res) => {
        const { follower, following } = req.body;
        const followId = Date.now().toString();
        inMemoryFollows.push({ 
          _id: followId, 
          follower, 
          following, 
          timestamp: new Date() 
        });
        res.send({ insertedId: followId });
      });

      app.delete("/unfollow", async (req, res) => {
        const { follower, following } = req.body;
        const index = inMemoryFollows.findIndex(f => f.follower === follower && f.following === following);
        if (index !== -1) {
          inMemoryFollows.splice(index, 1);
          res.send({ deletedCount: 1 });
        } else {
          res.send({ deletedCount: 0 });
        }
      });

      app.get("/followers/:email", async (req, res) => {
        const email = req.params.email;
        const followers = inMemoryFollows.filter(f => f.following === email);
        res.send(followers);
      });

      app.get("/following/:email", async (req, res) => {
        const email = req.params.email;
        const following = inMemoryFollows.filter(f => f.follower === email);
        res.send(following);
      });

      app.post("/publicspace/post", async (req, res) => {
        const post = req.body;
        
        // Check if user can post
        if (!canUserPost(post.email)) {
          const now = new Date();
          const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
          const currentHour = istTime.getHours();
          const currentMinute = istTime.getMinutes();
          
          if (currentHour === 10 && currentMinute >= 0 && currentMinute <= 30) {
            return res.status(403).json({ 
              error: "Posting limit reached for today",
              reason: "You have already posted your daily limit"
            });
          } else {
            return res.status(403).json({ 
              error: "Posting not allowed at this time",
              reason: "You can only post between 10:00 AM - 10:30 AM IST if you don't follow anyone"
            });
          }
        }
        
        // Record the post
        recordUserPost(post.email);
        
        // Save to in-memory storage
        post._id = Date.now().toString();
        inMemoryPosts.push(post);
        res.send({ insertedId: post._id });
      });

      app.get("/publicspace/posts", async (req, res) => {
        res.send([...inMemoryPosts].reverse());
      });

      app.get("/publicspace/userstats/:email", async (req, res) => {
        const email = req.params.email;
        const followers = inMemoryFollows.filter(f => f.following === email).length;
        const today = new Date().toDateString();
        const todayPosts = inMemoryDailyPosts.filter(p => 
          p.userEmail === email && p.date === today
        ).length;
        
        res.send({
          followers,
          todayPosts,
          canPost: canUserPost(email),
          postingRules: {
            timeWindow: "10:00 AM - 10:30 AM IST (if no followers)",
            dailyLimit: followers >= 10 ? "Unlimited" : followers >= 2 ? "2 posts" : "1 post"
          }
        });
      });
    }
  } catch (error) {
    console.log("Server error:", error);
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Twiller is working");
});

app.listen(port, () => {
  console.log(`🚀 Twiller clone server running on port ${port}`);
  console.log(`📊 MongoDB status: ${isMongoConnected ? 'Connected' : 'Using in-memory storage'}`);
  console.log(`🌍 Public Space feature enabled with posting restrictions`);
});
