#!/usr/bin/env bash
set -euo pipefail

# Run once as root on an Ubuntu 22.04/24.04 ECS instance.
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl git docker.io docker-compose-v2
systemctl enable --now docker

install -d -m 0755 /opt/yingjie-ai-drama-studio
if [ ! -d /opt/yingjie-ai-drama-studio/.git ]; then
  git clone https://github.com/Zeng-JM123/yingjie-ai-drama-studio.git /opt/yingjie-ai-drama-studio
fi

echo "Bootstrap complete. Copy .env.example to .env, fill the values, then run:"
echo "cd /opt/yingjie-ai-drama-studio/video-service/deploy/volcengine && docker compose up -d --build"
