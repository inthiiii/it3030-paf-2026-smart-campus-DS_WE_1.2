package com.smartcampus;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@SpringBootApplication
@EnableScheduling
public class SmartCampusApplication {

	public static void main(String[] args) {
		loadDotenv();
		SpringApplication.run(SmartCampusApplication.class, args);
	}

	/**
	 * Load environment variables from .env file into system properties.
	 * This ensures Spring Boot can resolve ${MONGO_URI}, ${PORT}, etc.
	 * The .env file is gitignored so secrets are never committed.
	 */
	private static void loadDotenv() {
		Path envFile = Path.of(".env");
		if (!Files.exists(envFile)) {
			System.out.println("[WARN] No .env file found at: " + envFile.toAbsolutePath());
			System.out.println("[WARN] Using system environment variables.");
			return;
		}
		try {
			Files.readAllLines(envFile).stream()
					.filter(line -> !line.isBlank() && !line.startsWith("#"))
					.forEach(line -> {
						int idx = line.indexOf('=');
						if (idx > 0) {
							String key = line.substring(0, idx).trim();
							String value = line.substring(idx + 1).trim();
							// Only set if not already set by actual environment
							if (System.getProperty(key) == null && System.getenv(key) == null) {
								System.setProperty(key, value);
							}
						}
					});

			// Debug: confirm MONGO_URI was loaded (mask the actual value)
			String mongoUri = System.getProperty("MONGO_URI");
			if (mongoUri != null) {
				String masked = mongoUri.substring(0, Math.min(30, mongoUri.length())) + "...";
				System.out.println("[INFO] MONGO_URI loaded: " + masked);
			} else {
				System.out.println("[WARN] MONGO_URI was NOT loaded from .env");
			}
			System.out.println("[INFO] Loaded environment variables from .env file.");
		} catch (IOException e) {
			System.err.println("[WARN] Failed to read .env file: " + e.getMessage());
		}
	}
}
