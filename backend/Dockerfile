# syntax=docker/dockerfile:1.6
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 mvn -B -q -DskipTests dependency:go-offline
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 mvn -B -DskipTests package \
    && mkdir -p /app/extracted \
    && cd /app/extracted && jar xf /app/target/kafka-gui-backend-*.jar

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN groupadd -r app && useradd -r -g app app && mkdir -p /data && chown app:app /data
# Extract the fat jar so app classes and META-INF/services sit on the system classpath.
# This is required for java.net.spi.InetAddressResolverProvider — InetAddress loads its
# resolver via ServiceLoader.load(..., ClassLoader.getSystemClassLoader()), which cannot
# see classes nested under BOOT-INF/classes/ in a packed Spring Boot jar.
COPY --from=build /app/extracted /app
VOLUME ["/data"]
USER app
EXPOSE 8080
ENV JAVA_OPTS=""
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -cp 'BOOT-INF/classes:BOOT-INF/lib/*' com.kafkagui.KafkaGuiApplication"]
