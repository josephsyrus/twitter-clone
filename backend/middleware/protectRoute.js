import User from "../models/user.model.js";
import jwt from "jsonwebtoken";


//everything obtained in the middleware will be accessible by the 'next' function
export const protectRoute=async(req,res,next)=>{
    try{
        const token=req.cookies.jwt;
        if(!token){
            return res.status(401).json({error:"Unauthorized: No token provided"});
        }
        const decoded=jwt.verify(token,process.env.JWT_SECRET); //will decode the jwt, this returns the userid which was encoded initially

        if(!decoded){
            return res.status(401).json({error:"Unauthorized: Invalid token"});
        }

        const user=await User.findById(decoded.userId).select("-password"); //decoded is a json object with userId as an object
        // the select function of mongoose tells which field to include and which to exclude, password would include only password field, -password would exclude only password field

        if(!user){
            return res.status(404).json({error:"User not found"});
        }

        req.user=user;
        next();

    }
    catch(error){
        console.log("Error in protectRoute middleware", error.message);
        res.status(500).json({error: "Internal Server Error"});
    }
}