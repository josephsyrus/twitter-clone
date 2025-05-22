import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

export const getNotifications=async(req,res)=>{
    try{
        const userId=req.user._id;
        const user=await User.findById(userId);

        if(!user) return res.status(404).json({message: "User not found"});

        const notifications=await Notification.find({to:userId}).populate("from","username profileImg");

        await Notification.updateMany({to:userId},{read:true});
        if(notifications.length==0){
            return res.status(200).json({message:"You do not have any notifications"});
        }
        else{   
            return res.status(200).json(notifications);
        }
        
    }
    catch(error){
        console.log("Error in getNotifications", error.message);
        res.status(500).json({error:"Internal Server Error"});
    }
}

export const deleteNotifications=async(req,res)=>{
    try{
        const userId=req.user._id;
        await Notification.deleteMany({to:userId});
        res.status(200).json({message:"Notifications deleted successfully"});
    }
    catch(error){
        console.log("Error in deleteNotifications", error.message);
        res.status(500).json({error:"Internal Server Error"});
    }
}

export const deleteNotification=async(req,res)=>{
    try{
        const userId=req.user._id;
        const notificationId=req.params.id;

        const notification=await Notification.findById(notificationId);

        if(!notification) return res.status(404).json({message: "Notification not found"});

        if(notification.to.toString()!==userId.toString()){
            return res.status(403).json({message:"You cannot delete this notification"});
        }

        await Notification.deleteOne({_id:notificationId});
        res.status(200).json({message: "Notification deleted"});
    }
    catch(error){

    }
}