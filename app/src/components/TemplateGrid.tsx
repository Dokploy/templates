import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "./ui/card";
import { useStore } from "@/store";
import { Skeleton } from "./ui/skeleton";
import { cn } from "@/lib/utils";
import TemplateDialog from "./TemplateDialog";
import Fuse from "fuse.js";

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

interface TemplateFiles {
  dockerCompose: string | null;
  config: string | null;
}

interface TemplateGridProps {
  view: "grid" | "rows";
}

// Debounce hook for search performance
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const TemplateGrid: React.FC<TemplateGridProps> = ({ view }) => {
  const { templates, setTemplates, setTemplatesCount, setFilteredTemplates } =
    useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchQuery = useStore((state) => state.searchQuery);
  const selectedTags = useStore((state) => state.selectedTags);
  const { addSelectedTag } = useStore();

  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [templateFiles, setTemplateFiles] = useState<TemplateFiles | null>(
    null
  );
  const [modalLoading, setModalLoading] = useState(false);

  // Deduplicate templates and ensure unique IDs
  const uniqueTemplates = useMemo(() => {
    if (!templates || templates.length === 0) return [];

    console.log("Raw templates loaded:", templates.length);

    // Use Map to ensure we only keep the first occurrence of each ID
    const uniqueMap = new Map<string, Template>();

    templates.forEach((template, index) => {
      // Skip if we've already seen this ID
      if (uniqueMap.has(template.id)) {
        console.log(`Duplicate found: ${template.id} at index ${index}`);
        return;
      }

      // Validate template has required fields
      if (!template.id || !template.name) {
        console.warn(`Invalid template at index ${index}:`, template);
        return;
      }

      uniqueMap.set(template.id, template);
    });

    const uniqueArray = Array.from(uniqueMap.values());
    console.log("Unique templates after deduplication:", uniqueArray.length);
    console.log("Duplicates removed:", templates.length - uniqueArray.length);

    return uniqueArray;
  }, [templates]);

  // Initialize Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    if (!uniqueTemplates || uniqueTemplates.length === 0) return null;

    return new Fuse(uniqueTemplates, {
      keys: [
        { name: "name", weight: 0.7 },
        { name: "description", weight: 0.2 },
        { name: "tags", weight: 0.1 },
      ],
      threshold: 0.3, // Lower = more strict, Higher = more fuzzy
      ignoreLocation: true,
      includeScore: true,
      minMatchCharLength: 1,
    });
  }, [uniqueTemplates]);

  // Memoized filtered templates for better performance
  const filteredTemplates = useMemo(() => {
    if (!uniqueTemplates || uniqueTemplates.length === 0) return [];

    let filtered = uniqueTemplates;

    // Filter by search query (debounced) using Fuse.js for fuzzy search
    if (debouncedSearchQuery.trim() && fuse) {
      const searchResults = fuse.search(debouncedSearchQuery);
      filtered = searchResults.map((result) => result.item);
    }

    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((template) =>
        selectedTags.every((tag) => template.tags.includes(tag))
      );
    }

    return filtered;
  }, [uniqueTemplates, debouncedSearchQuery, selectedTags, fuse]);

  // Update store when filtered templates change
  useEffect(() => {
    setFilteredTemplates(filteredTemplates);
    setTemplatesCount(filteredTemplates.length);
    console.log("Filtered templates updated:", filteredTemplates.length);
  }, [filteredTemplates, setFilteredTemplates, setTemplatesCount]);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch("/meta.json");
        if (!response.ok) {
          throw new Error("Failed to fetch templates");
        }
        const data = await response.json();
        console.log("Fetched templates:", data.length);
        setTemplates(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching templates:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [setTemplates]);

  const fetchTemplateFiles = useCallback(async (templateId: string) => {
    setModalLoading(true);
    try {
      const [dockerComposeRes, configRes] = await Promise.all([
        fetch(`/blueprints/${templateId}/docker-compose.yml`),
        fetch(`/blueprints/${templateId}/template.toml`),
      ]);

      const dockerCompose = dockerComposeRes.ok
        ? await dockerComposeRes.text()
        : null;
      const config = configRes.ok ? await configRes.text() : null;

      setTemplateFiles({ dockerCompose, config });
    } catch (err) {
      console.error("Error fetching template files:", err);
      setTemplateFiles({ dockerCompose: null, config: null });
    } finally {
      setModalLoading(false);
    }
  }, []);

  const handleTemplateClick = useCallback(
    (template: Template) => {
      setSelectedTemplate(template);
      setTemplateFiles(null); // Reset previous files
      fetchTemplateFiles(template.id);
    },
    [fetchTemplateFiles]
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div
          className={cn("", {
            "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6":
              view === "grid",
            "grid grid-cols-1 gap-4": view === "rows",
          })}
        >
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Skeleton
              key={item}
              className={cn({
                "h-[300px]": view === "grid",
                "h-[135px]": view === "rows",
              })}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-4">
          Error
        </h1>
        <p className="text-center text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div
          className={cn("", {
            "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6":
              view === "grid",
            "grid grid-cols-1 gap-4": view === "rows",
          })}
        >
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map((template) => (
              <Card
                key={template.id}
                onClick={() => handleTemplateClick(template)}
                className={cn(
                  "cursor-pointer hover:shadow-lg transition-all duration-200 h-full max-h-[300px]",
                  {
                    "flex-col": view === "grid",
                    "flex-row gap-0": view === "rows",
                  }
                )}
              >
                <CardHeader
                  className={cn("flex gap-2", {
                    "flex-row": view === "grid",
                    "flex-col justify-center items-center ms-4":
                      view === "rows",
                  })}
                >
                  <img
                    src={`/blueprints/${template.id}/${template.logo}`}
                    alt={template.name}
                    className={cn("w-auto h-12 object-contain mb-2", {
                      "w-auto h-12": view === "grid",
                      "w-12 h-auto": view === "rows",
                    })}
                    onError={(e) => {
                      // Fallback for missing images
                      (e.target as HTMLImageElement).src =
                        "/placeholder-logo.svg";
                    }}
                  />
                </CardHeader>
                <CardContent className="flex-1">
                  <CardTitle className="text-xl">{template.name}</CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1 w-fit">
                    {template.tags.slice(0, 3).map((tag, tagIndex) => (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          addSelectedTag(tag);
                        }}
                        key={`${template.id}-${tag}-${tagIndex}`}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                      >
                        {tag}
                      </span>
                    ))}
                    {template.tags.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                        +{template.tags.length - 3} more
                      </span>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {template.version}
                  </span>
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">
                {searchQuery.trim()
                  ? `No templates found matching "${searchQuery}"`
                  : selectedTags.length > 0
                  ? `No templates found with selected tags`
                  : "No templates available"}
              </p>
              {(searchQuery.trim() || selectedTags.length > 0) && (
                <p className="text-gray-400 text-sm mt-2">
                  Try adjusting your search criteria or clear filters
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <TemplateDialog
        selectedTemplate={selectedTemplate}
        templateFiles={templateFiles}
        modalLoading={modalLoading}
        onOpenChange={(open) => !open && setSelectedTemplate(null)}
      />
    </>
  );
};

export default TemplateGrid;
