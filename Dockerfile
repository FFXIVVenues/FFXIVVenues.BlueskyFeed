FROM node:18 as build
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

FROM node:18
WORKDIR /app
COPY --from=build /app/dist ./
EXPOSE 3000
CMD ["node", "."]