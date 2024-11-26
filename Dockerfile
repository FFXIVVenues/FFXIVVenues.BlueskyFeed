FROM node:18 AS build
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
RUN rm -rf node_modules
RUN npm install --production

FROM node:18
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./
EXPOSE 3000
CMD ["node", "."]