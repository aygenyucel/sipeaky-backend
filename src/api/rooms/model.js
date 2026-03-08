import {Schema, model} from "mongoose";

const RoomsModel = new Schema({
    capacity: {type: Number, required: true},
    language: {type: String, required: true},
    level: {type: String, required: true},
    users: [{type: Schema.Types.ObjectId, ref: 'User'}],
    creatorUserID: {type: Schema.Types.ObjectId, ref: 'User'},
    hostUserID: {type: Schema.Types.ObjectId, ref: 'User'},
    endpoint: {type: String, required: true},
    roomStartedAt: {type: Date, default: null},
    sessionDurationMinutes: {type: Number, default: null}
},
{timestamps: true})

export default model("Room", RoomsModel);