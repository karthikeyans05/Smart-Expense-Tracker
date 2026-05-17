package com.expensetracker.repository;

import com.expensetracker.model.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByDateBetweenOrderByDateDesc(LocalDate startDate, LocalDate endDate);

    List<Expense> findByCategoryOrderByDateDesc(String category);

    List<Expense> findAllByOrderByDateDesc();

    @Query("SELECT e FROM Expense e WHERE MONTH(e.date) = :month AND YEAR(e.date) = :year ORDER BY e.date DESC")
    List<Expense> findByMonthAndYear(@Param("month") int month, @Param("year") int year);

    @Query("SELECT e.category, SUM(e.amount) as total FROM Expense e WHERE MONTH(e.date) = :month AND YEAR(e.date) = :year GROUP BY e.category")
    List<Object[]> getCategoryTotalsForMonth(@Param("month") int month, @Param("year") int year);

    @Query("SELECT SUM(e.amount) FROM Expense e WHERE MONTH(e.date) = :month AND YEAR(e.date) = :year")
    BigDecimal getTotalForMonth(@Param("month") int month, @Param("year") int year);

    @Query("SELECT e.category, SUM(e.amount) as total FROM Expense e GROUP BY e.category ORDER BY total DESC")
    List<Object[]> getCategoryTotals();

    @Query("SELECT YEAR(e.date) as yr, MONTH(e.date) as mo, SUM(e.amount) as total FROM Expense e GROUP BY YEAR(e.date), MONTH(e.date) ORDER BY yr DESC, mo DESC")
    List<Object[]> getMonthlyTotals();

    @Query("SELECT e FROM Expense e WHERE e.title LIKE %:query% OR e.description LIKE %:query% OR e.category LIKE %:query% ORDER BY e.date DESC")
    List<Expense> searchExpenses(@Param("query") String query);
}
