package com.example.KajChai.Enum;

public enum ComplaintStatus {
    PENDING("Pending Review"),
    UNDER_REVIEW("Under Review"),
    RESOLVED("Resolved"),
    REJECTED("Rejected"),
    DISMISSED("Dismissed");

    private final String displayName;

    ComplaintStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}