# Multi-stage build for Next.js static export
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies with npm (legacy peer deps to resolve conflicts)
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application for static export
RUN npm run build

# Production stage with nginx
FROM nginx:alpine AS production

# Copy built static files
COPY --from=builder /app/out /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 