import * as React from 'react'

import errors from './errors'

/* ----------------- Types ----------------- */

interface Elm {
  Elm: ElmStep
}

interface ElmStep {
  [key: string]: ElmStep | ElmModule | undefined
}

interface ElmModule {
  init (args: ElmInitArgs): App
}

interface Options {
  /** the name of the elm module, shouldn't be necessary */
  path?: string[]
}

interface App {
  ports: {
    [key: string]: {
      subscribe? (fn: (data: any) => void): void
      unsubscribe? (fn: (data: any) => void): void
      send? (data: any): void
    }
  }
}

interface ElmInitArgs {
  node: HTMLDivElement
}

type Listener = (...data: any[]) => void

interface Listeners {
  [key: string]: Listener
}

interface Instance {
  app: App
  listeners: Listeners
  timing: number
}

interface Closure {
  sendData (name: string, payload: any): void
  addListener (name: string, listener: Listener): void
  clean (currentProps: string[]): void
}

interface PropTypes {
  [key: string]: any
}

type Instances = Instance[]

/* -------------- Type Guards -------------- */

function isObject (test: any) : test is object {
  if (test === null) return false
  if (typeof test === 'function') return false
  if (typeof test !== 'object') return false
  return true
}

function isElmStep (test: any, key?: string): test is ElmStep {
  if (typeof test === 'undefined') { return false }
  if (test === null) { return false }
  if (typeof test !== 'object') { return false }
  if (key === '') { return false }
  if (key) {
    const value = test[key]
    return isElmStep(value) || isElmModule(value)
  }
  if (!Object.keys(test).length) { return false }
  return true
}

function isElm (test: any): test is Elm {
  if (test === null) { return false }
  if (typeof test !== 'object') { return false }
  if (test.Elm === null) { return false }
  if (typeof test.Elm !== 'object') { return false }
  return true
}

function isElmModule (test: ElmModule | ElmStep): test is ElmModule {
  if (test === null) { return false }
  if (typeof test !== 'object') { return false }
  if (typeof test.init !== 'function') { return false }
  return true
}
/* ----------------- State ----------------- */

const {
  getClosure,
  createInstance,
  hasInstance,
  getId,
  teardown,
} = (() => {
  let currentId = 1
  const instances: Instances = []

  function createClosure ({ listeners, app }: Instance): Closure {
    return {
      sendData (name: string, payload: any) {
        if (!app.ports[name]) {
          console.error(errors.missingPort(name))
        } else {
          if (listeners[name]) {
            // we know this exists, because it was subscribed
            app.ports[name].unsubscribe!(listeners[name])
            delete listeners[name]
          }
          if (app.ports[name]?.send) {
            // we just proved this exists
            app.ports[name].send!(payload)
          } else {
            console.error(errors.missingPort(name))
          }
        }
      },
      addListener (name: string, listener: Listener) {
        if (!app.ports[name]?.subscribe) {
          console.error(errors.missingPort(name))
        } else {
          if (listeners[name]) {
            // we know this exists because it was subscribed
            app.ports[name].unsubscribe!(listeners[name])
          }
          // we know this exists because we did type check above
          app.ports[name].subscribe!(listener)
          listeners[name] = listener
        }
      },
      clean (currentProps: string[]) {
        Object.keys(listeners).forEach(name => {
          if (!currentProps.includes(name)) {
            // we know this exists because we subscribed
            app.ports[name].unsubscribe!(listeners[name])
          }
        })
      },
    }
  }

  return {
    getClosure (key: number) {
      return createClosure(instances[key])
    },
    createInstance (id: number, app: App) {
      const instance = {
        app,
        listeners: {},
        subscriptions: [],
        timing: 5,
      }
      instances[id] = instance

      return instance
    },
    hasInstance (key: number) {
      return !!instances[key]
    },
    getId () {
      return ++currentId
    },
    teardown (id: number) {
      const { listeners, app } = instances[id]
      Object.keys(listeners).forEach(name => {
        // we know this exists because it was subscribed
        app.ports[name].unsubscribe!(listeners[name])
      })
    },
  }
})()

/* -------------- Utilities -------------- */

function getOnlyValue (obj: ElmStep): ElmStep | ElmModule | false {
  const values = Object.values(obj)
  if (values.length > 1) { return false }
  if (values.length < 1) { return false }
  return values[0] || false
}

function getOnlyModule (step: ElmStep | ElmModule): ElmModule | false {
  if (isElmModule(step)) { return step }
  const deeper = getOnlyValue(step)
  if (!deeper) { return false }
  // wouldn't tail call optimization be nice :P
  return getOnlyModule(deeper)
}

function resolvePath (path: string[] = [], step: ElmStep): false | ElmModule {
  const resolve = (path: string[], step: ElmStep | ElmModule): false | ElmModule => {
    if (path.length === 0 && isElmModule(step)) {
      return step
    }
    if (path.length === 0 || typeof step === 'undefined') {
      return false
    }
    const [key, ...rest] = path
    if (!isElmStep(step, key)) {
      return false
    }
    return resolve(rest, (step[key] as ElmModule | ElmStep))
  }
  return resolve(path, step)
}

function wrap <Props extends PropTypes> (elm: Elm, opts: Options = {}) {
  return function (props: Props) {
    if (!isObject(props)) {
      throw new Error(`props must be of type "object", not ${typeof props}`)
    }

    const [id] = React.useState(getId())
    const node = React.createRef<HTMLInputElement>()

    // on update
    React.useEffect(() => {
      // handle if elm has been initialized already (not first run)
      if (hasInstance(id)) {
        const { addListener, sendData, clean } = getClosure(id)
        const propKeys = Object.keys(props)

        // send props data to elm instance
        propKeys
          .filter(key => typeof props[key] !== 'function')
          .forEach(key => sendData(key, props[key]))

        propKeys
          .filter(key => typeof props[key] === 'function')
          .forEach(key => addListener(key, props[key]))

        clean(propKeys)
      }
    })

    // mount & cleanup
    React.useEffect(() => {
      // should only run once, setup instance
      const consumed = document.createElement('div')
      if (!node.current) {
        throw new Error(errors.missingRef)
      }
      node.current.appendChild(consumed)

      if (!isElm(elm)) {
        throw new Error(errors.invalidElmInstance)
      }

      const elmModule = (() => {
        let resolved = resolvePath(opts.path, elm.Elm)
        if (resolved) { return resolved }
        resolved = getOnlyModule(elm.Elm)
        if (resolved) { return resolved }
        if (opts.path) {
          throw new Error(errors.invalidPath)
        } else {
          throw new Error(errors.invalidElmInstance)
        }
      })()

      const app = elmModule.init({
        node: consumed,
      })

      createInstance(id, app)

      return () => {
        teardown(id)
      }
    }, [])

    return <div ref={node} />
  }
}

export { Elm, App, ElmInitArgs }

export default wrap
