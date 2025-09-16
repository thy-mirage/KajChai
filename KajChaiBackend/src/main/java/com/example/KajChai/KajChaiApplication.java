package com.example.KajChai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableAsync
public class KajChaiApplication {

	public static void main(String[] args) {
		SpringApplication.run(KajChaiApplication.class, args);
	}

}
