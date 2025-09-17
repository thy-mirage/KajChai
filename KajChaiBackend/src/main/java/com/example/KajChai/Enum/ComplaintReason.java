package com.example.KajChai.Enum;

public enum ComplaintReason {
    SPAM_OR_SCAM("Spam or Scam"),
    INAPPROPRIATE_CONTENT("Inappropriate Content"),
    HARASSMENT("Harassment"),
    FALSE_INFORMATION("False Information"),
    COPYRIGHT_VIOLATION("Copyright Violation"),
    OFFENSIVE_LANGUAGE("Offensive Language"),
    OTHER("Other");

    private final String displayName;

    ComplaintReason(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}