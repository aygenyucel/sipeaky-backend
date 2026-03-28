import mongoose from "mongoose";
import { model, Schema } from "mongoose";
import bcrypt from "bcrypt";

const usersSchema = new Schema({
    username: {type: String, required: true, unique: true},
    email: {type: String},
    password: {type: String, required: function () {
        return !this.isGuest;
      }},
    friends: [{type: Schema.Types.ObjectId, ref: "Friend"}],
    rooms: [{type: Schema.Types.ObjectId, ref: "Room"}],
    isGuest: {type: Boolean, default: false}
},
{timestamps: true}) 


usersSchema.pre("save", async function(next) {
    if (this.isGuest) return next();
    const currentUser = this;

    if(currentUser.isModified("password")) {
        const plainPW = currentUser.password;
        const hash = await bcrypt.hash(plainPW, 10);
        currentUser.password = hash;
    }
    next();
})


usersSchema.static("checkCredentials", async function (username, password) {
    const UserModel = this;
    const user = await UserModel.findOne({username});
    if(user) {
        const passwordMatch = await bcrypt.compare(password, user.password);
        if(passwordMatch) {
            return user;
        } else {
            return null;
        }
    } else {
        return null
    }
})

usersSchema.static("checkUsername", async function (username) {
    const UserModel = this
    const user = await UserModel.findOne({username})
    if(user) {
        return username;
    } else {
        return null;
    }
})

export default model("User", usersSchema);
