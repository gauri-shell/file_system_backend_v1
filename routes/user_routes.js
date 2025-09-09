import express from "express";
import checkAuth from "../auth.js";
const router = express.Router();
import { ObjectId } from "mongodb";
import {client} from "../config/db.js"

router.post("/register", express.json(), async (req, res, next) => {
  const { name, email, password } = req.body;
  const db = req.db;
  // const session=client.startSession();
  console.log(req.body)

  const user = await db.collection("users").findOne({ email });
  if (user) {
    return res.status(409).json({ error: "user already exists" });
  }

  try {
    const rootDirId = new ObjectId();
    const userId = new ObjectId();
    
// session.startTransaction();
    const dirCollection = db.collection("directories");
    await dirCollection.insertOne({
      _id: rootDirId,
      name: `root-${email}`,
      parentDirId: null,
      userId,
    },
    // {session}
  );

    await db.collection("users").insertOne({
      _id: userId,
      name,
      email, 
      password,
      rootDirId,
    },
    // {session}
  );

// await session.commitTransaction();

    return res.status(201).json({ message: "user Registered scuccessfully " });
  } catch (err) {
    // await session.abortTransaction();
    // if(err.code === 121){
    // return res.status(400).json({error:"Invalid input, please enter valid fields "})
    // }else{
        next(err)
    // }
  }
});

router.post("/login", express.json(), async (req, res) => {
  const { email, password } = req.body;
  const db = req.db;

  const user = await db.collection("users").findOne({ email, password });
  console.log("user logged in as ::",user)


  if (!user) {
    return res.status(404).json({ error: "invalid credentials" });
  }

  //  Cookie with 1 hour expiration
  res.cookie("userId", user._id.toString(), {
    sameSite: "none",
    secure: true,
    httpOnly: true,
    maxAge:1000 * 60 * 60,    // 1 hour
  });

  return res.status(201).json({ message: "login successful " });
});

// for home route
router.get("/", checkAuth, (req, res) => {
  res.status(200).json({
    name: req.user.name,
    email: req.user.email,
  });
});

router.post("/logout", (req, res) => {
  res.clearCookie("userId",{
    sameSite:"none",
    secure:true,
    httpOnly:true
  });
  return res.status(204).end();
});

export default router;
