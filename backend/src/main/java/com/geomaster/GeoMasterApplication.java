package com.geomaster;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties
public class GeoMasterApplication {

    public static void main(String[] args) {
        SpringApplication.run(GeoMasterApplication.class, args);
    }
}
