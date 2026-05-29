FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -q -B -DskipTests package

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S texton && adduser -S texton -G texton
COPY --from=build /app/target/*.jar app.jar
RUN mkdir -p /app/garage-storage /data && chown -R texton:texton /app /data
USER texton
EXPOSE 8080
ENV SPRING_PROFILES_ACTIVE=docker
VOLUME ["/app/garage-storage", "/data"]
ENTRYPOINT ["java", "-jar", "app.jar"]
