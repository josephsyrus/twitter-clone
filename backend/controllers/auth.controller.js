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

        const existingEmail = await User.findOne({email});
        if(existingEmail){
            return res.status(400).json({error: "Email is already in use"});
        }

        if(password.length<6){
            return res.status(400).json({error: "Password must have a minimum of 6 character"});
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
    res.send("You have reached the login endpoint");
}
