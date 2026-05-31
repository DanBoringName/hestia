# Dev container image for Hestia.
# Debian (bookworm) base rather than Alpine: Prisma's query engine is happiest
# on glibc/openssl, and we get git + build tools out of the box.
FROM node:26-bookworm

# Extra CLIs that make debugging the stack from inside the container painless:
#   psql      -> talk to the postgres service
#   redis-cli -> talk to the redis service
#   curl      -> hit the meilisearch health/API
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
       postgresql-client \
       redis-tools \
       curl \
       ca-certificates \
  && rm -rf /var/lib/apt/lists/*


ARG USERNAME=danja
RUN groupmod --new-name "${USERNAME}" node \
  && usermod --login "${USERNAME}" --home "/home/${USERNAME}" --move-home node

USER ${USERNAME}
