export class RaceConditionGuard {
  private lastPromise: PromiseLike<unknown> | null = null

  getGuardedPromise<T>(promise: PromiseLike<T>) {
    this.lastPromise = promise
    return this.lastPromise.then(this.preventRaceCondition()) as Promise<T>
  }

  preventRaceCondition() {
    const currentPromise = this.lastPromise
    return (response: unknown) => {
      if (this.lastPromise !== currentPromise) {
        return new Promise(() => null)
      }
      return response
    }
  }

  cancel = () => {
    this.lastPromise = null
  }
}
