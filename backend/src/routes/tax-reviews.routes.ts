import { Router } from 'express';
import * as taxReviewController from '../controllers/tax-review.controller.js';
import { ensureAuthenticated } from '../middlewares/auth.middleware.js';

export const taxReviewsRoutes = Router();

taxReviewsRoutes.use(ensureAuthenticated);
taxReviewsRoutes.get('/', taxReviewController.listTaxReviews);
taxReviewsRoutes.post('/', taxReviewController.createTaxReview);
taxReviewsRoutes.put('/:id', taxReviewController.updateTaxReview);
