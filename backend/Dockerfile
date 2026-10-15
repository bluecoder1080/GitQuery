# Multi-stage build: compile with the JDK, run on a slim JRE.
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# Dependencies first so this layer is cached across source changes.
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -B dependency:go-offline

COPY src/ src/
# Tests are skipped deliberately: the only test is a full-context load
# that needs a live database and OAuth credentials.
RUN ./mvnw -B clean package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

# Keep the JVM inside the container's memory limit instead of the host's.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75"
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
