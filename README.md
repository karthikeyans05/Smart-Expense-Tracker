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

## 🚀 DEPLOYMENT GUIDE

### Prerequisites

| Tool             | Version  | Download                              |
|------------------|----------|---------------------------------------|
| Java JDK         | 17+      | https://adoptium.net                  |
| Apache Maven     | 3.8+     | https://maven.apache.org/download.cgi |
| MySQL Server     | 8.0+     | https://dev.mysql.com/downloads/      |
| VS Code / IntelliJ | Any   | For editing                           |

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

This creates the tables AND inserts sample data automatically.

---

## STEP 3 — Configure the Backend

Open `backend/src/main/resources/application.properties` and update:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/expense_tracker_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD_HERE
```

> ⚠️ Replace `YOUR_MYSQL_PASSWORD_HERE` with your actual MySQL root password.
> If MySQL has no password, leave the password field blank.

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

### Option D — Node.js serve
```bash
npm install -g serve
cd frontend
serve -p 3000
# Open: http://localhost:3000
```

---

## 🌐 REST API Endpoints

| Method | Endpoint                             | Description               |
|--------|--------------------------------------|---------------------------|
| GET    | `/api/expenses`                      | Get all expenses          |
| GET    | `/api/expenses/{id}`                 | Get expense by ID         |
| POST   | `/api/expenses`                      | Create new expense        |
| PUT    | `/api/expenses/{id}`                 | Update expense            |
| DELETE | `/api/expenses/{id}`                 | Delete expense            |
| GET    | `/api/expenses/month/{year}/{month}` | Get by month/year         |
| GET    | `/api/expenses/stats/{year}/{month}` | Dashboard statistics      |
| GET    | `/api/expenses/search?q=query`       | Search expenses           |
| GET    | `/api/budgets/{year}/{month}`        | Get budgets for month     |
| POST   | `/api/budgets`                       | Create/update budget      |
| DELETE | `/api/budgets/{id}`                  | Delete budget             |
| GET    | `/api/budgets/status/{year}/{month}` | Budget status with %      |

---

## 🐳 DEPLOY WITH DOCKER (Optional)

### docker-compose.yml
```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: expense_tracker_db
    ports:
      - "3306:3306"
    volumes:
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
      - mysql-data:/var/lib/mysql

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/expense_tracker_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
      SPRING_DATASOURCE_USERNAME: root
      SPRING_DATASOURCE_PASSWORD: rootpass
    depends_on:
      - mysql

  frontend:
    image: nginx:alpine
    ports:
      - "3000:80"
    volumes:
      - ./frontend:/usr/share/nginx/html:ro
    depends_on:
      - backend

volumes:
  mysql-data:
```

### Dockerfile for backend
```dockerfile
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/expense-tracker-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

```bash
# Run everything with Docker:
docker-compose up --build
```

---

## ☁️ CLOUD DEPLOYMENT

### Backend → Railway / Render
1. Push `backend/` folder to GitHub
2. Connect repo to Railway (railway.app) or Render (render.com)
3. Set env variables: `SPRING_DATASOURCE_URL`, `_USERNAME`, `_PASSWORD`
4. Deploy — they handle the rest

### Frontend → Netlify / GitHub Pages
1. Drag `frontend/` folder to netlify.com/drop
2. Update `API_BASE` in `js/app.js` to your deployed backend URL

### Database → PlanetScale / Clever Cloud
1. Create a free MySQL database at planetscale.com
2. Get the connection string and update `application.properties`

---

## 🛠️ TROUBLESHOOTING

| Problem | Fix |
|---------|-----|
| `Connection refused` on API | Make sure Spring Boot is running on port 8080 |
| `Access denied for user 'root'` | Check MySQL password in `application.properties` |
| `Unknown database 'expense_tracker_db'` | Run Step 2 to create the database |
| CORS error in browser | Ensure `CorsConfig.java` allows all origins (already done) |
| Port 8080 in use | Change `server.port` in `application.properties` to 9090 |
| Java version error | Ensure Java 17+ is installed: `java -version` |

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

---

## 📜 License
MIT — free to use and modify.
