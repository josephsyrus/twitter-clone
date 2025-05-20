import express from 'express';
import { signup,login, logout, getMe } from '../controllers/auth.controller.js';
import { protectRoute } from '../middleware/protectRoute.js';

const router=express.Router();
 
router.post("/signup",signup);
router.post("/login",login);
router.post("/logout",logout);
router.post("/me", protectRoute, getMe); //protectRoute is used to verify jwt

export default router;