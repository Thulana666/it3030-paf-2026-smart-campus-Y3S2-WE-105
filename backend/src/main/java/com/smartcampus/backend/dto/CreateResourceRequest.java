package com.smartcampus.backend.dto;

import java.time.LocalTime;

public class CreateResourceRequest {
    private String resourceCode;
    private String name;
    private String type; // Facility / Equipment
    private String category;
    private Integer capacity;
    private String building;
    private String floor;
    private String location;
    private LocalTime availabilityStartTime;
    private LocalTime availabilityEndTime;
    private String description;
    private String status;

    // Constructors
    public CreateResourceRequest() {}

    public CreateResourceRequest(String resourceCode, String name, String type, String category,
                                Integer capacity, String building, String floor, String location,
                                LocalTime availabilityStartTime, LocalTime availabilityEndTime,
                                String description, String status) {
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
