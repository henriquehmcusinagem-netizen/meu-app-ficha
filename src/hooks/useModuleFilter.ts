import { useMemo } from "react";
import { FilterValues } from "@/components/ui/module-filter";

interface UseModuleFilterOptions<T> {
  data: T[];
  searchFields: string[];
  dateField?: string;
  sortField?: string;
}

export function useModuleFilter<T extends Record<string, any>>({
  data,
  searchFields,
  dateField,
  sortField
}: UseModuleFilterOptions<T>) {

  const filterData = (filters: FilterValues): T[] => {
    let filtered = [...data];

    // Filtro de busca por texto
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        searchFields.some((field) => {
          const value = getNestedValue(item, field);
          return value?.toString().toLowerCase().includes(searchLower);
        })
      );
    }

    // Filtro de data (dateFrom)
    if (filters.dateFrom && dateField) {
      const fromTime = filters.dateFrom.getTime();
      filtered = filtered.filter((item) => {
        const itemDate = new Date(getNestedValue(item, dateField));
        return itemDate.getTime() >= fromTime;
      });
    }

    // Filtro de data (dateTo)
    if (filters.dateTo && dateField) {
      const toTime = new Date(filters.dateTo);
      toTime.setHours(23, 59, 59, 999); // Incluir o dia inteiro
      filtered = filtered.filter((item) => {
        const itemDate = new Date(getNestedValue(item, dateField));
        return itemDate.getTime() <= toTime.getTime();
      });
    }

    // Ordenação
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        const aValue = getNestedValue(a, filters.sortBy);
        const bValue = getNestedValue(b, filters.sortBy);

        // Tratamento especial para datas
        if (dateField && filters.sortBy === dateField) {
          const aTime = new Date(aValue).getTime();
          const bTime = new Date(bValue).getTime();
          return filters.sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
        }

        // Tratamento para strings
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue, 'pt-BR');
          return filters.sortOrder === 'asc' ? comparison : -comparison;
        }

        // Tratamento para números
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return filters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        }

        return 0;
      });
    }

    return filtered;
  };

  // Helper para acessar propriedades aninhadas (ex: "fichas_tecnicas.cliente")
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  return {
    filterData
  };
}
