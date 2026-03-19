export interface AdminResultsCache {
  invalidateResultCaches(): Promise<void>;
}

export const noopAdminResultsCache: AdminResultsCache = {
  async invalidateResultCaches() {
    // Slice 3 only defines the invalidation seam; Redis wiring comes later.
  }
};
