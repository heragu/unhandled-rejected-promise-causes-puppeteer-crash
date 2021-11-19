#!/bin/bash

NULL="null"
while [ true ]
do
  RESPONSE=$(curl -s -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" -d '{}')
  
  if [[ "$RESPONSE" != "$NULL" ]]; then
    echo $RESPONSE
    exit 1
  fi
done