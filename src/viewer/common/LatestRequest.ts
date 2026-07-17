/**
 * Guards against stale async responses: only the most recently begun
 * operation is allowed to apply its result.
 *
 * Usage:
 *   private guard = new LatestRequest();
 *   const token = this.guard.begin();      // starts a new operation,
 *                                          // invalidating all previous tokens
 *   fetchSomething().then(result => {
 *       if (!this.guard.isCurrent(token)) return; // a newer operation started
 *       apply(result);
 *   });
 */
export class LatestRequest {
    private currentId: number = 0;

    /** Begin a new operation; invalidates all previously returned tokens. */
    begin(): number {
        return ++this.currentId;
    }

    /** True only if the token belongs to the most recent begin() call. */
    isCurrent(token: number): boolean {
        return token === this.currentId;
    }
}
