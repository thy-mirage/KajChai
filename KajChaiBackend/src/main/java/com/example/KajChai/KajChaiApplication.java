package com.example.KajChai;

import java.util.TimeZone;

import jakarta.annotation.PostConstruct;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableAsync
public class KajChaiApplication {

	@PostConstruct
	public void init() {
		// Set default timezone to Asia/Dhaka (UTC+6)
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Dhaka"));
	}

	public static void main(String[] args) {
		SpringApplication.run(KajChaiApplication.class, args);
	}

}
