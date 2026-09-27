import { useAvanyx } from '../context/AvanyxContext';
import { getActiveCatalogSchema, deriveBusinessModel, BusinessModelView } from '../lib/catalogSchema';

/**
 * Returns the single source of truth for how the POS and catalog should render
 * for the currently active business. Everything derives from the AI-generated
 * catalog schema (falling back to a neutral, assumption-free schema).
 */
export function useBusinessModel(): BusinessModelView {
  const { activeBusiness } = useAvanyx();
  return deriveBusinessModel(getActiveCatalogSchema(activeBusiness));
}

export type { BusinessModelView };
