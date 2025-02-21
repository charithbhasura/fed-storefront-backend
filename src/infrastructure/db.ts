import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const connectionString = process.env.MONGODB_URI;
        if (!connectionString){
            throw new Error("no connection string found");
        }
        await mongoose.connect(connectionString);
        console.log("connected to the mongoDB");
    } catch (error) {
        console.log(error);
        console.log("Error connecting to the mongoDB");
    }
};