let hydrateLock = 0

export function withSessionLock<T>(work: () => Promise<T>): Promise<T> {
	hydrateLock += 1
	return work().finally(() => {
		hydrateLock -= 1
	})
}

export function sessionHydrateLocked() {
	return hydrateLock > 0
}
