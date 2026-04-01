FROM node:20-bookworm

WORKDIR /app

# Install project dependencies first to take advantage of Docker layer caching.
COPY package*.json ./
RUN npm ci

# Copy the full project and run the packaging step.
COPY . .
RUN npm run package

# Keep the generated package artifacts in /app/out.
CMD ["bash", "-lc", "ls -la out || true"]
