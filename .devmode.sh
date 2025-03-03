#!/bin/bash

cleanup() {
  trap - SIGINT
  DEV_CLEANUP=true bun run .devmode.ts
}

trap cleanup SIGINT

bun run nodemon