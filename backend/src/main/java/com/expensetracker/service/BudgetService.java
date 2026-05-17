package com.expensetracker.service;

import com.expensetracker.model.Budget;
import com.expensetracker.repository.BudgetRepository;
import com.expensetracker.repository.ExpenseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;

@Service
public class BudgetService {

    @Autowired
    private BudgetRepository budgetRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    public List<Budget> getBudgetsByMonth(int month, int year) {
        return budgetRepository.findByMonthAndYear(month, year);
    }

    public Budget saveBudget(Budget budget) {
        Optional<Budget> existing = budgetRepository.findByCategoryAndMonthAndYear(
                budget.getCategory(), budget.getMonth(), budget.getYear());
        if (existing.isPresent()) {
            Budget b = existing.get();
            b.setMonthlyLimit(budget.getMonthlyLimit());
            return budgetRepository.save(b);
        }
        return budgetRepository.save(budget);
    }

    public void deleteBudget(Long id) {
        budgetRepository.deleteById(id);
    }

    public List<Map<String, Object>> getBudgetStatus(int month, int year) {
        List<Budget> budgets = budgetRepository.findByMonthAndYear(month, year);
        List<Object[]> categoryTotals = expenseRepository.getCategoryTotalsForMonth(month, year);

        Map<String, BigDecimal> spentMap = new HashMap<>();
        for (Object[] row : categoryTotals) {
            spentMap.put((String) row[0], (BigDecimal) row[1]);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Budget budget : budgets) {
            Map<String, Object> status = new HashMap<>();
            BigDecimal spent = spentMap.getOrDefault(budget.getCategory(), BigDecimal.ZERO);
            BigDecimal limit = budget.getMonthlyLimit();
            double percentage = limit.compareTo(BigDecimal.ZERO) > 0
                    ? spent.divide(limit, 4, java.math.RoundingMode.HALF_UP).doubleValue() * 100
                    : 0;

            status.put("id", budget.getId());
            status.put("category", budget.getCategory());
            status.put("limit", limit);
            status.put("spent", spent);
            status.put("remaining", limit.subtract(spent));
            status.put("percentage", Math.min(percentage, 100));
            status.put("exceeded", spent.compareTo(limit) > 0);
            result.add(status);
        }
        return result;
    }
}
