import {
  checkerCheckResponseSchema,
  checkerDrawOptionsResponseSchema,
  resultDetailResponseSchema,
  resultHistoryResponseSchema
} from "@thai-lottery-checker/schemas";
import type {
  CheckerCheckRequest,
  CheckerCheckResponse,
  CheckerDrawOptionsResponse,
  ResultDetailResponse,
  ResultHistoryResponse
} from "@thai-lottery-checker/types";
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

export async function getCheckerDrawOptions(): Promise<CheckerDrawOptionsResponse> {
  const response = await fetchResultsJson("/api/v1/checker/draws");

  if (!response.ok) {
    throw new ResultsApiError(response.status, "Failed to load checker draw options");
  }

  return checkerDrawOptionsResponseSchema.parse(await response.json());
}

export async function checkLotteryTicket(payload: CheckerCheckRequest): Promise<CheckerCheckResponse> {
  const response = await fetch(`${getPublicEnv().apiBaseUrl}/api/v1/checker/check`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = (await response.json()) as { message?: string };
    throw new ResultsApiError(response.status, body.message ?? "Failed to check ticket");
  }

  return checkerCheckResponseSchema.parse(await response.json());
}
