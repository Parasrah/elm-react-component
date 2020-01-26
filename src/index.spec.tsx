import * as React from 'react'
import { shallow, ShallowWrapper, configure } from 'enzyme'
import renderer, { ReactTestRenderer } from 'react-test-renderer'
import Adapter from 'enzyme-adapter-react-16'

import wrap from '.'
import createMock, { MockInit } from './elm.mock'

configure({ adapter: new Adapter() })

describe('component', () => {
  const idRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/
  describe('with no props', () => {
    let element: ShallowWrapper
    let snapshot: ReactTestRenderer

    beforeEach(() => {
      ({ element, snapshot } = createComponent(
        {
          incoming: [],
          outgoing: [],
        },
        {},
      ))
    })

    it('renders successfully', () => {
      expect(snapshot.toJSON()).toMatchSnapshot()
      const div = element.find('div')
      expect(div).toBeTruthy()
      expect(div.prop('id')).toMatch(idRegex)
    })
  })

  describe('with listener props', () => {

  })

  describe('with data props', () => {

  })

  function createComponent<Props extends object> (init: MockInit, props: Props) {
    const Component = wrap(createMock(init))

    const reactEl = <Component {...props} />

    const element = shallow(reactEl)

    const snapshot = renderer.create(reactEl)

    return {
      element,
      snapshot,
    }
  }
})
