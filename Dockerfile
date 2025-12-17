FROM node:18

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production

COPY . .

ENV PORT=9000
EXPOSE 9000

CMD ["node", "server.js"]
