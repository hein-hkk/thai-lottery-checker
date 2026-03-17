import {
  resultDetailResponseSchema,
  resultHistoryResponseSchema
} from "@thai-lottery-checker/schemas";
import type { ResultDetailResponse, ResultHistoryResponse } from "@thai-lottery-checker/types";
import { getPublicEnv } from "../config/env";

export class ResultsApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ResultsApiError";
    this.status = status;
  }
}

async function fetchResultsJson(pathname: string): Promise<Response> {
  const response = await fetch(`${getPublicEnv().apiBaseUrl}${pathname}`, {
    cache: "no-store"
  });

  return response;
}

export async function getLatestResults(): Promise<ResultDetailResponse> {
  const response = await fetchResultsJson("/api/v1/results/latest");

  if (!response.ok) {
    throw new ResultsApiError(response.status, "Failed to load latest results");
  }

  return resultDetailResponseSchema.parse(await response.json());
}

export async function getResultHistory(page: number): Promise<ResultHistoryResponse> {
  const response = await fetchResultsJson(`/api/v1/results?page=${page}`);

  if (!response.ok) {
    throw new ResultsApiError(response.status, "Failed to load result history");
  }

  return resultHistoryResponseSchema.parse(await response.json());
}

export async function getResultDetail(drawDate: string): Promise<ResultDetailResponse | null> {
  const response = await fetchResultsJson(`/api/v1/results/${drawDate}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new ResultsApiError(response.status, "Failed to load result detail");
  }

  return resultDetailResponseSchema.parse(await response.json());
}
