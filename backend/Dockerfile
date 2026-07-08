# 1. Base image
FROM node:22-alpine

# 2. Working directory inside the container
WORKDIR /app

# 3. Copy dependency files first (better layer caching)
COPY package*.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy the rest of the application
COPY . .

# 6. Application listens on port 4000
EXPOSE 4000

# 7. Start the backend
CMD ["npm", "start"]