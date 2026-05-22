import { Response } from 'express';
import { taxReviewSchema } from '../validators/tax-review.validator.js';
import * as taxReviewService from '../services/tax-review.service.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';
import { getRequiredString } from '../utils/request.js';

export async function listTaxReviews(_request: AuthRequest, response: Response) {
  const reviews = await taxReviewService.listTaxReviews();
  return response.json(reviews);
}

export async function createTaxReview(request: AuthRequest, response: Response) {
  const data = taxReviewSchema.parse(request.body);
  const review = await taxReviewService.createTaxReview(data, request.user!.id);
  return response.status(201).json(review);
}

export async function updateTaxReview(request: AuthRequest, response: Response) {
  const data = taxReviewSchema.parse(request.body);
  const reviewId = getRequiredString(request.params.id, 'Revisao tributaria');
  const review = await taxReviewService.updateTaxReview(reviewId, data, request.user!.id);
  return response.json(review);
}
