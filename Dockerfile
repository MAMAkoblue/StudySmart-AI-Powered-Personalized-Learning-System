FROM node:20-alpine
WORKDIR /app

# Copy project
COPY backend ./backend
COPY frontend ./frontend

# Build frontend
WORKDIR /app/frontend
RUN npm install && npm run build

# Install backend deps (production)
WORKDIR /app/backend
RUN npm install --omit=dev

ENV NODE_ENV=production
ENV PORT=8080
ENV DATA_DIR=/data
EXPOSE 8080
VOLUME ["/data"]

CMD ["npm", "start"]