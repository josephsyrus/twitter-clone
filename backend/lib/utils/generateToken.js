import jwt from 'jsonwebtoken';

export const generateTokenAndSetCookie=async(userId,res)=>{
    const token=jwt.sign({userId}, process.env.JWT_SECRET, {expiresIn:"15d"}); //token will be invalid in 15 days

    res.cookie("jwt", token, {
        maxAge: 15*24*60*60*1000, //for 15 days
        httpsOnly: true, //prevents XSS attacks
        sameSite: "strict",  //prevents CSRF attacks
        secure: process.env.NODE_ENV !== "development"  //when developing, this should be set to development. during production, change it
    });
}