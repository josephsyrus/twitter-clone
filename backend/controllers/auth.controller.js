export const signup = async(req,res)=>{
    res.json({
        data:"You have reached the signup endpoint"
    });
}

export const login=async(req,res)=>{
    res.send("You have reached the login endpoint");
}
