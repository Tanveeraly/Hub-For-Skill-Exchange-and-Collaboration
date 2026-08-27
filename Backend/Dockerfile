# Use lightweight Node image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy only package files first (for Docker caching optimization)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Generate Prisma client (important)
RUN npx prisma generate

# Expose backend port
EXPOSE 2000

# Start development server (nodemon)
CMD ["npm", "run", "dev"]
