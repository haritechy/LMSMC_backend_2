FROM node:18

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --production  # <-- only install production deps

COPY . .

EXPOSE 9000

CMD ["npm", "start"]  # <-- use start, not dev
