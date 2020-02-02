import * as React from 'react'
import * as R from 'ramda'
import snapshotRenderer from 'react-test-renderer'
import { cleanup, render } from '@testing-library/react'

import wrap, { Elm, ElmModule, App, PropTypes } from '.'
import createMock, { } from './elm.mock'
import errors from './errors'

describe('component', () => {
  let mock: Elm

  afterEach(cleanup)

  beforeEach(() => {
    // mock out console
    global.console.warn = jest.fn()
    global.console.log = jest.fn()
    global.console.error = jest.fn()
  })

  describe('instantiation', () => {
    describe('with single module', () => {
      let path: string[]

      beforeEach(() => {
        path = ['First', 'Second', 'Third']
        mock = createMock([{
          path,
          incoming: ['name'],
          outgoing: ['hello'],
        }])
      })

      describe('with explicit path', () => {
        it('provides meaningful error when match does not exist', () => {
          const Component = wrap(mock, {
            path: ['First', 'Incorrect', 'Path'],
          })
          expect(() => render(<Component />)).toThrowError(errors.invalidPath)
        })

        it('successfully resolves path when match exists', () => {
          const Component = wrap(mock, {
            path,
          })
          render(<Component />)
        })
      })

      describe('with implicit path', () => {
        it('should resolve to module', () => {
          const Component = wrap(mock)
          render(<Component />)
        })
      })
    })

    describe('with multiple modules', () => {
      let path1: string[]

      beforeEach(() => {
        path1 = ['First', 'Second', 'Third']
        mock = createMock([
          {
            path: path1,
            incoming: ['name'],
            outgoing: ['hello'],
          },
          {
            path: ['First', 'Foo', 'Third'],
            incoming: [],
            outgoing: ['bar', 'test'],
          },
        ])
      })

      describe('with explicit path', () => {
        it('provides meaningful error when match does not exist', () => {
          const Component = wrap(mock, {
            path: ['First', 'Incorrect', 'Path'],
          })
          expect(() => render(<Component />)).toThrowError(errors.invalidPath)
        })

        it('successfully resolves path when match exists', () => {
          const Component = wrap(mock, {
            path: path1,
          })
          render(<Component />)
        })
      })

      describe('with implicit path', () => {
        it('should provide meaningful error', () => {
          const Component = wrap(mock)
          expect(() => render(<Component />)).toThrow(errors.pathRequired)
        })
      })
    })
  })

  describe('with no ports', () => {
    let path: string[]
    let Component: React.FunctionComponent<PropTypes>

    beforeEach(() => {
      path = ['First', 'Second']
      mock = createMock([{
        path,
        incoming: [],
        outgoing: [],
      }])
      Component = wrap(mock)
    })

    describe('on mount', () => {
      it('renders successfully', () => {
        const snapshot = snapshotRenderer.create(<Component />).toJSON()
        expect(snapshot).toMatchSnapshot()
      })

      it('warns about missing ports when props are passed in', () => {
        render(<Component invalidProp={4} />)
        expect(console.warn).toBeCalledTimes(1)
        expect(console.warn).toBeCalledWith(errors.missingPort('invalidProp'))
      })
    })

    describe('on update', () => {
      it('initializes elm only once', () => {
        const mod = getModule(path)
        const { rerender } = render(<Component />)
        expect(mod.init).toBeCalledTimes(1)
        rerender(<Component />)
        expect(mod.init).toBeCalledTimes(1)
      })

      it('warns about missing ports when props are passed in', () => {
        const { rerender } = render(<Component />)
        expect(console.warn).not.toBeCalled()
        rerender(<Component invalidProp={5} />)
        expect(console.warn).toBeCalledTimes(1)
        expect(console.warn).toBeCalledWith(errors.missingPort('invalidProp'))
      })
    })

    describe('on unmount', () => {
      it('should do nothing', () => {
        const { unmount } = render(<Component />)
        unmount()
      })
    })
  })

  describe('outgoing ports (function props)', () => {
    let outgoing: string[]
    let path: string[]
    let Component: React.FunctionComponent<PropTypes>
    let onUpdate: jest.Mock

    beforeEach(async () => {
      outgoing = ['onUpdate', 'classChange', 'name']
      path = ['First', 'Second']
      mock = createMock([{
        incoming: [],
        path,
        outgoing,
      }])
      Component = wrap(mock)
      onUpdate = jest.fn()
    })

    describe('on mount', () => {
      it('renders successfully', () => {
        const json = snapshotRenderer.create(<Component onUpdate={onUpdate} />).toJSON()
        expect(json).toMatchSnapshot()
      })

      it('receives data from elm', () => {
        render(<Component onUpdate={onUpdate} />)
        const app = getNewestApp(path)
        expect(app.ports.onUpdate.subscribe).toBeCalledTimes(1)
        expect(app.ports.onUpdate.subscribe).toBeCalledWith(onUpdate)
        expect(app.ports.onUpdate.unsubscribe).not.toBeCalled()
      })

      it.todo('warns about invalid port if data passed in')
    })

    describe('on update', () => {
      describe('no listener passed in', () => {
        it('unsubscribes old listener', () => {
          const { rerender } = render(<Component onUpdate={onUpdate} />)
          rerender(<Component />)
          const app = getNewestApp(path)
          expect(app.ports.onUpdate.unsubscribe).toBeCalledTimes(1)
          expect(app.ports.onUpdate.unsubscribe).toBeCalledWith(onUpdate)
        })
      })

      describe('same listener passed in', () => {
        it('does not unsubscribe listener', () => {
          const { rerender } = render(<Component onUpdate={onUpdate} />)
          rerender(<Component onUpdate={onUpdate} />)
          const app = getNewestApp(path)
          expect(app.ports.onUpdate.unsubscribe).not.toBeCalled()
        })

        it('does not resubscribe listener', () => {
          const { rerender } = render(<Component onUpdate={onUpdate} />)
          rerender(<Component onUpdate={onUpdate} />)
          const app = getNewestApp(path)
          expect(app.ports.onUpdate.subscribe).toBeCalledTimes(1)
        })
      })

      describe('new listener passed in', () => {
        let onUpdate2: jest.Mock

        beforeEach(() => {
          onUpdate2 = jest.fn()
        })

        it('unsubscribes old listener', () => {
          const { rerender } = render(<Component onUpdate={onUpdate} />)
          rerender(<Component onUpdate={onUpdate2} />)
          const app = getNewestApp(path)
          expect(app.ports.onUpdate.unsubscribe).toBeCalledTimes(1)
          expect(app.ports.onUpdate.unsubscribe).toBeCalledWith(onUpdate)
        })

        it('subscribes new listener', () => {
          const { rerender } = render(<Component onUpdate={onUpdate} />)
          rerender(<Component onUpdate={onUpdate2} />)
          const app = getNewestApp(path)
          expect(app.ports.onUpdate.subscribe).toBeCalledTimes(2)
          expect(app.ports.onUpdate.subscribe).toHaveBeenNthCalledWith(1, onUpdate)
          expect(app.ports.onUpdate.subscribe).toHaveBeenNthCalledWith(2, onUpdate2)
        })
      })
    })

    describe('on unmount', () => {
      it('unsubscribes listeners', () => {
        const onUpdate2 = jest.fn()
        const classChange = jest.fn()
        const name = jest.fn()
        const { rerender, unmount } = render(<Component onUpdate={onUpdate} />)
        rerender(<Component onUpdate={onUpdate2} />)
        rerender(<Component onUpdate={onUpdate2} classChange={classChange} />)
        rerender(<Component onUpdate={onUpdate2} name={name} />)
        unmount()
        const app = getNewestApp(path)
        expect(app.ports.onUpdate.unsubscribe).toBeCalledTimes(2)
        expect(app.ports.onUpdate.unsubscribe).toHaveBeenNthCalledWith(1, onUpdate)
        expect(app.ports.onUpdate.unsubscribe).toHaveBeenNthCalledWith(2, onUpdate2)
        expect(app.ports.classChange.unsubscribe).toBeCalledTimes(1)
        expect(app.ports.classChange.unsubscribe).toBeCalledWith(classChange)
        expect(app.ports.name.unsubscribe).toBeCalledTimes(1)
        expect(app.ports.name.unsubscribe).toBeCalledWith(name)
      })
    })
  })

  describe('with incoming ports (data props)', () => {
    describe('on mount', () => {
      describe('primitive data passed in', () => {
        it.todo('forwards data to port')
      })

      describe('complex data passed in', () => {
        it.todo('forwards data to port')
      })

      describe('undefined data passed in', () => {
        it.todo('forwards undefined to port')
      })

      describe('null data passed in', () => {
        it.todo('forwards null to port')
      })

      describe('function passed in', () => {
        it.todo('warns about invalid port')
      })
    })

    describe('on update', () => {
      describe('primitive data passed in', () => {
        it.todo('forwards data to port')
      })

      describe('complex data passed in', () => {
        it.todo('forwards data to port')
      })

      describe('new data passed in', () => {
        it.todo('forwards data to port')
      })

      describe('same data passed in', () => {
        it.todo('forwards data to port')
      })

      describe('undefined data passed in', () => {
        it.todo('forwards undefined to port')
      })

      describe('null data passed in', () => {
        it.todo('forwards null to port')
      })
    })

    describe('on unmount', () => {
      it.todo('does nothing')
    })
  })

  function getModule (path: string[]): ElmModule {
    const mod = R.path<ElmModule>(['Elm', ...path], mock)
    if (!mod) { throw new Error(`failed to resolve module for ${path}`) }
    return mod
  }

  function getNewestApp (path: string[]): App {
    const mod = getModule(path)
    return (mod.init as jest.Mock).mock.results.slice(-1)[0].value
  }
})
