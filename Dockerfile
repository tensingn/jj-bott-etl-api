FROM --platform=linux/amd64 node:20-alpine
WORKDIR /
COPY package*.json ./
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm install
COPY . .
EXPOSE 3001
CMD npm start