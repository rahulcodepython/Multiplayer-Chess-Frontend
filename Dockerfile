# Use Node.js base image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy source code
COPY . .

# Build the Vite project
RUN npm run build

# Expose port 3000
EXPOSE 4173

# Start the Vite server
CMD [ "npm", "run", "preview" ]

# # Use Nginx for serving static files
# FROM nginx:alpine

# # Copy built files from builder stage
# COPY --from=builder /app/dist /usr/share/nginx/html

# # Copy custom Nginx configuration
# COPY ./Nginx/default.conf /etc/nginx/conf.d/default.conf

# # Expose port 80
# EXPOSE 80

# # Start Nginx server
# CMD ["nginx", "-g", "daemon off;"]
