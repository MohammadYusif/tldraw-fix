import { describe, expect, it, vi } from 'vitest'
import { Timers } from './timers'

describe('Timers', () => {
	it('tracks timers by context and disposes them correctly', () => {
		const timers = new Timers()
		const mockClearTimeout = vi.fn()
		const mockClearInterval = vi.fn()
		const mockCancelAnimationFrame = vi.fn()

		// Mock only the clear functions since those are what we need to verify
		vi.stubGlobal('setTimeout', vi.fn().mockReturnValueOnce(1).mockReturnValueOnce(2))
		vi.stubGlobal('setInterval', vi.fn().mockReturnValue(3))
		vi.stubGlobal('requestAnimationFrame', vi.fn().mockReturnValue(4))
		vi.stubGlobal('clearTimeout', mockClearTimeout)
		vi.stubGlobal('clearInterval', mockClearInterval)
		vi.stubGlobal('cancelAnimationFrame', mockCancelAnimationFrame)

		// Create timers in different contexts
		timers.setTimeout('context1', () => {}, 1000)
		timers.setTimeout('context1', () => {}, 2000)
		timers.setInterval('context1', () => {}, 500)
		timers.requestAnimationFrame('context2', () => {})

		// Dispose one context
		timers.dispose('context1')

		// Should clear timers for context1 but not context2
		expect(mockClearTimeout).toHaveBeenCalledWith(1)
		expect(mockClearTimeout).toHaveBeenCalledWith(2)
		expect(mockClearInterval).toHaveBeenCalledWith(3)
		expect(mockCancelAnimationFrame).not.toHaveBeenCalled()

		vi.unstubAllGlobals()
	})

	it('disposes all contexts with disposeAll', () => {
		const timers = new Timers()
		const mockClearTimeout = vi.fn()
		const mockClearInterval = vi.fn()

		vi.stubGlobal('setTimeout', vi.fn().mockReturnValueOnce(1).mockReturnValueOnce(2))
		vi.stubGlobal('setInterval', vi.fn().mockReturnValue(3))
		vi.stubGlobal('clearTimeout', mockClearTimeout)
		vi.stubGlobal('clearInterval', mockClearInterval)

		timers.setTimeout('context1', () => {}, 1000)
		timers.setTimeout('context2', () => {}, 2000)
		timers.setInterval('context1', () => {}, 500)

		timers.disposeAll()

		expect(mockClearTimeout).toHaveBeenCalledWith(1)
		expect(mockClearTimeout).toHaveBeenCalledWith(2)
		expect(mockClearInterval).toHaveBeenCalledWith(3)

		vi.unstubAllGlobals()
	})

	it('provides context-bound methods via forContext', () => {
		const timers = new Timers()
		const mockClearTimeout = vi.fn()

		vi.stubGlobal('setTimeout', vi.fn().mockReturnValue(1))
		vi.stubGlobal('clearTimeout', mockClearTimeout)

		const contextTimers = timers.forContext('test-context')
		contextTimers.setTimeout(() => {}, 1000)
		contextTimers.dispose()

		expect(mockClearTimeout).toHaveBeenCalledWith(1)

		vi.unstubAllGlobals()
	})

	it('forwards extra arguments to the handler as individual values, not as an array', () => {
		const timers = new Timers()
		const mockSetTimeout = vi.fn().mockReturnValue(1)
		const mockSetInterval = vi.fn().mockReturnValue(2)

		vi.stubGlobal('setTimeout', mockSetTimeout)
		vi.stubGlobal('setInterval', mockSetInterval)

		const handler = vi.fn()
		timers.setTimeout('ctx', handler, 0, 'a', 'b')
		timers.setInterval('ctx', handler, 0, 'x', 'y')

		// The native calls must receive the args spread, not wrapped in an array
		expect(mockSetTimeout).toHaveBeenCalledWith(handler, 0, 'a', 'b')
		expect(mockSetInterval).toHaveBeenCalledWith(handler, 0, 'x', 'y')

		vi.unstubAllGlobals()
	})

	it('forwards extra arguments via forContext wrappers as individual values', () => {
		const timers = new Timers()
		const mockSetTimeout = vi.fn().mockReturnValue(1)
		const mockSetInterval = vi.fn().mockReturnValue(2)

		vi.stubGlobal('setTimeout', mockSetTimeout)
		vi.stubGlobal('setInterval', mockSetInterval)

		const ctx = timers.forContext('ctx')
		const handler = vi.fn()
		ctx.setTimeout(handler, 0, 'a', 'b')
		ctx.setInterval(handler, 0, 'x', 'y')

		expect(mockSetTimeout).toHaveBeenCalledWith(handler, 0, 'a', 'b')
		expect(mockSetInterval).toHaveBeenCalledWith(handler, 0, 'x', 'y')

		vi.unstubAllGlobals()
	})
})
