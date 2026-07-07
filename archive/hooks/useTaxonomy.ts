import { useQuery } from '@tanstack/react-query';
import * as taxonomyMock from '../services/taxonomyMock';

export function useTaxonomyNodes() {
  return useQuery({
    queryKey: ['taxonomy'],
    queryFn: () => taxonomyMock.getTaxonomyNodes(),
  });
}

export function useTaxonomyCategories() {
  return useQuery({
    queryKey: ['taxonomy', 'categories'],
    queryFn: () => {
      const cats = taxonomyMock.getTaxonomyCategories();
      return Promise.resolve(cats);
    },
  });
}