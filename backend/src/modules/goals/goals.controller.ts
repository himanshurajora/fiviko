import type { Request, Response } from 'express';
import { AppError } from '../../lib/http.js';
import {
  contributeToGoal,
  createGoal,
  deleteGoal,
  getGoal,
  listGoals,
  recalculateRecommendation,
  recommendationRowToResult,
  saveScoreInput,
  simulateWhatIf,
  toGoalDTO,
  updateGoal,
} from './goals.service.js';

function userId(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.id;
}

export async function postGoal(req: Request, res: Response): Promise<void> {
  res.status(201).json(await createGoal(userId(req), req.body));
}

export async function getGoals(req: Request, res: Response): Promise<void> {
  res.json(await listGoals(userId(req)));
}

export async function getGoalById(req: Request, res: Response): Promise<void> {
  const goal = await getGoal(userId(req), req.params.id);
  res.json({
    goal: toGoalDTO(goal),
    scoreInput: goal.scoreInput ?? null,
    recommendation: goal.recommendation ? recommendationRowToResult(goal.recommendation) : null,
  });
}

export async function putGoal(req: Request, res: Response): Promise<void> {
  res.json(await updateGoal(userId(req), req.params.id, req.body));
}

export async function removeGoal(req: Request, res: Response): Promise<void> {
  await deleteGoal(userId(req), req.params.id);
  res.json({ ok: true });
}

export async function postScoreInput(req: Request, res: Response): Promise<void> {
  await saveScoreInput(userId(req), req.params.id, req.body);
  // Saving scores immediately produces a fresh recommendation for convenience.
  const result = await recalculateRecommendation(userId(req), req.params.id);
  res.status(201).json(result);
}

export async function getRecommendation(req: Request, res: Response): Promise<void> {
  const goal = await getGoal(userId(req), req.params.id);
  if (goal.recommendation) {
    res.json(recommendationRowToResult(goal.recommendation));
    return;
  }
  // None stored yet — compute on demand.
  res.json(await recalculateRecommendation(userId(req), req.params.id));
}

export async function postRecalculate(req: Request, res: Response): Promise<void> {
  res.json(await recalculateRecommendation(userId(req), req.params.id));
}

export async function postWhatIf(req: Request, res: Response): Promise<void> {
  res.json(await simulateWhatIf(userId(req), req.params.id, req.body.overrideTargetAmount));
}

export async function postContribute(req: Request, res: Response): Promise<void> {
  res.json(await contributeToGoal(userId(req), req.params.id, req.body.amount));
}
