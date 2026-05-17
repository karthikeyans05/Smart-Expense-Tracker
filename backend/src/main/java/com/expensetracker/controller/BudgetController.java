package com.expensetracker.controller;

import com.expensetracker.model.Budget;
import com.expensetracker.service.BudgetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/budgets")
@CrossOrigin(origins = "*")
public class BudgetController {

    @Autowired
    private BudgetService budgetService;

    @GetMapping("/{year}/{month}")
    public ResponseEntity<List<Budget>> getBudgetsByMonth(
            @PathVariable int year, @PathVariable int month) {
        return ResponseEntity.ok(budgetService.getBudgetsByMonth(month, year));
    }

    @PostMapping
    public ResponseEntity<Budget> saveBudget(@RequestBody Budget budget) {
        return ResponseEntity.ok(budgetService.saveBudget(budget));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteBudget(@PathVariable Long id) {
        budgetService.deleteBudget(id);
        return ResponseEntity.ok(Map.of("message", "Budget deleted successfully"));
    }

    @GetMapping("/status/{year}/{month}")
    public ResponseEntity<List<Map<String, Object>>> getBudgetStatus(
            @PathVariable int year, @PathVariable int month) {
        return ResponseEntity.ok(budgetService.getBudgetStatus(month, year));
    }
}
