import * as React from 'react'

interface Elm {

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

const getId = (() => {
  let id = 20

  return () => {
    id += 3
    return id
  }
})()

function wrap <Props extends object> (elm: Elm) {
  return function (props: Props) {
    if (!isObject(props)) {
      logErr(`props must be of type "object", not ${typeof props}`)
    }

    return <div id={`embed-elm-${getId()}`} />
  }
}

export default wrap
