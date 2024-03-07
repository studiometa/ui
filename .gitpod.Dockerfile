FROM gitpod/workspace-full:latest

RUN brew install ddev/ddev/ddev
RUN mkdir -p ~/.ddev
RUN echo "instrumentation_opt_in: true" >> ~/.ddev/global_config.yaml
RUN echo "omit_containers: [ddev-ssh-agent]" >> ~/.ddev/global_config.yaml
