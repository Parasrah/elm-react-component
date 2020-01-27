## How to get @elm-react/component working with Create React App?

first up, install [@rescripts/cli](https://github.com/harrysolovay/rescripts), [@elm-react/rescripts-elm](https://github.com/Parasrah/rescripts-elm) and [elm-webpack-loader](https://github.com/elm-community/elm-webpack-loader):

`npm i -D @rescripts/cli @elm-react/rescripts-elm elm-webpack-loader`

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

And you should be good to go! Enjoy using Elm! And be sure to check out the [guide](https://guide.elm-lang.org/) if you're new!
