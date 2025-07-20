# Build stage
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create app user
RUN addgroup -g 1000 appuser && adduser -u 1000 -G appuser -s /bin/sh -D appuser

# Copy the jar file from build stage
COPY --from=build /app/target/*.jar app.jar

# Google Cloud credentials will be mounted at runtime
ENV GOOGLE_APPLICATION_CREDENTIALS_JSON=""

# Change ownership to app user
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8083

ENTRYPOINT ["java", "-jar", "app.jar"] 