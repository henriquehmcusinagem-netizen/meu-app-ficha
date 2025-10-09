import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, SlidersHorizontal, Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface FilterConfig {
  searchPlaceholder?: string;
  searchFields?: string[]; // campos para buscar (ex: ['cliente', 'numero_ftc', 'nome_peca'])
  sortOptions?: { value: string; label: string }[];
  showDateFilter?: boolean;
  dateField?: string; // campo de data para filtrar (ex: 'data_criacao')
}

export interface FilterValues {
  searchTerm: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
}

interface ModuleFilterProps {
  config: FilterConfig;
  onFilterChange: (filters: FilterValues) => void;
  totalItems?: number;
  filteredItems?: number;
}

export function ModuleFilter({
  config,
  onFilterChange,
  totalItems = 0,
  filteredItems = 0
}: ModuleFilterProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState(config.sortOptions?.[0]?.value || "");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    emitFilters({ searchTerm: value, sortBy, sortOrder, dateFrom, dateTo });
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    emitFilters({ searchTerm, sortBy: value, sortOrder, dateFrom, dateTo });
  };

  const handleSortOrderToggle = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    emitFilters({ searchTerm, sortBy, sortOrder: newOrder, dateFrom, dateTo });
  };

  const handleDateFromChange = (date: Date | undefined) => {
    setDateFrom(date);
    emitFilters({ searchTerm, sortBy, sortOrder, dateFrom: date, dateTo });
  };

  const handleDateToChange = (date: Date | undefined) => {
    setDateTo(date);
    emitFilters({ searchTerm, sortBy, sortOrder, dateFrom, dateTo: date });
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSortBy(config.sortOptions?.[0]?.value || "");
    setSortOrder('desc');
    setDateFrom(undefined);
    setDateTo(undefined);
    emitFilters({
      searchTerm: "",
      sortBy: config.sortOptions?.[0]?.value || "",
      sortOrder: 'desc',
      dateFrom: undefined,
      dateTo: undefined
    });
  };

  const emitFilters = (filters: FilterValues) => {
    onFilterChange(filters);
  };

  const hasActiveFilters = searchTerm || dateFrom || dateTo;

  return (
    <Card className="p-4 mb-4">
      <div className="space-y-3">
        {/* Linha 1: Busca e Botões */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={config.searchPlaceholder || "Buscar..."}
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Button
            variant={showAdvanced ? "default" : "outline"}
            size="icon"
            onClick={() => setShowAdvanced(!showAdvanced)}
            title="Filtros avançados"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={handleClearFilters}
              title="Limpar filtros"
            >
              <X className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          )}
        </div>

        {/* Linha 2: Filtros Avançados (condicional) */}
        {showAdvanced && (
          <div className="flex gap-2 items-center pt-2 border-t">
            {/* Ordenação */}
            {config.sortOptions && config.sortOptions.length > 0 && (
              <>
                <div className="flex-1">
                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ordenar por..." />
                    </SelectTrigger>
                    <SelectContent>
                      {config.sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSortOrderToggle}
                  title={sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </>
            )}

            {/* Filtro de Data */}
            {config.showDateFilter && (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-[140px] justify-start text-left">
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "dd/MM/yyyy", { locale: ptBR }) : "Data início"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateFrom}
                      onSelect={handleDateFromChange}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>

                <span className="text-sm text-muted-foreground">até</span>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-[140px] justify-start text-left">
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "dd/MM/yyyy", { locale: ptBR }) : "Data fim"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateTo}
                      onSelect={handleDateToChange}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </>
            )}
          </div>
        )}

        {/* Linha 3: Contador de resultados */}
        {totalItems > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
            <span>
              Mostrando <strong>{filteredItems}</strong> de <strong>{totalItems}</strong> {totalItems === 1 ? 'item' : 'itens'}
            </span>
            {hasActiveFilters && filteredItems < totalItems && (
              <span className="text-orange-600">
                ({totalItems - filteredItems} {totalItems - filteredItems === 1 ? 'item filtrado' : 'itens filtrados'})
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
