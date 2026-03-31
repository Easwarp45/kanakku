import { ReactElement } from 'react';
import { render, RenderOptions, renderHook as rtlRenderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Create a new QueryClient for each test
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface AllTheProvidersProps {
  children: React.ReactNode;
}

function AllTheProviders({ children }: AllTheProvidersProps) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
}

// Custom render that wraps in QueryClientProvider + BrowserRouter
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Custom renderHook that wraps in QueryClientProvider + BrowserRouter
// This is required because hooks using useQuery/useMutation need a QueryClient context.
function renderHook<TResult>(
  renderFn: () => TResult,
  options?: Omit<Parameters<typeof rtlRenderHook>[1], 'wrapper'>,
) {
  return rtlRenderHook(renderFn, { wrapper: AllTheProviders, ...options });
}

export * from '@testing-library/react';
// Re-export our wrapped versions, overriding the named exports from @testing-library/react
export { customRender as render, renderHook };
