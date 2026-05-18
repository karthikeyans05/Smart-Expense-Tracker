💸 ExpenseFlow — Full Stack Expense Tracker

A modern Full Stack Expense Tracker built using Spring Boot, MySQL, and Vanilla JavaScript to help users manage expenses, budgets, and financial analytics efficiently.

🚀 Tech Stack
Frontend	Backend	Database	Tools
HTML5	Java 17	MySQL 8	Maven
CSS3	Spring Boot	Hibernate / JPA	Docker
JavaScript	REST API		Git & GitHub
📌 Features
✅ Add, Edit & Delete Expenses
✅ Monthly Budget Management
✅ Expense Analytics Dashboard
✅ Category-wise Expense Breakdown
✅ Donut & Bar Charts Visualization
✅ Full-text Expense Search
✅ Responsive Mobile-Friendly UI
✅ RESTful API Architecture
✅ MySQL Database Integration
✅ JPA/Hibernate Persistence
✅ Input Validation (Frontend + Backend)
✅ Docker Support
✅ Cloud Deployment Ready
📂 Project Structure
expense-tracker/
│
├── backend/                         # Spring Boot Backend
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/expensetracker/
│       │   ├── ExpenseTrackerApplication.java
│       │   │
│       │   ├── controller/
│       │   │   ├── ExpenseController.java
│       │   │   └── BudgetController.java
│       │   │
│       │   ├── model/
│       │   │   ├── Expense.java
│       │   │   └── Budget.java
│       │   │
│       │   ├── repository/
│       │   │   ├── ExpenseRepository.java
│       │   │   └── BudgetRepository.java
│       │   │
│       │   ├── service/
│       │   │   ├── ExpenseService.java
│       │   │   └── BudgetService.java
│       │   │
│       │   └── config/
│       │       └── CorsConfig.java
│       │
│       └── resources/
│           └── application.properties
│
├── frontend/                        # HTML/CSS/JS Frontend
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       └── app.js
│
└── database/
    └── schema.sql