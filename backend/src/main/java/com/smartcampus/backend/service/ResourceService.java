package com.smartcampus.backend.service;

import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ResourceService {

    private final MongoTemplate mongoTemplate;

    public List<Map<String, Object>> getAllResources() {
        return mongoTemplate.findAll(Document.class, "resources")
                .stream()
                .map(this::toSerializableMap)
                .toList();
    }

    private Map<String, Object> toSerializableMap(Document document) {
        Map<String, Object> resource = new LinkedHashMap<>(document);
        Object id = resource.get("_id");
        if (id != null) {
            resource.put("_id", id.toString());
        }
        resource.remove("_class");
        return resource;
    }
}
