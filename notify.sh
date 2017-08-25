#!/bin/bash

BASEDIR=$(dirname $0)
cd $BASEDIR

IMAGE_NAME="harperreed/notifier"
CONTAINER_NAME=notifier

ACTION=$1

if [ -z "$ACTION" ];
  then
    echo "usage: $0 <build|run|stop|start|remove|rerun|attach|push|logs|debug>";
    exit 1;
fi

# Build
_build() {
  docker build --tag="$IMAGE_NAME" .
}

# Run (first time)
_run() {
  docker run -d --name $CONTAINER_NAME --net=host $IMAGE_NAME
}

# Debugging mode with terminal access
_debug() {
  docker run -i -t --entrypoint /bin/bash --name $CONTAINER_NAME --net=host $IMAGE_NAME
}

# Stop
_stop() {
  docker stop $CONTAINER_NAME
}

# Start (after stopping)
_start() {
  docker start $CONTAINER_NAME
}

# Remove
_remove() {
  docker rm $CONTAINER_NAME
}

# Remove container and create a new one
_rerun() {
  _stop
  _remove
  _run
}

# Manually open bash
_attach() {
  docker exec -ti $CONTAINER_NAME /bin/bash
}

# Container logs
_logs() {
  docker logs $CONTAINER_NAME
}

# Publish contents
_push() {
  docker push $IMAGE_NAME
}

eval _$ACTION
