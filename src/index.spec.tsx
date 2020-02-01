import * as React from 'react'
import {} from 'enzyme'
import {} from 'react-test-renderer'
import {} from 'enzyme-adapter-react-16'

import wrap from '.'
import createMock from './elm.mock'

// TODO: jest github action

/* configure({ adapter: new Adapter() }) */

describe('component', () => {
  describe('instantiation', () => {
    describe('with explicit path', () => {
      it('provides meaningful error when match does not exist')
      it('successfully resolves path when match exists')
    })

    describe('with implicit path', () => {
      it('provides meaningful error when multiple modules exist')
      it('resolves to default when only a single module exists')
    })
  })

  describe('with no props', () => {
    describe('on mount', () => {
      it('renders successfully')
    })

    describe('on unmount', () => {
      it('does nothing')
    })
  })

  describe('with listener props', () => {
    describe('on mount', () => {
      it('renders successfully')
      it('receives data from elm')
    })

    describe('on update', () => {
      describe('no listener passed in', () => {
        it('unsubscribes old listener')
      })

      describe('same listener passed in', () => {
        it('does not unsubscribe listener')
        it('does not resubscribe listener')
      })

      describe('new listener passed in', () => {
        it('unsubscribes old listener')
        it('subscribes new listener')
      })
    })

    describe('on unmount', () => {
      it('unsubscribes listeners')
    })
  })

  describe('with data props', () => {
    describe('on mount', () => {
      describe('primitive data passed in', () => {
        it('forwards data to port')
      })

      describe('complex data passed in', () => {
        it('forwards data to port')
      })

      describe('undefined data passed in', () => {
        it('forwards undefined to port')
      })

      describe('null data passed in', () => {
        it('forwards null to port')
      })
    })

    describe('on update', () => {
      describe('primitive data passed in', () => {
        it('forwards data to port')
      })

      describe('complex data passed in', () => {
        it('forwards data to port')
      })

      describe('new data passed in', () => {
        it('forwards data to port')
      })

      describe('same data passed in', () => {
        it('forwards data to port')
      })

      describe('undefined data passed in', () => {
        it('forwards undefined to port')
      })

      describe('null data passed in', () => {
        it('forwards null to port')
      })
    })

    describe('on unmount', () => {
      it('does nothing')
    })
  })
})
