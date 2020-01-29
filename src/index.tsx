/*
 * TODO: clean up subscriptions
 * TODO: make logic simpler
*/

import * as React from 'react'
import uuid from 'uuid/v1'

import errors from './errors'

interface Elm {
  Elm: ElmStep
}

interface ElmStep {
  [key: string]: ElmStep | ElmModule
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
      subscribe (fn: (data: any) => void): void
      send (data: any): void
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
  subscriptions: string[]
  timing: number
}

interface Instances {
  [key: string]: Instance
}

function isObject (input: any) : input is object {
  if (input === null) return false
  if (typeof input === 'function') return false
  if (typeof input !== 'object') return false
  return true
}

function getOnlyValue (obj: ElmStep): ElmStep | ElmModule | false {
  const values = Object.values(obj)
  if (values.length > 1) { return false }
  if (values.length < 1) { return false }
  return values[0]
}

function isElmModule (test: ElmModule | ElmStep): test is ElmModule {
  if (test === null) { return false }
  if (typeof test !== 'object') { return false }
  if (typeof test.init !== 'function') { return false }
  return true
}

function getOnlyModule (step: ElmStep | ElmModule): ElmModule | false {
  if (isElmModule(step)) { return step }
  const deeper = getOnlyValue(step)
  if (!deeper) { return false }
  // wouldn't tail call optimization be nice :P
  return getOnlyModule(deeper)
}

function isElm (test: any): test is Elm {
  if (test === null) { return false }
  if (typeof test !== 'object') { return false }
  if (test.Elm === null) { return false }
  if (typeof test.Elm !== 'object') { return false }
  return true
}

function resolvePath (path: string[] = [], step: ElmStep): false | ElmModule {
  // TODO: finish
}

const instances: Instances = { }

function hasInstance (id: string) {
  return instances[id] !== undefined
}

function getInstance (id: string) {
  const instance = instances[id]
  if (!instance) {
    // TODO: handle error
    throw new Error('FIXME')
  }
  return instance
}

function addListener (id: string, name: string, listener: Listener) {
  const instance = getInstance(id)
  if (!instance.app.ports[name]) {
    console.error(`no such outgoing port: ${name}`)
    return
  }
  instance.listeners[name] = listener
  if (!instance.subscriptions.includes(name)) {
    instance.app.ports[name].subscribe((...payload) => {
      if (instance && instance.listeners[name]) {
        instance.listeners[name](...payload)
        instance.subscriptions.push(name)
      } else {
        // TODO: handle, should never happen
        throw new Error('Deal with me')
      }
    })
  }
}

function sendData (id: string, name: string, payload: any) {
  const instance = getInstance(id)
  if (!instance.app.ports[name]) {
    console.error(`no such incoming port: ${name}`)
  } else {
    instance.app.ports[name].send(payload)
  }
}

function wrap <Props extends object> (elm: Elm, opts: Options = {}) {
  return function (props: Props) {
    if (!isObject(props)) {
      logErr(`props must be of type "object", not ${typeof props}`)
    }

    const node = React.createRef<HTMLInputElement>()

    // v1 is based on timestamp, 1 microsecond cost (negligible)
    const [id] = React.useState(uuid())

    // on update
    React.useEffect(() => {
      // handle if elm has been initialized already (not first run)
      if (hasInstance(id)) {
        const instance = instances[id]
        const propKeys = Object.keys(props)

        // send props data to elm instance
        propKeys
          .filter(key => typeof props[key] !== 'function')
          .forEach(key => {
            instances[id].app.ports[key].send(props[key])
          })

        // setup listeners from props
        propKeys
          .filter(key => typeof props[key] === 'function')
          .forEach(key => {
            addListener(id, key, props[key])
          })

        // fix listeners
        const { listeners } = instance
        const listenerKeys = Object.keys(listeners)
        // clean up props changing types (function -> !function)
        listenerKeys.forEach(propKey => {
          if (typeof props[propKey] !== 'function') {
            delete listeners[propKey]
          }
        })
        // clean up props changing types (function -> undefined)
        listenerKeys.forEach(listenerKey => {
          if (!propKeys.includes(listenerKey)) {
            delete listeners[listenerKey]
          }
        })
      }
    })

    // mount & cleanup
    React.useEffect(() => {
      // should only run once, setup instance
      instances[id] = (() => {
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

        return {
          app,
          listeners: {},
          subscriptions: [],
          timing: 5,
        }
      })()

      // setup inital ports
      Object.keys(props).forEach(key => {
        if (typeof props[key] === 'function') {
          addListener(id, key, props[key])
        } else {
          sendData(id, key, props[key])
        }
      })

      return () => {
        // cleanup instance
        delete instances[id]
      }
    }, [])

    return <div ref={node} />
  }
}

export { Elm, App, ElmInitArgs }

export default wrap
