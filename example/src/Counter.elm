port module Counter exposing (Model, Msg(..), className, onChange, update, value, view)

import Browser
import Html exposing (Html, button, div, text)
import Html.Attributes exposing (class)
import Html.Events exposing (onClick)
import Json.Encode as E



-- Ports (interop with props)


port className : (String -> Msg) -> Sub Msg


port onChange : Int -> Cmd msg


port value : Int -> Msg



-- Model


type alias Model =
    { class : String
    , value : String
    }


init : flags -> ( Model, Cmd Msg )
init _ =
    ( { class = ""
      , value = ""
      }
    , Cmd.none
    )



-- Msg


type Msg
    = IncomingClass String
    | IncomingValue Int
    | Increment
    | Decrement



-- Update


update : Msg -> Model -> Model
update msg model =
    case msg of
        IncomingClass class ->
            ( { model | class = class }
            , Cmd.none
            )

        IncomingValue updatedValue ->
            ( { model | value = updatedValue }
            , Cmd.none
            )

        Increment ->
            ( model
            , onChange + 1
            )

        Decrement ->
            ( model
            , onChange -1
            )



-- View


view : Model -> Html msg
view model =
    div
        [ class model.class ]
        [ button
            [ onClick Decrement ]
            [ text "-" ]
        , text model.value
        , button
            [ onClick Increment ]
            [ text "+" ]
        ]


main : Program flags Model Msg
main =
    Browser.element
        { view = view
        , update = update
        , init = init
        , subscriptions = Sub.none
        }
