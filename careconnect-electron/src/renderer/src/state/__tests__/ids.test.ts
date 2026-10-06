import { createId } from '../ids'

describe('createId', () => {
  it('prefixes a random UUID', () => {
    expect(createId('p')).toMatch(/^p-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  })

  it('never repeats', () => {
    const ids = Array.from({ length: 200 }, () => createId('a'))
    expect(new Set(ids).size).toBe(200)
  })

  it('still produces unique ids where crypto.randomUUID is unavailable', () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_791_200_000_000)
    Object.defineProperty(globalThis.crypto, 'randomUUID', { value: undefined, configurable: true })
    try {
      const first = createId('d')
      const second = createId('d')
      expect(first).toMatch(new RegExp(`^d-${(1_791_200_000_000).toString(36)}-\\d+$`))
      expect(second).not.toBe(first)
    } finally {
      delete (globalThis.crypto as { randomUUID?: unknown }).randomUUID
      now.mockRestore()
    }
    expect(createId('m')).toMatch(/^m-[0-9a-f-]{36}$/)
  })
})
