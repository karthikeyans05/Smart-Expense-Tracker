# 💰 ExpenseFlow — Full Stack Expense Tracker

> Built with: **HTML · CSS · Java (Spring Boot) · JavaScript · MySQL**

---

## 📁 Project Structure

```
expense-tracker/
├── backend/                        ← Spring Boot (Java) backend
│   ├── pom.xml                     ← Maven dependencies
│   └── src/main/
│       ├── java/com/expensetracker/
│       │   ├── ExpenseTrackerApplication.java
│       │   ├── controller/
│       │   │   ├── ExpenseController.java
│       │   │   └── BudgetController.java
│       │   ├── model/
│       │   │   ├── Expense.java
│       │   │   └── Budget.java
│       │   ├── repository/
│       │   │   ├── ExpenseRepository.java
│       │   │   └── BudgetRepository.java
│       │   ├── service/
│       │   │   ├── ExpenseService.java
│       │   │   └── BudgetService.java
│       │   └── config/
│       │       └── CorsConfig.java
│       └── resources/
│           └── application.properties
├── frontend/                       ← Static HTML/CSS/JS frontend
│   ├── index.html
│   ├── css/styles.css
│   └── js/app.js
└── database/
    └── schema.sql                  ← MySQL schema + seed data
```

---

## STEP 1 — Install & Start MySQL

### Windows
```bash
# After installing MySQL, start it:
net start MySQL80

# OR use MySQL Workbench / XAMPP
```

### macOS
```bash
brew install mysql
brew services start mysql
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install mysql-server -y
sudo systemctl start mysql
sudo systemctl enable mysql
```

---

## STEP 2 — Create the Database

```bash
# Login to MySQL (default root password is blank or what you set during install)
mysql -u root -p

# Run these SQL commands:
CREATE DATABASE expense_tracker_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

Then run the schema file:
```bash
mysql -u root -p expense_tracker_db < database/schema.sql
```

---

## STEP 3 — Configure the Backend

Open `backend/src/main/resources/application.properties` and update:

---

## STEP 4 — Build & Run the Backend

```bash
# Navigate to the backend directory
cd backend

# Option A — Run with Maven (recommended for development)
mvn spring-boot:run

# Option B — Build a JAR first, then run it
mvn clean package -DskipTests
java -jar target/expense-tracker-1.0.0.jar
```

✅ You should see:
```
Started ExpenseTrackerApplication in X.XXX seconds
Tomcat started on port(s): 8080
```

Test the API in your browser:
```
http://localhost:8080/api/expenses/health
```
Expected response: `{"status":"UP","service":"Expense Tracker API",...}`

---

## STEP 5 — Run the Frontend

### Option A — Open directly (simplest)
Just double-click `frontend/index.html` in your file explorer.
Or drag it into Chrome/Firefox.

### Option B — Use VS Code Live Server (recommended)
1. Install VS Code extension: **Live Server** by Ritwick Dey
2. Right-click `frontend/index.html` → "Open with Live Server"
3. Opens at: `http://127.0.0.1:5500`

### Option C — Python HTTP Server
```bash
cd frontend
python3 -m http.server 3000
# Open: http://localhost:3000

```

---

## ✨ Features

- ✅ Add / Edit / Delete expenses
- ✅ Category breakdown with donut chart
- ✅ Monthly trend bar chart
- ✅ Budget setting & progress tracking with alerts
- ✅ Full-text search across expenses
- ✅ Month navigation
- ✅ Analytics page (all-time category + payment method charts)
- ✅ Responsive mobile UI
- ✅ REST API with full CRUD operations
- ✅ MySQL persistence with JPA/Hibernate
- ✅ Input validation on both frontend and backend


