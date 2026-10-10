#!/bin/bash

set -euo pipefail

PROJECT_NAME="adaptive-food-api"

# Usage: deploy.sh --stage <alpha|staging|production> [--tag <version>]

display_usage() {
  echo "Usage: $0 --stage <alpha|staging|production> [--tag <version>]"
  echo "  --tag is required for production deployment"
  exit 1
}

# Parse arguments
DEPLOYMENT=""
TAG=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --stage)
      DEPLOYMENT="$2"
      shift 2
      ;;
    --tag)
      TAG="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      display_usage
      ;;
  esac
done

# COLORS
MAGENTA=$(tput setaf 5)
YELLOW=$(tput setaf 3)
GREEN=$(tput setaf 2)
RED=$(tput setaf 1)
NORMAL=$(tput sgr0)

# Validate arguments
if [[ -z "$DEPLOYMENT" ]]; then
  display_usage
fi

# Validate DEPLOYMENT values
if [[ ! "$DEPLOYMENT" =~ ^(alpha|staging|production)$ ]]; then
  echo "Invalid stage: $DEPLOYMENT"
  display_usage
fi

# Validate TAG for production
if [[ "$DEPLOYMENT" == "production" && -z "$TAG" ]]; then
  echo "${RED}Error: --tag is required for production deployment${NORMAL}"
  echo "Example: $0 --stage production --tag v1.0.1"
  exit 1
fi

# VALIDATE config
echo "${MAGENTA}*** VALIDATE ENV FILE ***${NORMAL}"
if [ ! -s ./.env.$DEPLOYMENT ]; then
  echo
  echo "${RED}./.env.$DEPLOYMENT not found.${NORMAL}"
  echo
  exit 1
else
  echo
  . ./.env.$DEPLOYMENT
  echo "Loaded .env.$DEPLOYMENT file"
  echo
fi

# GIT OPERATIONS
echo "${MAGENTA}*** GIT OPERATIONS ***${NORMAL}"

git reset --hard

if [[ "$DEPLOYMENT" == "alpha" ]]; then
  BRANCH="dev"
  echo "${MAGENTA}*** SWITCHING TO BRANCH: $BRANCH ***${NORMAL}"
  git checkout $BRANCH &&\
  git reset --hard &&\
  git pull origin $BRANCH
elif [[ "$DEPLOYMENT" == "staging" ]]; then
  BRANCH="main"
  echo "${MAGENTA}*** SWITCHING TO BRANCH: $BRANCH ***${NORMAL}"
  git checkout $BRANCH &&\
  git reset --hard &&\
  git pull origin $BRANCH
elif [[ "$DEPLOYMENT" == "production" ]]; then
  echo "${MAGENTA}*** FETCHING AND CHECKOUT TAG: $TAG ***${NORMAL}"
  git fetch origin tag "$TAG" --no-tags &&\
  git checkout "$TAG"
fi

echo
echo "Git operations completed successfully"
echo

# VALIDATE Dockerfile
echo "${MAGENTA}*** VALIDATE Dockerfile ***${NORMAL}"
DOCKERFILE_PATH="./Dockerfile"
if [ ! -s "$DOCKERFILE_PATH" ]; then
  echo
  echo "${RED}$DOCKERFILE_PATH not found.${NORMAL}"
  echo
  exit 1
else
  echo
  echo "Found! $DOCKERFILE_PATH"
  echo
fi

DOCKER_NAME="$PROJECT_NAME-$DEPLOYMENT"
COMPOSE_FILE="./docker-compose.yml"
echo "${MAGENTA}*** CHECK EXISTING CONTAINERS ***${NORMAL}"

EXISTING_CONTAINERS=$(docker ps -a --filter "name=${DOCKER_NAME}" --format '{{.Names}}' 2>/dev/null || true)

if [[ -n "$EXISTING_CONTAINERS" ]]; then
  echo "${YELLOW}Found existing containers for project ${DOCKER_NAME}. Will recreate.${NORMAL}"
  echo "${MAGENTA}*** RECREATE Docker Compose Services ***${NORMAL}"
  docker compose -f $COMPOSE_FILE --env-file .env.$DEPLOYMENT -p $DOCKER_NAME up -d --build --force-recreate
else
  echo "${MAGENTA}*** RUN Docker Compose ***${NORMAL}"
  docker compose -f $COMPOSE_FILE --env-file .env.$DEPLOYMENT -p $DOCKER_NAME up -d --build
fi

docker system prune -f --volumes
