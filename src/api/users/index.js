import express from "express";
import UsersModel from "./model.js"
import createHttpError from 'http-errors';
import { createJWTToken } from "../../lib/jwt-tools.js";
import { JWTAuthMiddleware } from "../../lib/auth/JWTAuthMiddleware.js";

const usersRouter = express.Router();

//post a new user
usersRouter.post("/", async(req, res, next) => {
    try {
        const newUser = new UsersModel(req.body);
        const {_id} = await newUser.save();

        res.status(201).send({_id})
    } catch (error) {
        next(error)
    }
})

//get all users
usersRouter.get("/", async(req, res, next) => {
    try{
        
        const users = await UsersModel.find({});
        res.send(users);
    } catch(error) {
        next(error)
    }
})

//get own profile after auth
usersRouter.get("/me",JWTAuthMiddleware, async(req,res,next) => {
    try {
        const {_id} = req.user;
        const user = await UsersModel.findById(_id);
        res.send(user);
    } catch (error) {
        next(error)
    }
})

//get user by id
usersRouter.get("/:userId", async(req,res,next) => {
    try {
        const user = await UsersModel.findById(req.params.userId);

        if(user) {
            res.send(user)
        } else {
            next(createHttpError(404, `User with id ${req.params.userId} not found!`))
        }
        
    } catch (error) {
        next(error)
    }
})


//update user by id
usersRouter.put("/:userId", async (req, res, next) => {
    try {
        const updatedUser = await UsersModel.findByIdAndUpdate(req.params.userId, {...req.body}, {runValidators: true, new: true})

        if(updatedUser) {
            res.send(updatedUser)
        } else {
            next(createHttpError(404, `User with id ${req.params.userId} not found!`))
        }
    } catch (error) {
        next(error)
    }
})

//delete user by id
usersRouter.delete("/:userId", async (req,res,next) => {
    try {
        const deletedUser = await UsersModel.findByIdAndDelete(req.params.userId);
        if(deletedUser) {
            res.status(204).send();
        } else {
            next(createHttpError(404, `User with id ${req.params.userId} not found!`))
        }
    } catch (error) {
        next(error)
    }
})

//user registiration
usersRouter.post("/signup", async(req,res,next) => {
    try {
        const {username} = req.body;
        const user = await UsersModel.checkUsername(username)
        if(user) {
            next(createHttpError(409, `Username already exists`))
        } else {
            const newUser = new UsersModel(req.body);
            const {_id} = await newUser.save();
            const payload = {_id}
            const JWTToken = await createJWTToken(payload);
            res.status(201).send({JWTToken})
        }
    } catch (error) {
        next(error)
    }
})

//user login
usersRouter.post("/login", async(req,res,next) => {
    try {
        const {username, password}  = req.body;
        const user = await UsersModel.checkCredentials(username, password);
        if (!user) {
            return next(
                createHttpError(401, "Invalid username or password")
            );
        }
        const payload = { _id: user._id };
        const JWTToken = await createJWTToken(payload);
        res.status(200).send({ JWTToken });
    } catch (error) {
        next(error)
    }
})

//login as guest
usersRouter.post("/guest", async(req,res,next) => {
    try {
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        const username = `Guest_${random}`;

        const guestUser = await UsersModel.create({
            username,
            isGuest: true
        });
      
        const JWTToken = await createJWTToken({ _id: guestUser._id });
        res.status(201).send({ JWTToken });
    } catch (error) {
        next(error)
    }
})

export default usersRouter;