# Dockerfile for workout-plan-service

# --- Build Stage ---
# Use a slim JDK image for the build environment. Alpine is lightweight.
FROM eclipse-temurin:21-jdk-alpine AS build
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


# --- Run Stage ---
# Use a minimal Java Runtime Environment (JRE) based on Alpine Linux for a small footprint.
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy the executable JAR from the build stage into the final image
COPY --from=build /app/target/*.jar app.jar

# Create a dedicated, non-root user and group for security best practices.
# Running as a non-root user reduces potential security risks.
RUN addgroup -g 1000 appuser && adduser -u 1000 -G appuser -s /bin/sh -D appuser
USER appuser

# Expose the port that the Spring Boot application will run on.
# We use 8082 for this service to avoid conflicts with user-service (8081).
EXPOSE 8082

# Set JVM options for optimized performance in a containerized environment.
# -XX:+UseContainerSupport makes the JVM aware of container memory limits.
# -XX:MaxRAMPercentage constrains the heap size to a percentage of the container's memory.
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=70.0"

# The command to run the application when the container starts.
# We use 'sh -c' to ensure the JAVA_OPTS environment variable is correctly interpreted.
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
