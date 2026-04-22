package com.smartcampus.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Document(collection = "resources")
public class Resource {
    @Id
    private String id;

    @Indexed(unique = true)
    private String resourceCode;

    private String name;
    private String type; // Facility / Equipment
    private String category; // Lab, Hall, Projector, etc.
    private Integer capacity;
    private String building;
    private String floor;
    private String location;

    private LocalTime availabilityStartTime;
    private LocalTime availabilityEndTime;

    private String description;
    private ResourceStatus status; // ACTIVE, UNDER_MAINTENANCE, OUT_OF_SERVICE, INACTIVE
    private String imageUrl;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Resource() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.status = ResourceStatus.ACTIVE;
    }

    // Constructors
    public Resource(String resourceCode, String name, String type, String category, 
                   Integer capacity, String building, String floor, String location,
                   LocalTime availabilityStartTime, LocalTime availabilityEndTime,
                   String description, ResourceStatus status) {
        this();
        this.resourceCode = resourceCode;
        this.name = name;
        this.type = type;
        this.category = category;
        this.capacity = capacity;
        this.building = building;
        this.floor = floor;
        this.location = location;
        this.availabilityStartTime = availabilityStartTime;
        this.availabilityEndTime = availabilityEndTime;
        this.description = description;
        this.status = status;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getResourceCode() {
        return resourceCode;
    }

    public void setResourceCode(String resourceCode) {
        this.resourceCode = resourceCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public String getBuilding() {
        return building;
    }

    public void setBuilding(String building) {
        this.building = building;
    }

    public String getFloor() {
        return floor;
    }

    public void setFloor(String floor) {
        this.floor = floor;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public LocalTime getAvailabilityStartTime() {
        return availabilityStartTime;
    }

    public void setAvailabilityStartTime(LocalTime availabilityStartTime) {
        this.availabilityStartTime = availabilityStartTime;
    }

    public LocalTime getAvailabilityEndTime() {
        return availabilityEndTime;
    }

    public void setAvailabilityEndTime(LocalTime availabilityEndTime) {
        this.availabilityEndTime = availabilityEndTime;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public ResourceStatus getStatus() {
        return status;
    }

    public void setStatus(ResourceStatus status) {
        this.status = status;
        this.updatedAt = LocalDateTime.now();
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
