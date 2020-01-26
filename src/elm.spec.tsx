import createMock, { Mock } from './elm.mock'

describe('elm mock', () => {
  let mock: Mock

  describe('with valid node', () => {

  })

  describe('with invalid node', () => {

  })

  describe('with incoming ports', () => {
    let incoming: string[]

    beforeEach(() => {
      incoming = ['a', 'b', 'c']
      mock = createMock({
        incoming,
        outgoing: [],
      })
    })

    it('should have subscriptions for included ports', () => {
    })

    it('should throw errors for missing ports', () => {

    })
  })

  describe('with outgoing ports', () => {
    it('should have subscriptions for included ports', () => {

    })

    it('should throw errors for missing ports', () => {

    })
  })

  describe('with incoming and outgoing ports', () => {
    describe('with overlap', () => {
      it('should have both functions for overlaps', () => {

      })
    })
  })
})
