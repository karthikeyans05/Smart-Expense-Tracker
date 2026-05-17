package com.expensetracker.service;

import com.expensetracker.model.Expense;
import com.expensetracker.repository.ExpenseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
public class ExpenseService {

    @Autowired
    private ExpenseRepository expenseRepository;

    public List<Expense> getAllExpenses() {
        return expenseRepository.findAllByOrderByDateDesc();
    }

    public Optional<Expense> getExpenseById(Long id) {
        return expenseRepository.findById(id);
    }

    public Expense createExpense(Expense expense) {
        return expenseRepository.save(expense);
    }

    public Expense updateExpense(Long id, Expense updatedExpense) {
        return expenseRepository.findById(id).map(expense -> {
            expense.setTitle(updatedExpense.getTitle());
            expense.setAmount(updatedExpense.getAmount());
            expense.setCategory(updatedExpense.getCategory());
            expense.setDate(updatedExpense.getDate());
            expense.setDescription(updatedExpense.getDescription());
            expense.setPaymentMethod(updatedExpense.getPaymentMethod());
            return expenseRepository.save(expense);
        }).orElseThrow(() -> new RuntimeException("Expense not found with id: " + id));
    }

    public void deleteExpense(Long id) {
        expenseRepository.deleteById(id);
    }

    public List<Expense> getExpensesByMonth(int month, int year) {
        return expenseRepository.findByMonthAndYear(month, year);
    }

    public List<Expense> getExpensesByDateRange(LocalDate startDate, LocalDate endDate) {
        return expenseRepository.findByDateBetweenOrderByDateDesc(startDate, endDate);
    }

    public List<Expense> searchExpenses(String query) {
        return expenseRepository.searchExpenses(query);
    }

    public Map<String, Object> getDashboardStats(int month, int year) {
        Map<String, Object> stats = new HashMap<>();

        BigDecimal monthlyTotal = expenseRepository.getTotalForMonth(month, year);
        stats.put("monthlyTotal", monthlyTotal != null ? monthlyTotal : BigDecimal.ZERO);

        List<Object[]> categoryTotals = expenseRepository.getCategoryTotalsForMonth(month, year);
        Map<String, BigDecimal> categoryMap = new LinkedHashMap<>();
        for (Object[] row : categoryTotals) {
            categoryMap.put((String) row[0], (BigDecimal) row[1]);
        }
        stats.put("categoryBreakdown", categoryMap);

        List<Object[]> monthlyTotals = expenseRepository.getMonthlyTotals();
        List<Map<String, Object>> monthlyList = new ArrayList<>();
        for (Object[] row : monthlyTotals) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("year", row[0]);
            entry.put("month", row[1]);
            entry.put("total", row[2]);
            monthlyList.add(entry);
        }
        stats.put("monthlyTrend", monthlyList);

        List<Expense> currentMonthExpenses = expenseRepository.findByMonthAndYear(month, year);
        stats.put("totalTransactions", currentMonthExpenses.size());

        BigDecimal avg = currentMonthExpenses.isEmpty() ? BigDecimal.ZERO :
                monthlyTotal.divide(BigDecimal.valueOf(currentMonthExpenses.size()), 2, java.math.RoundingMode.HALF_UP);
        stats.put("averageExpense", avg);

        return stats;
    }
}
