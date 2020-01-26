import wrap from '.'
import createMock from './elm.mock'

describe('component', () => {
  describe('with no props', () => {
    let component: React.FunctionComponent<{}>

    beforeEach(() => {
      component = wrap(createMock({
        incoming: [],
        outgoing: [],
      }))
    })
  })

  describe('with listener props', () => {

  })

  describe('with data props', () => {

  })
})
