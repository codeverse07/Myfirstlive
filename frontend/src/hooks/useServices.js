import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';

// API functions
export const fetchServices = async (params = {}) => {
  const { data } = await client.get('/services', { params });
  return {
    services: data.data.services || data.data.docs || [],
    pagination: {
      page: data.page || 1,
      limit: data.limit || 12,
      total: data.total || 0,
      totalPages: data.totalPages || 1,
      results: data.results || 0
    }
  };
};

export const fetchServiceById = async (id) => {
  const { data } = await client.get(`/services/${id}`);
  return data.data.service;
};

export const fetchCategories = async () => {
  const { data } = await client.get('/categories');
  return data.data.categories || [];
};

// React Query hooks
export const useServices = (params = {}) => {
  return useQuery({
    queryKey: ['services', params],
    queryFn: () => fetchServices(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    keepPreviousData: true, // Keep previous data while fetching new page
  });
};

export const useService = (id) => {
  return useQuery({
    queryKey: ['service', id],
    queryFn: () => fetchServiceById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes for individual service
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 30 * 60 * 1000, // 30 minutes - categories change rarely
    cacheTime: 60 * 60 * 1000, // 1 hour
  });
};

// Prefetch functions
export const usePrefetchService = () => {
  const queryClient = useQueryClient();
  
  return (id) => {
    queryClient.prefetchQuery({
      queryKey: ['service', id],
      queryFn: () => fetchServiceById(id),
      staleTime: 10 * 60 * 1000,
    });
  };
};

// Invalidate functions for cache management
export const useInvalidateServices = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['services'] });
  };
};

export const useInvalidateService = () => {
  const queryClient = useQueryClient();
  
  return (id) => {
    queryClient.invalidateQueries({ queryKey: ['service', id] });
    queryClient.invalidateQueries({ queryKey: ['services'] });
  };
};

// Optimistic update for saving/un-saving services
export const useOptimisticSaveService = () => {
  const queryClient = useQueryClient();
  
  return (serviceId, isSaved) => {
    // Cancel any outgoing refetches
    queryClient.cancelQueries({ queryKey: ['services'] });
    
    // Snapshot the previous value
    const previousServices = queryClient.getQueryData(['services']);
    
    // Optimistically update to the new value
    queryClient.setQueryData(['services'], (old) => {
      if (!old) return old;
      
      if (Array.isArray(old)) {
        return old.map(service => {
          if (service.id === serviceId || service._id === serviceId) {
            return { ...service, isSaved };
          }
          return service;
        });
      } else if (old.services) {
        return {
          ...old,
          services: old.services.map(service => {
            if (service.id === serviceId || service._id === serviceId) {
              return { ...service, isSaved };
            }
            return service;
          })
        };
      }
      
      return old;
    });
    
    // Return a context object with the snapshotted value
    return { previousServices };
  };
};