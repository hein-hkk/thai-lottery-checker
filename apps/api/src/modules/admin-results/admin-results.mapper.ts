import { groupPrizeRows } from "@thai-lottery-checker/domain";
import type {
  AdminResultDetailResponse,
  AdminResultListItem,
  AdminResultListResponse,
  PrizeType
} from "@thai-lottery-checker/types";
import { formatIsoTimestamp } from "@thai-lottery-checker/utils";
import type {
  AdminResultRepositoryDraw,
  AdminResultRepositoryGroupRelease,
  AdminResultRepositoryRow
} from "./admin-results.repository.js";

function formatDrawDate(drawDate: Date): string {
  return [
    drawDate.getUTCFullYear(),
    String(drawDate.getUTCMonth() + 1).padStart(2, "0"),
    String(drawDate.getUTCDate()).padStart(2, "0")
  ].join("-");
}

export function mapAdminResultListItem(draw: AdminResultRepositoryDraw): AdminResultListItem {
  return {
    id: draw.id,
    drawDate: formatDrawDate(draw.drawDate),
    drawCode: draw.drawCode,
    status: draw.status,
    publishedAt: draw.publishedAt ? formatIsoTimestamp(draw.publishedAt) : null,
    updatedAt: formatIsoTimestamp(draw.updatedAt)
  };
}

export function mapAdminResultListResponse(draws: readonly AdminResultRepositoryDraw[]): AdminResultListResponse {
  return {
    items: draws.map(mapAdminResultListItem)
  };
}

export function mapAdminResultDetailResponse(
  draw: AdminResultRepositoryDraw,
  rows: readonly AdminResultRepositoryRow[],
  releases: readonly AdminResultRepositoryGroupRelease[]
): AdminResultDetailResponse {
  const releaseStates =
    draw.status === "published"
      ? undefined
      : Object.fromEntries(releases.map((release) => [release.prizeType, release.isReleased])) as Partial<Record<PrizeType, boolean>>;

  return {
    result: {
      id: draw.id,
      drawDate: formatDrawDate(draw.drawDate),
      drawCode: draw.drawCode,
      status: draw.status,
      publishedAt: draw.publishedAt ? formatIsoTimestamp(draw.publishedAt) : null,
      updatedAt: formatIsoTimestamp(draw.updatedAt),
      prizeGroups: groupPrizeRows(rows, releaseStates)
    }
  };
}
