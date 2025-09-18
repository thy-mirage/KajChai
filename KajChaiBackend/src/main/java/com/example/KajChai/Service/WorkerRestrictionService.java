package com.example.KajChai.Service;

import com.example.KajChai.DatabaseEntity.Worker;
import com.example.KajChai.Repository.WorkerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkerRestrictionService {
    
    private final WorkerRepository workerRepository;
    
    private static final int RESTRICTION_DURATION_DAYS = 3;
    
    /**
     * Check if a worker is currently restricted from activities
     * @param workerId the worker ID to check
     * @return true if worker is restricted, false otherwise
     */
    public boolean isWorkerRestricted(Integer workerId) {
        Worker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found"));
        
        return isWorkerRestricted(worker);
    }
    
    /**
     * Check if a worker is currently restricted from activities
     * @param worker the worker entity to check
     * @return true if worker is restricted, false otherwise
     */
    public boolean isWorkerRestricted(Worker worker) {
        // Check if worker is banned
        if (Boolean.TRUE.equals(worker.getIsBanned())) {
            return true;
        }
        
        // Check if worker is currently under restriction
        if (Boolean.TRUE.equals(worker.getIsRestricted())) {
            // Check if restriction has expired (3 days)
            if (worker.getRestrictedAt() != null) {
                LocalDateTime restrictionExpiry = worker.getRestrictedAt().plusDays(RESTRICTION_DURATION_DAYS);
                LocalDateTime now = LocalDateTime.now();
                
                if (now.isAfter(restrictionExpiry)) {
                    // Restriction has expired, automatically lift it
                    liftRestriction(worker);
                    return false;
                } else {
                    // Still under restriction
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Check if a worker can apply to hire posts
     * @param workerId the worker ID to check
     * @throws RuntimeException if worker is restricted
     */
    public void checkWorkerCanApplyToHirePosts(Integer workerId) {
        if (isWorkerRestricted(workerId)) {
            Worker worker = workerRepository.findById(workerId).orElse(null);
            
            if (worker != null && Boolean.TRUE.equals(worker.getIsBanned())) {
                throw new RuntimeException("Your account has been banned. You cannot apply to hire posts.");
            }
            
            if (worker != null && Boolean.TRUE.equals(worker.getIsRestricted())) {
                LocalDateTime restrictionExpiry = worker.getRestrictedAt().plusDays(RESTRICTION_DURATION_DAYS);
                String expiryDate = restrictionExpiry.toLocalDate().toString();
                throw new RuntimeException("Your account is restricted from applying to hire posts until " + expiryDate + 
                    ". Reason: " + (worker.getRestrictionReason() != null ? worker.getRestrictionReason() : "Policy violation"));
            }
        }
    }
    
    /**
     * Check if a worker can post in forums
     * @param workerId the worker ID to check
     * @throws RuntimeException if worker is restricted
     */
    public void checkWorkerCanPostInForums(Integer workerId) {
        if (isWorkerRestricted(workerId)) {
            Worker worker = workerRepository.findById(workerId).orElse(null);
            
            if (worker != null && Boolean.TRUE.equals(worker.getIsBanned())) {
                throw new RuntimeException("Your account has been banned. You cannot post in forums.");
            }
            
            if (worker != null && Boolean.TRUE.equals(worker.getIsRestricted())) {
                LocalDateTime restrictionExpiry = worker.getRestrictedAt().plusDays(RESTRICTION_DURATION_DAYS);
                String expiryDate = restrictionExpiry.toLocalDate().toString();
                throw new RuntimeException("Your account is restricted from posting in forums until " + expiryDate + 
                    ". Reason: " + (worker.getRestrictionReason() != null ? worker.getRestrictionReason() : "Policy violation"));
            }
        }
    }
    
    /**
     * Check if a worker can comment in forums
     * @param workerId the worker ID to check
     * @throws RuntimeException if worker is restricted
     */
    public void checkWorkerCanCommentInForums(Integer workerId) {
        if (isWorkerRestricted(workerId)) {
            Worker worker = workerRepository.findById(workerId).orElse(null);
            
            if (worker != null && Boolean.TRUE.equals(worker.getIsBanned())) {
                throw new RuntimeException("Your account has been banned. You cannot comment in forums.");
            }
            
            if (worker != null && Boolean.TRUE.equals(worker.getIsRestricted())) {
                LocalDateTime restrictionExpiry = worker.getRestrictedAt().plusDays(RESTRICTION_DURATION_DAYS);
                String expiryDate = restrictionExpiry.toLocalDate().toString();
                throw new RuntimeException("Your account is restricted from commenting in forums until " + expiryDate + 
                    ". Reason: " + (worker.getRestrictionReason() != null ? worker.getRestrictionReason() : "Policy violation"));
            }
        }
    }
    
    /**
     * Get restriction details for a worker
     * @param workerId the worker ID to check
     * @return restriction details or null if not restricted
     */
    public WorkerRestrictionInfo getWorkerRestrictionInfo(Integer workerId) {
        Worker worker = workerRepository.findById(workerId).orElse(null);
        if (worker == null) return null;
        
        if (Boolean.TRUE.equals(worker.getIsBanned())) {
            return WorkerRestrictionInfo.builder()
                    .isRestricted(true)
                    .isBanned(true)
                    .reason(worker.getRestrictionReason())
                    .bannedAt(worker.getBannedAt())
                    .build();
        }
        
        if (Boolean.TRUE.equals(worker.getIsRestricted())) {
            LocalDateTime restrictionExpiry = worker.getRestrictedAt().plusDays(RESTRICTION_DURATION_DAYS);
            LocalDateTime now = LocalDateTime.now();
            
            if (now.isAfter(restrictionExpiry)) {
                // Auto-lift expired restriction
                liftRestriction(worker);
                return null;
            }
            
            return WorkerRestrictionInfo.builder()
                    .isRestricted(true)
                    .isBanned(false)
                    .reason(worker.getRestrictionReason())
                    .restrictedAt(worker.getRestrictedAt())
                    .restrictionExpiry(restrictionExpiry)
                    .build();
        }
        
        return null;
    }
    
    /**
     * Automatically lift restriction when it expires
     */
    private void liftRestriction(Worker worker) {
        worker.setIsRestricted(false);
        worker.setRestrictedAt(null);
        worker.setRestrictionReason(null);
        workerRepository.save(worker);
        
        log.info("Automatically lifted restriction for worker {} as restriction period expired", worker.getWorkerId());
    }
    
    /**
     * Data class to hold restriction information
     */
    public static class WorkerRestrictionInfo {
        private boolean isRestricted;
        private boolean isBanned;
        private String reason;
        private LocalDateTime restrictedAt;
        private LocalDateTime bannedAt;
        private LocalDateTime restrictionExpiry;
        
        public static WorkerRestrictionInfoBuilder builder() {
            return new WorkerRestrictionInfoBuilder();
        }
        
        // Getters
        public boolean isRestricted() { return isRestricted; }
        public boolean isBanned() { return isBanned; }
        public String getReason() { return reason; }
        public LocalDateTime getRestrictedAt() { return restrictedAt; }
        public LocalDateTime getBannedAt() { return bannedAt; }
        public LocalDateTime getRestrictionExpiry() { return restrictionExpiry; }
        
        // Builder
        public static class WorkerRestrictionInfoBuilder {
            private boolean isRestricted;
            private boolean isBanned;
            private String reason;
            private LocalDateTime restrictedAt;
            private LocalDateTime bannedAt;
            private LocalDateTime restrictionExpiry;
            
            public WorkerRestrictionInfoBuilder isRestricted(boolean isRestricted) {
                this.isRestricted = isRestricted;
                return this;
            }
            
            public WorkerRestrictionInfoBuilder isBanned(boolean isBanned) {
                this.isBanned = isBanned;
                return this;
            }
            
            public WorkerRestrictionInfoBuilder reason(String reason) {
                this.reason = reason;
                return this;
            }
            
            public WorkerRestrictionInfoBuilder restrictedAt(LocalDateTime restrictedAt) {
                this.restrictedAt = restrictedAt;
                return this;
            }
            
            public WorkerRestrictionInfoBuilder bannedAt(LocalDateTime bannedAt) {
                this.bannedAt = bannedAt;
                return this;
            }
            
            public WorkerRestrictionInfoBuilder restrictionExpiry(LocalDateTime restrictionExpiry) {
                this.restrictionExpiry = restrictionExpiry;
                return this;
            }
            
            public WorkerRestrictionInfo build() {
                WorkerRestrictionInfo info = new WorkerRestrictionInfo();
                info.isRestricted = this.isRestricted;
                info.isBanned = this.isBanned;
                info.reason = this.reason;
                info.restrictedAt = this.restrictedAt;
                info.bannedAt = this.bannedAt;
                info.restrictionExpiry = this.restrictionExpiry;
                return info;
            }
        }
    }
}