package com.example.demo; // Make sure this matches your actual package name!

import org.springframework.boot.CommandLineRunner;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

@Component
public class ConnectionTestRunner implements CommandLineRunner {

    private final MongoTemplate mongoTemplate;

    public ConnectionTestRunner(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("====== ATTEMPTING MONGODB CONNECTION ======");
        
        TestDoc doc = new TestDoc();
        doc.message = "System Online: Smart Campus Database is connected!";
        
        mongoTemplate.save(doc, "system_logs");
        
        System.out.println("====== SUCCESS! TEST DOCUMENT SAVED TO DATABASE ======");
    }

    static class TestDoc {
        @Id
        public String id;
        public String message;
    }
}
