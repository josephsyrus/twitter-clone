import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";

export const signup = async(req,res)=>{
    try{
        const {fullName, username, email, password}=req.body;
        
        const emailRegex= /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)){
            return res.status(400).json({error: "Invalid email format"});
        }

        const existingUser = await User.findOne({username}); //can also be written as [defined in schema] username:username [from req.body]
        if(existingUser){
            return res.status(400).json({error: "Username is already taken"});
        }

        const existingEmail = await User.findOne({email}); //this returns the document containing email, does not return the email
        if(existingEmail){
            return res.status(400).json({error: "Email is already in use"});
        }

        if(password.length<6){
            return res.status(400).json({error: "Password must have a minimum of 6 character"});
        }

        if(!fullName){
            return res.status(400).json({error : "Please enter fullname"});
        }

        const salt = await bcrypt.genSalt(10); //generating a salt of len 10
        const hashedPassword= await bcrypt.hash(password,salt);

        const newUser= new User({
            fullName,
            username,
            email,
            password: hashedPassword
        });

        if(newUser){
            generateTokenAndSetCookie(newUser._id,res);
            await newUser.save();

            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                username: newUser.username,
                email: newUser.email,
                followers: newUser.followers,
                following: newUser.following,
                profileImg: newUser.profileImg,
                coverImg: newUser.coverImg
            })
        }
        else{
            res.status(400).json({error: "Invalid user data"});
        }


    }
    catch(error){
        console.log("Error in signup controller ", error.message);
        res.status(500).json({error: "Internal Server Error"});
    }
}

export const login = async(req,res)=>{
    try{
        const {username, password}=req.body;
        const user= await User.findOne({username});
        const isPasswordValid=await bcrypt.compare(password,user?.password || ""); // the ? and the || ""  is necessary for bcrypt to run error free

        if(!isPasswordValid || !user){
            return res.status(400).json({error:"Incorrect username or password"});
        }

        generateTokenAndSetCookie(user._id,res);

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            followers: user.followers,
            following: user.following,
            profileImg: user.profileImg,
            coverImg: user.coverImg
        });
    }
    catch(error){
        console.log("Error in login controller ", error.message)
        res.status(500).json({error:"Internal Server Error"});
    }
}


export const logout=async(req,res)=>{
    try{
        res.cookie("jwt","",{maxAge:0});
        res.status(200).json({message:"Logged out succesfully"});
    }
    catch(error){
        res.status(500).json({error: "Internal Server Error"});
    }
}

export const getMe=async(req,res)=>{
    try{
        const user=await User.findById(req.user._id).select("-password"); //we get user._id once the jwt is verified
        res.status(200).json(user);
    }
    catch(error){
        console.log("Error in getMe controller");
        res.status(500).json({error:"Internal Server Error"});
    }
}