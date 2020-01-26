import * as React from 'react'
import uuid from 'uuid/v4'

interface Elm {
  Elm: {
    [key: string]: {
      init (args: ElmInitArgs): App
    }
  }
}

interface Options {
  /** the name of the elm module, shouldn't be necessary */
  name?: string
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

interface ElmProps {
  [key: string]: any
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

function logErr (msg: string) {
  console.error(`react-elm-component: ${msg}`)
}

function isObject (input: any) : input is object {
  if (input === null) return false
  if (typeof input === 'function') return false
  if (typeof input !== 'object') return false
  return true
}

function getFirstPropName (obj: Object): string {
  const keys = Object.keys(obj)
  if (!keys.length) {
    // TODO: Add error specifying to look at docs for Options#name
    throw new Error('bad error')
  }
  return keys[0]
}

const instances: Instances = { }

function hasInstance(id: string) {
  return instances[id] !== undefined
}

function getInstance(id: string) {
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

function wrap <Props extends ElmProps> (elm: Elm, opts: Options = {}) {
  return function (props: Props) {
    if (!isObject(props)) {
      logErr(`props must be of type "object", not ${typeof props}`)
    }

    // can optimize this later
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
        document.getElementById(id)?.appendChild(consumed)

        const app = elm.Elm[opts.name || getFirstPropName(elm.Elm)].init({
          node: consumed,
        })

        return {
          app,
          listeners: {},
          subscriptions: [],
          timing: 5
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

    return <div id={id} />
  }
}

export { Elm, App, ElmInitArgs, React }

export default wrap
