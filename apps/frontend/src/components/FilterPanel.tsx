import React from 'react';
import { X, Search, Calendar, Users, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

export interface FilterValues {
  search: string;
  startDate: string;
  endDate: string;
  minCashiers: string;
  maxCashiers: string;
}

interface FilterPanelProps {
  filters: FilterValues;
  onFilterChange: (filters: Partial<FilterValues>) => void;
  onClearAll: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  onClearAll,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onFilterChange({ [name]: value });
  };

  const removeFilter = (key: keyof FilterValues) => {
    onFilterChange({ [key]: '' });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="search" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Search className="h-3 w-3" />
            Search
          </Label>
          <Input
            id="search"
            name="search"
            placeholder="Name, shop..."
            value={filters.search}
            onChange={handleInputChange}
            className="h-9"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dateRange" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            Date Range
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleInputChange}
              className="h-9 text-xs"
            />
            <span className="text-muted-foreground text-xs">to</span>
            <Input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleInputChange}
              className="h-9 text-xs"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cashiers" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Users className="h-3 w-3" />
            Cashiers Count
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              name="minCashiers"
              placeholder="Min"
              value={filters.minCashiers}
              onChange={handleInputChange}
              className="h-9"
              min="0"
            />
            <span className="text-muted-foreground text-xs">-</span>
            <Input
              type="number"
              name="maxCashiers"
              placeholder="Max"
              value={filters.maxCashiers}
              onChange={handleInputChange}
              className="h-9"
              min="0"
            />
          </div>
        </div>

        <div className="flex items-end">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="h-9 text-xs text-muted-foreground hover:text-foreground"
            >
              <Filter className="h-3 w-3 mr-1.5" />
              Clear All Filters
            </Button>
          )}
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {filters.search && (
            <Badge variant="secondary" className="gap-1 px-2 py-1">
              Search: {filters.search}
              <button onClick={() => removeFilter('search')} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {(filters.startDate || filters.endDate) && (
            <Badge variant="secondary" className="gap-1 px-2 py-1">
              Date: {filters.startDate || '...'} to {filters.endDate || '...'}
              <button
                onClick={() => {
                  onFilterChange({ startDate: '', endDate: '' });
                }}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {(filters.minCashiers || filters.maxCashiers) && (
            <Badge variant="secondary" className="gap-1 px-2 py-1">
              Cashiers: {filters.minCashiers || '0'} - {filters.maxCashiers || '∞'}
              <button
                onClick={() => {
                  onFilterChange({ minCashiers: '', maxCashiers: '' });
                }}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
