package ru.paint.paintonline.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class WebMvcController {
    @GetMapping("/")
    public String index() {
        // forward to static resource: classpath:/static/single-page/index.html
        return "forward:/single-page/index.html";
    }
}