import { useStore } from "@/store";
import { Badge } from "@/components/ui/badge";

const Tags = () => {
  const templates = useStore((state) => state.templates);
  const selectedTags = useStore((state) => state.selectedTags);
  const addSelectedTag = useStore((state) => state.addSelectedTag);

  // Get all unique tags
  const uniqueTags = Array.from(
    new Set(templates.flatMap((template) => template.tags))
  ).sort();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Available Tags */}
      <div className="py-2 flex flex-wrap gap-2">
        {uniqueTags
          .filter((tag) => !selectedTags.includes(tag))
          .map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer hover:bg-blue-100 transition-colors"
              onClick={() => addSelectedTag(tag)}
            >
              {tag}
            </Badge>
          ))}
      </div>
    </div>
  );
};

export default Tags;
