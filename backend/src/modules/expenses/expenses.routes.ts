import { Router } from 'express';
import { asyncHandler } from '../../lib/http.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { createExpenseSchema, syncOfflineSchema, updateExpenseSchema } from './expenses.schema.js';
import {
  getExpenses,
  getMonthlySummary,
  getQuickAdd,
  getTrend,
  getTrendByGranularity,
  postExpense,
  postGenerateRecurring,
  postSyncOffline,
  putExpense,
  removeExpense,
} from './expenses.controller.js';

export const expensesRouter = Router();

expensesRouter.use(requireAuth);

expensesRouter.post('/', validateBody(createExpenseSchema), asyncHandler(postExpense));
expensesRouter.get('/', asyncHandler(getExpenses));
expensesRouter.get('/monthly-summary', asyncHandler(getMonthlySummary));
expensesRouter.get('/trend', asyncHandler(getTrend));
expensesRouter.get('/trend-by-grain', asyncHandler(getTrendByGranularity));
expensesRouter.get('/quick-add', asyncHandler(getQuickAdd));
expensesRouter.post('/sync-offline', validateBody(syncOfflineSchema), asyncHandler(postSyncOffline));
expensesRouter.post('/generate-recurring', asyncHandler(postGenerateRecurring));
expensesRouter.put('/:id', validateBody(updateExpenseSchema), asyncHandler(putExpense));
expensesRouter.delete('/:id', asyncHandler(removeExpense));
