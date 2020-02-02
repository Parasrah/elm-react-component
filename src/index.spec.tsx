import * as React from 'react'
import * as R from 'ramda'
import snapshotRenderer from 'react-test-renderer'
import { cleanup, render } from '@testing-library/react'

import wrap, { Elm, ElmModule, App } from '.'
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
    describe('with invalid elm instance (didn\'t pass in Elm.<path>)', () => {
      describe('did not pass in Elm.<path>', () => {
        it('should provide meaningful error', () => {
          expect(() => wrap({ Main: { init: jest.fn() } } as any)).toThrow(errors.invalidElmInstance)
        })
      })

      describe('passed in empty object', () => {
        it('should provide meaningful error', () => {
          expect(() => wrap({} as any)).toThrow(errors.invalidElmInstance)
        })
      })

      describe('passed in undefined', () => {
        it('should provide meaningful error', () => {
          expect(() => wrap(undefined as any)).toThrow(errors.invalidElmInstance)
        })
      })
    })

    describe('with invalid opts#path', () => {
      it('should provide meaningful error', () => {
        const mock = createMock([{
          path: ['First'],
          incoming: [],
          outgoing: [],
        }])
        expect(() => wrap(mock, { path: true } as any)).toThrow(errors.invalidOpts)
      })
    })

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
    let Component: React.FunctionComponent<any>

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
    let Component: React.FunctionComponent<any>
    let onUpdate: jest.Mock

    beforeEach(async () => {
      outgoing = ['onUpdate', 'classChange', 'name']
      path = ['First', 'Second']
      mock = createMock([
        {
          incoming: [],
          path,
          outgoing,
        },
        {
          incoming: ['onUpdate', 'classChange', 'NAME'],
          outgoing: ['test', 'foo', 'bar'],
          path: [...path, 'Another'],
        },
      ])
      Component = wrap(mock, { path })
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

      it('warns about invalid port if data passed in', () => {
        const payload = { test: 3 }
        render(<Component onUpdate={payload} />)
        expect(console.warn).toBeCalledTimes(1)
        expect(console.warn).toBeCalledWith(errors.missingPort('onUpdate'))
      })
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
    let path: string[]
    let Component: React.FunctionComponent<any>

    beforeEach(() => {
      path = ['First', 'Second', 'Third']
      mock = createMock([
        {
          path,
          incoming: ['className', 'id'],
          outgoing: [],
        },
        {
          path: [...path, 'Another'],
          incoming: ['className', 'ID'],
          outgoing: ['foo', 'bar'],
        },
      ])
      Component = wrap(mock, { path })
    })

    describe('on mount', () => {
      describe('primitive data passed in', () => {
        it('forwards data to port', () => {
          render(<Component className="test" />)
          const app = getNewestApp(path)
          expect(app.ports.className.send).toHaveBeenCalledTimes(1)
          expect(app.ports.className.send).toHaveBeenCalledWith('test')
        })
      })

      describe('complex data passed in', () => {
        it('forwards to port', () => {
          const payload = { test: 1 }
          render(<Component className={payload} />)
          const app = getNewestApp(path)
          expect(app.ports.className.send).toHaveBeenCalledTimes(1)
          expect(app.ports.className.send).toHaveBeenCalledWith(payload)
        })
      })

      describe('undefined data passed in', () => {
        it('forwards to port', () => {
          const payload = undefined
          render(<Component className={payload} />)
          const app = getNewestApp(path)
          expect(app.ports.className.send).toHaveBeenCalledTimes(1)
          expect(app.ports.className.send).toHaveBeenCalledWith(payload)
        })
      })

      describe('null data passed in', () => {
        it('forwards to port', () => {
          const payload = null
          render(<Component className={payload} />)
          const app = getNewestApp(path)
          expect(app.ports.className.send).toHaveBeenCalledTimes(1)
          expect(app.ports.className.send).toHaveBeenCalledWith(payload)
        })
      })

      describe('function passed in', () => {
        it('warns about invalid port', () => {
          const payload = () => {}
          render(<Component className={payload} />)
          const app = getNewestApp(path)
          expect(app.ports.className.send).toHaveBeenCalledTimes(0)
          expect(console.warn).toHaveBeenCalledTimes(1)
          expect(console.warn).toHaveBeenCalledWith(errors.missingPort('className'))
        })
      })
    })

    describe('on update', () => {
      describe('primitive data passed in', () => {
        it('forwards to port', () => {
          const payload = 1
          const { rerender } = render(<Component />)
          rerender(<Component className={payload} />)
          const app = getNewestApp(path)
          expect(app.ports.className.send).toHaveBeenCalledTimes(1)
          expect(app.ports.className.send).toHaveBeenLastCalledWith(payload)
        })
      })

      describe('complex data passed in', () => {
        it('forwards to port', () => {
          const payload = { test: 1 }
          const { rerender } = render(<Component />)
          rerender(<Component className={payload} />)
          const app = getNewestApp(path)
          expect(app.ports.className.send).toHaveBeenCalledTimes(1)
          expect(app.ports.className.send).toHaveBeenLastCalledWith(payload)
        })
      })

      describe('new data passed in', () => {
        it('forwards to port', () => {
          const first = { a: 4 }
          const second = 'barfoo'
          const { rerender } = render(<Component className={first} />)
          const app = getNewestApp(path)
          rerender(<Component className={second} />)
          expect(app.ports.className.send).toHaveBeenCalledTimes(2)
          expect(app.ports.className.send).toHaveBeenLastCalledWith(second)
        })
      })

      describe('same data passed in', () => {
        it('forwards to port both times', () => {
          const payload = 'test'
          const { rerender } = render(<Component className={payload} />)
          const app = getNewestApp(path)
          rerender(<Component className={payload} />)
          expect(app.ports.className.send).toHaveBeenCalledTimes(2)
          expect(app.ports.className.send).toHaveBeenNthCalledWith(1, payload)
          expect(app.ports.className.send).toHaveBeenNthCalledWith(2, payload)
        })
      })

      describe('undefined data passed in', () => {
        it('forwards to port', () => {
          const payload = undefined
          const { rerender } = render(<Component />)
          rerender(<Component className={payload} />)
          const app = getNewestApp(path)
          expect(app.ports.className.send).toHaveBeenCalledTimes(1)
          expect(app.ports.className.send).toHaveBeenLastCalledWith(payload)
        })
      })

      describe('null data passed in', () => {
        it('forwards to port', () => {
          const payload = null
          const { rerender } = render(<Component />)
          rerender(<Component className={payload} />)
          const app = getNewestApp(path)
          expect(app.ports.className.send).toHaveBeenCalledTimes(1)
          expect(app.ports.className.send).toHaveBeenLastCalledWith(payload)
        })
      })
    })

    describe('on unmount', () => {
      it('does nothing', () => {
        const { unmount } = render(<Component className="test" />)
        unmount()
      })
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
