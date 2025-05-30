import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import {v2 as cloudinary} from 'cloudinary'

export const getUserProfile=async(req,res)=>{
    try{
        const {username}=req.params;
        const user=await User.findOne({username}).select("-password");

        if(!user){
            return res.status(404).json({message: "User not found"});
        }

        res.status(200).json(user);
    }
    catch(error){
        console.log("Error in getUserProfile ", error.message);
        res.status(500).json({message: "Internal Server Error"});
    }
}

export const followUnfollowUser=async(req,res)=>{
    try{
        const {id}=req.params;
        const userToModify=await User.findById(id);
        const currentUser=await User.findById(req.user._id);

        if(id===req.user._id.toString()){
            return res.status(400).json({error: "You cannot follow yourself"});
        }

        if(!userToModify || !currentUser){
            return res.status(400).json({error: "User not found"});
        }

        const isFollowing=currentUser.following.includes(id);

        if(isFollowing){
            //unfollow
            await User.findByIdAndUpdate(req.user._id, {$pull:{following: id}});
            await User.findByIdAndUpdate(id, {$pull: {followers: req.user._id}});
            res.status(200).json({message: "Unfollowed successfully"});
        }
        else{
            //follow
            await User.findByIdAndUpdate(req.user._id, {$push:{following: id}});
            await User.findByIdAndUpdate(id, {$push:{followers: req.user._id}});

            const newNotification=new Notification({
                type:'follow',
                from: req.user._id,
                to:userToModify._id
            });

            await newNotification.save();

            res.status(200).json({message: "Followed successfully"});
        }
    }
    catch(error){
        console.log("Error in followUnfollowUser ", error.message);
        res.status(500).json({message: "Internal Server Error"});
    }
}


export const getSuggestedUsers=async(req,res)=>{
    try{
        const userId=req.user._id;
        const usersFollowedByMe= await User.findById(userId).select("following");

        const users=await User.aggregate([
            {$match:{_id: {$ne:userId}}},
            {$sample:{size:10}}
        ]);

        const filteredUsers=users.filter(user=>!usersFollowedByMe.following.includes(user._id));
        const suggestedUsers=filteredUsers.slice(0,4);

        suggestedUsers.forEach(user=>user.password=null);

        res.status(200).json(suggestedUsers);

    }
    catch(error){
        console.log("Error in getSuggestedUsers ", error.message);
        res.send(500).json({error: "Internal Server Error"});
    }
}

export const updateUser=async(req,res)=>{
    try{
        const {fullName, username, email, currentPassword, newPassword, bio, link}=req.body;
        let {profileImg, coverImg}=req.body;

        const userId=req.user._id;
        let user=await User.findById(userId);

        if(!user){
            return res.status(404).json({message: "User not Found"});
        }


        if((!currentPassword&&newPassword)||(!newPassword&&currentPassword)){
            return res.status(400).json({message: "Please enter both current Password and new Password"});
        }

        if(currentPassword&&newPassword){
            const valid=await bcrypt.compare(currentPassword, user.password);
            if(!valid){
                return res.status(400).json({message: "Current Password is incorrect"});
            }
            if(newPassword.length<6){
                return res.status(400).json({message: "Password must be atleast 6 character long"});
            }
            const salt=await bcrypt.genSalt(10);
            const hashedPassword=await bcrypt.hash(newPassword,salt);
            user.password=hashedPassword;
        }

        if(profileImg){
            if(user.profileImg){
                await cloudinary.uploader.destroy(user.profileImg.split('/').pop().split('.')[0]);
            }
            const uploadedResponse=await cloudinary.uploader.upload(profileImg);
            profileImg=uploadedResponse.secure_url;
        }
        if(coverImg){
            if(user.coverImg){
                await cloudinary.uploader.destroy(user.coverImg.split('/').pop().split('.')[0]);
            }
            const uploadedResponse=await cloudinary.uploader.upload(coverImg);
            coverImg=uploadedResponse.secure_url;
        }

        user.fullName=fullName||user.fullName;
        user.email=email||user.email;
        user.username=username||user.username;
        user.bio=bio||user.bio;
        user.link=link||user.link;
        user.profileImg=profileImg||user.profileImg;
        user.coverImg=coverImg||user.coverImg;

        user=await user.save();

        user.password=null;
        return res.status(200).json(user);

    }
    catch(error){
        console.log("Error in user.controller ", error.message);
        res.status(500).json({error: "Internal Server Error"});
    }
}