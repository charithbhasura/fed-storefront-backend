import mongoose from "mongoose";

const ProductSchema  = new mongoose.Schema({
    categoryId:{
        type: String,
        required: true,
    },
    image:{
        type: String,
        required: true,
    },
    name:{
        type: String,
        required: true,
    },
    price:{
        type: Number,
        required: true,
    },
    description:{
        type: String,
        required: true,
    },
    stockQuantity: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    lowStockThreshold: {
        type: Number,
        default: 5
    }
});

ProductSchema.methods.isInStock = function() {
    return this.stockQuantity > 0;
};

ProductSchema.methods.isLowStock = function() {
    return this.stockQuantity <= this.lowStockThreshold;
};

export default mongoose.model("Products",ProductSchema);