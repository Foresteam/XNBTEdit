#!/bin/bash
sudo docker run --rm -ti \
  -v "$(pwd)":/project \
  -v "$(pwd)/dist":/dist \
  electronuserland/builder:16-wine-mono \
  /bin/bash -c "yarn -D && yarn ebuild --win"