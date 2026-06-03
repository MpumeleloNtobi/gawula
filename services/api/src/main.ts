import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import helmet from "helmet";
import { json, urlencoded } from "express";
import { AppModule } from "./app.module";

function parseOrigins(value: string | undefined): string[] | boolean {
  if (!value || value.trim() === "*") return true;
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false, bodyParser: false });
  app.use(json({ limit: "12mb" }));
  app.use(urlencoded({ extended: true, limit: "12mb" }));
  app.use(helmet());
  app.enableCors({
    origin: parseOrigins(process.env.CORS_ORIGINS),
    credentials: true,
  });
  app.setGlobalPrefix("v1");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  Logger.log(`Foyer API listening on :${port}`, "Bootstrap");
}

bootstrap();
