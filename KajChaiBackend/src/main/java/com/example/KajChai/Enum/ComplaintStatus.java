package com.example.KajChai.Enum;

public enum ComplaintStatus {
    PENDING("Pending"),
    UNDER_INVESTIGATION("Under Investigation"),
    RESOLVED("Resolved"),
    REJECTED("Rejected");

    private final String displayName;

    ComplaintStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}