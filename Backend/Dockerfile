FROM node:20-alpine

WORKDIR /app

# Copy package files first for Docker cache
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Backend port
EXPOSE 5000

# Run migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
