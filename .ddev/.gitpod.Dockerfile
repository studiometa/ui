FROM gitpod/workspace-full
SHELL ["/bin/bash", "-c"]

RUN sudo apt-get -qq update

# Install ddev
RUN brew update && brew install drud/ddev/ddev && mkcert -install
