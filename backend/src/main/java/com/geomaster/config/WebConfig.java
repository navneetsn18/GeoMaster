package com.geomaster.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload-path:/app/uploads}")
    private String uploadPath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = uploadPath.endsWith("/") ? uploadPath : uploadPath + "/";
        // Ensure URI form: file:///absolute/path/
        if (!location.startsWith("file:")) {
            location = "file:///" + location.replace("\\", "/").replaceFirst("^/+", "");
        }
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(location);
    }
}
