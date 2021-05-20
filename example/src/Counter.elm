port module Counter exposing (main)

import Browser
import Html exposing (Html, button, div, span, text)
import Html.Attributes exposing (class)
import Html.Events exposing (onClick)
import Json.Decode as D exposing (Decoder)
import Json.Decode.Pipeline exposing (required)
import Json.Encode as E exposing (Value)



-- Ports (interop with props)


port className : (String -> msg) -> Sub msg


port value : (Int -> msg) -> Sub msg


port onChange : Int -> Cmd msg



-- Flags (initialization)


type alias Flags =
    { value : Int
    , messageFlag : String
    }


flagsDecoder : Decoder Flags
flagsDecoder =
    D.succeed Flags
        |> required "value" D.int
        |> required "messageFlag" D.string


defaultFlags : Flags
defaultFlags =
    { value = 0, messageFlag = "failed to parse flags" }



-- Model


type alias Model =
    { class : String
    , value : Int
    , message : String
    }


init : Value -> ( Model, Cmd Msg )
init flagsJson =
    let
        flags =
            D.decodeValue flagsDecoder flagsJson |> Result.withDefault defaultFlags
    in
    ( { class = ""
      , value = flags.value
      , message = flags.messageFlag
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
    Sub.batch
        [ className IncomingClass
        , value IncomingValue
        ]



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
            , onChange 1
            )

        Decrement ->
            ( model
            , onChange -1
            )



-- View


view : Model -> Html Msg
view model =
    div
        [ class model.class ]
        [ div []
            [ button
                [ onClick Decrement ]
                [ text "-" ]
            , text <| String.fromInt model.value
            , button
                [ onClick Increment ]
                [ text "+" ]
            ]
        , span [] [ text model.message ]
        ]


main : Program Value Model Msg
main =
    Browser.element
        { view = view
        , update = update
        , init = init
        , subscriptions = subscriptions
        }
