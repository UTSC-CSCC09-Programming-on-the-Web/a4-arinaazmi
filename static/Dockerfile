#–– Stage 1: install dependencies ––
FROM node:18-alpine AS builder
WORKDIR /app

# copy only the manifest, install deps
COPY package.json package-lock.json ./
RUN npm ci --silent

# copy your frontend code
COPY . .

#–– Stage 2: serve with nginx ––
FROM nginx:stable-alpine
# remove default html
RUN rm -rf /usr/share/nginx/html/*

# copy built/static files from builder
COPY --from=builder /app /usr/share/nginx/html

# expose and run
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
