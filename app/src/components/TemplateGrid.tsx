import React, { useEffect, useState } from "react";
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

const TemplateGrid: React.FC<TemplateGridProps> = ({ view }) => {
  const {
    templates,
    setTemplates,
    setTemplatesCount,
    filteredTemplates,
    setFilteredTemplates,
  } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchQuery = useStore((state) => state.searchQuery);
  const selectedTags = useStore((state) => state.selectedTags);
  const { addSelectedTag } = useStore();

  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [templateFiles, setTemplateFiles] = useState<TemplateFiles | null>(
    null
  );
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch("/meta.json");
        if (!response.ok) {
          throw new Error("Failed to fetch templates");
        }
        const data = await response.json();
        setTemplates(data);
        setFilteredTemplates(data);
        setTemplatesCount(data.length);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [setTemplates, setFilteredTemplates]);

  const fetchTemplateFiles = async (templateId: string) => {
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
  };

  const handleTemplateClick = (template: Template) => {
    setSelectedTemplate(template);
    setTemplateFiles(null); // Reset previous files
    fetchTemplateFiles(template.id);
  };

  useEffect(() => {
    const filtered = templates.filter((template) => {
      // Filter by search query
      const matchesSearch = template.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      // Filter by selected tags
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((tag) => template.tags.includes(tag));

      return matchesSearch && matchesTags;
    });

    setTemplatesCount(filtered.length);
    setFilteredTemplates(filtered);
  }, [searchQuery, selectedTags]);

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
          {[1, 2, 3].map((item) => (
            <Skeleton
              key={item}
              className={cn({
                "h-[300px]": view === "grid",
                "h-[135px]": view === "rows",
              })}
            ></Skeleton>
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
                  " cursor-pointer hover:shadow-lg transition-all duration-200 h-full max-h-[300px]",
                  {
                    "flex-col": view === "grid",
                    "flex-row gap-0": view === "rows",
                  }
                )}
              >
                <CardHeader
                  className={cn("flex  gap-2 ", {
                    "flex-row": view === "grid",
                    "flex-col justify-center items-center ms-4":
                      view === "rows",
                  })}
                >
                  <img
                    src={`/blueprints/${template.id}/${template.logo}`}
                    alt={template.name}
                    className={cn("w-auto h-12 s object-contain mb-2", {
                      "w-auto h-12": view === "grid",
                      "w-12 h-auto": view === "rows",
                    })}
                  />
                </CardHeader>
                <CardContent className="flex-1">
                  <CardTitle className="text-xl ">{template.name}</CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1 w-fit">
                    {template.tags.slice(0, 3).map((tag) => (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          addSelectedTag(tag);
                        }}
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
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
              <p className="text-gray-500 text-lg">
                No templates found matching "{searchQuery}"
              </p>
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
