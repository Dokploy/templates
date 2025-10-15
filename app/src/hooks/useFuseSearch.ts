import { useMemo, useCallback } from "react";
import Fuse, { IFuseOptions } from "fuse.js";

interface Template {
  id: string;
  name: string;
  description: string;
  version: string;
  logo?: string;
  links: {
    github?: string;
    website?: string;
    docs?: string;
  };
  tags: string[];
}

/**
 * Custom hook for Fuse.js fuzzy search
 * Provides optimized search configuration for template searching
 */
export const useFuseSearch = (templates: Template[]) => {
  const fuse = useMemo(() => {
    if (!templates || templates.length === 0) return null;

    // Fuse.js configuration optimized for template search
    const options: IFuseOptions<Template> = {
      // Basic Options
      isCaseSensitive: false, // Case-insensitive search
      ignoreDiacritics: true, // Ignore accents (café = cafe)
      includeScore: true, // Include relevance score (0 = perfect, 1 = no match)
      includeMatches: true, // Include match indices for highlighting
      minMatchCharLength: 1, // Match even single characters
      shouldSort: true, // Sort by relevance score
      findAllMatches: false, // Stop at first perfect match

      // Keys to search with weighted importance
      keys: [
        {
          name: "name",
          weight: 2, // Name is most important
        },
        {
          name: "description",
          weight: 1, // Description has normal weight
        },
        {
          name: "tags",
          weight: 1.5, // Tags are quite important
        },
        {
          name: "id",
          weight: 0.5, // ID has lower weight
        },
      ],

      // Fuzzy Matching Options
      location: 0, // Expected position of pattern (0 = start)
      threshold: 0.4, // Match threshold (0.0 = perfect, 1.0 = anything) - higher = more lenient
      distance: 100, // Max distance from location
      ignoreLocation: true, // Match anywhere in the string

      // Advanced Options
      useExtendedSearch: false, // Unix-like search commands
      ignoreFieldNorm: false, // Consider field length in scoring
      fieldNormWeight: 1, // Field length norm weight
    };

    return new Fuse(templates, options);
  }, [templates]);

  /**
   * Perform fuzzy search on templates
   * @param query - Search query string
   * @returns Array of matched templates sorted by relevance
   */
  const search = useCallback(
    (query: string): Template[] => {
      if (!fuse || !query.trim()) {
        return templates;
      }

      const results = fuse.search(query);
      return results.map((result) => result.item);
    },
    [fuse, templates]
  );

  /**
   * Perform fuzzy search with full result details
   * @param query - Search query string
   * @returns Array of Fuse result objects with scores and matches
   */
  const searchWithDetails = useCallback(
    (query: string) => {
      if (!fuse || !query.trim()) {
        return [];
      }

      return fuse.search(query);
    },
    [fuse]
  );

  return {
    fuse,
    search,
    searchWithDetails,
  };
};
