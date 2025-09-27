import { Input } from "./ui/input";
import { useStore } from "@/store";
import { Grid, List, SearchIcon, XIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import React from "react";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import SelectedTags from "./SelectedTags";
import { useSearchParams } from "react-router-dom";

const Search = () => {
  const { templates, searchQuery, setSearchQuery, setView, templatesCount, setFilteredTemplates, setTemplatesCount } =
    useStore();
  const selectedTags = useStore((state) => state.selectedTags);
  const addSelectedTag = useStore((state) => state.addSelectedTag);
  const removeSelectedTag = useStore((state) => state.removeSelectedTag);
  const [open, setOpen] = React.useState(false);
  const [tagSearch, setTagSearch] = React.useState("");
  const view = useStore((state) => state.view);
  const [searchParams, setSearchParams] = useSearchParams();

  // Get all unique tags, safely handle empty templates
  const uniqueTags = React.useMemo(() => {
    if (!templates || templates.length === 0) return [];
    return Array.from(
      new Set(templates.flatMap((template) => template.tags || []))
    ).sort();
  }, [templates]);

  // Filter tags based on search
  const filteredTags = React.useMemo(() => {
    if (!tagSearch) return uniqueTags;
    return uniqueTags.filter((tag) =>
      tag.toLowerCase().includes(tagSearch.toLowerCase())
    );
  }, [uniqueTags, tagSearch]);

  // Initialize search query from URL params and apply filters
  React.useEffect(() => {
    const queryFromUrl = searchParams.get("q") || "";
    if (queryFromUrl !== searchQuery) {
      setSearchQuery(queryFromUrl);
    }

    // Apply filters whenever templates, search query or selected tags change
    if (templates) {
      const filtered = templates.filter((template) => {
        // Filter by search query - search across name and description
        const searchTerm = queryFromUrl.toLowerCase();
        const matchesSearch =
          template.name.toLowerCase().includes(searchTerm) ||
          template.description.toLowerCase().includes(searchTerm);

        // Filter by selected tags
        const matchesTags =
          selectedTags.length === 0 ||
          selectedTags.every((tag) => template.tags.includes(tag));

        return matchesSearch && matchesTags;
      });

      setFilteredTemplates(filtered);
      setTemplatesCount(filtered.length);
    }
  }, [searchParams, templates, selectedTags, setSearchQuery, setFilteredTemplates, setTemplatesCount]);

  // Update URL params when search query changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    if (newQuery) {
      setSearchParams({ q: newQuery });
    } else {
      searchParams.delete("q");
      setSearchParams(searchParams);
    }
  };

  // Clear search and URL params
  const handleClearSearch = () => {
    setSearchQuery("");
    searchParams.delete("q");
    setSearchParams(searchParams);
  };

  return (
    <div className=" mx-auto p-4 lg:p-12  border-b w-full">
      {/* <h1 className="text-2xl md:text-3xl xl:text-4xl font-bold text-center mb-8">
        Available Templates ({templates?.length || 0})
      </h1> */}
      <div className="max-w-xl mx-auto flex flex-col gap-2">
        <div className="relative w-full">
          <div className="mb-2 flex flex-row gap-1">
            <div className="text-sm text-muted-foreground">
              Available Templates
            </div>
            <div className="text-sm font-bold">
              {(templatesCount && templatesCount) || 0}
            </div>
          </div>

          <Input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full p-6"
          />
          {searchQuery.length > 0 ? (
            <div className="cursor-pointer" onClick={handleClearSearch}>
              <XIcon className="absolute end-3 translate-y-3.5 top-1/2 h-5 w-5 text-gray-400" />
            </div>
          ) : (
            <SearchIcon className="absolute end-3 translate-y-2 top-1/2 lg:size-5 size-4 text-gray-400" />
          )}
        </div>

        <div className="flex flex-row gap-2 justify-between">
          <Tabs
            defaultValue={view}
            onValueChange={(value) => {
              setView(value as "grid" | "rows");
            }}
          >
            <TabsList>
              <TabsTrigger value="grid" className="cursor-pointer">
                <Grid /> <span className="text-xs p-1">Grid</span>
              </TabsTrigger>
              <TabsTrigger value="rows" className="cursor-pointer">
                <List /> <span className="text-xs p-1">List</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="justify-between"
              >
                Tags
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Search tags...."
                  value={tagSearch}
                  onValueChange={setTagSearch}
                />
                <CommandList>
                  <CommandEmpty>No tags found.</CommandEmpty>
                  <CommandGroup>
                    {filteredTags.map((tag) => (
                      <CommandItem
                        key={tag}
                        value={tag}
                        onSelect={(value) => {
                          if (selectedTags.includes(value)) {
                            removeSelectedTag(value);
                          } else {
                            addSelectedTag(value);
                          }
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedTags.includes(tag)
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {tag}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        {selectedTags.length > 0 && <SelectedTags />}
      </div>
    </div>
  );
};

export default Search;
