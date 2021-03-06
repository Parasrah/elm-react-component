# @elm-react/component

![](https://badge.fury.io/js/%40elm-react%2Fcomponent.svg) [![Coverage Status](https://coveralls.io/repos/github/Parasrah/elm-react-component/badge.svg?branch=improvements)](https://coveralls.io/github/Parasrah/elm-react-component?branch=improvements) ![](https://david-dm.org/parasrah/elm-react-component.svg) ![](https://github.com/parasrah/elm-react-component/workflows/tests/badge.svg)

The goal of this library is to make trying out Elm in your existing React code-base as easy as possible! After all most companies that decide to try Elm do so incrementally. Try it out!

> If you're looking for a library with more explicit control over ports, check out [react-elm-components](https://github.com/cultureamp/react-elm-components).

## Install

Using npm:

`npm i -S @elm-react/component`

Using yarn:

`yarn add @elm-react/component`

## Setting up Elm & React

This readme only covers the most common setup for Elm + React web projects. If your needs deviate from this, you should find the information you need on [the Elm website](https://elm-lang.org/).

### Webpack

> Regardless of which method you choose, please visit the [Assets](#asset-size) section of the readme to ensure you are only bundling a single Elm runtime in your application.

Adding Elm to your existing webpack configuration is fairly easy through the use of [elm-webpack-loader](https://github.com/elm-community/elm-webpack-loader), which has instructions to set it up [here](https://github.com/elm-community/elm-webpack-loader#elm-loader---). After you've set this up, you should be able to import Elm modules as seen below.

If instead you are using Create React App (which significantly limits configurability), you can visit [the CRA example](example#example) in this repo which should guide you through that process.

### Parcel

Although Webpack is the most well known file bundler, [Parcel](https://parceljs.org/) is a great alternative, especially if you're using Elm! Converting your existing webpack configuration is often just a matter of deleting all of your webpack configuration files and packages, installing parcel instead and changing your npm scripts. It supports Elm, React and many other common tooling with no configuration. Best of all, there are [plans with Parcel 2.0](https://github.com/parcel-bundler/parcel/issues/3351) to potentially resolve the [assets issue](#asset-size)!

## Usage

The goal of this library is to adopt familiar patterns from both React & Elm. With React we just use props:

```javascript
// Counter.jsx

import wrap from '@elm-react/component'

import Counter from './Counter.elm'

export default wrap(Counter)
```

```javascript
// App.jsx

import React, { useState } from 'react';

import Counter from './Counter'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <Counter
        className="counter"
        value={count}
        onChange={(change) => setCount(count + change)}
      />
    </div>
  );
}
```

And with Elm you just create an element and use ports:

```elm
-- Counter.elm

port className : (String -> msg) -> Sub msg


port value : (Int -> msg) -> Sub msg


port onChange : Int -> Cmd msg

...

main : Program Flags Model Msg
main =
    Browser.element
        { view = view
        , update = update
        , init = init
        , subscriptions = subscriptions
        }
```

The library will automatically convert React props to Elm ports:

* function props are converted to outgoing ports in Elm
* all other props are converted to incoming ports in Elm (subscriptions)

these functions are capable of receiving a single argument from the Elm element

### Opts

`path?: string[]`

`path` is only necessary when using an Elm instance containing multiple modules. This happens when you pass multiple Elm files to the compiler.

> Example:
>
> `module Page.Home` translates to the path: `['Page', 'Home']`

### Complex Props

There are two things you can pass in as props to an Elm component (provided you have defined their respective ports). As you saw above, you can pass in functions which will automatically be translated to outgoing ports, and you can pass in objects & primitives which get translated to incoming ports. Where this breaks down is objects that contain functions as properties.

For example:

```javascript
const MyElmComponent = wrap(MyElmModule)

export default () => (
  function onChange () {
    console.log('I changed!')
  }
  <MyElmComponent info={{ onChange, value: 1 }} />
)
```

This snippet is passing a complex object that contains a function as one of its properties. While this is completely valid, this will be translated to an incoming port, giving you no way to access the function because you can't decode it! In most cases, it's better to flatten your state like this:

```javascript
const MyElmComponent = wrap(MyElmModule)

export default () => (
  function onChange () {
    console.log('I changed!')
  }
  <MyElmComponent onChange={onChange} value={1} />
)
```

Now you can access all values, with the added benefit of having an easier time writing the decoder for the port.

### Flags

In React, props are used for both initialization and updates. This is not
the case in Elm interop, which uses Flags for initialization and Ports
for update.

All props that would be converted to incoming ports (i.e. props that are
not functions) will also be passed into the Elm component as flags. This
way if you do need to initialize your Elm component, you can access the
props via flags as well. You can see any example of this in `/example`.

If you wish to have a prop that is only used for initialization (i.e. you
don't wish to define any ports for it), use the suffix `Flag` for the prop
name. For example, if you have a prop named `version` with no ports,
this library will warn you about the missing ports. If you change the name
to `versionFlag`, the warning will go away.

Vice versa, if you have a prop named `versionFlag` that you decide you want
to define ports for, remove the `Flag` suffix. Otherwise the library will
again warn you that you have defined ports for a "flag only" prop.

### Common Pitfalls

There is a drawback to having props automatically injected into an Elm
element in that you have to be more aware of what is rendering your Elm
components. For example, react-router injects props into every component
it renders, which is probably not what you want. Currently the advice is to
explicitly pass props to your Elm component. If this affects you and you have
ideas on how to improve it, please feel free to open an issue with your ideas.

## Asset Size

Generally, Elm produces very small assets when compared to other frameworks
(like React and Angular). Similar to those other frameworks though, it
requires a runtime to operate. This is dealt with by the Elm compiler and
isn't typically something you have to worry about, but in the case of using
multiple `Browser.element`'s, it's easy to **accidentally bundle multiple
instances of the Elm runtime into your app**. Luckily, it's also easy to avoid!

### With elm-webpack-loader

[elm-webpack-loader](https://github.com/elm-community/elm-webpack-loader) documents how to bundle multiple modules with the same Elm runtime [here](https://github.com/elm-community/elm-webpack-loader#files-default---path-to-required-file).

### With CRA

There is currently [an issue](https://github.com/Parasrah/rescripts-elm/issues/3) open on the `@elm-react/rescripts-elm` package to deal with this problem.

### With Parcel

There is currently [an issue](https://github.com/parcel-bundler/parcel/issues/2508) open on the [`parcel`](https://github.com/parcel-bundler/parcel) package to resolve this issue.

## Create React App

Create React App (CRA) abstracts the configuration away from the user. This is great when you don't have the time or knowledge to maintain a react configuration, but it results in roadblocks when you want to customize behaviour yourself.

Fortunately, [@rescripts/cli](https://github.com/harrysolovay/rescripts) alleviates this difficulty to some extent. And paired with [@elm-react/rescripts-elm](https://github.com/Parasrah/rescripts-elm), it's actually quite easy to get started with Elm in a CRA project.

> You can see an example of this in action [here](example#example)
