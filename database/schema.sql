-- ============================================================
-- Expense Tracker Database Schema
-- MySQL 8.0+
-- ============================================================

-- Create Database
CREATE DATABASE IF NOT EXISTS expense_tracker_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE expense_tracker_db;

-- ============================================================
-- TABLE: expenses
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(100)    NOT NULL,
    amount          DECIMAL(10, 2)  NOT NULL CHECK (amount > 0),
    category        VARCHAR(50)     NOT NULL,
    date            DATE            NOT NULL,
    description     VARCHAR(255),
    payment_method  ENUM('CASH','CREDIT_CARD','DEBIT_CARD','UPI','NET_BANKING','OTHER')
                                    NOT NULL DEFAULT 'CASH',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_date      (date),
    INDEX idx_category  (category),
    INDEX idx_date_cat  (date, category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: budgets
-- ============================================================
CREATE TABLE IF NOT EXISTS budgets (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    category        VARCHAR(50)     NOT NULL,
    monthly_limit   DECIMAL(10, 2)  NOT NULL CHECK (monthly_limit > 0),
    month           INT             NOT NULL CHECK (month BETWEEN 1 AND 12),
    year            INT             NOT NULL CHECK (year >= 2000),
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_cat_month_year (category, month, year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- SEED DATA — Sample Expenses
-- ============================================================
INSERT INTO expenses (title, amount, category, date, description, payment_method) VALUES
('Grocery Shopping',    1850.00, 'Food & Dining',  CURDATE() - INTERVAL 2 DAY,  'Weekly groceries from Big Bazaar',  'UPI'),
('Electricity Bill',    1200.00, 'Bills & Utilities', CURDATE() - INTERVAL 5 DAY, 'Monthly electricity bill',          'NET_BANKING'),
('Netflix Subscription', 649.00, 'Entertainment',  CURDATE() - INTERVAL 1 DAY,  'Monthly streaming subscription',    'CREDIT_CARD'),
('Petrol',              2000.00, 'Transport',       CURDATE() - INTERVAL 3 DAY,  'Bike petrol refill',                'CASH'),
('Doctor Visit',        500.00,  'Healthcare',      CURDATE() - INTERVAL 7 DAY,  'General check-up',                  'CASH'),
('Online Course',       1999.00, 'Education',       CURDATE() - INTERVAL 10 DAY, 'Udemy course purchase',             'DEBIT_CARD'),
('Restaurant Dinner',   1350.00, 'Food & Dining',   CURDATE() - INTERVAL 4 DAY,  'Dinner with family',                'CREDIT_CARD'),
('Mobile Recharge',     299.00,  'Bills & Utilities', CURDATE() - INTERVAL 6 DAY,'Monthly mobile plan',               'UPI'),
('Clothing',            2500.00, 'Shopping',        CURDATE() - INTERVAL 8 DAY,  'New shirts and trousers',           'DEBIT_CARD'),
('Gym Membership',      1000.00, 'Healthcare',      CURDATE() - INTERVAL 12 DAY, 'Monthly gym fee',                   'UPI');

-- ============================================================
-- SEED DATA — Sample Budgets (current month)
-- ============================================================
INSERT INTO budgets (category, monthly_limit, month, year) VALUES
('Food & Dining',    5000.00, MONTH(CURDATE()), YEAR(CURDATE())),
('Bills & Utilities',3000.00, MONTH(CURDATE()), YEAR(CURDATE())),
('Transport',        2500.00, MONTH(CURDATE()), YEAR(CURDATE())),
('Entertainment',    1500.00, MONTH(CURDATE()), YEAR(CURDATE())),
('Healthcare',       2000.00, MONTH(CURDATE()), YEAR(CURDATE())),
('Shopping',         4000.00, MONTH(CURDATE()), YEAR(CURDATE())),
('Education',        3000.00, MONTH(CURDATE()), YEAR(CURDATE()));

-- ============================================================
-- Useful Views
-- ============================================================
CREATE OR REPLACE VIEW v_monthly_summary AS
SELECT
    YEAR(date)  AS year,
    MONTH(date) AS month,
    category,
    COUNT(*)    AS transactions,
    SUM(amount) AS total_spent
FROM expenses
GROUP BY YEAR(date), MONTH(date), category
ORDER BY year DESC, month DESC, total_spent DESC;
