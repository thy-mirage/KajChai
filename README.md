# KajChai - Service Provider Platform

KajChai is a comprehensive platform that connects customers with skilled workers, enabling seamless service discovery and hiring processes. The platform facilitates efficient communication between service seekers and providers while maintaining quality standards through AI-powered content moderation.

## 🌐 Live Application
**Access the platform:** [https://kaj-chai.vercel.app/](https://kaj-chai.vercel.app/)

## 🎯 Key Features

### For Customers
- **Create Hire Posts**: Post service requirements and receive applications from qualified workers
- **Worker Selection**: Review applicant profiles, ratings, and contact workers directly
- **Location-based Search**: Find nearby workers for your specific needs
- **Review System**: Rate and review workers after service completion
- **Real-time Notifications**: Get notified when workers apply to your posts

### For Workers  
- **Job Discovery**: Browse and apply to hire posts in your area
- **Location-based Sorting**: Find nearby job opportunities efficiently
- **Profile Management**: Showcase your skills and build your reputation
- **Application Tracking**: Receive notifications when selected for jobs

### Community Forum
- **Three Main Sections**:
  - Customer Q&A
  - Customer Experience Sharing
  - Worker Tips and Projects
- **AI Content Moderation**: LLM-powered filtering ensures relevant, high-quality posts
- **Reporting System**: Users can report inappropriate content for admin review

### AI-Powered Chatbot
An intelligent assistant that helps users with:
- Technical queries and problem-solving
- Worker recommendations and summaries
- Nearby job listings
- Platform navigation guidance
- Service cost estimation
- General platform assistance

### Admin Panel
- **Complaint Management**: Review and resolve user reports
- **Content Moderation**: Manage forum posts and user behavior
- **User Management**: Handle user restrictions, bans, and clarifications

## 🛠 Technology Stack

### Frontend
- **Framework**: React.js with Vite
- **Deployment**: Vercel
- **Styling**: CSS3 with responsive design

### Backend  
- **Framework**: Spring Boot (Java)
- **Deployment**: Render
- **Database**: Supabase (PostgreSQL)

### AI Integration
- **Content Moderation**: LLM-based post filtering
- **Chatbot**: AI-powered customer assistance

## 🚀 Getting Started

### Prerequisites
- Node.js (for frontend)
- Java 11+ (for backend)
- Maven (for dependency management)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/thy-mirage/KajChai.git
   cd KajChai
   ```

2. **Frontend Setup**
   ```bash
   cd KajChaiFrontend
   npm install
   npm run dev
   ```

3. **Backend Setup**
   ```bash
   cd KajChaiBackend
   ./mvnw spring-boot:run
   ```

## 📱 Platform Workflow

1. **Registration**: Users sign up as either customers or workers
2. **Service Posting**: Customers create hire posts with job details
3. **Application Process**: Workers apply to relevant posts
4. **Selection & Communication**: Customers review applications and select workers
5. **Service Completion**: Work is completed and reviewed
6. **Community Engagement**: Users participate in forums and seek AI assistance

## 🔒 Quality Assurance

- **AI Content Filtering**: Automated moderation ensures forum quality
- **Review System**: Transparent rating mechanism for accountability
- **Admin Oversight**: Human moderation for complex issues
- **Notification System**: Real-time updates for all platform activities

## 📞 Support

For technical support or general inquiries, use the integrated AI chatbot or contact the admin panel for specific issues.

---

**Built with ❤️ for connecting communities and empowering local services**