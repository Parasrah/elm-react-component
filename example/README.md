# Example

You should be able to use this example regardless of what setup you're using, but it is specifically targeting CRA users because of the added difficulty it takes to configure it. It's assumed in other cases you know how to setup webpack loaders yourself.

## How to get @elm-react/component working with Create React App?

first up, install [@rescripts/cli](https://github.com/harrysolovay/rescripts), [@elm-react/rescripts-elm](https://github.com/Parasrah/rescripts-elm), [elm](https://elm-lang.org/) and [elm-webpack-loader](https://github.com/elm-community/elm-webpack-loader):

`npm i -D @rescripts/cli @elm-react/rescripts-elm elm elm-webpack-loader`

update your `package.json`:

```json

  "scripts": {
-   "start": "react-scripts start",
+   "start": "rescripts start",
-   "build": "react-scripts build",
+   "build": "rescripts build",
-   "test": "react-scripts test",
+   "test": "rescripts test",
-   "eject": "react-scripts eject"
  },
  .
  .
  .
+ "rescripts": [
+   "@elm-react/rescripts-elm"
+ ]

```

From here you should be able to follow the [guide](https://github.com/Parasrah/elm-react-component) for this library! Enjoy using Elm! And be sure to check out the [guide](https://guide.elm-lang.org/) if you're new!
