FROM node:alpine

WORKDIR /frontend

COPY package.json .
RUN npm install 

COPY . .

EXPOSE 3000
