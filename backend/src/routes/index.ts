import { Router } from 'express';
import { alertsRoutes } from './alerts.routes.js';
import { authRoutes } from './auth.routes.js';
import { clientsRoutes } from './clients.routes.js';
import { dashboardRoutes } from './dashboard.routes.js';
import { documentsRoutes } from './documents.routes.js';
import { kanbanRoutes } from './kanban.routes.js';
import { processesRoutes } from './processes.routes.js';
import { taxReviewsRoutes } from './tax-reviews.routes.js';
import { usersRoutes } from './users.routes.js';

export const apiRoutes = Router();

apiRoutes.use('/auth', authRoutes);
apiRoutes.use('/users', usersRoutes);
apiRoutes.use('/clients', clientsRoutes);
apiRoutes.use('/processes', processesRoutes);
apiRoutes.use('/documents', documentsRoutes);
apiRoutes.use('/dashboard', dashboardRoutes);
apiRoutes.use('/tax-reviews', taxReviewsRoutes);
apiRoutes.use('/alerts', alertsRoutes);
apiRoutes.use('/kanban', kanbanRoutes);
