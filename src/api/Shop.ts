import { Router } from 'express';
import { getProduct } from '../application/Product';
import { isAuthenticated } from "./middleware/authentication-middleware";

export const shopRouter = Router();

shopRouter
    .route('/shop/:productId')  
    .get(isAuthenticated, getProduct);


