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

# Tuned for a 512 MB container (e.g. Render free tier). RAM — not image
# size — is what gets you OOM-killed, so every flag below caps a memory pool:
#   MaxRAMPercentage=50 ... heap ~256 MB, leaving room for metaspace, the
#                           ONNX native arena + model, and direct buffers
#   MaxMetaspaceSize=128m . Spring + Spring AI load a lot of classes; cap it
#   Xss256k ............... default 1 MB thread stacks × dozens of threads
#                           adds up; 256k is plenty for this app
#   TieredStopAtLevel=1 ... C1 JIT only — smaller code cache, faster startup
#   UseSerialGC ........... single-threaded GC; on 0.1-CPU free tiers G1's
#                           parallel threads are pure overhead
ENV JAVA_OPTS="-XX:MaxRAMPercentage=50 -XX:MaxMetaspaceSize=128m -XX:CompressedClassSpaceSize=32m -Xss256k -XX:TieredStopAtLevel=1 -XX:+UseSerialGC -Djava.security.egd=file:/dev/./urandom"
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
