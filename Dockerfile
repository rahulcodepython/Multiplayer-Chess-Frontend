# FROM node:alpine

# WORKDIR /frontend

# COPY package.json .
# RUN npm install 

# COPY . .

# EXPOSE 3000

# CMD ["npm", "run", "dev"]

# Use an official Node.js image as the base
FROM node:14-alpine

# Set the working directory inside the container
WORKDIR /app

# RUN npm install -g npm@latest
# Copy package.json and package-lock.json to the working directory
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy all files from the current directory to the working directory in the container
COPY . .

# Expose port 3000 to the outside world
EXPOSE 3000

# Command to run the development server
CMD ["npm", "run", "dev"]
