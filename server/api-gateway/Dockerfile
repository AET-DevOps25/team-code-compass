# Dockerfile for api-gateway

# Use Eclipse Temurin JDK 21 Alpine for smaller image size and better performance
FROM eclipse-temurin:21-jdk-alpine
LABEL maintainer="flexfit-dev-team"

# Set the working directory inside the container
WORKDIR /app

# Copy the Maven wrapper files and the pom.xml. This allows us to leverage
# Docker's layer caching effectively. The next step will only re-run if pom.xml changes.
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Make the Maven wrapper executable
RUN chmod +x ./mvnw

# Download dependencies. This creates a separate layer that is cached.
RUN ./mvnw dependency:go-offline -B

# Copy the rest of the application's source code
COPY src ./src

# Build the application and package it into a JAR file, skipping tests.
RUN ./mvnw clean package -DskipTests

# Copy the executable JAR (the JAR is created by the previous RUN command)
RUN cp target/api-gateway-*.jar app.jar

# Create a dedicated, non-root user and group for security best practices.
RUN addgroup -g 1000 appuser && adduser -u 1000 -G appuser -s /bin/sh -D appuser
USER appuser

# Expose the port that the API Gateway will run on.
EXPOSE 8000

# Set JVM options for optimized performance in a containerized environment.
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=70.0"

# Add startup delay to allow services to register with Eureka before gateway starts
ENTRYPOINT ["sh", "-c", "echo 'Waiting for services to register...' && sleep 45 && echo 'Starting API Gateway...' && java $JAVA_OPTS -jar app.jar"] 