port module Counter exposing (main)

import Browser
import Html exposing (Html, button, div, text)
import Html.Attributes exposing (class)
import Html.Events exposing (onClick)
import Json.Encode as E



-- Ports (interop with props)


port className : (String -> msg) -> Sub msg


port value : (Int -> msg) -> Sub msg


port onValueChange : Int -> Cmd msg



-- Model


type alias Model =
    { class : String
    , value : Int
    }


type alias Flags =
    {}


init : Flags -> ( Model, Cmd Msg )
init _ =
    ( { class = ""
      , value = 0
      }
    , Cmd.none
    )



-- Msg


type Msg
    = IncomingClass String
    | IncomingValue Int
    | Increment
    | Decrement



-- Subscriptions


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.none



-- Update


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        IncomingClass updatesClass ->
            ( { model | class = updatesClass }
            , Cmd.none
            )

        IncomingValue updatedValue ->
            ( { model | value = updatedValue }
            , Cmd.none
            )

        Increment ->
            ( model
            , onValueChange 1
            )

        Decrement ->
            ( model
            , onValueChange -1
            )



-- View


view : Model -> Html Msg
view model =
    div
        [ class model.class ]
        [ button
            [ onClick Decrement ]
            [ text "-" ]
        , text <| String.fromInt model.value
        , button
            [ onClick Increment ]
            [ text "+" ]
        ]


main : Program Flags Model Msg
main =
    Browser.element
        { view = view
        , update = update
        , init = init
        , subscriptions = subscriptions
        }
