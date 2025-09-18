package com.example.KajChai.Service;

import com.example.KajChai.DatabaseEntity.Customer;
import com.example.KajChai.DatabaseEntity.UserComplaint;
import com.example.KajChai.DatabaseEntity.Worker;
import com.example.KajChai.DTO.UserComplaintResponse;
import com.example.KajChai.DTO.CreateUserComplaintRequest;
import com.example.KajChai.Enum.ComplaintStatus;
import com.example.KajChai.Repository.CustomerRepository;
import com.example.KajChai.Repository.UserComplaintRepository;
import com.example.KajChai.Repository.WorkerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class UserComplaintService {
    
    private final UserComplaintRepository userComplaintRepository;
    private final WorkerRepository workerRepository;
    private final CustomerRepository customerRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    
    public UserComplaint createComplaint(CreateUserComplaintRequest request) {
        try {
            // Get worker and customer entities
            Worker reportedWorker = workerRepository.findById(request.getReportedWorkerId())
                    .orElseThrow(() -> new RuntimeException("Worker not found"));
            
            Customer reportingCustomer = customerRepository.findById(request.getReportedByCustomerId())
                    .orElseThrow(() -> new RuntimeException("Customer not found"));
            
            // Create complaint
            UserComplaint complaint = UserComplaint.builder()
                    .reportedWorker(reportedWorker)
                    .reportedByCustomer(reportingCustomer)
                    .reason(request.getReason())
                    .description(request.getDescription())
                    .evidenceUrls(request.getEvidenceUrls())
                    .status(ComplaintStatus.PENDING)
                    .build();
            
            UserComplaint savedComplaint = userComplaintRepository.save(complaint);
            
            // Send notification to admin (if needed)
            log.info("New user complaint created: {} against worker: {}", 
                    savedComplaint.getComplaintId(), reportedWorker.getWorkerId());
            
            return savedComplaint;
            
        } catch (Exception e) {
            log.error("Error creating user complaint: {}", e.getMessage());
            throw new RuntimeException("Failed to create complaint: " + e.getMessage());
        }
    }
    
    public List<UserComplaintResponse> getAllComplaints() {
        List<UserComplaint> complaints = userComplaintRepository.findAllByOrderByCreatedAtDesc();
        return complaints.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    public List<UserComplaintResponse> getComplaintsByStatus(ComplaintStatus status) {
        List<UserComplaint> complaints = userComplaintRepository.findByStatusOrderByCreatedAtDesc(status);
        return complaints.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    public UserComplaintResponse getComplaintById(Integer complaintId) {
        UserComplaint complaint = userComplaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        return convertToResponse(complaint);
    }
    
    public UserComplaint updateComplaintStatus(Integer complaintId, ComplaintStatus status, String adminResponse) {
        UserComplaint complaint = userComplaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        
        complaint.setStatus(status);
        complaint.setAdminResponse(adminResponse);
        
        if (status == ComplaintStatus.RESOLVED || status == ComplaintStatus.REJECTED) {
            complaint.setResolvedAt(LocalDateTime.now());
        }
        
        UserComplaint updatedComplaint = userComplaintRepository.save(complaint);
        
        // Send notification to customer about status update
        String message = String.format("Your complaint against %s %s has been updated. Status: %s", 
                complaint.getReportedWorker().getFirstName(),
                complaint.getReportedWorker().getLastName(),
                status.getDisplayName());
        
        notificationService.createCustomerNotification(complaint.getReportedByCustomer(), message);
        
        return updatedComplaint;
    }
    
    public UserComplaint banWorker(Integer complaintId, String reason) {
        UserComplaint complaint = userComplaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        
        // Update worker status
        Worker worker = complaint.getReportedWorker();
        worker.setIsBanned(true);
        worker.setBannedAt(LocalDateTime.now());
        worker.setRestrictionReason(reason);
        workerRepository.save(worker);
        
        // Update complaint
        complaint.setStatus(ComplaintStatus.RESOLVED);
        complaint.setAdminAction("BAN");
        complaint.setAdminResponse("Worker has been banned. Reason: " + reason);
        complaint.setResolvedAt(LocalDateTime.now());
        
        UserComplaint updatedComplaint = userComplaintRepository.save(complaint);
        
        // Send email notification to worker
        try {
            String subject = "Account Banned - KajChai Platform";
            String emailBody = String.format(
                "Dear %s,\n\n" +
                "We regret to inform you that your account on the KajChai platform has been permanently banned due to complaints received from customers.\n\n" +
                "Reason: %s\n\n" +
                "This decision was made after careful review of the complaint against you. Your account and all associated data will be removed from our platform.\n\n" +
                "You will not be able to create a new account using this email address.\n\n" +
                "If you believe this decision was made in error, please contact our support team at kajchai.team@gmail.com with any relevant information.\n\n" +
                "Thank you for your understanding.\n\n" +
                "Best regards,\n" +
                "The KajChai Team",
                worker.getName(),
                reason
            );
            
            emailService.sendEmail(worker.getGmail(), subject, emailBody);
            log.info("Ban notification email sent to worker: {}", worker.getGmail());
        } catch (Exception e) {
            log.error("Failed to send ban notification email to worker: {}", worker.getGmail(), e);
            // Don't fail the ban operation if email fails
        }
        
        // Send notifications
        String customerMessage = String.format("Your complaint against %s %s has been resolved. The worker has been banned from the platform.", 
                worker.getFirstName(), worker.getLastName());
        notificationService.createCustomerNotification(complaint.getReportedByCustomer(), customerMessage);
        
        String workerMessage = "Your account has been banned due to user complaints. Reason: " + reason + 
                ". If you believe this is an error, please contact support.";
        notificationService.createWorkerNotification(worker, workerMessage);
        
        log.info("Worker {} has been banned due to complaint {}", worker.getWorkerId(), complaintId);
        
        return updatedComplaint;
    }
    
    public UserComplaint restrictWorker(Integer complaintId, String reason) {
        UserComplaint complaint = userComplaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        
        // Update worker status
        Worker worker = complaint.getReportedWorker();
        worker.setIsRestricted(true);
        worker.setRestrictedAt(LocalDateTime.now());
        worker.setRestrictionReason(reason);
        workerRepository.save(worker);
        
        // Update complaint
        complaint.setStatus(ComplaintStatus.RESOLVED);
        complaint.setAdminAction("RESTRICT");
        complaint.setAdminResponse("Worker has been restricted. Reason: " + reason);
        complaint.setResolvedAt(LocalDateTime.now());
        
        UserComplaint updatedComplaint = userComplaintRepository.save(complaint);
        
        // Calculate restriction expiry
        LocalDateTime restrictionExpiry = worker.getRestrictedAt().plusDays(3);
        String expiryDate = restrictionExpiry.toLocalDate().toString();
        
        // Send email notification to worker
        try {
            String subject = "Account Restriction - KajChai Platform";
            String emailBody = String.format(
                "Dear %s,\n\n" +
                "We are writing to inform you that your account on the KajChai platform has been temporarily restricted due to complaints received from customers.\n\n" +
                "Reason: %s\n\n" +
                "During this restriction period, you will not be able to:\n" +
                "• Apply to new hire posts\n" +
                "• Post in forums\n" +
                "• Comment on forum posts\n\n" +
                "This restriction will be automatically lifted on: %s\n\n" +
                "You can continue to use other features of the platform during this time. We encourage you to review our community guidelines and terms of service to ensure compliance in the future.\n\n" +
                "If you have any questions or believe this restriction was applied in error, please contact our support team at kajchai.team@gmail.com.\n\n" +
                "Thank you for your understanding.\n\n" +
                "Best regards,\n" +
                "The KajChai Team",
                worker.getName(),
                reason,
                expiryDate
            );
            
            emailService.sendEmail(worker.getGmail(), subject, emailBody);
            log.info("Restriction notification email sent to worker: {}", worker.getGmail());
        } catch (Exception e) {
            log.error("Failed to send restriction notification email to worker: {}", worker.getGmail(), e);
            // Don't fail the restriction operation if email fails
        }
        
        // Send notifications
        String customerMessage = String.format("Your complaint against %s %s has been resolved. The worker has been restricted from certain platform activities.", 
                worker.getFirstName(), worker.getLastName());
        notificationService.createCustomerNotification(complaint.getReportedByCustomer(), customerMessage);
        
        String workerMessage = "Your account has been restricted due to user complaints. Reason: " + reason + 
                ". You may continue using the platform with limited functionality.";
        notificationService.createWorkerNotification(worker, workerMessage);
        
        log.info("Worker {} has been restricted due to complaint {}", worker.getWorkerId(), complaintId);
        
        return updatedComplaint;
    }
    
    public UserComplaint requestClarification(Integer complaintId, String clarificationRequest) {
        UserComplaint complaint = userComplaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        
        // Update complaint
        complaint.setStatus(ComplaintStatus.AWAITING_CLARIFICATION);
        complaint.setAdminAction("CLARIFICATION_REQUESTED");
        complaint.setAdminResponse("Clarification requested: " + clarificationRequest);
        complaint.setClarificationDeadline(LocalDateTime.now().plusHours(24));
        complaint.setUpdatedAt(LocalDateTime.now());
        
        UserComplaint updatedComplaint = userComplaintRepository.save(complaint);
        
        Worker worker = complaint.getReportedWorker();
        
        // Calculate deadline
        LocalDateTime deadline = complaint.getClarificationDeadline();
        String deadlineFormatted = deadline.toLocalDate().toString() + " at " + 
                deadline.toLocalTime().withSecond(0).toString();
        
        // Send email notification to worker
        try {
            String subject = "Clarification Required - KajChai Platform";
            String emailBody = String.format(
                "Dear %s,\n\n" +
                "We have received a complaint regarding your services on the KajChai platform. To ensure fair treatment for all parties, we are requesting clarification from you.\n\n" +
                "Complaint Details:\n" +
                "Filed by: %s %s\n" +
                "Service Type: %s\n" +
                "Description: %s\n\n" +
                "Admin Request for Clarification:\n" +
                "%s\n\n" +
                "Please provide your response by: %s\n\n" +
                "To respond to this complaint, please:\n" +
                "1. Log into your KajChai account\n" +
                "2. Go to your notifications\n" +
                "3. Click on this clarification request\n" +
                "4. Provide a detailed response explaining your side of the situation\n\n" +
                "Important: If you do not respond within the specified deadline, this complaint may be resolved automatically against you. We strongly encourage you to provide your clarification as soon as possible.\n\n" +
                "If you need assistance or have questions about this process, please contact our support team at kajchai.team@gmail.com.\n\n" +
                "Thank you for your cooperation.\n\n" +
                "Best regards,\n" +
                "The KajChai Team",
                worker.getName(),
                complaint.getReportedByCustomer().getFirstName(),
                complaint.getReportedByCustomer().getLastName(),
                complaint.getServiceType(),
                complaint.getDescription(),
                clarificationRequest,
                deadlineFormatted
            );
            
            emailService.sendEmail(worker.getGmail(), subject, emailBody);
            log.info("Clarification request email sent to worker: {}", worker.getGmail());
        } catch (Exception e) {
            log.error("Failed to send clarification request email to worker: {}", worker.getGmail(), e);
            // Don't fail the clarification operation if email fails
        }
        
        // Send notifications
        String customerMessage = String.format("We have requested clarification from %s %s regarding your complaint. You will be notified once the matter is resolved.", 
                worker.getFirstName(), worker.getLastName());
        notificationService.createCustomerNotification(complaint.getReportedByCustomer(), customerMessage);
        
        String workerMessage = "Clarification requested for a complaint against you. Message: " + clarificationRequest + 
                ". Please respond within 24 hours.";
        notificationService.createWorkerNotification(worker, workerMessage);
        
        log.info("Clarification requested from worker {} for complaint {}", worker.getWorkerId(), complaintId);
        
        return updatedComplaint;
    }
    
    public void processExpiredClarifications() {
        List<UserComplaint> expiredComplaints = userComplaintRepository
                .findExpiredClarificationRequests(ComplaintStatus.AWAITING_CLARIFICATION, LocalDateTime.now());
        
        for (UserComplaint complaint : expiredComplaints) {
            complaint.setStatus(ComplaintStatus.DISMISSED);
            complaint.setAdminResponse(complaint.getAdminResponse() + " [Auto-dismissed: No clarification provided within deadline]");
            complaint.setResolvedAt(LocalDateTime.now());
            userComplaintRepository.save(complaint);
            
            // Notify customer
            String message = "Your complaint has been dismissed due to no response within the 24-hour clarification deadline.";
            notificationService.createCustomerNotification(complaint.getReportedByCustomer(), message);
        }
        
        log.info("Processed {} expired clarification requests", expiredComplaints.size());
    }
    
    private UserComplaintResponse convertToResponse(UserComplaint complaint) {
        return UserComplaintResponse.builder()
                .complaintId(complaint.getComplaintId())
                .reportedWorkerName(complaint.getReportedWorker().getFirstName() + " " + complaint.getReportedWorker().getLastName())
                .reportedWorkerId(complaint.getReportedWorker().getWorkerId())
                .reportedByCustomerName(complaint.getReportedByCustomer().getFirstName() + " " + complaint.getReportedByCustomer().getLastName())
                .reportedByCustomerId(complaint.getReportedByCustomer().getCustomerId())
                .reason(complaint.getReason())
                .description(complaint.getDescription())
                .evidenceUrls(complaint.getEvidenceUrls())
                .status(complaint.getStatus())
                .adminResponse(complaint.getAdminResponse())
                .adminAction(complaint.getAdminAction())
                .createdAt(complaint.getCreatedAt())
                .resolvedAt(complaint.getResolvedAt())
                .clarificationDeadline(complaint.getClarificationDeadline())
                .clarificationResponse(complaint.getClarificationResponse())
                .build();
    }
}