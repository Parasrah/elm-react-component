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

type AddListener = (name: string, listener: Listener) => void

type SendData = (name: string, payload: any) => void

type Clean = (currentProps: string[]) => void

interface Closure {
  sendData: AddListener
  addListener: SendData
  clean: Clean
}

interface PropTypes {
  [key: string]: any
}

type Instances = Instance[]

/* -------------- Type Guards -------------- */

function isObject (test: any) : test is object {
  if (isUndefinedOrNull(test)) { return false }
  if (typeof test === 'function') return false
  if (typeof test !== 'object') return false
  return true
}

function isElmStep (test: any, key?: string): test is ElmStep {
  if (isUndefinedOrNull(test)) { return false }
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
  if (isUndefinedOrNull(test)) { return false }
  if (typeof test !== 'object') { return false }
  if (test.Elm === null) { return false }
  if (typeof test.Elm !== 'object') { return false }
  return true
}

function isElmModule (test: ElmModule | ElmStep): test is ElmModule {
  if (isUndefinedOrNull(test)) { return false }
  if (typeof test !== 'object') { return false }
  if (typeof test.init !== 'function') { return false }
  return true
}

function isTruthyString (test: any): test is string {
  return (typeof test === 'string') && !!test.length
}

function isUndefinedOrNull (test: any): test is null | undefined {
  return (test === null || typeof test === 'undefined')
}

function isOptions (options: Options) {
  if (isUndefinedOrNull(options)) { return false }
  if (typeof options !== 'object') { return false }
  const { path } = options
  if (!(isUndefinedOrNull(path) || (Array.isArray(path) && path.every(isTruthyString)))) {
    return false
  }
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
          console.warn(errors.missingPort(name))
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
            console.warn(errors.missingPort(name))
          }
        }
      },
      addListener (name: string, listener: Listener) {
        if (!app.ports[name]?.subscribe) {
          console.warn(errors.missingPort(name))
        } else if (listeners[name] === listener) {
          // noop (same listener, don't resubscribe)
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
            delete listeners[name]
          }
        })
      },
    }
  }

  return {
    getClosure (key: number) {
      return createClosure(instances[key])
    },
    createInstance (key: number, app: App) {
      if (instances[key]) {
        throw new Error(errors.duplicateInstance)
      }
      const instance = {
        app,
        listeners: {},
        subscriptions: [],
        timing: 5,
      }
      instances[key] = instance

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

/* -------------- Implementation -------------- */

function wrap <Props extends PropTypes> (elm: Elm, opts: Options = {}) {
  if (!isElm(elm)) {
    throw new Error(errors.invalidElmInstance)
  }

  if (!isUndefinedOrNull(opts) && !isOptions(opts)) {
    throw new Error(errors.invalidOpts)
  }

  return function (props: Props) {
    if (!isObject(props)) {
      throw new Error(errors.invalidProps)
    }

    const [id] = React.useState(getId())
    const node = React.useRef<HTMLDivElement>(null)

    // mount & cleanup
    React.useEffect(() => {
      if (!node.current) {
        return
      }
      // should only run once, setup instance
      const consumed = document.createElement('div')
      node.current.appendChild(consumed)

      const elmModule = (() => {
        if (opts.path?.length) {
          const resolved = resolvePath(opts.path, elm.Elm)
          if (resolved) { return resolved }
          throw new Error(errors.invalidPath)
        }
        const resolved = getOnlyModule(elm.Elm)
        if (resolved) { return resolved }
        throw new Error(errors.pathRequired)
      })()

      const app = elmModule.init({
        node: consumed,
      })

      createInstance(id, app)

      return () => teardown(id)
    }, [node])

    // on update
    React.useEffect(() => {
      if (hasInstance(id)) {
        const { addListener, sendData, clean } = getClosure(id)
        const propKeys = Object.keys(props)
        propKeys
          .filter(key => typeof props[key] !== 'function')
          .forEach(key => sendData(key, props[key]))

        propKeys
          .filter(key => typeof props[key] === 'function')
          .forEach(key => addListener(key, props[key]))

        clean(propKeys)
      } else {
        console.error(errors.missingInstance)
      }
    })

    return <div ref={node} />
  }
}

export {
  Elm,
  ElmStep,
  ElmModule,
  App,
  ElmInitArgs,
  PropTypes,
}

export default wrap
