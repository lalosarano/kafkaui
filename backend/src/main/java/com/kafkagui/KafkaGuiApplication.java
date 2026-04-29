package com.kafkagui;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@ConfigurationPropertiesScan("com.kafkagui")
@EnableScheduling
public class KafkaGuiApplication {
    public static void main(String[] args) {
        SpringApplication.run(KafkaGuiApplication.class, args);
    }
}
