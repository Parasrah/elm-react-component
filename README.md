![](https://badge.fury.io/js/%40elm-react%2Fcomponent.svg) ![](https://david-dm.org/parasrah/elm-react-component.svg) ![](https://github.com/parasrah/elm-react-component/workflows/tests/badge.svg)

# @elm-react/component

TODO: description

## [Install](#install)

TODO: npm
TODO: yarn
TODO: elm (direct to website)
TODO: webpack (direct to website & loader, include note on duplicate runtime)

## [Usage](#usage)

### [Opts](#opts)

### [Complex Props](#complex-props)

There are two things you can pass in as props to an Elm component (provided you have defined their respective ports). As you saw above, you can pass in functions which will automatically be translated to outgoing ports, and you can pass in objects & primitives which get translated to incoming ports. Where this breaks down is objects that contain functions as properties.

For example:

```
const MyElmComponent = wrap(MyElmModule)

export default () => (
  function onChange () {
    console.log('I changed!')
  }
  <MyElmComponent info={{ onChange, value: 1 }} />
)
```

This snippet is passing a complex object that contains a function as one of its properties. While this is completely valid, this will be translated to an incoming port, giving you no way to access the function because you can't decode it! In most cases, it's better to flatten your state like this:

```
const MyElmComponent = wrap(MyElmModule)

export default () => (
  function onChange () {
    console.log('I changed!')
  }
  <MyElmComponent onChange={onChange} value={1} />
)
```

Now you can access all values, with the added benefit of having an easier time writing the decoder for the port.

### [Common Pitfalls](#pitfalls)

There is a drawback to having props automatically injected into an Elm element as well. You have to be more aware of what is rendering your Elm components. For example, react-router injects props into every component it renders, which is probably not what you want. Currently the advice is to explicitly pass props to your Elm component, although there are other ideas being toyed with currently. If this affects you and you have ideas on how to improve it, please feel free to open an issue with your ideas. 

## [Performance](#perf)

## [Asset Size](#assets)

## [Create React App](#cra)
