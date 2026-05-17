package com.expensetracker.repository;

import com.expensetracker.model.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {

    List<Budget> findByMonthAndYear(Integer month, Integer year);

    Optional<Budget> findByCategoryAndMonthAndYear(String category, Integer month, Integer year);
}
