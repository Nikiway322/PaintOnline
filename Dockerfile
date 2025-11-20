# ---------- СБОРКА ----------
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /app

# копируем pom.xml и скачиваем зависимости
COPY pom.xml .
RUN mvn -ntp dependency:go-offline

# копируем проект и собираем
COPY src ./src
RUN mvn -ntp clean package -DskipTests

# ---------- ПРОДАКШЕН ----------
FROM eclipse-temurin:17-jre
WORKDIR /app

# копируем собранный jar
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "./app.jar"]