import Post from "../models/post.model.js";
import { v2 as cloudinary } from "cloudinary";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

export const createPost=async(req,res)=>{
    const userId=req.user._id;
    const {text}=req.body;
    let {img}=req.body;

    try{
        const user=await User.findById(userId);
        if(!user){
            return res.status(400).json({message: "Invalid User"});
        }

        if(!text&&!img){
            return res.status(400).json({message: "Either text or image is required"});
        }

        if(img){
            const uploadedImg=await cloudinary.uploader.upload(img);
            img=uploadedImg.secure_url;
        }

        const newPost=new Post({
            user:userId,
            text,
            img
        });

        await newPost.save();
        res.status(201).json(newPost);
    }
    catch(error){
        console.log("Error in createPost", error.message);
        res.status(500).json({error: "Internal Server Error"});
    }
}

export const deletePost=async(req,res)=>{
    const postId=req.params.id;
    try{
        const post=await Post.findById(postId);
        if(!post){
            return res.status(404).json({message: "Post does not exist"});
        }
        if(post.user.toString()!==req.user._id.toString()){
            return res.status(400).json({message: "Cannot delete other user's posts"});
        }

        //need to remove image from cloudinary if it exists
        if(post.img){
            const imgId=post.img.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(imgId);
        }

        await Post.findByIdAndDelete(postId);
        res.status(200).json({message: "Post has been deleted"});
    }
    catch(error){
        console.log("Error in deletePost", error.message);
        res.status(500).json({error: "Internal Server Error"});
    }
}

export const commentOnPost=async(req,res)=>{
    const postId=req.params.id;
    const {text}=req.body;
    try{
        const post= await Post.findById(postId);
        if(!post){
            return res.status(404).json({message: "Post does not exist"});
        }
        if(!text){
            return res.status(400).json({message: "Enter a comment"});
        }

        const commentObject={
            text,
            user:req.user._id
        }

        await Post.findByIdAndUpdate(postId, {$push:{comments:commentObject}});
        res.status(201).json({message: "Created comment"});
    }
    catch(error){
        console.log("Error in commentOnPost", error.message);
        res.status(500).json({error: "Internal Server Error"});
    }
}

export const likeUnlikePost=async(req,res)=>{
    const postId=req.params.id;
    try{
        let post=await Post.findById(postId);
        if(!post){
            return res.status(404).json({error:"Post not found"});
        }

        const filteredLikes=post.likes.map(like=>like.toString());
        const includedLike=filteredLikes.includes(req.user._id.toString());
        if(includedLike){
            //unlike
            post=await Post.findByIdAndUpdate(postId, {$pull:{likes:req.user._id}}, {new:true});
            await User.updateOne({_id:req.user._id}, {$pull:{likedPosts:postID}});
            res.status(200).json({message:"Unliked the Post", likes:post.likes.length});
        }
        else{
            //like
            post=await Post.findByIdAndUpdate(postId, {$push:{likes:req.user._id}}, {new:true}); //findByIdAndUpdate returns the document after updating
            await User.updateOne({_id:req.user._id}, {$push:{likedPosts:postId}}); //updateOne simply updates, does not return anything
            const newNotification=new Notification({
                from:req.user._id,
                to:post.user,
                type:'like'
            });

            await newNotification.save();

            res.status(200).json({message:"Liked the Post", likes:post.likes.length});
        }
    }
    catch(error){
        console.log("Error in likeUnlikePost", error.message);
        res.status(500).json({error:"Internal Server Error"});
    }
}

export const getAllPosts=async(req,res)=>{
    const userId=req.user._id;
    try{
        const user=await User.findById(userId);
        if(!user){
            return res.status(404).json({error:"User does not exist"});
        }
        const posts=await Post.find({user:userId}).sort({createdAt:-1}).populate('user', '-password').populate('comments.user', '-password -email');
        if(posts.length==0){
            res.status(200).json({message:"You do not have any posts"});
        }
        else{
            res.status(200).json(posts);
        }
    }
    catch(error){
        console.log("Error in getAllPosts", error.message);
        res.status(500).json({error:"Internal Server Error"});
    }
}


export const getLikedPosts=async(req,res)=>{
    const userId=req.params.id;
    try{
        const user=await User.findById(userId);
        if(!user) return res.status(404).json({error:"User not found"});

        const likedPosts=await Post.find({_id:{$in:user.likedPosts}}).populate("user","-password").populate("comments.user","-password");

        if(likedPosts.length==0){
            return res.status(200).json({message: "This user had not liked any posts"});
        }
        else{
            return res.status(200).json(likedPosts);
        }
        
    }
    catch(error){
        console.log("Error in getLikedPosts", error.message);
        req.status(500).json({error: "Internal Server Error"});
    }
}

export const getFollowingPosts=async(req,res)=>{
    const userId=req.user._id;
    try{
        const user=await User.findById(userId);
        if(!user) return res.status(404).json({error:"User not found"});

        const following=user.following;
        const feedPosts=await Post.find({user:{$in:following}}).sort({createdAt:-1}).populate("user","-password").populate("comment.user", "-password");

        res.status(200).json(feedPosts);
    }
    catch(error){
        console.log("Error in getFollowingPosts", error.message);
        res.status(500).json({error: "Internal Server Error"});
    }
}

export const getUserPosts=async(req,res)=>{
    const username=req.params;
    try{
        const user=await User.findOne({username});
        if(!user) return res.status(404).json({error: "User not found"});

        const posts=await Post.find({user:user._id}).sort({createdAt:-1}).populate("user","-password").populate("comments.user","-password");
        if(posts.length==0){
            return res.status(200).json({message:"You do not have any posts"});
        }
        else{
            return res.status(200).json(posts);
        }
    }
    catch(error){
        console.log("Error in getUserPosts", error.message);
        res.status(500).json({error: "Internal Server Error"});
    }
}