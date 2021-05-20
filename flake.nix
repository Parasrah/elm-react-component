{
  description = "Simple API to embed Elm 0.19 elements in React";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";

    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs =
          import nixpkgs {
            inherit system;
            overlays = [
              (import ./nix/overlay.nix)
            ];
          };

        inherit (pkgs) stdenv;

      in
      rec {
        overlay = import ./nix/overlay.nix;

        devShell = with pkgs; mkShell {
          LANG = "en_US.UTF-8";

          buildInputs = with pkgs; [
            nodejs
            go-task

            elmPackages.elm
            elmPackages.elm-format

            nodePackages.prettier
          ];

          shellHook = ''
            export NIX_PATH=${pkgs.path}:nixpkgs=${pkgs.path}:.
          '';
        };
      }
    );
}
